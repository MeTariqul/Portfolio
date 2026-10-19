import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AppsTabs } from "@/components/admin/apps-tabs";
import { BanForm } from "@/components/admin/ban-form";
import { CopyText } from "@/components/admin/copy-text";
import { ConfirmForm } from "@/components/admin/confirm-form";
import { removeBan } from "../actions";

export const metadata: Metadata = {
  title: "Bans",
  robots: { index: false, follow: false },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default async function BansPage() {
  const bans = await prisma.ban.findMany({ orderBy: { createdAt: "desc" } });
  const emailBans = bans.filter((b) => b.kind === "EMAIL").length;
  const deviceBans = bans.length - emailBans;

  return (
    <div>
      <h1 className="text-3xl">Bans</h1>
      <p className="mt-2 max-w-[720px] text-soft">
        A ban is global and checked before anything else on every request,
        activation and re-check. A banned email is refused when it asks for a
        key and when it activates or re-checks; a banned device is refused
        whatever key it presents. Both are reversible — nothing is deleted.
      </p>

      <div className="mt-6">
        <AppsTabs />
      </div>

      <div className="mt-6">
        <BanForm />
      </div>

      <p className="mt-6 text-sm text-soft">
        {bans.length} ban{bans.length === 1 ? "" : "s"} — {emailBans} email
        {emailBans === 1 ? "" : "s"}, {deviceBans} device
        {deviceBans === 1 ? "" : "s"}.
      </p>

      {bans.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          Nothing banned. Bans added from a license or device row land here too.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">Kind</th>
                <th className="py-2 pr-4 font-medium">Value</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 pr-4 font-medium">Added</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.id} className="border-b border-line align-top last:border-b-0">
                  <td className="py-4 pr-4">
                    <span className="rounded-full border border-line px-2.5 py-0.5 text-xs">
                      {ban.kind === "EMAIL" ? "Email" : "Device"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <code className="font-mono text-xs">{ban.value}</code>
                    <div className="mt-1">
                      <CopyText text={ban.value} label="Copy" />
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-soft">{ban.reason ?? "—"}</td>
                  <td className="py-4 pr-4 text-soft">{formatDate(ban.createdAt)}</td>
                  <td className="py-4">
                    <ConfirmForm
                      action={removeBan.bind(null, ban.id)}
                      confirmText={`Lift the ban on ${ban.value}? It can ask for keys and activate again immediately.`}
                    >
                      <button
                        type="submit"
                        className="link-underline text-soft hover:text-ink"
                      >
                        Lift ban
                      </button>
                    </ConfirmForm>
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
