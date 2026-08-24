"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function Terminal({ lines, title }: { lines: string[]; title: string }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  useEffect(() => {
    if (!inView || done) return;
    let i = 0;
    let j = 0;

    const timer = setInterval(() => {
      if (i >= lines.length) {
        clearInterval(timer);
        setDone(true);
        return;
      }
      const line = lines[i];
      if (j <= line.length) {
        setTyped(lines.slice(0, i).join("\n") + "\n" + line.slice(0, j));
        j++;
      } else {
        i++;
        j = 0;
      }
    }, 14);

    return () => clearInterval(timer);
  }, [inView, lines, done]);

  return (
    <div
      ref={ref}
      className="glass-strong relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl shadow-black/20"
    >
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 font-mono text-xs text-soft">{title}</span>
      </div>
      <pre className="min-h-[320px] overflow-hidden whitespace-pre-wrap break-words p-5 font-mono text-[13px] leading-7 text-ink">
        <code>
          <span className="text-emerald-400">{typed}</span>
          {!done && <span className="inline-block h-4 w-2 translate-y-0.5 animate-blink bg-emerald-400" />}
        </code>
      </pre>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] opacity-40"
      />
    </div>
  );
}
