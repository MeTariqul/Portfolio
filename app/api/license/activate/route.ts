import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipOf, userAgentOf } from "@/lib/request-info";
import { banHit, isLicenseUsable } from "@/lib/licensing";
import { deny, grant, readApp } from "@/lib/license-api";

// POST /api/license/activate
//
// Called by one of your apps when a user enters a license key. The app
// sends its own API key (x-app-key) plus the user's license key and a
// device fingerprint; this endpoint claims a device slot and returns a
// signed token.
//
//   headers: x-app-key: appk_…
//   body:    { key, deviceId, deviceName?, platform? }
//
// Idempotent per device: calling it again on an activated device just
// refreshes the record and re-issues the token.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  key: z.string().trim().min(6).max(80),
  deviceId: z.string().trim().min(8).max(200),
  deviceName: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  const h = new Headers(req.headers);
  const ip = ipOf(h);
  if (!(await rateLimit(`lic-act:${ip}`, 60, 60_000))) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "Too many attempts. Try again shortly." },
      { status: 429 },
    );
  }

  const app = await readApp(req);
  if (!app) return deny("invalid");

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "Check the request fields." },
      { status: 400 },
    );
  }
  const { key, deviceId } = parsed.data;

  const license = await prisma.license.findFirst({
    where: { key: key.toUpperCase(), appId: app.id },
    include: { activations: { where: { deviceId } } },
  });
  if (!license) return deny("invalid");

  // A ban is checked before suspension and expiry: it is the admin's last
  // word, and it applies to the email on the license as well as the device
  // asking, so a banned address cannot activate on a fresh machine either.
  const ban = await banHit({ email: license.email, deviceId });
  if (ban?.kind === "EMAIL") return deny("banned");
  if (ban) return deny("banned_device");

  if (license.status === "SUSPENDED") return deny("suspended");
  if (!isLicenseUsable(license)) return deny("expired");

  const existing = license.activations[0];
  if (existing?.revoked) return deny("revoked_device");

  const details = {
    deviceName: parsed.data.deviceName ?? null,
    platform: parsed.data.platform ?? (userAgentOf(h) ?? null),
    ip,
  };

  if (existing) {
    await prisma.licenseActivation.update({
      where: { id: existing.id },
      data: details,
    });
    return grant({
      licenseId: license.id,
      appSlug: app.slug,
      deviceId,
      expiresAt: license.expiresAt,
      label: license.label,
    });
  }

  // Seat check and claim in one transaction, so two devices racing for
  // the last slot cannot both win.
  const claimed = await prisma.$transaction(async (tx) => {
    const used = await tx.licenseActivation.count({
      where: { licenseId: license.id, revoked: false },
    });
    if (used >= license.maxDevices) return null;
    return tx.licenseActivation.create({
      data: { licenseId: license.id, deviceId, ...details },
    });
  });

  if (!claimed) return deny("device_limit");

  return grant({
    licenseId: license.id,
    appSlug: app.slug,
    deviceId,
    expiresAt: license.expiresAt,
    label: license.label,
  });
}
