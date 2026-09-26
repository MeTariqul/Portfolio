"use client";

import { type ReactNode, useEffect } from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";
import { setLenis, scrollToId } from "@/lib/lenis-store";

if (typeof window !== "undefined") {
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    if (msg.includes("THREE.Clock") && msg.includes("deprecated")) return;
    warn(...args);
  };
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    setLenis(lenis);

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      requestAnimationFrame(() => {
        if (document.getElementById(hash)) scrollToId(hash);
      });
    };
    window.addEventListener("hashchange", handleHash);
    if (window.location.hash) handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
