import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppForm } from "@/components/admin/app-form";
import { CopyText } from "@/components/admin/copy-text";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { deleteApp, rotateAppKey, toggleApp } from "./actions";

export const metadata: Metadata = {
  title: "Apps",
  robots: { index: false, follow: false },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function AppsPage() {
  const apps = await prisma.app.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { licenses: true } },
      // Only the seats in use matter here, so pull the live activations
      // and count them in memory (a handful per app at most).
      licenses: {
        select: {
          activations: { where: { revoked: false }, select: { id: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl">Apps</h1>
      <p className="mt-2 max-w-[680px] text-soft">
        Activation server for the apps you build and ship. Each app gets its
        own API key; its users activate license keys you issue here.
      </p>

      <div className="mt-6">
        <AppForm />
      </div>

      {apps.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No apps yet. Register the first one above.
        </p>
      )}

      {apps.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">App</th>
                <th className="py-2 pr-4 font-medium">API key</th>
                <th className="py-2 pr-4 font-medium">Licenses</th>
                <th className="py-2 pr-4 font-medium">Devices in use</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const seats = app.licenses.reduce(
                  (total, l) => total + l.activations.length,
                  0,
                );
                return (
                  <tr
                    key={app.id}
                    className={`border-b border-line align-top last:border-b-0 ${
                      app.active ? "" : "opacity-60"
                    }`}
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/apps/${app.id}`}
                          prefetch={false}
                          className="link-underline text-accent"
                        >
                          {app.name}
                        </Link>
                        {!app.active && (
                          <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-soft">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-soft">{app.slug}</p>
                      {app.description && (
                        <p className="mt-1 max-w-[240px] text-xs text-soft">{app.description}</p>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <code className="font-mono text-xs">{app.apiKey.slice(0, 12)}…</code>
                      <div className="mt-1">
                        <CopyText text={app.apiKey} label="Copy key" />
                      </div>
                    </td>
                    <td className="py-4 pr-4 tabular-nums">{app._count.licenses}</td>
                    <td className="py-4 pr-4 tabular-nums">{seats}</td>
                    <td className="py-4 pr-4 text-soft">{formatDate(app.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <Link
                          href={`/admin/apps/${app.id}`}
                          prefetch={false}
                          className="link-underline text-accent hover:text-ink"
                        >
                          Open
                        </Link>
                        <form action={toggleApp.bind(null, app.id, !app.active)}>
                          <button
                            type="submit"
                            className="link-underline text-soft hover:text-ink"
                          >
                            {app.active ? "Pause" : "Resume"}
                          </button>
                        </form>
                        <ConfirmForm
                          action={rotateAppKey.bind(null, app.id)}
                          confirmText="Rotate the API key? Existing installations keep working, but the app must be updated with the new key before it can talk to the activation server."
                        >
                          <button
                            type="submit"
                            className="link-underline text-soft hover:text-ink"
                          >
                            Rotate key
                          </button>
                        </ConfirmForm>
                        <ConfirmForm
                          action={deleteApp.bind(null, app.id)}
                          confirmText="Delete this app? Every license and activation record for it is deleted too."
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
