"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

export type Stat = { value: number; suffix: string; label: string };

export function Counter({
  stat,
  index,
}: {
  stat: Stat;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, stat.value, {
      duration: 2.2,
      delay: index * 0.12,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, stat.value, index]);

  return (
    <div
      ref={ref}
      className="group relative overflow-hidden rounded-2xl border border-line p-6 transition-colors duration-300 hover:border-neon/40"
    >
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-neon/10 blur-2xl transition-opacity duration-500 opacity-0 group-hover:opacity-100"
      />
      <p className="font-display text-4xl font-bold sm:text-5xl">
        <span className="gradient-text">
          {display.toLocaleString()}
          {stat.suffix}
        </span>
      </p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-soft">
        {stat.label}
      </p>
    </div>
  );
}
