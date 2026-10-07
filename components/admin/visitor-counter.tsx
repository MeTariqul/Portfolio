"use client";

import { useEffect, useState } from "react";

// Live visitor numbers for the admin dashboard. The initial values come
// from the server render; this polls app/api/visit every 10 seconds.
export function VisitorCounter({
  initialOnline,
  initialVisits,
}: {
  initialOnline: number;
  initialVisits: number;
}) {
  const [online, setOnline] = useState(initialOnline);
  const [visits, setVisits] = useState(initialVisits);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/visit", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { online?: number; visits?: number };
        if (typeof data.online === "number") setOnline(data.online);
        if (typeof data.visits === "number") setVisits(data.visits);
      } catch {
        // Server unreachable — keep showing the last known numbers.
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Live visitors"
      className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-surface px-5 py-4"
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <p className="text-sm">
        <span className="font-medium tabular-nums">{online}</span>{" "}
        <span className="text-soft">
          {online === 1 ? "visitor online now" : "visitors online now"}
        </span>
      </p>
      <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
      <p className="text-sm">
        <span className="font-medium tabular-nums">
          {visits.toLocaleString("en-US")}
        </span>{" "}
        <span className="text-soft">
          {visits === 1 ? "visit total" : "visits total"}
        </span>
      </p>
      <span className="ml-auto text-xs text-soft">refreshes every 10s</span>
    </section>
  );
}
