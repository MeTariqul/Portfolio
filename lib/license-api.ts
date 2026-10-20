import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildClaims, signToken, type LicenseCheck } from "@/lib/licensing";

// Shared plumbing for the license endpoints (app/api/license/*), kept in
// one place so /activate and /verify cannot drift apart in how they
// decide what a key is allowed to do.

// The app identifies itself with its own API key. Apps are looked up by
// exact key (the DB index does the comparison); the key carries 192 bits
// of entropy, so guessing is not a realistic attack, and the rate limits
// in each route cap attempts anyway.
//
// Two keys are accepted: the current one, and the one from the last
// rotation while it is still within its grace period. That is what lets a
// rotation happen without breaking every copy of the app that is already
// installed — the old key stops working when the grace period ends, not the
// moment the new key is created.
export async function readApp(req: Request) {
  const apiKey = req.headers.get("x-app-key")?.trim() ?? "";
  if (!apiKey || apiKey.length > 200) return null;

  const now = new Date();
  const app = await prisma.app.findFirst({
    where: {
      active: true,
      OR: [
        { apiKey },
        {
          previousApiKey: apiKey,
          previousApiKeyExpiresAt: { gt: now },
        },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      active: true,
      requestMode: true,
      recheckDays: true,
    },
  });
  if (!app) return null;
  return app;
}

const MESSAGES: Record<LicenseCheck["status"], string> = {
  active: "Activated.",
  expired: "This license has expired.",
  suspended: "This license was suspended.",
  device_limit: "All device slots for this license are in use.",
  revoked_device: "This device was removed from the license.",
  not_activated: "Activate this device before verifying.",
  banned: "This license was blocked. Contact support.",
  banned_device: "This device was blocked. Contact support.",
  invalid: "This license key is not valid for this app.",
};

const CODES: Record<LicenseCheck["status"], number> = {
  active: 200,
  expired: 403,
  suspended: 403,
  device_limit: 409,
  revoked_device: 403,
  not_activated: 409,
  banned: 403,
  banned_device: 403,
  invalid: 404,
};

// A refusal the app can show its user without leaking anything else.
export function deny(status: Exclude<LicenseCheck["status"], "active">) {
  return NextResponse.json(
    { ok: false, status, error: MESSAGES[status] },
    { status: CODES[status] },
  );
}

// The success shape: a signed token the app verifies offline (public key
// from /api/license/pubkey) plus plain fields for a UI that just wants to
// print "licensed until …".
export async function grant(input: {
  licenseId: string;
  appSlug: string;
  deviceId: string;
  deviceHash: string;
  recheckDays?: number;
  expiresAt: Date | null;
  label?: string | null;
}) {
  const claims = buildClaims(input);
  const token = await signToken(claims);
  return NextResponse.json({
    ok: true,
    status: "active" satisfies LicenseCheck["status"],
    token,
    issuedAt: new Date(claims.i).toISOString(),
    recheckAt: new Date(claims.r).toISOString(),
    expiresAt: input.expiresAt ? input.expiresAt.toISOString() : null,
    label: input.label ?? null,
  });
}
