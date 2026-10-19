import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { RECHECK_DAYS, publicKeyPem, licenseStateLabel } from "@/lib/licensing";
import { LicenseForm } from "@/components/admin/license-form";
import { CopyText } from "@/components/admin/copy-text";
import { ConfirmForm } from "@/components/admin/confirm-form";
import {
  deleteApp,
  rotateAppKey,
  setLicenseStatus,
  toggleApp,
} from "../actions";

export const metadata: Metadata = {
  title: "App",
  robots: { index: false, follow: false },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const formatDateTime = (d: Date) =>
  d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Shown in the dashboard so integration is copy-paste: activate once,
// then verify the signed token offline at every launch and re-check
// online when the token's recheck date passes.
function snippet(base: string) {
  return `// 1. Stable per-machine id (Electron/Node example)
import { machineIdSync } from "node-machine-id";        // npm i node-machine-id
const deviceId = machineIdSync();

// 2. Activate when the user enters their key
const res = await fetch("${base}/api/license/activate", {
  method: "POST",
  headers: { "content-type": "application/json", "x-app-key": APP_KEY },
  body: JSON.stringify({ key: userKey, deviceId, platform: process.platform }),
});
const data = await res.json();
if (!data.ok) return showMessage(data.error);   // status: expired | suspended |
                                                // device_limit | revoked_device | invalid
save("license.token", data.token);              // keep for offline launches

// 3. Offline check at every launch — no network needed
import { verify } from "node:crypto";
const [payload, sig] = load("license.token").split(".");
const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
const valid =
  verify(null, Buffer.from(payload), PUBLIC_KEY_PEM, Buffer.from(sig, "base64url")) &&
  claims.d === deviceId &&
  (claims.e === 0 || claims.e > Date.now());
if (!valid) return lockTheApp();

// 4. Re-check online when the token says so (revocation lands here)
if (Date.now() > claims.r) {
  const again = await fetch("${base}/api/license/verify", {
    method: "POST",
    headers: { "content-type": "application/json", "x-app-key": APP_KEY },
    body: JSON.stringify({ key: userKey, deviceId }),
  }).then((r) => r.json());
  if (!again.ok) return lockTheApp();           // suspended, expired, revoked, …
  save("license.token", again.token);
}`;
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const app = await prisma.app.findUnique({
    where: { id },
    include: {
      licenses: {
        orderBy: { createdAt: "desc" },
        include: {
          activations: {
            where: { revoked: false },
            select: { id: true, lastSeenAt: true },
          },
        },
      },
    },
  });
  if (!app) notFound();

  const base = site.url.replace(/\/$/, "");
  const publicKey = await publicKeyPem();

  return (
    <div>
      <Link href="/admin/apps" prefetch={false} className="link-underline text-sm text-soft">
        ← Apps
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{app.name}</h1>
        <span className="font-mono text-xs text-soft">{app.slug}</span>
        {!app.active && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-soft">
            Paused
          </span>
        )}
      </div>
      {app.description && <p className="mt-2 max-w-[680px] text-soft">{app.description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-2">
          <code className="rounded-md border border-line px-2 py-1 font-mono text-xs">
            {app.apiKey}
          </code>
          <CopyText text={app.apiKey} label="Copy API key" />
        </span>
        <form action={toggleApp.bind(null, app.id, !app.active)}>
          <button type="submit" className="link-underline text-soft hover:text-ink">
            {app.active ? "Pause app" : "Resume app"}
          </button>
        </form>
        <ConfirmForm
          action={rotateAppKey.bind(null, app.id)}
          confirmText="Rotate the API key? Deployed copies must be updated with the new key before they can activate or verify."
        >
          <button type="submit" className="link-underline text-soft hover:text-ink">
            Rotate API key
          </button>
        </ConfirmForm>
        <ConfirmForm
          action={deleteApp.bind(null, app.id)}
          confirmText="Delete this app? Every license and activation record for it is deleted too."
        >
          <button type="submit" className="text-soft transition-colors hover:text-accent">
            Delete app
          </button>
        </ConfirmForm>
      </div>

      <section className="mt-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm uppercase tracking-wide text-soft">Endpoint</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-soft">Activate</dt>
            <dd className="font-mono text-xs">POST {base}/api/license/activate</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-soft">Re-check</dt>
            <dd className="font-mono text-xs">POST {base}/api/license/verify</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-soft">Public key</dt>
            <dd className="font-mono text-xs">GET {base}/api/license/pubkey</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-soft">Auth header</dt>
            <dd className="font-mono text-xs">x-app-key: {app.apiKey.slice(0, 12)}…</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-soft">
          Tokens are Ed25519-signed and valid offline for {RECHECK_DAYS} days (or
          until the license expires, whichever comes first). Suspending a key,
          expiring it or revoking a device takes effect at that re-check.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-sm uppercase tracking-wide text-soft">
              Offline verification key
            </h2>
            <p className="mt-1 text-xs text-soft">
              Ship this in the app. It can verify tokens but cannot create them.
            </p>
          </div>
          <CopyText text={publicKey} label="Copy public key" />
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-bg p-3 text-[0.7rem] leading-relaxed">
{publicKey}
        </pre>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-sm uppercase tracking-wide text-soft">Client snippet</h2>
            <p className="mt-1 text-xs text-soft">
              Activate once, verify offline at launch, re-check when the token
              asks for it. Same shape on any platform — only the device id and
              the signature check change.
            </p>
          </div>
          <CopyText text={snippet(base)} label="Copy snippet" />
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-bg p-3 text-[0.7rem] leading-relaxed">
{snippet(base)}
        </pre>
      </section>

      <h2 className="mt-10 text-xl">Licenses</h2>
      <p className="mt-1 mb-4 text-sm text-soft">
        {app.licenses.length} key{app.licenses.length === 1 ? "" : "s"} issued.
      </p>

      <LicenseForm appId={app.id} />

      {app.licenses.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No licenses yet. Issue the first key above.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">Key</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Devices</th>
                <th className="py-2 pr-4 font-medium">Expires</th>
                <th className="py-2 pr-4 font-medium">Last seen</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {app.licenses.map((license) => {
                const used = license.activations.length;
                const lastSeen = license.activations.reduce<Date | null>(
                  (latest, a) => (!latest || a.lastSeenAt > latest ? a.lastSeenAt : latest),
                  null,
                );
                const state = licenseStateLabel(license);
                return (
                  <tr
                    key={license.id}
                    className={`border-b border-line align-top last:border-b-0 ${
                      state === "Active" ? "" : "opacity-60"
                    }`}
                  >
                    <td className="py-4 pr-4">
                      <code className="font-mono text-xs">{license.key}</code>
                      <div className="mt-1">
                        <CopyText text={license.key} label="Copy key" />
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {license.label ?? <span className="text-soft">—</span>}
                      {license.email && (
                        <p className="text-xs text-soft">{license.email}</p>
                      )}
                    </td>
                    <td className="py-4 pr-4">{state}</td>
                    <td className="py-4 pr-4 tabular-nums">
                      {used}/{license.maxDevices}
                    </td>
                    <td className="py-4 pr-4 text-soft">
                      {license.expiresAt ? formatDate(license.expiresAt) : "Lifetime"}
                    </td>
                    <td className="whitespace-nowrap py-4 pr-4 text-soft">
                      {lastSeen ? formatDateTime(lastSeen) : <span className="text-soft/60">never</span>}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <Link
                          href={`/admin/apps/${app.id}/licenses/${license.id}`}
                          prefetch={false}
                          className="link-underline text-accent hover:text-ink"
                        >
                          Open
                        </Link>
                        <form
                          action={setLicenseStatus.bind(
                            null,
                            license.id,
                            license.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                          )}
                        >
                          <button type="submit" className="link-underline text-soft hover:text-ink">
                            {license.status === "ACTIVE" ? "Suspend" : "Resume"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
