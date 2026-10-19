import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CopyText } from "@/components/admin/copy-text";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { licenseStateLabel, normalizeEmail } from "@/lib/licensing";
import {
  banActivationDevice,
  banLicenseEmail,
  deleteLicense,
  resetLicenseActivations,
  setActivationRevoked,
  setLicenseStatus,
  updateLicense,
} from "../../../actions";

export const metadata: Metadata = {
  title: "License",
  robots: { index: false, follow: false },
};

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[0.95rem] focus:border-accent focus:outline-none";

const formatDateTime = (d: Date) =>
  d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const dateInputValue = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function LicensePage({
  params,
}: {
  params: Promise<{ id: string; licenseId: string }>;
}) {
  const { id, licenseId } = await params;

  const license = await prisma.license.findUnique({
    where: { id: licenseId },
    include: {
      app: { select: { id: true, name: true, slug: true } },
      activations: { orderBy: { lastSeenAt: "desc" } },
    },
  });
  if (!license || license.appId !== id) notFound();

  // Bans live in their own table, so the page asks about the address on this
  // license and the devices that activated it.
  const [emailBan, deviceBanRows] = await Promise.all([
    license.email
      ? prisma.ban.findUnique({
          where: {
            kind_value: { kind: "EMAIL", value: normalizeEmail(license.email) },
          },
          select: { id: true, reason: true },
        })
      : Promise.resolve(null),
    prisma.ban.findMany({
      where: {
        kind: "DEVICE",
        value: { in: license.activations.map((a) => a.deviceId) },
      },
      select: { value: true },
    }),
  ]);
  const bannedDevices = new Set(deviceBanRows.map((b) => b.value));
  const liveDeviceBanned = license.activations.some(
    (a) => !a.revoked && bannedDevices.has(a.deviceId),
  );

  const seats = license.activations.filter((a) => !a.revoked).length;
  const state =
    emailBan || liveDeviceBanned ? "Banned" : licenseStateLabel(license);

  return (
    <div>
      <Link
        href={`/admin/apps/${license.app.id}`}
        prefetch={false}
        className="link-underline text-sm text-soft"
      >
        ← {license.app.name}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl">{license.key}</h1>
        <CopyText text={license.key} label="Copy key" />
        <span
          className={`rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${
            state === "Active" ? "text-accent" : "text-soft"
          }`}
        >
          {state}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-soft">
        {license.label && <span>{license.label}</span>}
        {license.email && <span>{license.email}</span>}
        <span className="tabular-nums">
          {seats}/{license.maxDevices} device slots in use
        </span>
        <span>{license.expiresAt ? `Expires ${formatDateTime(license.expiresAt)}` : "Lifetime"}</span>
      </div>

      {license.notes && (
        <p className="mt-3 max-w-[680px] whitespace-pre-wrap text-sm text-soft">{license.notes}</p>
      )}

      {emailBan && (
        <p className="mt-3 text-sm text-accent">
          This email address is banned
          {emailBan.reason ? ` (${emailBan.reason})` : ""} — it cannot request a
          key or activate anything.{" "}
          <Link
            href="/admin/apps/bans"
            prefetch={false}
            className="link-underline text-accent"
          >
            Manage bans
          </Link>
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <form
          action={setLicenseStatus.bind(
            null,
            license.id,
            license.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
          )}
        >
          <button type="submit" className="link-underline text-soft hover:text-ink">
            {license.status === "ACTIVE" ? "Suspend license" : "Resume license"}
          </button>
        </form>
        {license.email && !emailBan && (
          <ConfirmForm
            action={banLicenseEmail.bind(null, license.id)}
            confirmText={`Ban ${license.email}? It blocks new key requests and every license using that address, on every app. Reversible from the Bans screen.`}
          >
            <button type="submit" className="link-underline text-soft hover:text-ink">
              Ban email
            </button>
          </ConfirmForm>
        )}
        <ConfirmForm
          action={resetLicenseActivations.bind(null, license.id)}
          confirmText="Clear every device from this license? Users will need to activate again on each machine."
        >
          <button type="submit" className="link-underline text-soft hover:text-ink">
            Reset activations
          </button>
        </ConfirmForm>
        <ConfirmForm
          action={deleteLicense.bind(null, license.id)}
          confirmText="Delete this license? The key stops working and its activation history is deleted."
        >
          <button type="submit" className="text-soft transition-colors hover:text-accent">
            Delete license
          </button>
        </ConfirmForm>
      </div>

      <section className="mt-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm uppercase tracking-wide text-soft">Key settings</h2>
        <form action={updateLicense.bind(null, license.id)} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label htmlFor="maxDevices" className="mb-1.5 block text-sm text-soft">
              Device slots
            </label>
            <input
              id="maxDevices"
              name="maxDevices"
              type="number"
              min={1}
              max={100}
              defaultValue={license.maxDevices}
              className={inputClass}
            />
          </div>
          <div className="w-52">
            <label htmlFor="expiresAt" className="mb-1.5 block text-sm text-soft">
              Expires <span className="text-soft/70">(empty = lifetime)</span>
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={dateInputValue(license.expiresAt)}
              className={inputClass}
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Save settings
          </Button>
        </form>
        <p className="mt-3 text-xs text-soft">
          Fewer slots than devices in use keeps the extra devices active until
          they are revoked below, but no new one can activate.
        </p>
      </section>

      <h2 className="mt-10 text-xl">Devices</h2>
      <p className="mt-1 mb-4 text-sm text-soft">
        Every device that activated this key. Revoking a device blocks it
        permanently until restored — useful when a customer changes machines.
      </p>

      {license.activations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No devices yet. The app claims a slot the first time someone
          activates this key.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">Device</th>
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 font-medium">IP</th>
                <th className="py-2 pr-4 font-medium">First seen</th>
                <th className="py-2 pr-4 font-medium">Last seen</th>
                <th className="py-2 pr-4 font-medium">State</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {license.activations.map((a) => (
                <tr
                  key={a.id}
                  className={`border-b border-line align-top last:border-b-0 ${
                    a.revoked ? "opacity-60" : ""
                  }`}
                >
                  <td className="py-4 pr-4">
                    <p>{a.deviceName ?? "Unnamed device"}</p>
                    <code className="mt-1 block max-w-[220px] truncate font-mono text-[0.7rem] text-soft" title={a.deviceId}>
                      {a.deviceId}
                    </code>
                  </td>
                  <td className="py-4 pr-4 text-soft">{a.platform ?? "—"}</td>
                  <td className="py-4 pr-4 font-mono text-xs">{a.ip ?? "—"}</td>
                  <td className="whitespace-nowrap py-4 pr-4 text-soft">
                    {formatDateTime(a.firstSeenAt)}
                  </td>
                  <td className="whitespace-nowrap py-4 pr-4 text-soft">
                    {formatDateTime(a.lastSeenAt)}
                  </td>
                  <td className="py-4 pr-4">
                    {a.revoked
                      ? "Revoked"
                      : bannedDevices.has(a.deviceId)
                        ? "Banned"
                        : "Active"}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <ConfirmForm
                        action={setActivationRevoked.bind(null, a.id, !a.revoked)}
                        confirmText={
                          a.revoked
                            ? "Restore this device? It keeps the same activation row."
                            : "Revoke this device? The app locks out on its next check and cannot re-activate with this key."
                        }
                      >
                        <button
                          type="submit"
                          className="link-underline text-soft hover:text-ink"
                        >
                          {a.revoked ? "Restore" : "Revoke"}
                        </button>
                      </ConfirmForm>
                      {!bannedDevices.has(a.deviceId) && (
                        <ConfirmForm
                          action={banActivationDevice.bind(null, a.id)}
                          confirmText="Ban this device? It is refused on every app, whatever key it presents, until the ban is lifted."
                        >
                          <button
                            type="submit"
                            className="text-soft transition-colors hover:text-accent"
                          >
                            Ban device
                          </button>
                        </ConfirmForm>
                      )}
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
