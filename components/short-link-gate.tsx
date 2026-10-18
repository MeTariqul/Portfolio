"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Landing page between a short link and its destination.
//
// Deliberately says nothing about logging, IPs or what was recorded —
// the visitor just sees where they're going and one Continue button.
//
// When the admin enables the GPS feature, Continue first triggers the
// browser's own geolocation prompt (that prompt IS the consent), and
// whatever the visitor allows is attached to this click before forwarding.
// Declined, missing, or feature off → forward immediately with nothing extra.
export function ShortLinkGate({
  target,
  clickId,
  askGps,
}: {
  target: string;
  // null when the click row could not be written — then Continue just
  // forwards, with nothing to attach shared details to.
  clickId: string | null;
  askGps: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "asking" | "leaving">("idle");

  let host = target;
  try {
    host = new URL(target).host;
  } catch {
    /* keep raw target */
  }

  // Attaches whatever the visitor allowed, then leaves. Every failure is
  // swallowed: the forward is the point, the details are a bonus.
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

  function onContinue() {
    if (!askGps) {
      void finish({});
      return;
    }
    setPhase("asking");

    const details: Record<string, unknown> = {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${window.screen.width}x${window.screen.height}`,
      platform:
        (navigator as unknown as { userAgentData?: { platform?: string } })
          .userAgentData?.platform || navigator.platform || "",
    };

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
      // Denied or unavailable: share the rest, then forward.
      () => void finish(details),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  if (phase !== "idle") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="text-center">
          <p className="text-xl">
            {phase === "asking" ? "Waiting for your browser…" : "Taking you there…"}
          </p>
          <p className="mt-3 text-sm text-soft">
            <a href={target} className="link-underline">
              {host}
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="w-full max-w-[440px] text-center">
        <p className="text-sm text-soft">You&apos;re about to open</p>
        <h1 className="mt-1 break-all text-3xl">{host}</h1>
        <div className="mt-8">
          <Button type="button" onClick={onContinue}>
            Continue
          </Button>
        </div>
        <noscript>
          <p className="mt-4 text-sm">
            <a href={target} className="link-underline text-accent">
              Continue →
            </a>
          </p>
        </noscript>
      </div>
    </main>
  );
}
