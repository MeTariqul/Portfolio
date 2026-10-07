import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getVisitorStats } from "@/lib/visitors";

// Visitor counter for the admin dashboard (Postgres, no third party).
//
// POST /api/visit — public beacon fired once per page load (c: 1 counts a
// visit) and then every minute while the tab stays open (c: 0, heartbeat
// only). Each ping refreshes the visitor's `lastSeen`; the dashboard calls
// GET /api/visit to read "online now" and the all-time total.
//
// Only a random browser id is stored — no IP, no cookies, no personal data.

const IDLE_DELETE_AFTER_MS = 30 * 24 * 60 * 60_000; // prune after 30 days
const CLEANUP_EVERY_MS = 60 * 60_000; // at most once an hour per instance

const pingSchema = z.object({
  v: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/),
  c: z.number().int().min(0).max(1).optional(),
});

let lastCleanup = 0;

async function countVisit() {
  try {
    await prisma.stat.upsert({
      where: { key: "pageviews" },
      create: { key: "pageviews", value: 1 },
      update: { value: { increment: 1 } },
    });
  } catch {
    // Two first visitors at the same moment can race the upsert create;
    // the row exists now, so a plain increment works.
    try {
      await prisma.stat.update({
        where: { key: "pageviews" },
        data: { value: { increment: 1 } },
      });
    } catch {
      /* never fail the beacon */
    }
  }
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (await rateLimit(`visit:${ip}`, 30, 60_000)) {
      const body = await req.json().catch(() => null);
      const parsed = pingSchema.safeParse(body);
      if (parsed.success) {
        await prisma.visitor.upsert({
          where: { id: parsed.data.v },
          create: { id: parsed.data.v },
          update: { lastSeen: new Date() },
        });
        if (parsed.data.c === 1) await countVisit();

        if (Date.now() - lastCleanup > CLEANUP_EVERY_MS) {
          lastCleanup = Date.now();
          await prisma.visitor.deleteMany({
            where: {
              lastSeen: { lt: new Date(Date.now() - IDLE_DELETE_AFTER_MS) },
            },
          });
        }
      }
    }
  } catch {
    /* the beacon is fire-and-forget; a 200 keeps consoles clean */
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { online, visits } = await getVisitorStats();
  return NextResponse.json({ online, visits });
}
