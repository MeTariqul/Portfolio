"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Landing page shown between a short link and its destination.
//
// Flow the visitor sees: first the data that was recorded automatically
// (ordinary server logs — IP, coarse location, device), then an explicit
// choice about sharing anything more (precise coordinates, language,
// timezone, screen). Nothing extra is collected unless they press Allow,
// and the choice comes *before* collection, not after.
export function ShortLinkGate({
  target,
  clickId,
  recorded,
}: {
  target: string;
  // null when the click row could not be written — then the Allow button
  // just forwards, with nothing to attach the shared details to.
  clickId: string | null;
  recorded: {
    ip: string;
    location: string;
    device: string;
  };
}) {
  const [phase, setPhase] = useState<"idle" | "sharing" | "leaving">("idle");

  let host = target;
  try {
    host = new URL(target).host;
  } catch {
    /* keep raw target */
  }

  // Sends whatever the visitor agreed to share, then leaves. Failures are
  // swallowed: the redirect is the point, the extra data is a bonus.
  async function finish(extra: Record<string, unknown>) {
    setPhase("leaving");
    if (clickId && Object.keys(extra).length > 0) {
      try {
        await fetch("/api/link-visit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: clickId, ...extra }),
        });
      } catch {
        /* network hiccup — still forward */
      }
    }
    window.location.replace(target);
  }

  function allow() {
    setPhase("sharing");
    const details: Record<string, unknown> = {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
      platform:
        (navigator as unknown as { userAgentData?: { platform?: string } })
          .userAgentData?.platform || navigator.platform || "",
    };

    // The browser's own geolocation prompt is a second gate on top of
    // this button. If it is denied or unavailable, share the rest anyway.
    if (!navigator.geolocation) {
      void finish(details);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        void finish({
          ...details,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => void finish(details),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  if (phase === "leaving" || phase === "sharing") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="text-center">
          <p className="text-xl">{phase === "sharing" ? "Allow location in your browser…" : "Taking you there…"}</p>
          <p className="mt-3 text-sm text-soft">
            <a href={target} className="link-underline">
              {host}
            </a>
            {phase === "sharing" && (
              <span> — if the browser asks, press Allow or Deny to continue.</span>
            )}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="w-full max-w-[520px]">
        <p className="text-sm text-soft">Short link</p>
        <h1 className="mt-1 text-3xl">Before you continue</h1>
        <p className="mt-4 text-soft">
          You&apos;re heading to{" "}
          <span className="text-ink">{host}</span>.
        </p>

        {/* Recorded automatically — standard server logs, no permission needed. */}
        <section className="mt-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm uppercase tracking-wide text-soft">
            Already recorded by this link
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-soft">IP address</dt>
              <dd className="font-mono text-xs">{recorded.ip}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-soft">Approximate location</dt>
              <dd className="text-right">{recorded.location}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-soft">Device</dt>
              <dd className="text-right">{recorded.device}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-soft">
            Collected automatically as standard server-log data, like almost
            every website does.
          </p>
        </section>

        {/* Optional extras — only after an explicit yes. */}
        <section className="mt-4 rounded-xl border border-dashed border-line p-5">
          <h2 className="text-sm uppercase tracking-wide text-soft">
            Want to share more? (optional)
          </h2>
          <p className="mt-2 text-sm text-soft">
            Precise location, language, timezone and screen size — recorded
            only for this click, and only if you press Allow. Decline and
            nothing extra is collected.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" size="sm" onClick={allow}>
              Allow &amp; continue
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void finish({})}>
              Continue without sharing
            </Button>
          </div>
        </section>

        <noscript>
          <p className="mt-4 text-sm">
            <a href={target} className="link-underline text-accent">
              Continue to {host} →
            </a>
          </p>
        </noscript>
      </div>
    </main>
  );
}
