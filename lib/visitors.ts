import { prisma } from "@/lib/prisma";

// Visitor numbers for the admin dashboard. Shared by the dashboard
// (initial server render) and GET /api/visit (10s polling).

export const ONLINE_WINDOW_MS = 5 * 60_000; // "online" = ping in last 5 min

export type VisitorStats = { online: number; visits: number };

export async function getVisitorStats(): Promise<VisitorStats> {
  const now = Date.now();
  try {
    const [online, stat] = await Promise.all([
      prisma.visitor.count({
        where: { lastSeen: { gte: new Date(now - ONLINE_WINDOW_MS) } },
      }),
      prisma.stat.findUnique({ where: { key: "pageviews" } }),
    ]);
    return { online, visits: stat?.value ?? 0 };
  } catch {
    return { online: 0, visits: 0 };
  }
}
