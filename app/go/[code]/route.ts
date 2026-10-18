import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Public short link: /go/{code}. Records the click — IP plus coarse
// location read from the platform's request headers — then sends the
// visitor on to the target. A logging failure never blocks the redirect.
//
// Dynamic on purpose: every request must hit the database, both to find
// the link and to count the click.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Vercel puts the visitor's geolocation in these headers; on any other
// host (local dev included) they are absent and the fields stay null.
// `x-vercel-ip-city` arrives URL-encoded, so decode defensively.
function locationOf(headers: Headers) {
  const decode = (value: string | null): string | null => {
    if (!value) return null;
    try {
      return decodeURIComponent(value).trim() || null;
    } catch {
      return value.trim() || null;
    }
  };
  return {
    country: decode(
      headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"),
    ),
    region: decode(headers.get("x-vercel-ip-region")),
    city: decode(headers.get("x-vercel-ip-city")),
  };
}

function ipOf(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || headers.get("x-vercel-ip") || "unknown";
}

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

  const { country, region, city } = locationOf(req.headers);
  try {
    await prisma.shortLinkClick.create({
      data: {
        shortLinkId: link.id,
        ip: ipOf(req.headers),
        country,
        region,
        city,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
        referer: req.headers.get("referer")?.slice(0, 500) ?? null,
      },
    });
    await prisma.shortLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });
  } catch {
    // Counting must never stop the redirect.
  }

  // 307 (not 301): the destination can change from the dashboard at any
  // time, and browsers must not cache the mapping.
  return NextResponse.redirect(link.targetUrl, {
    status: 307,
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
