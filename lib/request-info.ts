// Reads the visitor's coarse identity from request headers.
//
// This is the "no asking needed" set: ordinary server-log data every web
// server records. Anything beyond it (precise coordinates, browser
// details) is collected only after the visitor consents on the landing
// page — see components/short-link-gate.tsx.

// Vercel puts the visitor's geolocation in these headers; on any other
// host (local dev included) they are absent and the fields stay null.
// `x-vercel-ip-city` arrives URL-encoded, so decode defensively.
export function coarseLocation(headers: Headers) {
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

export function ipOf(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || headers.get("x-vercel-ip") || "unknown";
}

export function userAgentOf(headers: Headers): string | null {
  return headers.get("user-agent")?.slice(0, 300) ?? null;
}
