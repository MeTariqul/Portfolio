"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./section-heading";
import type { ProcessStep } from "@/lib/content";

export function Process({ items: propItems }: { items?: ProcessStep[] }) {
  const t = useTranslations("process");
  const items = propItems ?? (t.raw("items") as ProcessStep[]);

  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 70%", "end 70%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  const pinRef = useRef<HTMLDivElement>(null);

  return (
    <section id="process" className="relative overflow-x-clip">
      <div ref={pinRef} className="relative">
        <div className="sticky top-0 flex min-h-dvh items-center">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20">
            <div>
              <SectionHeading
                number="05"
                label={t("label")}
                title={t("heading")}
                sub={t("sub")}
              />

              <div ref={trackRef} className="relative mt-14 hidden h-64 lg:block">
                <div className="absolute left-0 top-0 h-full w-px bg-line" />
                <motion.div
                  className="absolute left-0 top-0 h-full w-px origin-top bg-gradient-to-b from-nebula via-neon to-aqua"
                  style={{ scaleY }}
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mt-10 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-soft lg:hidden"
              >
                <span className="h-px w-8 bg-neon" />
                {items.length} {t("label").toLowerCase()} {t("stages")}
              </motion.p>
            </div>

            <div className="space-y-8 lg:space-y-10">
              {items.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 48 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative overflow-hidden rounded-3xl border border-line p-7 transition-all duration-300 hover:-translate-y-1 hover:border-neon/40"
                >
                  <span className="absolute right-6 top-5 font-display text-6xl font-bold text-soft/10 transition-colors duration-500 group-hover:text-neon/20">
                    0{i + 1}
                  </span>
                  <span className="gradient-text font-mono text-xs font-bold uppercase tracking-[0.3em]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-soft">
                    {item.desc}
                  </p>
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-nebula to-neon transition-transform duration-500 group-hover:scale-x-100"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}