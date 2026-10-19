import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipOf } from "@/lib/request-info";
import { normalizeEmail } from "@/lib/licensing";
import { readApp } from "@/lib/license-api";
import { issueKeyForEmail, type IssueResult } from "@/lib/license-requests";

// POST /api/license/request
//
// Step 1–2 of the activation flow: the user types their email into a window
// in your software, and the software calls this. The app's own API key
// authenticates the call (x-app-key), so the endpoint is not a public form.
//
//   headers: x-app-key: appk_…
//   body:    { email, platform? }
//
// What happens next depends on the app's request mode (admin → Apps):
//   OFF     refused — nothing is issued.
//   AUTO    a single-device key is created (or the existing one reused) and
//           emailed to the address immediately.
//   REVIEW  the request is parked in the dashboard until the admin approves
//           or rejects it; approving sends the same email.
//
// The response is deliberately thin: it says whether a key is coming, never
// whether this address already had one.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().min(3).max(200),
  platform: z.string().trim().max(80).optional(),
});

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Wording the software can show as-is; `status` is what it should switch on.
const OUTCOMES: Record<
  IssueResult["outcome"],
  { http: number; ok: boolean; status: string; text: string }
> = {
  sent: {
    http: 200,
    ok: true,
    status: "sent",
    text: "Your activation key is on its way — check your email in a minute.",
  },
  failed: {
    http: 200,
    ok: true,
    status: "pending",
    text: "Request received. Your key will arrive shortly.",
  },
  no_slots: {
    http: 409,
    ok: false,
    status: "device_limit",
    text: "This key is already activated on a device. Contact support if you changed computers.",
  },
  suspended: {
    http: 403,
    ok: false,
    status: "suspended",
    text: "This license was suspended. Contact support.",
  },
  expired: {
    http: 403,
    ok: false,
    status: "expired",
    text: "This license has expired. Contact support.",
  },
  blocked: {
    http: 403,
    ok: false,
    status: "blocked",
    text: "This email cannot be used for activation. Contact support.",
  },
};

// Audit trail. Never allowed to break the answer: a database hiccup here
// must not turn a delivered key into an error screen.
async function record(entry: {
  appId: string;
  email: string;
  status: "PENDING" | "SENT" | "REJECTED" | "BLOCKED" | "FAILED";
  note: string | null;
  ip: string;
  platform?: string;
  licenseId?: string | null;
}) {
  try {
    await prisma.keyRequest.create({
      data: {
        appId: entry.appId,
        email: entry.email,
        status: entry.status,
        note: entry.note,
        ip: entry.ip,
        platform: entry.platform ?? null,
        licenseId: entry.licenseId ?? null,
        resolvedAt: entry.status === "PENDING" ? null : new Date(),
      },
    });
  } catch (err) {
    console.warn("Could not record key request:", err);
  }
}

export async function POST(req: Request) {
  const ip = ipOf(new Headers(req.headers));

  const app = await readApp(req);
  if (!app) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "Unknown app." },
      { status: 404 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "A valid email is required." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, status: "invalid", error: "That email address looks wrong." },
      { status: 400 },
    );
  }

  // Two buckets: one per network, one per address. The first stops a machine
  // from sweeping many addresses, the second stops one inbox being hammered.
  // failClosed: this is the endpoint that hands out keys, so the limit has to
  // hold across instances or it holds nowhere.
  const [withinIp, withinEmail] = await Promise.all([
    rateLimit(`lic-req-ip:${ip}`, 10, 3_600_000, { scope: "global", failClosed: true }),
    rateLimit(`lic-req-mail:${email}`, 3, 3_600_000, { scope: "global", failClosed: true }),
  ]);
  if (!withinIp || !withinEmail) {
    return NextResponse.json(
      {
        ok: false,
        status: "rate_limited",
        error: "Too many requests. Try again in an hour.",
      },
      { status: 429 },
    );
  }

  if (app.requestMode === "OFF") {
    await record({
      appId: app.id,
      email,
      status: "BLOCKED",
      note: "requests are switched off for this app",
      ip,
      platform: parsed.data.platform,
    });
    return NextResponse.json(
      {
        ok: false,
        status: "closed",
        error: "Activation requests are closed for this app.",
      },
      { status: 403 },
    );
  }

  if (app.requestMode === "REVIEW") {
    await record({
      appId: app.id,
      email,
      status: "PENDING",
      note: null,
      ip,
      platform: parsed.data.platform,
    });
    return NextResponse.json({
      ok: true,
      status: "pending",
      message: "Request received. Your key will arrive by email shortly.",
    });
  }

  const result = await issueKeyForEmail(
    { id: app.id, slug: app.slug, name: app.name },
    email,
  );

  const status =
    result.outcome === "sent"
      ? "SENT"
      : result.outcome === "failed"
        ? "FAILED"
        : result.outcome === "blocked"
          ? "BLOCKED"
          : "PENDING";

  await record({
    appId: app.id,
    email,
    status,
    note: result.note,
    ip,
    platform: parsed.data.platform,
    licenseId: result.licenseId,
  });

  const outcome = OUTCOMES[result.outcome];
  return NextResponse.json(
    { ok: outcome.ok, status: outcome.status, ...(outcome.ok ? { message: outcome.text } : { error: outcome.text }) },
    { status: outcome.http },
  );
}
