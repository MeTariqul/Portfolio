"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSpec, type ContentSpec } from "@/lib/content-specs";
import { deleteRow, upsertRow } from "@/lib/content-rows";

export type ContentFormState = { error?: string };

// Validates the posted form against the spec's fields, so every content
// type gets the same rules without repeating them per model.
function parseForm(
  spec: ContentSpec,
  formData: FormData,
): { data?: Record<string, string | number>; error?: string } {
  const data: Record<string, string | number> = {};

  for (const f of spec.fields) {
    // Inputs are posted as `f.<key>` (see content-form.tsx), which keeps
    // them apart from the hidden kind/id routing inputs.
    const raw = formData.get(`f.${f.key}`);

    if (f.type === "number") {
      const n = Number(String(raw ?? "").trim() || 0);
      if (!Number.isInteger(n) || n < 0 || n > 99999) {
        return { error: `${f.label}: use a whole number.` };
      }
      data[f.key] = n;
      continue;
    }

    const v = String(raw ?? "").trim();
    if (!v && f.required) return { error: `${f.label} is required.` };
    if (f.max && v.length > f.max) {
      return { error: `${f.label}: keep it under ${f.max} characters.` };
    }
    if (
      f.type === "select" &&
      v &&
      !f.options?.some((o) => o.value === v)
    ) {
      return { error: `${f.label}: pick one of the options.` };
    }
    data[f.key] = v;
  }

  return { data };
}

export async function saveContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireAdmin();

  const spec = getSpec(String(formData.get("kind") ?? ""));
  if (!spec) return { error: "Unknown content type." };

  const { data, error } = parseForm(spec, formData);
  if (!data) return { error: error ?? "Check the form." };

  const rawId = formData.get("id");
  const id = typeof rawId === "string" && rawId ? rawId : null;

  try {
    await upsertRow(spec, id, data);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { error: "That row no longer exists. Reload the page." };
    }
    throw err;
  }

  for (const path of spec.revalidate) revalidatePath(path);
  revalidatePath(`/admin/content/${spec.kind}`);
  redirect(`/admin/content/${spec.kind}`);
}

export async function deleteContent(kind: string, id: string) {
  await requireAdmin();
  const spec = getSpec(kind);
  if (!spec) return;

  try {
    await deleteRow(spec, id);
  } catch (err) {
    // Already deleted elsewhere (a second click): nothing left to do.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return;
    }
    throw err;
  }

  for (const path of spec.revalidate) revalidatePath(path);
  revalidatePath(`/admin/content/${spec.kind}`);
  redirect(`/admin/content/${spec.kind}`);
}
