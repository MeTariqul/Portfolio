import {
  createPrivateKey,
  generateKeyPairSync,
  randomBytes,
  sign as edSign,
  timingSafeEqual,
} from "node:crypto";
import { prisma } from "@/lib/prisma";

// Core of the app-licensing system (/admin/apps). Three jobs:
//
//  1. Signing keys. One Ed25519 pair for the whole server, generated on
//     first use and kept in the Setting table. The private key never
//     leaves the server; the public key is what shipped apps embed to
//     verify tokens offline (GET /api/license/pubkey).
//
//  2. Tokens. A signed, self-contained proof of activation
//     ("payload.signature", both base64url). The app can verify it with
//     the public key and keep running without a network round-trip until
//     the `r` (recheck) claim, so revocation lands within the grace
//     window instead of instantly.
//
//  3. Keys. License keys in a readable, unguessable format
//     (MYAPP-XXXX-XXXX-XXXX) and per-app API keys.

const KEYS_SETTING = "license_keys";

// How long a token stays valid offline before the app must re-check
// online. Shorter = revocation bites sooner, but apps nag the server more.
// This is the default; each app can set its own window (App.recheckDays).
export const RECHECK_DAYS = 7;

// The bounds for a per-app re-check window. Below a day the app would be
// talking to the server on every launch; above a month a revoked licence
// would keep working offline for a month.
export const MIN_RECHECK_DAYS = 1;
export const MAX_RECHECK_DAYS = 90;

export type LicenseClaims = {
  v: 1;
  l: string; // license id
  a: string; // app slug
  d: string; // device id (fingerprint the app computed)
  h: string; // digest of that device id — see lib/device.ts
  e: number; // expires at (ms since epoch), 0 = lifetime
  i: number; // issued at (ms)
  r: number; // recheck at (ms) — offline grace ends here
};

type SigningKeys = { privateKeyPem: string; publicKeyPem: string };

// Process-level cache: the keys are long-lived, so one read per instance.
let cached: SigningKeys | null = null;

function readRow(value: unknown): SigningKeys | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.privateKeyPem !== "string" ||
    typeof row.publicKeyPem !== "string"
  ) {
    return null;
  }
  return { privateKeyPem: row.privateKeyPem, publicKeyPem: row.publicKeyPem };
}

// Generates the pair on first use and stores it. The upsert is
// create-only: if two requests race, one wins and both end up reading
// the winner, so tokens never verify against a phantom key.
async function loadKeys(): Promise<SigningKeys> {
  if (cached) return cached;

  const existing = readRow(
    (await prisma.setting.findUnique({ where: { key: KEYS_SETTING } }))?.value,
  );
  if (existing) {
    cached = existing;
    return cached;
  }

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const generated: SigningKeys = {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
  await prisma.setting.upsert({
    where: { key: KEYS_SETTING },
    create: { key: KEYS_SETTING, value: generated },
    update: {},
  });
  cached =
    readRow(
      (await prisma.setting.findUnique({ where: { key: KEYS_SETTING } }))?.value,
    ) ?? generated;
  return cached;
}

export async function publicKeyPem(): Promise<string> {
  return (await loadKeys()).publicKeyPem;
}

export function buildClaims(input: {
  licenseId: string;
  appSlug: string;
  deviceId: string;
  deviceHash: string;
  expiresAt: Date | null;
  recheckDays?: number;
}): LicenseClaims {
  const issuedAt = Date.now();
  const expires = input.expiresAt ? input.expiresAt.getTime() : 0;

  // The re-check window is per app: a short one makes a revoked licence
  // stop working sooner, at the cost of the app talking to the server more
  // often. The window never runs past the licence's own expiry.
  const days = Math.min(
    Math.max(Math.trunc(input.recheckDays ?? RECHECK_DAYS), MIN_RECHECK_DAYS),
    MAX_RECHECK_DAYS,
  );
  const graceEnd = issuedAt + days * 24 * 60 * 60_000;

  return {
    v: 1,
    l: input.licenseId,
    a: input.appSlug,
    d: input.deviceId,
    h: input.deviceHash,
    e: expires,
    i: issuedAt,
    r: expires > 0 ? Math.min(graceEnd, expires) : graceEnd,
  };
}

export async function signToken(claims: LicenseClaims): Promise<string> {
  const { privateKeyPem } = await loadKeys();
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = edSign(
    null,
    Buffer.from(payload),
    createPrivateKey(privateKeyPem),
  ).toString("base64url");
  return `${payload}.${signature}`;
}

// ── Key generation ──────────────────────────────────────────────────────

// No I, O, 0 or 1: keys get read aloud and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomBlock(size: number): string {
  const bytes = randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// e.g. slug "myapp" → MYAPP-7QK4-2XP9-MZ34
export function formatLicenseKey(slug: string): string {
  const prefix =
    slug.replace(/[^a-z0-9]/gi, "").slice(0, 5).toUpperCase() || "LIC";
  return [prefix, randomBlock(4), randomBlock(4), randomBlock(4)].join("-");
}

export async function uniqueLicenseKey(slug: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const key = formatLicenseKey(slug);
    const taken = await prisma.license.findUnique({
      where: { key },
      select: { id: true },
    });
    if (!taken) return key;
  }
  throw new Error("Could not allocate a license key.");
}

export function newAppApiKey(): string {
  return `appk_${randomBytes(24).toString("base64url")}`;
}

// Constant-time comparison for API keys, so a wrong key cannot be
// brute-forced by timing the response.
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

// Shared response vocabulary: apps switch on `status`, and everything the
// end user should never see (why a key failed) stays server-side.
export type LicenseCheck =
  | { status: "active" }
  | { status: "expired" }
  | { status: "suspended" }
  | { status: "device_limit" }
  | { status: "revoked_device" }
  | { status: "not_activated" }
  | { status: "banned" }
  | { status: "banned_device" }
  | { status: "invalid" };

export function isLicenseUsable(license: {
  status: "ACTIVE" | "SUSPENDED";
  expiresAt: Date | null;
}): boolean {
  if (license.status === "SUSPENDED") return false;
  if (license.expiresAt && license.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

// How the dashboard labels a license. Lives here rather than in the two
// admin pages so both agree, and because deciding it reads the clock —
// work for a plain function, not a render body.
//
// "Blocked" is the licence-level switch (LicenseStatus.SUSPENDED, which is
// what the activation API reports as `suspended`); "Banned" is the separate
// email/device deny list and is applied by the pages, which know the ban
// table.
export function licenseStateLabel(license: {
  status: "ACTIVE" | "SUSPENDED";
  expiresAt: Date | null;
}): "Active" | "Blocked" | "Expired" {
  if (license.status === "SUSPENDED") return "Blocked";
  if (license.expiresAt && license.expiresAt.getTime() <= Date.now()) return "Expired";
  return "Active";
}

// ── Bans ────────────────────────────────────────────────────────────────

// Emails are matched case-insensitively; device ids are matched as digests
// (lib/device.ts), so the same machine always produces the same value.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type BanHit = {
  kind: "EMAIL" | "DEVICE";
  value: string;
  reason: string | null;
};

// One query covering both kinds, run on every request, activation and
// re-check. A hit means the caller is refused before anything else about
// the license matters — a ban outranks suspension and expiry.
export async function banHit(input: {
  email?: string | null;
  deviceId?: string | null;
}): Promise<BanHit | null> {
  const values: { kind: "EMAIL" | "DEVICE"; value: string }[] = [];
  if (input.email) values.push({ kind: "EMAIL", value: normalizeEmail(input.email) });
  // The device id is compared as a digest: the database stores digests
  // (lib/device.ts), so the value passed in here must already be digested.
  // The caller hashes once, at the edge of the request, and passes the same
  // digest everywhere.
  if (input.deviceId) values.push({ kind: "DEVICE", value: input.deviceId });
  if (values.length === 0) return null;

  return prisma.ban.findFirst({
    where: { OR: values },
    select: { kind: true, value: true, reason: true },
  });
}
