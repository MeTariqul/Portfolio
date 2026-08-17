"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useTranslations } from "next-intl";
import { GraduationCap, Briefcase } from "lucide-react";
import { SectionHeading } from "./section-heading";

type ExpItem = { role: string; org: string; period: string; desc: string };

export function Experience() {
  const t = useTranslations("experience");
  const items = t.raw("items") as ExpItem[];

  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 60%"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <section
      id="experience"
      className="relative mx-auto max-w-5xl px-5 py-28 sm:px-8 lg:py-36"
    >
      <SectionHeading number="06" label={t("label")} title={t("heading")} />

      <div ref={trackRef} className="relative mt-20">
        <div
          aria-hidden
          className="absolute left-5 top-0 h-full w-px bg-line sm:left-1/2 sm:-translate-x-1/2"
        />
        <motion.div
          aria-hidden
          className="absolute left-5 top-0 h-full w-px origin-top bg-gradient-to-b from-nebula via-neon to-aqua sm:left-1/2 sm:-translate-x-1/2"
          style={{ scaleY }}
        />

        <div className="space-y-14 sm:space-y-20">
          {items.map((item, i) => {
            const left = i % 2 === 0;
            return (
              <div
                key={item.role}
                className={`relative flex flex-col gap-6 pl-14 sm:pl-0 ${
                  left ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                <div className="hidden sm:block sm:w-1/2" />

                <motion.div
                  initial={{ opacity: 0, x: left ? -48 : 48 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative sm:w-1/2 ${
                    left
                      ? "sm:pr-14 sm:text-right"
                      : "sm:pl-14"
                  }`}
                >
                  <div
                    aria-hidden
                    className={`absolute left-[-3.15rem] top-1 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface sm:left-auto ${
                      left
                        ? "sm:right-[-3.15rem]"
                        : "sm:left-[-3.15rem]"
                    }`}
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
                    </span>
                    <span className="absolute -inset-1 rounded-full border border-neon/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>

                  <div className="rounded-2xl border border-line p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-neon/40 group-hover:shadow-xl group-hover:shadow-neon/5">
                    <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-neon">
                      {i === 0 ? <Briefcase size={12} /> : <GraduationCap size={12} />}
                      {item.period}
                    </span>
                    <h3 className="mt-3 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                      {item.role}
                    </h3>
                    <p className="mt-1 font-mono text-sm text-soft">{item.org}</p>
                    <p className="mt-3 text-sm leading-relaxed text-soft">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
