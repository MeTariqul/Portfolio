"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SectionHeading } from "./section-heading";
import { Terminal } from "./terminal";
import { Counter, type Stat } from "./counters";
import { site } from "@/lib/site";
import type { AboutContent } from "@/lib/content";

export function About({
  stats: propStats,
  badges: propBadges,
  terminalLines: propLines,
  location: propLocation,
}: {
  stats?: AboutContent["stats"];
  badges?: AboutContent["badges"];
  terminalLines?: AboutContent["terminalLines"];
  location?: string;
}) {
  const t = useTranslations("about");
  const router = useRouter();
  const location = propLocation ?? site.location;
  const lines = propLines ?? (t.raw("terminalLines") as string[]);
  const stats = propStats ?? (t.raw("stats") as Stat[]);
  const badges = propBadges ?? (t.raw("badges") as string[]);

  return (
    <section id="about" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-line to-transparent"
      />

      <SectionHeading number="01" label={t("label")} title={t("heading")} />

      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-line bg-black">
            <img
              src="/profile.jpg"
              alt="Md. Tariqul Islam"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-4 rounded-2xl border border-white/10"
            />
            <motion.div
              aria-hidden
              className="absolute inset-0 rounded-3xl border-2 border-transparent"
              animate={{
                boxShadow: [
                  "inset 0 0 0px rgba(139,92,246,0)",
                  "inset 0 0 40px rgba(139,92,246,0.15)",
                  "inset 0 0 0px rgba(139,92,246,0)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>

          <div className="glass absolute -bottom-5 -right-3 flex rotate-2 items-center gap-2 rounded-full px-5 py-2.5 sm:-right-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-soft">
              {location}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Terminal lines={lines} title={t("terminalTitle")} />
        </motion.div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {stats.map((stat, i) => (
          <Counter key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        {badges.map((badge, i) => (
          <motion.span
            key={badge}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-full px-4 py-2 font-mono text-xs text-soft transition-colors duration-300 hover:border-neon/50 hover:text-ink"
          >
            {badge}
          </motion.span>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <motion.button
          onClick={() => router.push("/about")}
          data-cursor="link"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="group flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-soft transition-all duration-300 hover:border-neon/50 hover:text-ink"
        >
          {t("showMore")}
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </motion.button>
      </div>
    </section>
  );
}
