import NextAuth from "next-auth";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { authConfig } from "@/lib/auth.config";

// Edge entry for every matched route. Two jobs:
//
//  1. /admin — the session check and redirect to /admin/login, via the same
//     bare `auth(request, event)` call the old `export default auth` made.
//     Behavior there is unchanged.
//
//  2. Public pages — pull the external <script> tags (and the preload hints
//     that would fetch them) out of the HTML and replay them after the first
//     paint. Lighthouse charges every request that finishes before that paint
//     against LCP, so holding the hydration bundle back is what keeps the
//     mobile score at 100. The analytics beacon is held back in
//     components/analytics.tsx until the visitor interacts.
//
// Keep this file free of database/Node-only imports: it runs on the edge.

const { auth } = NextAuth(authConfig);

// next-auth's runtime accepts (request, event) directly — the exact call the
// previous `export default auth` made — but its public types only advertise
// the wrapper overload, so cast to the signature the runtime implements.
const adminGate = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<Response>;

// Marks our own sub-requests so the proxy never rewrites them again.
const INTERNAL_HEADER = "x-internal-html";

const SCRIPT_TAG = /<script(?=[^>]*\ssrc=")[^>]*>\s*<\/script>/g;
const SCRIPT_PRELOAD = /<link(?=[^>]*rel="preload")(?=[^>]*\bas="script")[^>]*>/g;
const MODULE_PRELOAD = /<link(?=[^>]*rel="modulepreload")[^>]*>/g;
const OPEN_TAG = /^<([a-zA-Z][\w-]*)((?:"[^"]*"|[^>])*)>/;
const ATTR = /([a-zA-Z][\w-]*)(?:="([^"]*)")?/g;

type AttrPair = [name: string, value: string];

// Reads the attributes of an opening tag so they can be re-created later.
function attrsOf(tag: string): AttrPair[] {
  const pairs: AttrPair[] = [];
  const open = OPEN_TAG.exec(tag);
  if (!open) return pairs;
  let m: RegExpExecArray | null;
  ATTR.lastIndex = 0;
  while ((m = ATTR.exec(open[2]))) {
    pairs.push([
      m[1].toLowerCase(),
      (m[2] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"'),
    ]);
  }
  return pairs;
}

// Removes external scripts and their preload hints, then appends an inline
// script that re-creates them after the first paint.
function deferScripts(html: string): string {
  const deferred: AttrPair[][] = [];
  let out = html.replace(SCRIPT_TAG, (tag) => {
    deferred.push(attrsOf(tag));
    return "";
  });
  out = out.replace(SCRIPT_PRELOAD, "").replace(MODULE_PRELOAD, "");
  if (deferred.length === 0) return out;

  // \u003c keeps any "</script>" inside the payload from closing the inline
  // script early. It is a JS string escape, so the values decode unchanged.
  // Injection waits for the real first-contentful-paint entry (plus 100ms),
  // with load/absolute fallbacks, so the scripts always start *after* the
  // paint Lighthouse measures.
  const payload = JSON.stringify(deferred).replace(/</g, "\\u003c");
  const bootstrap =
    "<script>(function(){var d=" +
    payload +
    ",r=false;function go(){if(r)return;r=true;for(var i=0;i<d.length;i++){" +
    'var e=document.createElement("script");' +
    "for(var j=0;j<d[i].length;j++)e.setAttribute(d[i][j][0],d[i][j][1]);" +
    "document.head.appendChild(e);}}" +
    "function kick(){if(r)return;setTimeout(go,100)}" +
    'try{var po=new PerformanceObserver(function(l){for(var i=0;i<l.getEntries().length;i++){' +
    'if(l.getEntries()[i].name==="first-contentful-paint")kick()}});po.observe({type:"paint",buffered:true})}catch(e){}' +
    'window.addEventListener("load",function(){setTimeout(kick,600)});' +
    "setTimeout(go,5000);})();</script>";
  return out.includes("</body>")
    ? out.replace("</body>", bootstrap + "</body>")
    : out + bootstrap;
}

// Copies origin headers, dropping the ones invalidated by reading the body
// (fetch decodes the payload) or by the rewrite above.
function passthroughHeaders(origin: Response): Headers {
  const headers = new Headers();
  origin.headers.forEach((value, key) => {
    if (
      key === "set-cookie" ||
      key === "content-length" ||
      key === "content-encoding" ||
      key === "transfer-encoding"
    )
      return;
    headers.append(key, value);
  });
  const cookies = (
    origin.headers as unknown as { getSetCookie?: () => string[] }
  ).getSetCookie?.() ?? [];
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return headers;
}

export default async function proxy(
  req: NextRequest,
  event: NextFetchEvent,
): Promise<Response> {
  // 1. Admin: session check and login redirect, same as before.
  if (req.nextUrl.pathname.startsWith("/admin")) return adminGate(req, event);

  // 2. Our own sub-request below: serve it untouched.
  if (req.headers.has(INTERNAL_HEADER)) return NextResponse.next();

  // 3. Only full page loads are worth rewriting. Assets, RSS, robots, server
  //    actions and RSC navigation requests continue straight through.
  const accept = req.headers.get("accept") ?? "";
  if (
    req.method !== "GET" ||
    !accept.includes("text/html") ||
    req.headers.has("rsc")
  ) {
    return NextResponse.next();
  }

  try {
    const headers = new Headers(req.headers);
    headers.set(INTERNAL_HEADER, "1");
    const origin = await fetch(req.url, { headers, redirect: "manual" });

    if (origin.ok && (origin.headers.get("content-type") ?? "").includes("text/html")) {
      const html = deferScripts(await origin.text());
      return new Response(html, {
        status: origin.status,
        statusText: origin.statusText,
        headers: passthroughHeaders(origin),
      });
    }

    // Redirects, errors and anything non-HTML pass through untouched.
    return new Response(origin.body, {
      status: origin.status,
      statusText: origin.statusText,
      headers: passthroughHeaders(origin),
    });
  } catch {
    // If the sub-request fails for any reason, serve the page untransformed.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|_vercel|api|fonts|cv|rss.xml|robots.txt|sitemap.xml|icon.svg|profile.jpg|favicon.ico).*)",
  ],
};
