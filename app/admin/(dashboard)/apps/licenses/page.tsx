import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { licenseStateLabel, normalizeEmail } from "@/lib/licensing";
import { AppsTabs } from "@/components/admin/apps-tabs";
import { CopyText } from "@/components/admin/copy-text";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { banActivationDevice, banLicenseEmail, deleteLicense, removeBan, setLicenseStatus } from "../actions";

export const metadata: Metadata = {
  title: "Keys",
  robots: { index: false, follow: false },
};

const FILTERS = ["active", "unused", "suspended", "expired", "banned"] as const;

const formatDateTime = (d: Date) =>
  d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Every key on the server, across every app — the "all key status" view.
// Rows are filtered in memory because half the states (banned, unused,
// expired) are computed from the ban list and the clock rather than stored.
export default async function KeysPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const appSlug = params.app?.trim() || "";
  const statusParam = params.status?.trim().toLowerCase() || "";
  const query = params.q?.trim() || "";

  const [apps, bans] = await Promise.all([
    prisma.app.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.ban.findMany({
      select: { id: true, kind: true, value: true },
    }),
  ]);

  // value -> ban row id, so a banned row can offer "Unban" in place.
  const emailBans = new Map(
    bans.filter((b) => b.kind === "EMAIL").map((b) => [b.value, b.id]),
  );
  const deviceBans = new Map(
    bans.filter((b) => b.kind === "DEVICE").map((b) => [b.value, b.id]),
  );

  const where: Prisma.LicenseWhereInput = {};
  if (appSlug) where.app = { slug: appSlug };
  if (query) {
    where.OR = [
      { key: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { label: { contains: query, mode: "insensitive" } },
    ];
  }

  const licenses = await prisma.license.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      app: { select: { id: true, name: true, slug: true } },
      activations: { orderBy: { lastSeenAt: "desc" } },
    },
  });

  const rows = licenses.map((license) => {
    const live = license.activations.filter((a) => !a.revoked);
    const emailKey = license.email ? normalizeEmail(license.email) : null;
    const emailBanId = emailKey ? (emailBans.get(emailKey) ?? null) : null;
    const deviceBanned = live.some((a) => deviceBans.has(a.deviceId));
    const bound = live[0] ?? null;
    return {
      license,
      live,
      bound,
      emailBanId,
      deviceBanId: bound ? (deviceBans.get(bound.deviceId) ?? null) : null,
      deviceBanned,
      label: emailBanId || deviceBanned ? "Banned" : licenseStateLabel(license),
      lastSeen: bound?.lastSeenAt ?? null,
    };
  });

  const filtered = rows.filter(({ label, live }) => {
    if (!statusParam) return true;
    const state = label.toLowerCase();
    if (statusParam === "unused") return state === "active" && live.length === 0;
    return state === statusParam;
  });

  const counts = {
    active: rows.filter((r) => r.label === "Active").length,
    banned: rows.filter((r) => r.label === "Banned").length,
    unused: rows.filter((r) => r.label === "Active" && r.live.length === 0).length,
  };

  return (
    <div>
      <h1 className="text-3xl">Keys</h1>
      <p className="mt-2 max-w-[720px] text-soft">
        Every license key on the server, across all apps, with the state the
        activation API currently reports for it.
      </p>

      <div className="mt-5 grid gap-x-6 gap-y-3 rounded-xl border border-line bg-surface p-5 text-xs text-soft sm:grid-cols-2 lg:grid-cols-4">
        <p>
          <span className="text-ink">Block / Unblock</span> — that one key
          stops working, or starts again. Reversible, nothing deleted.
        </p>
        <p>
          <span className="text-ink">Ban / Unban email</span> — that address
          cannot request a key, activate or re-check on any app.
        </p>
        <p>
          <span className="text-ink">Ban / Unban device</span> — that machine
          is refused on any app, whatever key it presents.
        </p>
        <p>
          <span className="text-ink">Revoke / Restore</span> — drops a single
          machine from one key, on that key&apos;s own page.
        </p>
      </div>

      <div className="mt-6">
        <AppsTabs />
      </div>

      <form
        action="/admin/apps/licenses"
        method="get"
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label htmlFor="filter-app" className="mb-1.5 block text-sm text-soft">
            App
          </label>
          <select
            id="filter-app"
            name="app"
            defaultValue={appSlug}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm"
          >
            <option value="">All apps</option>
            {apps.map((app) => (
              <option key={app.id} value={app.slug}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-status" className="mb-1.5 block text-sm text-soft">
            State
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={statusParam}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm"
          >
            <option value="">Any</option>
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f[0].toUpperCase() + f.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-q" className="mb-1.5 block text-sm text-soft">
            Search
          </label>
          <input
            id="filter-q"
            name="q"
            defaultValue={query}
            placeholder="key, email or customer"
            className="h-10 w-56 rounded-lg border border-line bg-surface px-3 text-sm"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-full border border-line bg-surface px-5 text-sm text-ink transition-colors hover:border-accent/50"
        >
          Filter
        </button>
        {(appSlug || statusParam || query) && (
          <Link
            href="/admin/apps/licenses"
            prefetch={false}
            className="link-underline pb-2.5 text-sm text-soft hover:text-ink"
          >
            Clear
          </Link>
        )}
      </form>

      <p className="mt-6 text-sm text-soft">
        {rows.length} key{rows.length === 1 ? "" : "s"}
        {statusParam ? ` matching "${statusParam}" → ${filtered.length}` : ""} ·{" "}
        {counts.active} active · {counts.unused} never activated ·{" "}
        {counts.banned} banned
        {rows.length >= 500 && " · showing the newest 500"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No keys here yet. They are created when you issue one from an app
          page, or when a request is approved.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">Key</th>
                <th className="py-2 pr-4 font-medium">App</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">State</th>
                <th className="py-2 pr-4 font-medium">Devices</th>
                <th className="py-2 pr-4 font-medium">Device</th>
                <th className="py-2 pr-4 font-medium">Last seen</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ license, live, bound, emailBanId, deviceBanId, label, lastSeen }) => (
                <tr
                  key={license.id}
                  className={`border-b border-line align-top last:border-b-0 ${
                    label === "Active" ? "" : "opacity-70"
                  }`}
                >
                  <td className="py-4 pr-4">
                    <code className="font-mono text-xs">{license.key}</code>
                    <div className="mt-1">
                      <CopyText text={license.key} label="Copy key" />
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/apps/${license.app.id}`}
                      prefetch={false}
                      className="link-underline text-accent hover:text-ink"
                    >
                      {license.app.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4">
                    {license.label ?? <span className="text-soft">—</span>}
                    {license.email && (
                      <p className="text-xs text-soft">{license.email}</p>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${
                        label === "Active"
                          ? "border-accent text-accent"
                          : "border-line text-soft"
                      }`}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="py-4 pr-4 tabular-nums">
                    {live.length}/{license.maxDevices}
                  </td>
                  <td className="py-4 pr-4">
                    {bound ? (
                      <>
                        <span>{bound.deviceName ?? "Unnamed device"}</span>
                        <code
                          className="mt-1 block max-w-[180px] truncate font-mono text-[0.7rem] text-soft"
                          title={bound.deviceId}
                        >
                          {bound.deviceId}
                        </code>
                      </>
                    ) : (
                      <span className="text-soft/60">never</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-4 pr-4 text-soft">
                    {lastSeen ? formatDateTime(lastSeen) : "—"}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-4 text-sm">
                      <Link
                        href={`/admin/apps/${license.app.id}/licenses/${license.id}`}
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
                        <button
                          type="submit"
                          className="link-underline text-soft hover:text-ink"
                        >
                          {license.status === "ACTIVE" ? "Block" : "Unblock"}
                        </button>
                      </form>
                      {license.email &&
                        (emailBanId ? (
                          <ConfirmForm
                            action={removeBan.bind(null, emailBanId)}
                            confirmText={`Unban ${license.email}? It can request keys and activate again immediately.`}
                          >
                            <button
                              type="submit"
                              className="link-underline text-accent hover:text-ink"
                            >
                              Unban email
                            </button>
                          </ConfirmForm>
                        ) : (
                          <ConfirmForm
                            action={banLicenseEmail.bind(null, license.id)}
                            confirmText={`Ban ${license.email}? It blocks new key requests and every license using that address, on every app.`}
                          >
                            <button
                              type="submit"
                              className="link-underline text-soft hover:text-ink"
                            >
                              Ban email
                            </button>
                          </ConfirmForm>
                        ))}
                      {bound &&
                        (deviceBanId ? (
                          <ConfirmForm
                            action={removeBan.bind(null, deviceBanId)}
                            confirmText={`Unban ${bound.deviceId}? That machine can activate again on any app.`}
                          >
                            <button
                              type="submit"
                              className="link-underline text-accent hover:text-ink"
                            >
                              Unban device
                            </button>
                          </ConfirmForm>
                        ) : (
                          <ConfirmForm
                            action={banActivationDevice.bind(null, bound.id)}
                            confirmText="Ban this device? It is refused on every app, whatever key it presents, until the ban is lifted."
                          >
                            <button
                              type="submit"
                              className="link-underline text-soft hover:text-ink"
                            >
                              Ban device
                            </button>
                          </ConfirmForm>
                        ))}
                      <ConfirmForm
                        action={deleteLicense.bind(null, license.id)}
                        confirmText={`Delete ${license.key}? The key stops working and its device history goes with it.`}
                      >
                        <button
                          type="submit"
                          className="text-soft transition-colors hover:text-accent"
                        >
                          Delete
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
