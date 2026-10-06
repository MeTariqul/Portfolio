"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PostFormState = { error?: string };

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

export async function savePost(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
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

  const d = parsed.data;
  const tags = d.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let publishedAt: Date | null = null;
  if (d.status === "PUBLISHED") {
    publishedAt = d.publishedAt ? new Date(d.publishedAt + "T00:00:00") : new Date();
    if (Number.isNaN(publishedAt.getTime())) publishedAt = new Date();
  }

  try {
    if (d.id) {
      await prisma.post.update({
        where: { id: d.id },
        data: {
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          contentMD: d.contentMD,
          coverImage: d.coverImage || null,
          coverAlt: d.coverAlt || null,
          category: d.category || null,
          tags,
          status: d.status,
          publishedAt,
          featured: d.featured,
          seoTitle: d.seoTitle || null,
          seoDescription: d.seoDescription || null,
        },
      });
    } else {
      await prisma.post.create({
        data: {
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          contentMD: d.contentMD,
          coverImage: d.coverImage || null,
          coverAlt: d.coverAlt || null,
          category: d.category || null,
          tags,
          status: d.status,
          publishedAt,
          featured: d.featured,
          seoTitle: d.seoTitle || null,
          seoDescription: d.seoDescription || null,
        },
      });
    }
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
  redirect("/admin/posts");
}

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath("/");
}
