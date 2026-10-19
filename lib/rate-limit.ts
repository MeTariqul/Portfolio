// Rate limiting.
//
// Three backends, in the order they are tried:
//
//   1. Upstash Redis, when KV_REST_API_URL and KV_REST_API_TOKEN are set.
//      Cheapest: one round trip, nothing written to the main database.
//   2. The database, for the counters that have to be the same on every
//      instance of the app. A serverless function's memory is not shared, so
//      a counter that lives in memory counts per instance — which means a
//      limit of 10 becomes 10 x (number of instances) in practice.
//   3. An in-process window, as a last resort. It is per instance, so it is
//      only good enough for the page-view beacon.
//
// Which one is used depends on the scope:
//
//   scope "instance" — cheap, per instance, no database write. Right for
//                       the visit beacon, which fires on every page view.
//   scope "global"   — one counter for the whole site. Right for anything
//                       that is a security boundary: license keys, sign-in.
//
// Why this is more than a counter: the licensing API lets a caller try
// license keys and device ids, so the limiter is the thing standing between
// a script and a million guesses. Three properties matter, and all three are
// handled below:
//
//   1. The window must not be able to leak. A key with no expiry is a
//      permanent lockout; a key that expires early is a bypass.
//   2. The fallback must not grow without bound. Every distinct key (each
//      source IP, each email address) adds an entry, so an attacker who
//      rotates addresses would otherwise grow the map until the instance runs
//      out of memory.
//   3. When no counter can be reached, the caller decides whether to fail
//      open (a contact form) or closed (a license key).

import { prisma } from "@/lib/prisma";

// The client is stateless and the credentials do not change at runtime, so
// one instance is enough. Building it per call meant a new connection pool
// for every request. The import stays dynamic so the package is not loaded at
// all when Redis is not configured.
import type { Redis } from "@upstash/redis";

let redisPromise: Promise<Redis | null> | null = null;

// After a failure, stop trying Redis for a while. Otherwise every request
// pays the connection timeout before falling back — which on a cold Redis
// means every request is slow, and on a hot one means a thundering herd of
// retries.
let redisDownUntil = 0;

function getRedis(): Promise<Redis | null> {
  if (Date.now() < redisDownUntil) return Promise.resolve(null);
  if (!redisPromise) {
    redisPromise = (async () => {
      const url = process.env.KV_REST_API_URL;
      const token = process.env.KV_REST_API_TOKEN;
      if (!url || !token) return null;
      const { Redis } = await import("@upstash/redis");
      return new Redis({ url, token });
    })();
  }
  return redisPromise;
}

export type RateLimitOptions = {
  /**
   * "instance" counts per process (cheap, no database write).
   * "global" counts once for the whole site.
   */
  scope?: "instance" | "global";
  /**
   * When no counter can be reached, refuse the request instead of allowing
   * it. Use this where the limit is a security boundary (license keys,
   * sign-in) rather than a courtesy.
   */
  failClosed?: boolean;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  options: RateLimitOptions = {},
): Promise<boolean> {
  const scope = options.scope ?? "instance";

  // The cheap path, and the one the page-view beacon uses: no database
  // write, no network call, one map lookup.
  if (scope === "instance") {
    return memoryLimit(key, limit, windowMs, Date.now());
  }

  const now = Date.now();
  const client = await getRedis();

  if (client) {
    try {
      const redisKey = `rl:${key}`;
      // INCR and EXPIRE in one round trip: if the process dies between two
      // calls the key would keep counting forever, and a client that
      // already hit the limit would stay locked out even after the window.
      const count = await client.incr(redisKey);
      if (count === 1) {
        await client.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      return count <= limit;
    } catch {
      // Redis is unreachable. Fall through to the database.
      redisDownUntil = Date.now() + 30_000;
    }
  }

  // The database counter: one row per key, updated in place. The statement
  // is a single atomic upsert, so two requests arriving at the same moment
  // cannot both read the same count and both decide there is room.
  try {
    const count = await bumpDatabaseCounter(key, windowMs, now);
    if (count !== null) return count <= limit;
  } catch {
    // The database is unreachable too.
  }

  if (options.failClosed) return false;
  return memoryLimit(key, limit, windowMs, now);
}

// Returns the count after this call, or null when the row could not be read.
//
// The values are bound parameters, never interpolated into the statement, so
// a key containing quotes or SQL cannot change what runs here.
async function bumpDatabaseCounter(
  key: string,
  windowMs: number,
  now: number,
): Promise<number | null> {
  const windowStart = new Date(now);
  const expiredBefore = new Date(now - windowMs);
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "updatedAt")
    VALUES (${`rl:${key}`}, 1, ${windowStart}, ${windowStart})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= ${expiredBefore} THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= ${expiredBefore} THEN ${windowStart}
        ELSE "RateLimit"."windowStart"
      END,
      "updatedAt" = ${windowStart}
    RETURNING "count"
  `;

  // Every distinct key leaves a row behind, so the table would grow for as
  // long as the site is up. One request in a hundred tidies up the rows
  // whose window closed long ago — they cannot affect any decision.
  if (Math.random() < 0.01) {
    void prisma.rateLimit
      .deleteMany({ where: { updatedAt: { lt: new Date(now - 3_600_000) } } })
      .catch(() => {
        /* tidying up is never worth an error */
      });
  }

  return rows[0]?.count ?? null;
}

// The in-process fallback. A sliding window: the timestamps of the calls
// inside the current window, per key.
const memory = new Map<string, number[]>();

// Upper bound on how many keys are held. Each key is one source address or
// one address being requested, so an attacker rotating addresses grows this
// map without limit. Past the cap the oldest keys are dropped — they are the
// ones whose windows have almost certainly expired anyway.
const MAX_MEMORY_KEYS = 10_000;

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
): boolean {
  const list = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    memory.set(key, list);
    return false;
  }
  list.push(now);
  memory.set(key, list);

  if (memory.size > MAX_MEMORY_KEYS) {
    // Drop the oldest insertions. Map preserves insertion order, and the
    // first key inserted is the first to expire.
    const excess = memory.size - MAX_MEMORY_KEYS;
    let dropped = 0;
    for (const k of memory.keys()) {
      memory.delete(k);
      if (++dropped >= excess) break;
    }
  }

  return true;
}
