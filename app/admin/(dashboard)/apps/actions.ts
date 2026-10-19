"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newAppApiKey, normalizeEmail, uniqueLicenseKey } from "@/lib/licensing";
import { issueKeyForEmail } from "@/lib/license-requests";

export type AppFormState = { error?: string; apiKey?: string; slug?: string };
export type LicenseFormState = { error?: string; key?: string };

// ── Apps ────────────────────────────────────────────────────────────────

const appSchema = z.object({
  name: z.string().trim().min(1, "Give the app a name.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug: at least 2 characters.")
    .max(30, "Slug: 30 characters max.")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers and dashes only."),
  description: z.string().trim().max(300),
});

export async function createApp(
  _prev: AppFormState,
  formData: FormData,
): Promise<AppFormState> {
  await requireAdmin();
  const parsed = appSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const apiKey = newAppApiKey();
  try {
    await prisma.app.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        apiKey,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That slug is already used by another app." };
    }
    throw err;
  }

  revalidatePath("/admin/apps");
  // Returns the key instead of redirecting: it is displayed once here,
  // with a copy button, and can be revealed again on the app's page.
  return { apiKey, slug: parsed.data.slug };
}

export async function rotateAppKey(id: string) {
  await requireAdmin();
  await prisma.app.update({ where: { id }, data: { apiKey: newAppApiKey() } });
  revalidatePath(`/admin/apps/${id}`);
  revalidatePath("/admin/apps");
}

export async function toggleApp(id: string, active: boolean) {
  await requireAdmin();
  await prisma.app.update({ where: { id }, data: { active } });
  revalidatePath("/admin/apps");
  revalidatePath(`/admin/apps/${id}`);
}

export async function deleteApp(id: string) {
  await requireAdmin();
  // Cascades to licenses and their activations.
  await prisma.app.delete({ where: { id } });
  revalidatePath("/admin/apps");
}

// ── Licenses ────────────────────────────────────────────────────────────

const licenseSchema = z.object({
  appId: z.string().min(1),
  label: z.string().trim().max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /\S+@\S+\.\S+/.test(v), "That email looks wrong."),
  notes: z.string().trim().max(2000),
  maxDevices: z.coerce.number().int().min(1, "At least 1 device.").max(100),
  expiresAt: z.string().trim(),
  customKey: z.string().trim(),
});

export async function createLicense(
  _prev: LicenseFormState,
  formData: FormData,
): Promise<LicenseFormState> {
  await requireAdmin();
  const parsed = licenseSchema.safeParse({
    appId: formData.get("appId") ?? "",
    label: formData.get("label") ?? "",
    email: formData.get("email") ?? "",
    notes: formData.get("notes") ?? "",
    maxDevices: formData.get("maxDevices") ?? 1,
    expiresAt: formData.get("expiresAt") ?? "",
    customKey: formData.get("customKey") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const app = await prisma.app.findUnique({
    where: { id: parsed.data.appId },
    select: { slug: true },
  });
  if (!app) return { error: "That app no longer exists." };

  let key = parsed.data.customKey.toUpperCase();
  if (key) {
    if (!/^[A-Z0-9-]{6,60}$/.test(key)) {
      return { error: "Custom key: A–Z, 0–9 and dashes only (6–60 characters)." };
    }
  } else {
    key = await uniqueLicenseKey(app.slug);
  }

  const expiresAt = parsed.data.expiresAt
    ? new Date(`${parsed.data.expiresAt}T23:59:59`)
    : null;

  try {
    await prisma.license.create({
      data: {
        appId: parsed.data.appId,
        key,
        label: parsed.data.label || null,
        email: parsed.data.email || null,
        notes: parsed.data.notes || null,
        maxDevices: parsed.data.maxDevices,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "That key already exists." };
    }
    throw err;
  }

  revalidatePath(`/admin/apps/${parsed.data.appId}`);
  revalidatePath("/admin/apps");
  return { key };
}

export async function setLicenseStatus(
  id: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  await requireAdmin();
  const license = await prisma.license.update({
    where: { id },
    data: { status },
    select: { appId: true },
  });
  revalidatePath(`/admin/apps/${license.appId}`);
  revalidatePath("/admin/apps");
}

// Edits the two per-key dials: device slots and the expiry date. Takes
// FormData directly so the license page can bind it to a plain form.
export async function updateLicense(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      maxDevices: z.coerce.number().int().min(1).max(100),
      expiresAt: z.string().trim(),
    })
    .safeParse({
      maxDevices: formData.get("maxDevices") ?? 1,
      expiresAt: formData.get("expiresAt") ?? "",
    });
  if (!parsed.success) return;

  const expiresAt = parsed.data.expiresAt
    ? new Date(`${parsed.data.expiresAt}T23:59:59`)
    : null;
  const license = await prisma.license.update({
    where: { id },
    data: {
      maxDevices: parsed.data.maxDevices,
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    },
    select: { appId: true },
  });
  revalidatePath(`/admin/apps/${license.appId}/licenses/${id}`);
  revalidatePath(`/admin/apps/${license.appId}`);
}

// Clears every device, so the key can be re-activated on new machines.
export async function resetLicenseActivations(id: string) {
  await requireAdmin();
  const license = await prisma.license.findUnique({
    where: { id },
    select: { appId: true },
  });
  await prisma.licenseActivation.deleteMany({ where: { licenseId: id } });
  if (license) revalidatePath(`/admin/apps/${license.appId}`);
}

export async function deleteLicense(id: string) {
  await requireAdmin();
  const license = await prisma.license.findUnique({
    where: { id },
    select: { appId: true },
  });
  await prisma.license.delete({ where: { id } }); // cascades to activations
  if (license) revalidatePath(`/admin/apps/${license.appId}`);
  revalidatePath("/admin/apps");
}

// Kicks a single device off a license (or lets it back on).
export async function setActivationRevoked(id: string, revoked: boolean) {
  await requireAdmin();
  const activation = await prisma.licenseActivation.update({
    where: { id },
    data: { revoked },
    select: { license: { select: { appId: true } } },
  });
  revalidatePath(`/admin/apps/${activation.license.appId}`);
}

// ── Key requests ────────────────────────────────────────────────────────

// What a request log entry means for the whole dashboard.
function revalidateRequestViews(appId?: string) {
  revalidatePath("/admin/apps/requests");
  revalidatePath("/admin/apps/licenses");
  revalidatePath("/admin/apps");
  if (appId) revalidatePath(`/admin/apps/${appId}`);
}

// How a request is answered when the software asks for a key for someone's
// email: OFF refuses, AUTO sends at once, REVIEW waits for this screen.
export async function setRequestMode(
  id: string,
  mode: "OFF" | "AUTO" | "REVIEW",
) {
  await requireAdmin();
  if (!["OFF", "AUTO", "REVIEW"].includes(mode)) return;
  await prisma.app.update({ where: { id }, data: { requestMode: mode } });
  revalidateRequestViews(id);
}

// Issues (or re-sends) the key for a waiting request. Used by both
// "Approve & send" on a pending request and "Resend" on a failed one —
// same operation, because re-requesting never mints a duplicate key.
export async function sendKeyRequest(id: string) {
  await requireAdmin();
  const request = await prisma.keyRequest.findUnique({
    where: { id },
    include: { app: { select: { id: true, slug: true, name: true } } },
  });
  if (!request) return;

  const result = await issueKeyForEmail(request.app, request.email);
  const status =
    result.outcome === "sent"
      ? "SENT"
      : result.outcome === "failed"
        ? "FAILED"
        : result.outcome === "blocked"
          ? "BLOCKED"
          : "PENDING";

  await prisma.keyRequest.update({
    where: { id },
    data: {
      status,
      note: result.note,
      licenseId: result.licenseId,
      resolvedAt: status === "PENDING" ? null : new Date(),
    },
  });
  revalidateRequestViews(request.app.id);
}

export async function rejectKeyRequest(id: string) {
  await requireAdmin();
  const request = await prisma.keyRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      note: "rejected in the dashboard",
      resolvedAt: new Date(),
    },
    select: { appId: true },
  });
  revalidateRequestViews(request.appId);
}

export async function deleteKeyRequest(id: string) {
  await requireAdmin();
  const request = await prisma.keyRequest.delete({
    where: { id },
    select: { appId: true },
  });
  revalidateRequestViews(request.appId);
}

// ── Bans ────────────────────────────────────────────────────────────────

export type BanFormState = { error?: string; ok?: boolean };

const banSchema = z.object({
  kind: z.enum(["EMAIL", "DEVICE"]),
  value: z.string().trim().min(3, "Enter an email or a device id.").max(200),
  reason: z.string().trim().max(200),
});

function revalidateBanViews() {
  revalidatePath("/admin/apps/bans");
  revalidatePath("/admin/apps/licenses");
  revalidatePath("/admin/apps/requests");
  revalidatePath("/admin/apps");
}

// One place where a ban is written, shared by the hand-typed form and the
// one-click buttons on license, device and request rows. Emails are stored
// lowercased, matching banHit()'s lookup.
async function addBan(
  kind: "EMAIL" | "DEVICE",
  rawValue: string,
  reason: string | null,
): Promise<"created" | "exists"> {
  const value = kind === "EMAIL" ? normalizeEmail(rawValue) : rawValue;
  try {
    await prisma.ban.create({ data: { kind, value, reason } });
    return "created";
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return "exists";
    }
    throw err;
  }
}

// Adds a ban by hand from the Bans screen.
export async function createBan(
  _prev: BanFormState,
  formData: FormData,
): Promise<BanFormState> {
  await requireAdmin();
  const parsed = banSchema.safeParse({
    kind: formData.get("kind") ?? "EMAIL",
    value: formData.get("value") ?? "",
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const result = await addBan(
    parsed.data.kind,
    parsed.data.value,
    parsed.data.reason || null,
  );
  if (result === "exists") {
    return {
      error: `That ${parsed.data.kind === "EMAIL" ? "email" : "device"} is already banned.`,
    };
  }

  revalidateBanViews();
  return { ok: true };
}

export async function removeBan(id: string) {
  await requireAdmin();
  await prisma.ban.delete({ where: { id } });
  revalidateBanViews();
}

// Bans an address without touching a license — used from the request queue,
// where the point is to stop that email asking again.
export async function banEmailValue(email: string, reason?: string) {
  await requireAdmin();
  await addBan("EMAIL", email, reason ?? null);
  revalidateBanViews();
}

// One-click ban from a license row: blocks that email everywhere — new key
// requests as well as activation and re-checks on every app.
export async function banLicenseEmail(licenseId: string) {
  await requireAdmin();
  const license = await prisma.license.findUnique({
    where: { id: licenseId },
    select: { email: true, appId: true },
  });
  if (!license?.email) return;
  await addBan("EMAIL", license.email, `banned from license ${licenseId}`);
  revalidateBanViews();
  revalidatePath(`/admin/apps/${license.appId}/licenses/${licenseId}`);
}

// One-click ban from a device row: that machine is refused on every app,
// whatever key it presents.
export async function banActivationDevice(activationId: string) {
  await requireAdmin();
  const activation = await prisma.licenseActivation.findUnique({
    where: { id: activationId },
    select: {
      deviceId: true,
      licenseId: true,
      license: { select: { appId: true } },
    },
  });
  if (!activation) return;
  await addBan("DEVICE", activation.deviceId, `banned from activation ${activationId}`);
  revalidateBanViews();
  revalidatePath(
    `/admin/apps/${activation.license.appId}/licenses/${activation.licenseId}`,
  );
}
