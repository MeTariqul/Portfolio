// End-to-end check of the licensing API. Creates throwaway apps, licenses
// and bans directly in the database, exercises every response the endpoints
// can return, verifies a signed token offline with the public key, then
// deletes everything it created.
//
// Run with the dev server up: node scripts/verify-license.mjs
//
// Note on email: the request flow really does try to send through Brevo.
// The script uses @example.invalid addresses, which the provider refuses,
// so it exercises the "key created but not delivered" path — the one the
// admin's Retry button exists for — without mailing a human.
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
// A fresh client IP per run: with Upstash configured, rate-limit counters
// survive between runs and a shared bucket would turn reruns into 429s.
const clientIp = `203.0.113.${(Number.parseInt(tag, 16) % 200) + 1}`;
const ipHeader = { "x-forwarded-for": clientIp };

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

// A second app, for the request flow (its key prefix differs too). Created
// with no requestMode on purpose: the default is what the first check below
// is asserting.
const reqKey = `appk_test_${randomBytes(12).toString("hex")}`;
const reqApp = await prisma.app.create({
  data: {
    name: `Request App ${tag}`,
    slug: `reqapp-${tag}`,
    apiKey: reqKey,
  },
});
// The three addresses this run touches. Each is unique to the run.
const emailA = `buyer-${tag}@example.invalid`;
const emailB = `review-${tag}@example.invalid`;
const emailC = `banned-${tag}@example.invalid`;

const device = `device-aaaa-${tag}`;
const otherDevice = `device-bbbb-${tag}`;
const bannedDevice = `device-cccc-${tag}`;

const post = (path, body, key = apiKey, extra = {}) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-app-key": key,
      ...ipHeader,
      ...extra,
    },
    body: JSON.stringify(body),
  }).then(async (r) => ({ code: r.status, body: await r.json() }));

const results = [];
const check = (name, actual, expected) => {
  const ok = actual === expected;
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got ${actual}${ok ? "" : `, wanted ${expected}`}`);
};

console.log(`\n── Activation lifecycle ──────────────────────────────`);

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

console.log(`\n── Key requests ─────────────────────────────────────`);

// 14. A fresh app defaults to Auto, and one request is all it takes to get a
// single-device key for that address — no admin action needed.
const freshMode = await prisma.app.findUnique({
  where: { id: reqApp.id },
  select: { requestMode: true },
});
check("new app defaults to Auto", freshMode?.requestMode, "AUTO");

const autoRequest = await post("/api/license/request", { email: emailA }, reqKey);
check("request (auto) returns 200", autoRequest.code, 200);
check(
  "request (auto) reports delivery or pending",
  ["sent", "pending"].includes(autoRequest.body.status),
  true,
);
const autoLicense = await prisma.license.findFirst({
  where: { appId: reqApp.id, email: emailA },
});
check("request (auto) created exactly one key", await prisma.license.count({ where: { appId: reqApp.id, email: emailA } }), 1);
check("request (auto) key is single-device", autoLicense?.maxDevices, 1);
check("request (auto) key carries the slug prefix", autoLicense?.key.startsWith("REQAP-"), true);
const autoRequestRow = await prisma.keyRequest.findFirst({
  where: { appId: reqApp.id, email: emailA },
  orderBy: { createdAt: "desc" },
});
// Brevo refuses @example.invalid, so this lands as FAILED unless the
// provider accepts everything — both are valid outcomes of the same path.
check(
  "request (auto) logged as SENT or FAILED",
  ["SENT", "FAILED"].includes(autoRequestRow?.status),
  true,
);
check("request (auto) log links the license", autoRequestRow?.licenseId, autoLicense?.id);

// 15. Asking twice for the same address resends, it never mints a duplicate.
const autoAgain = await post("/api/license/request", { email: emailA }, reqKey);
check("request (second time) answered", autoAgain.code, 200);
check("request (second time) keeps one key", await prisma.license.count({ where: { appId: reqApp.id, email: emailA } }), 1);

// 16. REVIEW: nothing is issued until the admin approves.
await prisma.app.update({ where: { id: reqApp.id }, data: { requestMode: "REVIEW" } });
const reviewRequest = await post("/api/license/request", { email: emailB }, reqKey);
check("request (review) is accepted", `${reviewRequest.code} ${reviewRequest.body.status}`, "200 pending");
check("request (review) issues nothing yet", await prisma.license.count({ where: { appId: reqApp.id, email: emailB } }), 0);
const reviewRow = await prisma.keyRequest.findFirst({
  where: { appId: reqApp.id, email: emailB },
  orderBy: { createdAt: "desc" },
});
check("request (review) waits as PENDING", reviewRow?.status, "PENDING");

// 17. OFF: refused, and noted in the log.
await prisma.app.update({ where: { id: reqApp.id }, data: { requestMode: "OFF" } });
const closedRequest = await post("/api/license/request", { email: `closed-${tag}@example.invalid` }, reqKey);
check("request (off) refused", `${closedRequest.code} ${closedRequest.body.status}`, "403 closed");
const closedRow = await prisma.keyRequest.findFirst({
  where: { appId: reqApp.id, email: `closed-${tag}@example.invalid` },
  orderBy: { createdAt: "desc" },
});
check("request (off) is logged as BLOCKED", closedRow?.status, "BLOCKED");

// 18. A bad address is rejected before anything is created.
const badEmail = await post("/api/license/request", { email: "not-an-email" }, reqKey);
check("request (bad email) rejected", `${badEmail.code} ${badEmail.body.status}`, "400 invalid");

// 19. Requests are per app: the same address can hold a separate key in
// each app you ship, and one app's key never writes into another's rows.
await prisma.app.update({ where: { id: app.id }, data: { requestMode: "AUTO" } });
const crossApp = await post("/api/license/request", { email: emailB }, apiKey);
check("request (second app) answered", crossApp.code, 200);
check(
  "request (second app) makes its own key",
  await prisma.license.count({ where: { appId: app.id, email: emailB } }),
  1,
);
check(
  "request (second app) leaves the first app alone",
  await prisma.license.count({ where: { appId: reqApp.id, email: emailB } }),
  0,
);
await prisma.app.update({ where: { id: app.id }, data: { requestMode: "OFF" } });

console.log(`\n── Bans ─────────────────────────────────────────────`);

// 20. Banning an email blocks new requests from it, and stops the key it
// already holds. A device is put on the licence *before* the ban so the
// "before/after" pair is meaningful.
await prisma.app.update({ where: { id: reqApp.id }, data: { requestMode: "AUTO" } });
const bannedEmailRequest = await post("/api/license/request", { email: emailC }, reqKey);
check("request (allowed) before the ban", bannedEmailRequest.code, 200);

const emailLicense = await prisma.license.findFirst({
  where: { appId: reqApp.id, email: emailC },
});
const emailDevice = `device-dddd-${tag}`;
const beforeBan = await post("/api/license/activate", { key: emailLicense.key, deviceId: emailDevice }, reqKey);
check("activate before the ban", `${beforeBan.code} ${beforeBan.body.status}`, "200 active");

await prisma.ban.create({ data: { kind: "EMAIL", value: emailC, reason: "test run" } });
const blockedRequest = await post("/api/license/request", { email: emailC }, reqKey);
check("request (banned email) refused", `${blockedRequest.code} ${blockedRequest.body.status}`, "403 blocked");
const blockedRow = await prisma.keyRequest.findFirst({
  where: { appId: reqApp.id, email: emailC },
  orderBy: { createdAt: "desc" },
});
check("request (banned email) logged as BLOCKED", blockedRow?.status, "BLOCKED");

// 21. The ban blocks the already-activated device too, and a fresh machine
// cannot claim the slot the ban just freed.
const bannedVerify = await post("/api/license/verify", { key: emailLicense.key, deviceId: emailDevice }, reqKey);
check("verify (banned email)", `${bannedVerify.code} ${bannedVerify.body.status}`, "403 banned");
const bannedReactivate = await post("/api/license/activate", { key: emailLicense.key, deviceId: `device-eeee-${tag}` }, reqKey);
check("activate (banned email, new machine)", `${bannedReactivate.code} ${bannedReactivate.body.status}`, "403 banned");

// 22. Banning a device stops that machine whatever key it presents.
await prisma.license.update({ where: { id: license.id }, data: { expiresAt: null, maxDevices: 3 } });
await prisma.licenseActivation.updateMany({ where: { licenseId: license.id }, data: { revoked: false } });
const deviceOk = await post("/api/license/activate", { key: license.key, deviceId: bannedDevice });
check("activate before the device ban", `${deviceOk.code} ${deviceOk.body.status}`, "200 active");
await prisma.ban.create({ data: { kind: "DEVICE", value: bannedDevice, reason: "test run" } });
const deviceBanned = await post("/api/license/activate", { key: license.key, deviceId: bannedDevice });
check("activate (banned device)", `${deviceBanned.code} ${deviceBanned.body.status}`, "403 banned_device");
const deviceBannedVerify = await post("/api/license/verify", { key: license.key, deviceId: bannedDevice });
check("verify (banned device)", `${deviceBannedVerify.code} ${deviceBannedVerify.body.status}`, "403 banned_device");

// 23. An unrelated device on the same key still works: bans are precise.
const unaffected = await post("/api/license/activate", { key: license.key, deviceId: `device-ffff-${tag}` });
check("activate (same key, other device)", `${unaffected.code} ${unaffected.body.status}`, "200 active");

// 24. Lifting the ban restores access immediately — nothing was deleted.
const emailBanRow = await prisma.ban.findFirst({ where: { kind: "EMAIL", value: emailC } });
await prisma.ban.delete({ where: { id: emailBanRow.id } });
const restored = await post("/api/license/verify", { key: emailLicense.key, deviceId: emailDevice }, reqKey);
check("verify after lifting the ban", `${restored.code} ${restored.body.status}`, "200 active");

console.log(`\n── Cleanup ──────────────────────────────────────────`);

// The apps cascade to their licenses, activations and requests. Bans are
// global and have no owner, so they are removed by value.
await prisma.app.delete({ where: { id: app.id } });
await prisma.app.delete({ where: { id: reqApp.id } });
await prisma.ban.deleteMany({ where: { value: { in: [emailC, bannedDevice] } } });
check("cleanup removed test apps", await prisma.app.count({ where: { id: { in: [app.id, reqApp.id] } } }), 0);
check("cleanup removed test bans", await prisma.ban.count({ where: { value: { in: [emailC, bannedDevice] } } }), 0);

await prisma.$disconnect();

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed > 0) {
  console.log("Failed checks need attention before this counts as verified.");
}
process.exit(failed === 0 ? 0 : 1);
