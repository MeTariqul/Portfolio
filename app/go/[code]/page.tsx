import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { coarseLocation, ipOf, userAgentOf } from "@/lib/request-info";
import { getShortLinkOptions } from "@/lib/shortlinks";
import { ShortLinkGate } from "@/components/short-link-gate";

// Short-link handler. The click is ALWAYS recorded silently from server
// logs (IP, coarse location, device, referrer) — the visitor is never
// shown anything about it, no notice, no wording, nothing.
//
// Whether they see a page at all is the admin's switchboard
// (/admin/links → lib/shortlinks.ts):
//
//   notice + gps off  → straight 307 redirect, zero UI
//   notice on         → minimal landing page: "Continue" and nothing else
//   gps on            → same landing page, and Continue first triggers the
//                       browser's geolocation prompt (its Allow/Deny is the
//                       consent) before forwarding
//
// Dynamic: every hit must reach the database to log the click.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Short link",
  robots: { index: false, follow: false },
};

export default async function ShortLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [link, options] = await Promise.all([
    prisma.shortLink
      .findUnique({
        where: { code },
        select: { id: true, targetUrl: true, active: true },
      })
      .catch(() => null),
    getShortLinkOptions(),
  ]);

  // Unknown or retired code: back to the homepage rather than a dead end.
  if (!link || !link.active) redirect("/");

  const h = await headers();
  const ip = ipOf(h);
  const { country, region, city } = coarseLocation(h);
  const ua = userAgentOf(h);

  // Silent log — written before any UI decision so the click counts even
  // when the visitor closes the tab on the landing page. The row id also
  // anchors anything the GPS prompt collects to THIS click.
  let clickId: string | null = null;
  try {
    const created = await prisma.shortLinkClick.create({
      data: {
        shortLinkId: link.id,
        ip,
        country,
        region,
        city,
        userAgent: ua,
        referer: h.get("referer")?.slice(0, 500) ?? null,
      },
      select: { id: true },
    });
    clickId = created.id;
    await prisma.shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Logging must never take the link down.
  }

  // Default: no page, no prompt, no visible trace of any logger.
  if (!options.notice && !options.gps) redirect(link.targetUrl);

  return (
    <ShortLinkGate
      target={link.targetUrl}
      clickId={clickId}
      askGps={options.gps}
    />
  );
}
