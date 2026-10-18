import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { coarseLocation, ipOf, userAgentOf } from "@/lib/request-info";

// Public short link: /go/{code}. Logs the click SILENTLY (server-log
// data only — IP, coarse location, device, referrer) and 307s straight
// to the target. The visitor always forwards immediately: no landing
// page, no notice, no prompt — by request, and there is deliberately no
// UI or collection point between the short link and its destination.
//
// Dynamic on purpose: every request must hit the database, both to find
// the link and to count the click.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const link = await prisma.shortLink
    .findUnique({
      where: { code },
      select: { id: true, targetUrl: true, active: true },
    })
    .catch(() => null);

  // Unknown or retired code: back to the homepage rather than a dead end.
  if (!link || !link.active) {
    return NextResponse.redirect(new URL("/", req.url), {
      status: 302,
      headers: { "cache-control": "no-store" },
    });
  }

  const h = req.headers;
  try {
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: link.id,
        ip: ipOf(h),
        ...coarseLocation(h),
        userAgent: userAgentOf(h),
        referer: h.get("referer")?.slice(0, 500) ?? null,
      },
    });
    await prisma.shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Logging must never stop the redirect.
  }

  // 307 (not 301): the destination can change from the dashboard at any
  // time, and browsers must not cache the mapping. Immediate, every time.
  return NextResponse.redirect(link.targetUrl, {
    status: 307,
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
