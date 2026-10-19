"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Live visitor numbers for the admin dashboard. The initial values come
// from the server render; this polls app/api/visit every 10 seconds, and
// the Refresh button pulls them on demand.
export function VisitorCounter({
  initialOnline,
  initialVisits,
}: {
  initialOnline: number;
  initialVisits: number;
}) {
  const [online, setOnline] = useState(initialOnline);
  const [visits, setVisits] = useState(initialVisits);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Shared by the poll and the button, so both mean the same thing.
  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/visit", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { online?: number; visits?: number };
      if (typeof data.online === "number") setOnline(data.online);
      if (typeof data.visits === "number") setVisits(data.visits);
    } catch {
      // Server unreachable — keep showing the last known numbers.
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(load, 10_000);
    return () => clearInterval(timer);
  }, [load]);

  // Only the button raises the spinner, so the 10s background poll updates
  // the numbers silently instead of flickering the button.
  async function refresh() {
    setRefreshing(true);
    await load();
    setUpdatedAt(
      new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    );
    setRefreshing(false);
  }

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
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs text-soft sm:inline">
          {updatedAt ? `Updated ${updatedAt}` : "Auto-refreshes every 10s"}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </section>
  );
}
