import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppsTabs } from "@/components/admin/apps-tabs";
import { ConfirmForm } from "@/components/admin/confirm-form";
import {
  banEmailValue,
  deleteKeyRequest,
  rejectKeyRequest,
  sendKeyRequest,
} from "../actions";

export const metadata: Metadata = {
  title: "Requests",
  robots: { index: false, follow: false },
};

const STATUSES = ["PENDING", "SENT", "FAILED", "REJECTED", "BLOCKED"] as const;
type Status = (typeof STATUSES)[number];

const BLURB: Record<Status, string> = {
  PENDING: "Waiting for you, or created but not delivered yet",
  SENT: "Key emailed",
  FAILED: "Key exists, but the mail provider refused the send",
  REJECTED: "You turned it down",
  BLOCKED: "Banned address, or requests switched off",
};

const formatDateTime = (d: Date) =>
  d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// The queue behind POST /api/license/request: what people asked for from
// inside the software, and whether they got it.
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string; status?: string }>;
}) {
  const params = await searchParams;
  const appSlug = params.app?.trim() || "";
  const wanted = params.status?.trim().toUpperCase() || "";
  const statusFilter = STATUSES.find((s) => s === wanted);

  const [apps, grouped, requests] = await Promise.all([
    prisma.app.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.keyRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.keyRequest.findMany({
      where: {
        ...(appSlug ? { app: { slug: appSlug } } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      // Enum order, so anything awaiting the admin floats to the top.
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 300,
      include: {
        app: { select: { id: true, name: true, slug: true } },
        license: { select: { id: true, key: true } },
      },
    }),
  ]);

  const counts = Object.fromEntries(
    grouped.map((g) => [g.status, g._count._all]),
  ) as Partial<Record<Status, number>>;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const base = "/admin/apps/requests";

  return (
    <div>
      <h1 className="text-3xl">Requests</h1>
      <p className="mt-2 max-w-[720px] text-soft">
        What users asked for from inside your software, and whether the key
        reached them. Approving a waiting request issues the key and emails it
        straight away.
      </p>

      <div className="mt-6">
        <AppsTabs />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={base}
          prefetch={false}
          className={`inline-flex h-8 items-center rounded-full border px-3 ${
            statusFilter ? "border-line text-soft hover:text-ink" : "border-accent text-accent"
          }`}
        >
          All ({total})
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`${base}?status=${status.toLowerCase()}`}
            prefetch={false}
            title={BLURB[status]}
            className={`inline-flex h-8 items-center rounded-full border px-3 ${
              statusFilter === status
                ? "border-accent text-accent"
                : "border-line text-soft hover:text-ink"
            }`}
          >
            {status[0] + status.slice(1).toLowerCase()} ({counts[status] ?? 0})
          </Link>
        ))}
      </div>

      {apps.length > 1 && (
        <form action={base} method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="req-app" className="mb-1.5 block text-sm text-soft">
              App
            </label>
            <select
              id="req-app"
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
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter.toLowerCase()} />
          )}
          <button
            type="submit"
            className="h-10 rounded-full border border-line bg-surface px-5 text-sm text-ink transition-colors hover:border-accent/50"
          >
            Filter
          </button>
        </form>
      )}

      {requests.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No requests here. They arrive when someone asks for a key from inside
          an app whose request mode is Auto or Review.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">App</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Key</th>
                <th className="py-2 pr-4 font-medium">Asked</th>
                <th className="py-2 pr-4 font-medium">From</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className={`border-b border-line align-top last:border-b-0 ${
                    request.status === "PENDING" ? "" : "opacity-80"
                  }`}
                >
                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/apps/${request.app.id}`}
                      prefetch={false}
                      className="link-underline text-accent hover:text-ink"
                    >
                      {request.app.name}
                    </Link>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="break-all">{request.email}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${
                        request.status === "PENDING"
                          ? "border-accent text-accent"
                          : "border-line text-soft"
                      }`}
                      title={BLURB[request.status]}
                    >
                      {request.status[0] + request.status.slice(1).toLowerCase()}
                    </span>
                    {request.note && (
                      <p className="mt-1 max-w-[220px] text-xs text-soft">
                        {request.note}
                      </p>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    {request.license ? (
                      <Link
                        href={`/admin/apps/${request.app.id}/licenses/${request.license.id}`}
                        prefetch={false}
                        className="link-underline font-mono text-xs text-accent hover:text-ink"
                      >
                        {request.license.key}
                      </Link>
                    ) : (
                      <span className="text-soft">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-4 pr-4 text-soft">
                    {formatDateTime(request.createdAt)}
                  </td>
                  <td className="py-4 pr-4 text-xs text-soft">
                    <p className="font-mono">{request.ip ?? "—"}</p>
                    {request.platform && <p>{request.platform}</p>}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {(request.status === "PENDING" || request.status === "FAILED") && (
                        <form action={sendKeyRequest.bind(null, request.id)}>
                          <button
                            type="submit"
                            className="link-underline text-accent hover:text-ink"
                          >
                            {request.status === "PENDING"
                              ? "Approve & send"
                              : "Retry send"}
                          </button>
                        </form>
                      )}
                      {request.status === "SENT" && (
                        <form action={sendKeyRequest.bind(null, request.id)}>
                          <button
                            type="submit"
                            className="link-underline text-soft hover:text-ink"
                          >
                            Resend
                          </button>
                        </form>
                      )}
                      {request.status === "PENDING" && (
                        <form action={rejectKeyRequest.bind(null, request.id)}>
                          <button
                            type="submit"
                            className="link-underline text-soft hover:text-ink"
                          >
                            Reject
                          </button>
                        </form>
                      )}
                      <ConfirmForm
                        action={banEmailValue.bind(
                          null,
                          request.email,
                          `banned from the request queue`,
                        )}
                        confirmText={`Ban ${request.email}? It blocks new requests and every license using that address.`}
                      >
                        <button
                          type="submit"
                          className="link-underline text-soft hover:text-ink"
                        >
                          Ban email
                        </button>
                      </ConfirmForm>
                      <ConfirmForm
                        action={deleteKeyRequest.bind(null, request.id)}
                        confirmText="Delete this request from the log? The license it produced, if any, stays."
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
