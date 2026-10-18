"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

export type LinkFormState = {
  error?: string;
  // The finished short URL, so the form can show a copy button right away
  // instead of sending the admin hunting for the row in the list.
  url?: string;
};

// Codes a custom link may not use. Short links live under /go/, so these
// cannot collide today — kept anyway in case they ever move to the root.
const RESERVED = new Set([
  "admin",
  "api",
  "go",
  "login",
  "new",
  "about",
  "blog",
  "contact",
  "projects",
  "services",
  "uses",
  "settings",
  "media",
  "copy",
  "messages",
  "posts",
  "content",
  "links",
]);

const CODE_RE = /^[a-zA-Z0-9_-]{3,60}$/;

const createSchema = z.object({
  targetUrl: z
    .string()
    .trim()
    .min(1, "Paste the link you want to shorten.")
    .max(2000, "That URL is too long.")
    .refine((v) => /^https?:\/\//.test(v), "Must start with http:// or https://."),
  title: z.string().trim().max(120, "Title: 120 characters max."),
  code: z.string().trim().max(60),
});

// 8 base64url characters from 6 random bytes — short enough to share,
// long enough that guessing an active code is pointless.
function autoCode(): string {
  return randomBytes(6).toString("base64url").slice(0, 8);
}

async function uniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = autoCode();
    const taken = await prisma.shortLink.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a short code.");
}

export async function createShortLink(
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    targetUrl: formData.get("targetUrl") ?? "",
    title: formData.get("title") ?? "",
    code: formData.get("code") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  const { targetUrl, title } = parsed.data;

  let code = parsed.data.code.toLowerCase();
  if (code) {
    if (!CODE_RE.test(code)) {
      return { error: "Code: 3–60 letters, numbers, dashes or underscores." };
    }
    if (RESERVED.has(code)) return { error: "That code is reserved. Pick another." };
  } else {
    code = await uniqueCode();
  }

  try {
    await prisma.shortLink.create({
      data: { code, targetUrl, title: title || null },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That code is already taken." };
    }
    throw err;
  }

  revalidatePath("/admin/links");
  // Returns instead of redirecting: the form shows the short URL (with a
  // copy button) while the list below refreshes on its own.
  return { url: `${site.url}/go/${code}` };
}

export async function toggleShortLink(id: string, active: boolean) {
  await requireAdmin();
  await prisma.shortLink.update({ where: { id }, data: { active } });
  revalidatePath("/admin/links");
}

export async function deleteShortLink(id: string) {
  await requireAdmin();
  await prisma.shortLink.delete({ where: { id } }); // cascades to the click log
  revalidatePath("/admin/links");
}
