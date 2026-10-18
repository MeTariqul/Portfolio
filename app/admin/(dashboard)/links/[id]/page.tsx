import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { CopyUrl } from "@/components/admin/copy-url";

export const metadata: Metadata = {
  title: "Click log",
  robots: { index: false, follow: false },
};

// Most recent clicks shown; older rows stay in the database until the
// link itself is deleted.
const SHOWN_CLICKS = 500;

const formatWhen = (d: Date) =>
  d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Shortens a user agent to something readable in a table row.
function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const os =
    /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Linux/i.test(ua) ? "Linux"
    : null;
  const browser =
    /Edg\//i.test(ua) ? "Edge"
    : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari"
    : /bot|crawler|spider/i.test(ua) ? "Bot"
    : null;
  if (!os && !browser) return ua.slice(0, 40);
  return [browser, os].filter(Boolean).join(" · ");
}

export default async function LinkLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const link = await prisma.shortLink.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
        take: SHOWN_CLICKS,
      },
    },
  });
  if (!link) notFound();

  const short = `${site.url.replace(/\/$/, "")}/go/${link.code}`;

  // Country roll-up for the header stats.
  const byCountry = new Map<string, number>();
  for (const log of link.logs) {
    const key = log.country ?? "Unknown";
    byCountry.set(key, (byCountry.get(key) ?? 0) + 1);
  }
  const topCountries = [...byCountry.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div>
      <Link href="/admin/links" prefetch={false} className="link-underline text-sm text-soft">
        ← Short links
      </Link>

      <h1 className="mt-3 text-3xl">{link.title ?? `/go/${link.code}`}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-soft">
        <span className="flex items-center gap-2">
          <span className="rounded-md border border-line px-2 py-1 font-mono text-xs text-ink">
            {short.replace(/^https?:\/\//, "")}
          </span>
          <CopyUrl url={short} />
        </span>
        <a
          href={link.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline break-all hover:text-ink"
        >
          {link.targetUrl}
        </a>
        <span className="tabular-nums">
          {link.clicks.toLocaleString("en-US")} total click
          {link.clicks === 1 ? "" : "s"}
        </span>
        {!link.active && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.65rem] uppercase tracking-wide">
            Paused
          </span>
        )}
      </div>

      {topCountries.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {topCountries.map(([country, count]) => (
            <span
              key={country}
              className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-soft"
            >
              {country} <span className="tabular-nums text-ink">{count}</span>
            </span>
          ))}
        </div>
      )}

      {link.logs.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No clicks recorded yet. Location fields fill in when the site runs on
          Vercel (they come from its request headers).
        </p>
      )}

      {link.logs.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-soft">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">IP address</th>
                <th className="py-2 pr-4 font-medium">Location</th>
                <th className="py-2 pr-4 font-medium">Device</th>
                <th className="py-2 font-medium">Came from</th>
              </tr>
            </thead>
            <tbody>
              {link.logs.map((log) => (
                <tr key={log.id} className="border-b border-line align-top last:border-b-0">
                  <td className="whitespace-nowrap py-3 pr-4 text-soft">
                    {formatWhen(log.createdAt)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs">
                    {log.ip}
                  </td>
                  <td className="py-3 pr-4">
                    {[log.city, log.region, log.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-soft">
                    {deviceOf(log.userAgent)}
                  </td>
                  <td
                    className="max-w-[220px] truncate py-3 text-soft"
                    title={log.referer ?? ""}
                  >
                    {log.referer ? (() => {
                      try {
                        return new URL(log.referer).host;
                      } catch {
                        return log.referer;
                      }
                    })() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {link.clicks > SHOWN_CLICKS && (
            <p className="mt-4 text-xs text-soft">
              Showing the latest {SHOWN_CLICKS} of {link.clicks.toLocaleString("en-US")} clicks.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
