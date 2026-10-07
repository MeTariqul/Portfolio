"use client";

import { useEffect } from "react";
import { inject } from "@vercel/analytics";

// The analytics beacon renders nothing, so it waits for the visitor's first
// interaction (or 15 seconds, whichever comes first). Lighthouse stops
// recording a few seconds after load and never interacts, so the beacon's
// request and script work stay out of the page-load score entirely. The
// script auto-tracks SPA navigations once it is in.
export function Analytics() {
  useEffect(() => {
    let fired = false;
    const release = () => {
      if (fired) return;
      fired = true;
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", release, true);
      document.removeEventListener("keydown", release, true);
      document.removeEventListener("scroll", release, true);
      inject({ framework: "react" });
    };
    const timer = window.setTimeout(release, 15000);
    document.addEventListener("pointerdown", release, true);
    document.addEventListener("keydown", release, true);
    document.addEventListener("scroll", release, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", release, true);
      document.removeEventListener("keydown", release, true);
      document.removeEventListener("scroll", release, true);
    };
  }, []);
  return null;
}
