"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  authHeaders,
  BUCKET,
  deleteObject,
  ensureBucket,
  publicUrl,
  supabaseStorage,
} from "@/lib/storage";

export type UploadState = { error?: string; ok?: boolean };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const uploadSchema = z.object({
  alt: z.string().trim().min(2, "Describe the image (alt text, 2+ chars)."),
});

export async function uploadMedia(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const parsed = uploadSchema.safeParse({ alt: formData.get("alt") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image file first." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed (jpg, png, webp, gif, svg)." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File is larger than 5 MB." };
  }

  const storage = supabaseStorage();
  if (!storage) {
    return { error: "Storage is not configured (missing env keys)." };
  }

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");
  const path = `${Date.now()}-${safeName || "image"}`;

  await ensureBucket(storage);

  try {
    const res = await fetch(`${storage.url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        ...authHeaders(storage),
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: Buffer.from(await file.arrayBuffer()),
    });
    if (!res.ok) {
      console.warn("Storage upload failed:", res.status, await res.text());
      return { error: `Upload failed (storage returned ${res.status}).` };
    }
  } catch (err) {
    console.warn("Storage upload error:", err);
    return { error: "Upload failed. Check your connection and try again." };
  }

  await prisma.media.create({
    data: {
      url: publicUrl(storage, path),
      publicId: path,
      filename: file.name,
      alt: parsed.data.alt,
    },
  });

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMedia(id: string) {
  const row = await prisma.media.findUnique({ where: { id } });
  if (!row) return;

  const storage = supabaseStorage();
  if (storage) await deleteObject(storage, row.publicId);

  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
