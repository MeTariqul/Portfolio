"use client";

import { useEffect, useState, type RefObject } from "react";

export function useFrameloopOnView(ref: RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  return inView;
}
