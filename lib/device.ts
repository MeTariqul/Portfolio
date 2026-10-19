import { createHash } from "node:crypto";

// Device identity.
//
// A device id is a fingerprint the app computes on the user's machine (see
// the snippet in docs/activation-client-prompt.md: a Windows MachineGuid, a
// macOS IOPlatformUUID, a Linux machine-id). The server never sees the
// machine otherwise — no IP identity, no attestation — so the id is the one
// thing that binds a licence to a machine.
//
// Two things follow from that, and both are handled here:
//
//   1. It is attacker-controlled input. It arrives in a JSON body from a
//      client that may be hostile, so it is validated and canonicalised
//      before it is stored, compared or shown. Control characters, newlines
//      and absurd lengths are refused outright.
//
//   2. It is personal data. A hardware fingerprint identifies a person's
//      machine, and a copy of this database is a list of them. The server
//      therefore stores a SHA-256 digest rather than the fingerprint itself,
//      and every comparison is made on the digest. The raw value never
//      touches the database.
//
// The digest is one-way, so the admin screens show a short prefix of it
// instead of the fingerprint — enough to tell two devices apart, not enough
// to identify the machine.

// The app is told to send 8–200 characters. Anything shorter is too weak to
// be a fingerprint, anything longer is a payload.
const MIN_LENGTH = 8;
const MAX_LENGTH = 200;

/**
 * Validates and canonicalises a device id.
 *
 * Returns null when the value cannot be accepted — the caller answers the
 * request with an invalid-device error rather than storing it.
 */
export function normalizeDeviceId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  // Trim the whitespace a client may have picked up along the way.
  const value = raw.trim();
  if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) return null;

  // Control characters (including newlines and tabs) have no place in a
  // fingerprint, and they are how a value would try to forge a second line
  // in a log or a spreadsheet.
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;

  // Two different spellings of the same fingerprint must not become two
  // different devices, or the user "changes device" every time they copy
  // the id in a different case. UUIDs are case-insensitive in practice.
  return value.toLowerCase();
}

/**
 * The value the server stores and compares: a SHA-256 digest of the
 * canonical id, hex encoded.
 *
 * Fixed length (64 characters) whatever the client sent, so a long id
 * cannot be used to bloat a row, and the stored value cannot be replayed as
 * a device id by anyone who reads the database.
 */
export function deviceDigest(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/** Convenience: validate, then digest. Returns null if the id is not usable. */
export function digestDeviceId(raw: unknown): string | null {
  const canonical = normalizeDeviceId(raw);
  return canonical === null ? null : deviceDigest(canonical);
}

/**
 * The short form the admin screens show: the first 12 hex characters of the
 * digest. Enough to recognise a device, not enough to reverse.
 */
export function shortDeviceDigest(digest: string): string {
  return digest.slice(0, 12);
}
