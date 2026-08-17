import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Redis } from "@upstash/redis";

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? Redis.fromEnv()
    : null;

const SESSION_TTL = 180;
const VISITOR_COOKIE = "mt_visitor";
const SESSION_COOKIE = "mt_session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!redis) {
    return NextResponse.json({ count: null, live: null });
  }

  const isNew = !cookieStore.get(VISITOR_COOKIE);
  const total = isNew
    ? await redis.incr("visitors:total")
    : (Number(await redis.get("visitors:total")) || 0);

  let live = 0;
  if (sessionId) {
    await redis.set(`visitors:live:${sessionId}`, "1", { ex: SESSION_TTL });
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: "visitors:live:*",
      });
      live += keys.length;
      cursor = Number(nextCursor);
    } while (cursor !== 0);
  }

  const res = NextResponse.json({ count: total, live });
  if (sessionId) {
    res.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: 86400,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  if (isNew) {
    res.cookies.set(VISITOR_COOKIE, "1", {
      maxAge: 86400,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}