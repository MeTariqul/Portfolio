// Rate limiting for the contact form.
// Uses Upstash Redis when KV_REST_API_URL/KV_REST_API_TOKEN are set,
// otherwise an in-memory sliding window (fine for a single dev/preview
// instance; on Vercel serverless each instance counts separately).
const memory = new Map<string, number[]>();

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();

  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      return count <= limit;
    } catch {
      // Redis unavailable — fall through to memory
    }
  }

  const list = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) {
    memory.set(key, list);
    return false;
  }
  list.push(now);
  memory.set(key, list);
  return true;
}
