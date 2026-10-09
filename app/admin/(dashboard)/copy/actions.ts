"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COPY_FIELDS } from "@/lib/copy";

export type CopyState = { error?: string };

const MAX_LEN = 5000;

// Saves the whole Copy screen. A field that is empty — or typed back to
// exactly its default — is not stored, so lib/copy.ts keeps ownership of
// the wording and a later default change still reaches untouched fields.
export async function saveCopy(
  _prev: CopyState,
  formData: FormData,
): Promise<CopyState> {
  await requireAdmin();

  const value: Record<string, string> = {};
  for (const f of COPY_FIELDS) {
    const raw = formData.get(`c.${f.key}`);
    const v = typeof raw === "string" ? raw : "";
    if (v.length > MAX_LEN) {
      return { error: `"${f.label}" is too long (${MAX_LEN} characters max).` };
    }
    if (v.trim() === "" || v.trim() === f.def.trim()) continue;
    value[f.key] = v;
  }

  await prisma.setting.upsert({
    where: { key: "copy" },
    create: { key: "copy", value },
    update: { value },
  });

  // The wording reaches every public page: layouts first, then each route's
  // own ISR window (60 seconds) picks the rest up.
  revalidatePath("/", "layout");
  revalidatePath("/rss.xml");
  redirect("/admin/copy?saved=1");
}
