import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipOf } from "@/lib/request-info";

// Receives the details a visitor agreed to share on the short-link
// landing page (POST /api/link-visit) and attaches them to their click.
// Called only after the "Allow & continue" button — never for someone
// who pressed "Continue without sharing".

// A click row must be younger than this for the attach to count, so a
// leaked/old id cannot be used to scribble on history.
const FRESH_MS = 15 * 60_000;

const bodySchema = z.object({
  id: z.string().regex(/^[a-z0-9]{10,40}$/, "Bad click id."),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).max(1_000_000).optional(),
  language: z.string().max(35).optional(),
  timezone: z.string().max(64).optional(),
  screen: z.string().regex(/^\d{1,6}x\d{1,6}$/).optional(),
  platform: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  const ip = ipOf(new Headers(req.headers));
  if (!(await rateLimit(`linkvisit:${ip}`, 30, 60_000))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { id, ...extra } = parsed.data;
  try {
    await prisma.shortLinkClick.updateMany({
      where: { id, createdAt: { gt: new Date(Date.now() - FRESH_MS) } },
      data: { extra: extra as Prisma.InputJsonValue },
    });
  } catch {
    // Never surface database trouble to the caller — the visitor is
    // mid-redirect and the gate already swallowed network errors.
  }
  return NextResponse.json({ ok: true });
}
