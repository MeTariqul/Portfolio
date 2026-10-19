import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipOf } from "@/lib/request-info";
import { banHit, isLicenseUsable } from "@/lib/licensing";
import { digestDeviceId, normalizeDeviceId } from "@/lib/device";
import { deny, grant, readApp } from "@/lib/license-api";

// POST /api/license/verify
//
// The online half of the hybrid check. An app runs on its cached token
// until the token's `recheckAt`, then calls this to re-validate and get a
// fresh token. It is also the heartbeat that keeps "last seen" honest in
// the dashboard, and the point where a suspension, an expiry or a revoked
// device actually takes effect.
//
//   headers: x-app-key: appk_…
//   body:    { key, deviceId }
//
// Never claims a new device slot — a device that has not activated gets
// status "not_activated" and is expected to call /activate.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  key: z.string().trim().min(6).max(80),
  deviceId: z.string().trim().min(8).max(200),
});

export async function POST(req: Request) {
  const ip = ipOf(new Headers(req.headers));
  // Apps poll on their own schedule; the ceiling is generous but finite.
  // failClosed: a shared counter is the only way to hold the limit across
  // instances, so the request is refused when it cannot be reached.
  if (!(await rateLimit(`lic-ver:${ip}`, 240, 60_000, { scope: "global", failClosed: true }))) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "Too many checks. Try again shortly." },
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
  const { key, deviceId: rawDeviceId } = parsed.data;

  // Same rule as the activate route: the id is validated, canonicalised and
  // hashed before it is used for anything. The database stores the digest.
  const deviceId = normalizeDeviceId(rawDeviceId);
  if (deviceId === null) return deny("invalid");
  const deviceHash = digestDeviceId(rawDeviceId) as string;

  const license = await prisma.license.findFirst({
    where: { key: key.toUpperCase(), appId: app.id },
    include: { activations: { where: { deviceId: deviceHash } } },
  });
  if (!license) return deny("invalid");

  // Bans outrank suspension and expiry — see the note in the activate route.
  const ban = await banHit({ email: license.email, deviceId: deviceHash });
  if (ban?.kind === "EMAIL") return deny("banned");
  if (ban) return deny("banned_device");

  if (license.status === "SUSPENDED") return deny("suspended");
  if (!isLicenseUsable(license)) return deny("expired");

  const activation = license.activations[0];
  if (!activation) return deny("not_activated");
  if (activation.revoked) return deny("revoked_device");

  await prisma.licenseActivation.update({
    where: { id: activation.id },
    data: { ip },
  });

  return grant({
    licenseId: license.id,
    appSlug: app.slug,
    deviceId,
    deviceHash,
    recheckDays: app.recheckDays,
    expiresAt: license.expiresAt,
    label: license.label,
  });
}
