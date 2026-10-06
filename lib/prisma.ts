import { PrismaClient } from "@prisma/client";

// Single Prisma instance, reused across hot reloads in dev AND across warm
// serverless invocations (assigned on globalThis in every environment, so
// no function opens a second pool).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Supabase's pooler allows 15 client connections total (shared between local
// dev, build-time prerendering and every serverless function). Prisma would
// otherwise open num_cpus*2+1 connections per pool, and a few concurrent
// functions hit "(EMAXCONNSESSION) max clients reached". One connection per
// process is plenty: the queries here are tiny and fast.
function withConnectionLimit(url: string): string {
  if (!url || url.includes("connection_limit=")) return url;
  return url + (url.includes("?") ? "&" : "?") + "connection_limit=1";
}

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(url
      ? { datasources: { db: { url: withConnectionLimit(url) } } }
      : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;
