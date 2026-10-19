// End-to-end check of the license API. Creates a throwaway app + license
// directly in the database, exercises every response the endpoints can
// return, verifies a signed token offline with the public key, then
// deletes the app (cascading its license and activations).
//
// Run with the dev server up: node scripts/verify-license.mjs
import { createPublicKey, randomBytes, verify as edVerify } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.TEST_BASE ?? "http://localhost:3000";
const prisma = new PrismaClient();

// Wait for the dev server (first compile can take a few seconds).
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`${BASE}/api/license/pubkey`);
    if (r.ok) break;
  } catch {
    /* not up yet */
  }
  await new Promise((r) => setTimeout(r, 1000));
}

const tag = randomBytes(3).toString("hex");
const apiKey = `appk_test_${randomBytes(12).toString("hex")}`;
const app = await prisma.app.create({
  data: { name: `Test App ${tag}`, slug: `testapp-${tag}`, apiKey },
});
const license = await prisma.license.create({
  data: {
    appId: app.id,
    key: `TEST-${tag.toUpperCase()}-AAAA-BBBB`,
    maxDevices: 1,
    label: "Test customer",
  },
});

const device = `device-aaaa-${tag}`;
const otherDevice = `device-bbbb-${tag}`;

const post = (path, body, key = apiKey) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-key": key },
    body: JSON.stringify(body),
  }).then(async (r) => ({ code: r.status, body: await r.json() }));

const results = [];
const check = (name, actual, expected) => {
  const ok = actual === expected;
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got ${actual}${ok ? "" : `, wanted ${expected}`}`);
};

// 1. First activation claims the single seat.
const first = await post("/api/license/activate", {
  key: license.key,
  deviceId: device,
  deviceName: "Test PC",
  platform: "win32",
});
check("activate (first device)", `${first.code} ${first.body.status}`, "200 active");

// 2. Same device again: idempotent, no second seat.
const again = await post("/api/license/activate", { key: license.key, deviceId: device });
check("activate (same device again)", `${again.code} ${again.body.status}`, "200 active");

// 3. A second device has nowhere to sit (maxDevices = 1).
const second = await post("/api/license/activate", { key: license.key, deviceId: otherDevice });
check("activate (second device)", `${second.code} ${second.body.status}`, "409 device_limit");

// 4. Online re-check works for an activated device.
const verifyOk = await post("/api/license/verify", { key: license.key, deviceId: device });
check("verify (activated)", `${verifyOk.code} ${verifyOk.body.status}`, "200 active");

// 5. Re-check from a device that never activated.
const verifyNever = await post("/api/license/verify", { key: license.key, deviceId: "device-none-0000" });
check("verify (never activated)", `${verifyNever.code} ${verifyNever.body.status}`, "409 not_activated");

// 6. Wrong app API key gets nothing.
const wrongApp = await post("/api/license/activate", { key: license.key, deviceId: device }, "appk_wrong");
check("activate (bad app key)", `${wrongApp.code} ${wrongApp.body.status}`, "404 invalid");

// 7. Gossip-proof: an unknown license key looks the same as a wrong one.
const unknownKey = await post("/api/license/activate", { key: "NOPE-0000-0000-0000", deviceId: device });
check("activate (unknown key)", `${unknownKey.code} ${unknownKey.body.status}`, "404 invalid");

// 8. Suspension takes effect on the next re-check.
await prisma.license.update({ where: { id: license.id }, data: { status: "SUSPENDED" } });
const suspended = await post("/api/license/verify", { key: license.key, deviceId: device });
check("verify (suspended)", `${suspended.code} ${suspended.body.status}`, "403 suspended");

// 9. Single-device revocation, with the license active again.
await prisma.license.update({ where: { id: license.id }, data: { status: "ACTIVE" } });
await prisma.licenseActivation.updateMany({
  where: { licenseId: license.id, deviceId: device },
  data: { revoked: true },
});
const revoked = await post("/api/license/verify", { key: license.key, deviceId: device });
check("verify (device revoked)", `${revoked.code} ${revoked.body.status}`, "403 revoked_device");
const revokedReactivate = await post("/api/license/activate", { key: license.key, deviceId: device });
check("activate (device revoked)", `${revokedReactivate.code} ${revokedReactivate.body.status}`, "403 revoked_device");

// 10. A lapsed expiry is refused.
await prisma.license.update({
  where: { id: license.id },
  data: { expiresAt: new Date(Date.now() - 86_400_000) },
});
await prisma.licenseActivation.updateMany({
  where: { licenseId: license.id, deviceId: device },
  data: { revoked: false },
});
const expired = await post("/api/license/verify", { key: license.key, deviceId: device });
check("verify (expired)", `${expired.code} ${expired.body.status}`, "403 expired");

// 11. The offline half: verify the first token with the published public key.
const publicKeyResponse = await fetch(`${BASE}/api/license/pubkey`).then((r) => r.json());
const [payload, signature] = first.body.token.split(".");
const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
const signatureOk = edVerify(
  null,
  Buffer.from(payload),
  createPublicKey(publicKeyResponse.publicKey),
  Buffer.from(signature, "base64url"),
);
check("offline token signature", signatureOk, true);
check("token binds device", claims.d, device);
check("token binds app", claims.a, app.slug);
check("token carries recheck window", claims.r > claims.i, true);
check("public key is ed25519", publicKeyResponse.algorithm, "ed25519");

// 12. Tampering is caught: flip one character of the payload.
const tampered = `${payload.slice(0, -1)}${payload.at(-1) === "A" ? "B" : "A"}.${signature}`;
const [tPayload, tSignature] = tampered.split(".");
const tamperOk = edVerify(
  null,
  Buffer.from(tPayload),
  createPublicKey(publicKeyResponse.publicKey),
  Buffer.from(tSignature, "base64url"),
);
check("tampered token rejected", tamperOk, false);

// 13. The public key is stable across requests (same signing pair).
const publicKeyAgain = await fetch(`${BASE}/api/license/pubkey`).then((r) => r.json());
check("public key stable", publicKeyAgain.publicKey === publicKeyResponse.publicKey, true);

// Cleanup: the app delete cascades to license + activations.
await prisma.app.delete({ where: { id: app.id } });
const leftovers = await prisma.app.count({ where: { id: app.id } });
check("cleanup removed test app", leftovers, 0);

await prisma.$disconnect();

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed === 0 ? 0 : 1);
