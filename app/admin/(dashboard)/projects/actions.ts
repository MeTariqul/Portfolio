"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyUpload, UPLOAD_LIMITS } from "@/lib/uploads";
import {
  deleteObject,
  deleteObjectByUrl,
  ensureBucket,
  publicUrl,
  signUpload,
  storagePathFromUrl,
  supabaseStorage,
} from "@/lib/storage";

export type ProjectFormState = { error?: string };

const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\//.test(v), "Must be a URL or empty.");

const projectSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Give the project a title.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Give the project a slug.")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and dashes only."),
  summary: z.string().trim().min(1, "Write a one-line summary.").max(500),
  problem: z.string().trim().min(1, "Describe the problem."),
  solutionMD: z.string().trim().min(1, "Describe what you built."),
  learnedMD: z.string().trim().min(1, "Describe what you learned."),
  stack: z.string().trim(),
  category: z.string().trim().min(1, "Pick a category.").max(100),
  screenshots: z.string().trim(), // one "url | alt text" per line
  liveUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  downloadUrl: urlOrEmpty,
  downloadFilename: z.string().trim().max(200),
  featured: z.boolean(),
  order: z.coerce.number().int().min(0).max(999),
});

export async function saveProject(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    problem: formData.get("problem"),
    solutionMD: formData.get("solutionMD"),
    learnedMD: formData.get("learnedMD"),
    stack: formData.get("stack") ?? "",
    category: formData.get("category"),
    screenshots: formData.get("screenshots") ?? "",
    liveUrl: formData.get("liveUrl") ?? "",
    githubUrl: formData.get("githubUrl") ?? "",
    downloadUrl: formData.get("downloadUrl") ?? "",
    downloadFilename: formData.get("downloadFilename") ?? "",
    featured: formData.get("featured") === "on",
    order: formData.get("order") ?? "0",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const d = parsed.data;

  const screenshots: { url: string; alt: string }[] = [];
  for (const line of d.screenshots.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [url, ...rest] = trimmed.split("|");
    const alt = rest.join("|").trim();
    if (!/^https?:\/\//.test(url.trim())) {
      return {
        error: `Screenshot line "${trimmed}": the URL must start with http(s):// and be followed by | alt text.`,
      };
    }
    if (!alt) {
      return {
        error: `Screenshot "${url.trim()}": add alt text after the | character.`,
      };
    }
    screenshots.push({ url: url.trim(), alt });
  }

  const data = {
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    problem: d.problem,
    solutionMD: d.solutionMD,
    learnedMD: d.learnedMD,
    stack: d.stack
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    category: d.category,
    screenshots: screenshots as never,
    liveUrl: d.liveUrl || null,
    githubUrl: d.githubUrl || null,
    // A filename only means something attached to a file: drop it with the
    // URL so a cleared download never resurfaces its old name.
    downloadUrl: d.downloadUrl || null,
    downloadFilename: d.downloadUrl ? d.downloadFilename || null : null,
    featured: d.featured,
    order: d.order,
  };

  let previous: { slug: string; downloadUrl: string | null } | null = null;

  try {
    if (d.id) {
      previous = await prisma.project.findUnique({
        where: { id: d.id },
        select: { slug: true, downloadUrl: true },
      });
      await prisma.project.update({ where: { id: d.id }, data });
    } else {
      await prisma.project.create({ data });
    }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That slug is already used by another project." };
    }
    throw err;
  }

  // Replaced or cleared download: drop the old stored file so it does not
  // linger in the bucket. Best effort — a misspelled external URL is not a
  // storage path and is skipped by storagePathFromUrl.
  const oldFile = previous?.downloadUrl;
  if (oldFile && oldFile !== data.downloadUrl && storagePathFromUrl(oldFile)) {
    await deleteObjectByUrl(oldFile);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  // The detail page caches under its own path with its own 60s window, so
  // revalidating the list alone would leave a fresh download invisible.
  revalidatePath(`/projects/${d.slug}`);
  if (previous && previous.slug !== d.slug) {
    revalidatePath(`/projects/${previous.slug}`);
  }
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  const row = await prisma.project.findUnique({
    where: { id },
    select: { slug: true, downloadUrl: true },
  });
  await prisma.project.delete({ where: { id } });
  // Take the hosted download with it, the way deletePost clears attachments.
  if (row?.downloadUrl && storagePathFromUrl(row.downloadUrl)) {
    await deleteObjectByUrl(row.downloadUrl);
  }
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  if (row) revalidatePath(`/projects/${row.slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export type ProjectUploadResult = {
  uploadUrl?: string;
  publicUrl?: string;
  error?: string;
};

// Signs a short-lived upload URL for a project's downloadable file. The
// browser PUTs it straight to Supabase Storage, so a large archive never
// crosses Vercel's ~4.5 MB serverless body limit.
//
// `kind !== "FILE"` is deliberate: it rejects photos and videos, and it
// rejects anything classifyUpload does not know — .exe and .msi included.
// Hosting executables from this domain is not a service worth offering.
export async function requestProjectDownload(
  filename: string,
  contentType: string,
  size: number,
): Promise<ProjectUploadResult> {
  await requireAdmin();
  if (typeof filename !== "string" || !filename || filename.length > 200) {
    return { error: "That filename is not usable." };
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { error: "The file is empty." };
  }

  const kind = classifyUpload(
    typeof contentType === "string" ? contentType : "",
    filename,
  );
  if (kind !== "FILE") {
    return {
      error: "Upload an archive or document: zip, pdf, Office or text files.",
    };
  }
  if (size > UPLOAD_LIMITS.FILE) {
    return {
      error: `Files must be under ${Math.round(UPLOAD_LIMITS.FILE / (1024 * 1024))} MB.`,
    };
  }

  const storage = supabaseStorage();
  if (!storage) {
    return { error: "Storage is not configured (missing env keys)." };
  }

  const safeName =
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "") || "file";
  const path = `projects/${Date.now()}-${randomBytes(4).toString("hex")}-${safeName}`;

  await ensureBucket(storage);
  const signed = await signUpload(storage, path);
  if ("error" in signed) return { error: signed.error };

  return { uploadUrl: signed.uploadUrl, publicUrl: publicUrl(storage, path) };
}

// Removes an uploaded download that was never saved with the project (the
// admin pressed Remove, or navigated away before submitting).
export async function discardProjectDownload(
  url: string,
): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (typeof url !== "string") return { error: "Bad url." };
  const path = storagePathFromUrl(url);
  if (!path || !path.startsWith("projects/")) {
    return { error: "Not a project download." };
  }
  const storage = supabaseStorage();
  if (!storage) return { error: "Storage is not configured." };
  const ok = await deleteObject(storage, path);
  return ok ? { ok: true } : { error: "Could not delete the file." };
}
