import { prisma } from "@/lib/prisma";
import { banHit, normalizeEmail, uniqueLicenseKey } from "@/lib/licensing";
import { sendActivationKey } from "@/lib/license-mail";

// Turns "email me a key" into either a delivered key or a recorded reason it
// could not be delivered. Shared by POST /api/license/request (AUTO mode)
// and the admin's Approve / Resend buttons, so all three paths behave the
// same way — in particular, a key is never minted twice for one email.

export type IssueOutcome =
  | "sent" // key emailed just now
  | "failed" // key exists, but the mail provider refused it
  | "no_slots" // their existing key is already on a device
  | "suspended" // their existing key is suspended — only the admin can lift it
  | "expired" // their existing key lapsed
  | "blocked"; // banned email

export type IssueResult = {
  outcome: IssueOutcome;
  key: string | null;
  licenseId: string | null;
  note: string | null;
};

export async function issueKeyForEmail(
  app: { id: string; slug: string; name: string },
  email: string,
): Promise<IssueResult> {
  const normalised = normalizeEmail(email);

  // A ban outranks everything: no key, no email, no exceptions.
  const ban = await banHit({ email: normalised });
  if (ban) {
    return {
      outcome: "blocked",
      key: null,
      licenseId: null,
      note: ban.reason ? `banned email: ${ban.reason}` : "banned email",
    };
  }

  const existing = await prisma.license.findFirst({
    where: { appId: app.id, email: normalised },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { activations: { where: { revoked: false } } } },
    },
  });

  let licenseId: string;
  let key: string;

  if (existing) {
    // Suspension and expiry are decisions the admin made; self-service must
    // not route around them by handing out a fresh key.
    if (existing.status === "SUSPENDED") {
      return {
        outcome: "suspended",
        key: existing.key,
        licenseId: existing.id,
        note: "their existing key is suspended",
      };
    }
    if (existing.expiresAt && existing.expiresAt.getTime() <= Date.now()) {
      return {
        outcome: "expired",
        key: existing.key,
        licenseId: existing.id,
        note: "their existing key has expired",
      };
    }
    if (existing._count.activations >= existing.maxDevices) {
      return {
        outcome: "no_slots",
        key: existing.key,
        licenseId: existing.id,
        note: "their key is already activated on a device",
      };
    }

    // Same key again: a re-request resends, it never mints a duplicate.
    licenseId = existing.id;
    key = existing.key;
  } else {
    key = await uniqueLicenseKey(app.slug);
    const created = await prisma.license.create({
      data: {
        appId: app.id,
        key,
        email: normalised,
        // The brief: one key, one device. The admin can raise this later
        // on the license page without invalidating the key.
        maxDevices: 1,
      },
      select: { id: true },
    });
    licenseId = created.id;
  }

  const delivered = await sendActivationKey({
    to: normalised,
    appName: app.name,
    key,
  });

  return {
    outcome: delivered ? "sent" : "failed",
    key,
    licenseId,
    note: delivered ? null : "the mail provider refused the send",
  };
}
