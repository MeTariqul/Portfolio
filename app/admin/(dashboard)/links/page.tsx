import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { LinkForm } from "@/components/admin/link-form";
import { LinkActions } from "@/components/admin/link-actions";
import { CopyUrl } from "@/components/admin/copy-url";

export const metadata: Metadata = {
  title: "Short links",
  robots: { index: false, follow: false },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default async function LinksPage() {
  const [links, totalClicks] = await Promise.all([
    prisma.shortLink.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.shortLinkClick.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl">Short links</h1>
      <p className="mt-2 text-soft">
        Turn any link into <span className="font-mono text-sm">/go/…</span> — every
        click is logged with the visitor&apos;s IP and location.{" "}
        {totalClicks > 0 && (
          <span className="tabular-nums">
            {totalClicks.toLocaleString("en-US")} click{totalClicks === 1 ? "" : "s"} recorded.
          </span>
        )}
      </p>

      <div className="mt-6">
        <LinkForm />
      </div>

      {links.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No short links yet. Create the first one above.
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">Short link</th>
                <th className="py-2 pr-4 font-medium">Goes to</th>
                <th className="py-2 pr-4 font-medium">Clicks</th>
                <th className="py-2 pr-4 font-medium">Created</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => {
                const short = `${site.url.replace(/\/$/, "")}/go/${l.code}`;
                return (
                  <tr
                    key={l.id}
                    className={`border-b border-line align-top last:border-b-0 ${
                      l.active ? "" : "opacity-60"
                    }`}
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">/go/{l.code}</span>
                        {!l.active && (
                          <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wide text-soft">
                            Paused
                          </span>
                        )}
                      </div>
                      {l.title && (
                        <p className="mt-1 max-w-[220px] truncate text-soft" title={l.title}>
                          {l.title}
                        </p>
                      )}
                      <div className="mt-1">
                        <CopyUrl url={short} />
                      </div>
                    </td>
                    <td className="max-w-[260px] py-4 pr-4">
                      <a
                        href={l.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline break-all text-soft hover:text-ink"
                        title={l.targetUrl}
                      >
                        {l.targetUrl}
                      </a>
                    </td>
                    <td className="py-4 pr-4 tabular-nums">
                      <Link
                        href={`/admin/links/${l.id}`}
                        prefetch={false}
                        className="link-underline text-accent"
                      >
                        {l.clicks.toLocaleString("en-US")}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-soft">{formatDate(l.createdAt)}</td>
                    <td className="py-4">
                      <LinkActions id={l.id} active={l.active} />
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
