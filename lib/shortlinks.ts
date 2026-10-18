import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Visitor-flow options for short links, toggled from /admin/links.
//
// Both default OFF: a short link then 307s straight to its target with
// nothing shown and nothing asked — the click is still recorded from
// server logs (IP, coarse location, device), but the visitor never sees
// a word about it.
//
//   notice — show a landing page (a single Continue button, no details
//            displayed) before forwarding.
//   gps    — ask for precise coordinates on that landing page. Needs the
//            page, so enabling gps implies the landing page too; the
//            browser's own Allow/Deny prompt is the consent.
export type ShortLinkOptions = {
  notice: boolean;
  gps: boolean;
};

const KEY = "shortlinks";

export const DEFAULT_SHORT_LINK_OPTIONS: ShortLinkOptions = {
  notice: false,
  gps: false,
};

function normalize(raw: unknown): ShortLinkOptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_SHORT_LINK_OPTIONS;
  }
  const row = raw as Record<string, unknown>;
  return {
    notice: row.notice === true,
    gps: row.gps === true,
  };
}

export const getShortLinkOptions = cache(async (): Promise<ShortLinkOptions> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    return normalize(row?.value);
  } catch {
    return DEFAULT_SHORT_LINK_OPTIONS;
  }
});
