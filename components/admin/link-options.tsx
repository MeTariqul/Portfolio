"use client";

import { useState, useTransition } from "react";
import { setShortLinkOption } from "@/app/admin/(dashboard)/links/actions";

// Two visitor-flow switches for short links.
//
// Nothing about the click logger is ever shown to visitors either way —
// these only decide whether a page appears before the redirect and whether
// Continue asks for GPS in the browser.
function Switch({
  on,
  pending,
  onClick,
  label,
}: {
  on: boolean;
  pending: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={pending}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
        on ? "bg-accent" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function LinkOptions({
  notice,
  gps,
}: {
  notice: boolean;
  gps: boolean;
}) {
  const [opts, setOpts] = useState({ notice, gps });
  const [pending, startTransition] = useTransition();

  function toggle(option: "notice" | "gps") {
    const next = !opts[option];
    // Optimistic: the switch flips now, the server confirms after.
    setOpts((o) => ({ ...o, [option]: next }));
    startTransition(() => void setShortLinkOption(option, next));
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm uppercase tracking-wide text-soft">Visitor flow</h2>

      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm">Show a landing page before redirecting</p>
          <p className="mt-1 text-xs text-soft">
            One Continue button, nothing else displayed. Off = short links
            forward instantly and silently.
          </p>
        </div>
        <Switch
          on={opts.notice}
          pending={pending}
          onClick={() => toggle("notice")}
          label="Show a landing page before redirecting"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-6 border-t border-line pt-4">
        <div>
          <p className="text-sm">Ask for GPS location</p>
          <p className="mt-1 text-xs text-soft">
            On Continue, the browser shows its own Allow/Deny location prompt;
            coordinates are recorded only if the visitor allows. Implies the
            landing page (there is no other moment to ask).
          </p>
        </div>
        <Switch
          on={opts.gps}
          pending={pending}
          onClick={() => toggle("gps")}
          label="Ask for GPS location"
        />
      </div>
    </div>
  );
}
