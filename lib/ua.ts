// Short human-readable device label from a user agent string.
// Shared by the short-link landing page and the admin click log.
export function deviceOf(ua: string | null): string {
  if (!ua) return "—";
  const os =
    /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /Android/i.test(ua) ? "Android"
    : /iPhone|iPad|iOS/i.test(ua) ? "iOS"
    : /Linux/i.test(ua) ? "Linux"
    : null;
  const browser =
    /Edg\//i.test(ua) ? "Edge"
    : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /Firefox\//i.test(ua) ? "Firefox"
    : /Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari"
    : /bot|crawler|spider/i.test(ua) ? "Bot"
    : null;
  if (!os && !browser) return ua.slice(0, 40);
  return [browser, os].filter(Boolean).join(" · ");
}
