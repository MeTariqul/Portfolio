import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { coarseLocation, ipOf, userAgentOf } from "@/lib/request-info";
import { deviceOf } from "@/lib/ua";
import { ShortLinkGate } from "@/components/short-link-gate";

// Short-link landing page. Records what server logs legitimately give
// (IP, coarse location, device — no permission needed for those), shows
// it to the visitor, and asks for consent before ANYTHING extra is
// collected (components/short-link-gate.tsx sends that to
// app/api/link-visit). The visitor then chooses: Allow, or continue
// without sharing.
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

  const link = await prisma.shortLink
    .findUnique({
      where: { code },
      select: { id: true, targetUrl: true, active: true },
    })
    .catch(() => null);

  // Unknown or retired code: back to the homepage rather than a dead end.
  if (!link || !link.active) redirect("/");

  const h = await headers();
  const ip = ipOf(h);
  const { country, region, city } = coarseLocation(h);
  const ua = userAgentOf(h);

  // The click row doubles as the anchor for post-consent details: the
  // gate gets its id back so anything shared lands on THIS click.
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
    // Logging must never take the landing page down.
  }

  const location = [city, region, country].filter(Boolean).join(", ");

  return (
    <ShortLinkGate
      target={link.targetUrl}
      clickId={clickId}
      recorded={{
        ip,
        location: location || "Not available on this host",
        device: deviceOf(ua),
      }}
    />
  );
}
