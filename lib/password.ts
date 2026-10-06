import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Scrypt password hashing. Format: scrypt$N$r$p$salt$hash (all base64 salt/hash).
// prisma/seed.mjs implements the identical format so seeded admins can log in.
const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64");
  const hash = scryptSync(password, salt, KEYLEN, { N, r: R, p: P }).toString(
    "base64",
  );
  return `scrypt$${N}$${R}$${P}$${salt}$${hash}`;
}

export function verifyPassword(
  password: string,
  stored: string,
): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, salt, expectedB64] = parts;
  let calc: Buffer;
  try {
    calc = scryptSync(password, salt, KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
  } catch {
    return false;
  }
  const expected = Buffer.from(expectedB64, "base64");
  return (
    calc.length === expected.length && timingSafeEqual(calc, expected)
  );
}
