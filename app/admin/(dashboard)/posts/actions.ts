"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
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

export type PostFormState = { error?: string };

export type AutosaveResult = {
  ok: boolean;
  id?: string;
  savedAt?: string;
  error?: string;
  incomplete?: boolean;
  // Fresh rows after reconcile, so the form learns the ids of files it
  // just uploaded and the next save does not re-create them.
  attachments?: { id: string; url: string }[];
};

export type SignResult = {
  uploadUrl?: string;
  publicUrl?: string;
  error?: string;
};

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Give the post a title.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Give the post a slug.")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and dashes only."),
  excerpt: z.string().trim().min(1, "Write a one-line summary.").max(500),
  contentMD: z.string().trim().min(1, "The post body cannot be empty."),
  coverImage: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Must be a URL or empty."),
  coverAlt: z.string().trim().max(300),
  category: z.string().trim().max(100),
  tags: z.string().trim(), // comma-separated, parsed below
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.string().trim(),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(200),
  seoDescription: z.string().trim().max(300),
});

type PostData = z.infer<typeof postSchema>;

// The form's attachment list travels as JSON in a hidden input. Only files
// inside our own storage bucket's posts/ folder are accepted.
const attachmentSchema = z.object({
  id: z.string().min(1).optional(),
  url: z.string().min(1).max(600),
  filename: z.string().min(1).max(200),
  kind: z.enum(["IMAGE", "VIDEO", "FILE"]),
  mimeType: z.string().min(1).max(140),
  size: z.number().int().min(0).max(50 * 1024 * 1024),
  width: z.number().int().positive().max(30000).nullable().optional(),
  height: z.number().int().positive().max(30000).nullable().optional(),
});
const attachmentsSchema = z.array(attachmentSchema).max(12);

type AttachmentData = z.infer<typeof attachmentSchema>;

function parsePostForm(formData: FormData): { data?: PostData; error?: string } {
  const parsed = postSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    contentMD: formData.get("contentMD"),
    coverImage: formData.get("coverImage") ?? "",
    coverAlt: formData.get("coverAlt") ?? "",
    category: formData.get("category") ?? "",
    tags: formData.get("tags") ?? "",
    status: formData.get("status"),
    publishedAt: formData.get("publishedAt") ?? "",
    featured: formData.get("featured") === "on",
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  return { data: parsed.data };
}

function parseAttachments(raw: unknown): AttachmentData[] | null {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = attachmentsSchema.safeParse(json);
  if (!parsed.success) return null;

  const storageOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  for (const item of parsed.data) {
    const path = storagePathFromUrl(item.url);
    if (!path || !path.startsWith("posts/")) return null;
    if (storageOrigin && !item.url.startsWith(`${storageOrigin}/`)) return null;
  }
  return parsed.data;
}

function postData(d: PostData, status?: "DRAFT" | "PUBLISHED", publishedAt?: Date | null) {
  const tags = d.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let finalStatus: "DRAFT" | "PUBLISHED";
  let finalPublishedAt: Date | null;
  if (status) {
    // Autosave path: caller decides (new posts are always born as drafts).
    finalStatus = status;
    finalPublishedAt = publishedAt ?? null;
  } else {
    finalStatus = d.status;
    if (d.status === "PUBLISHED") {
      finalPublishedAt = d.publishedAt
        ? new Date(d.publishedAt + "T00:00:00")
        : new Date();
      if (Number.isNaN(finalPublishedAt.getTime())) finalPublishedAt = new Date();
    } else {
      finalPublishedAt = null;
    }
  }

  return {
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt,
    contentMD: d.contentMD,
    coverImage: d.coverImage || null,
    coverAlt: d.coverAlt || null,
    category: d.category || null,
    tags,
    status: finalStatus,
    publishedAt: finalPublishedAt,
    featured: d.featured,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };
}

// Makes the database match the list coming from the form: rows whose id is
// gone get deleted, new items get created. Storage files are deliberately
// untouched here — files are only removed when the user explicitly discards
// an upload (discardPostUpload) or the whole post is deleted (deletePost).
// That way a lost autosave response can never break an already-saved file.
async function reconcileAttachments(postId: string, items: AttachmentData[]) {
  const existing = await prisma.postAttachment.findMany({
    where: { postId },
    select: { id: true },
  });
  const keptIds = new Set(items.map((i) => i.id).filter(Boolean));
  const removed = existing.filter((e) => !keptIds.has(e.id));
  if (removed.length > 0) {
    await prisma.postAttachment.deleteMany({
      where: { id: { in: removed.map((r) => r.id) } },
    });
  }

  const existingIds = new Set(existing.map((e) => e.id));
  for (const item of items) {
    if (item.id && existingIds.has(item.id)) continue;
    await prisma.postAttachment.create({
      data: {
        postId,
        url: item.url,
        filename: item.filename,
        kind: item.kind,
        mimeType: item.mimeType,
        size: item.size,
        width: item.width ?? null,
        height: item.height ?? null,
      },
    });
  }
}

export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const { data, error } = parsePostForm(formData);
  if (!data) return { error: error ?? "Check the form." };

  const attachments = parseAttachments(formData.get("attachments"));
  if (attachments === null) {
    return { error: "The attachment list looks broken. Re-add the files." };
  }

  try {
    let id: string;
    if (data.id) {
      id = data.id;
      await prisma.post.update({ where: { id }, data: postData(data) });
    } else {
      const created = await prisma.post.create({ data: postData(data) });
      id = created.id;
    }
    await reconcileAttachments(id, attachments);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That slug is already used by another post." };
    }
    throw err;
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath(`/blog/${data.slug}`);
  redirect("/admin/posts");
}

// Fired by the editor a couple of seconds after typing stops. Never
// redirects: it reports back so the form can show a saved-at time.
export async function autosavePost(formData: FormData): Promise<AutosaveResult> {
  const { data, error } = parsePostForm(formData);
  if (!data) {
    const filled =
      formData.get("title") &&
      formData.get("slug") &&
      formData.get("excerpt") &&
      formData.get("contentMD");
    // Half-written form: wait quietly instead of nagging.
    if (!filled) return { ok: false, incomplete: true };
    return { ok: false, error: error ?? "Check the form." };
  }

  const attachments = parseAttachments(formData.get("attachments"));
  if (attachments === null) {
    return { ok: false, error: "The attachment list looks broken. Re-add the files." };
  }

  let id: string;
  let savedAttachments: { id: string; url: string }[] = [];
  try {
    if (data.id) {
      id = data.id;
      await prisma.post.update({ where: { id }, data: postData(data) });
    } else {
      // A post created by autosave is always a draft; publishing happens
      // only when the Save button is pressed.
      const created = await prisma.post.create({
        data: { ...postData(data, "DRAFT", null) },
      });
      id = created.id;
    }
    await reconcileAttachments(id, attachments);
    savedAttachments = await prisma.postAttachment.findMany({
      where: { postId: id },
      select: { id: true, url: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "That slug is already used by another post." };
    }
    console.error("Autosave failed:", err);
    return { ok: false, error: "Autosave failed. Press Save to keep your work." };
  }

  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath(`/blog/${data.slug}`);
  return {
    ok: true,
    id,
    savedAt: new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    attachments: savedAttachments,
  };
}

// Returns a short-lived upload URL for a post attachment. The file itself
// goes browser → Supabase Storage directly, so it can be bigger than the
// ~4.5 MB serverless body limit.
export async function requestPostUpload(
  filename: string,
  contentType: string,
  size: number,
): Promise<SignResult> {
  if (typeof filename !== "string" || !filename || filename.length > 200) {
    return { error: "That filename is not usable." };
  }
  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return { error: "The file is empty." };
  }

  const kind = classifyUpload(typeof contentType === "string" ? contentType : "", filename);
  if (!kind) {
    return {
      error: "Unsupported type. Photos, videos, PDF, Office, text and zip files only.",
    };
  }
  const limit = UPLOAD_LIMITS[kind];
  if (size > limit) {
    return {
      error: `${kind === "IMAGE" ? "Photos" : kind === "VIDEO" ? "Videos" : "Files"} must be under ${Math.round(limit / (1024 * 1024))} MB.`,
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
  const path = `posts/${Date.now()}-${randomBytes(4).toString("hex")}-${safeName}`;

  await ensureBucket(storage);
  const signed = await signUpload(storage, path);
  if ("error" in signed) return { error: signed.error };

  return { uploadUrl: signed.uploadUrl, publicUrl: publicUrl(storage, path) };
}

// Removes an uploaded file that was never saved with a post (the user
// pressed Remove before the form was submitted).
export async function discardPostUpload(
  url: string,
): Promise<{ ok?: boolean; error?: string }> {
  if (typeof url !== "string") return { error: "Bad url." };
  const path = storagePathFromUrl(url);
  if (!path || !path.startsWith("posts/")) return { error: "Not an attachment." };
  const storage = supabaseStorage();
  if (!storage) return { error: "Storage is not configured." };
  const ok = await deleteObject(storage, path);
  return ok ? { ok: true } : { error: "Could not delete the file." };
}

// Removes an attachment that is already saved: row and storage file go
// together, and the public post page is refreshed immediately.
export async function discardSavedAttachment(
  id: string,
  slug: string,
): Promise<{ ok?: boolean; error?: string }> {
  const row = await prisma.postAttachment.findUnique({
    where: { id },
    select: { url: true },
  });
  if (!row) return { ok: true };
  await prisma.postAttachment.delete({ where: { id } });
  await deleteObjectByUrl(row.url);
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/posts");
  return { ok: true };
}

export async function deletePost(id: string) {
  const row = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, attachments: { select: { url: true } } },
  });
  await prisma.post.delete({ where: { id } }); // cascades to attachments
  if (row) {
    await Promise.all(row.attachments.map((a) => deleteObjectByUrl(a.url)));
  }
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
  if (row) revalidatePath(`/blog/${row.slug}`);
}
