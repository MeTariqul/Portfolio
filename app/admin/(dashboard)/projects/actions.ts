"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    featured: d.featured,
    order: d.order,
  };

  try {
    if (d.id) {
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

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath("/");
}
