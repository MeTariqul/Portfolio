"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type UploadState = { error?: string; ok?: boolean };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const BUCKET = "portfolio-media";

function supabaseStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

async function ensureBucket(url: string, key: string) {
  try {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: BUCKET, public: true }),
    });
    // 409 = already exists, that's fine
    if (!res.ok && res.status !== 409) {
      console.warn("Bucket create failed:", res.status, await res.text());
    }
  } catch (err) {
    console.warn("Bucket create error:", err);
  }
}

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

  await ensureBucket(storage.url, storage.key);

  try {
    const res = await fetch(
      `${storage.url}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storage.key}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: Buffer.from(await file.arrayBuffer()),
      },
    );
    if (!res.ok) {
      console.warn("Storage upload failed:", res.status, await res.text());
      return { error: `Upload failed (storage returned ${res.status}).` };
    }
  } catch (err) {
    console.warn("Storage upload error:", err);
    return { error: "Upload failed. Check your connection and try again." };
  }

  const publicUrl = `${storage.url}/storage/v1/object/public/${BUCKET}/${path}`;

  await prisma.media.create({
    data: {
      url: publicUrl,
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
  if (storage) {
    try {
      await fetch(
        `${storage.url}/storage/v1/object/${BUCKET}/${row.publicId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${storage.key}` },
        },
      );
    } catch (err) {
      console.warn("Storage delete error:", err);
    }
  }

  await prisma.media.delete({ where: { id } });
  revalidatePath("/admin/media");
}
