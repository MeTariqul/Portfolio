"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { WordReveal } from "./word-reveal";

export function Statement() {
  const t = useTranslations("statement");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const ghostX = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.4], [0.06, 0.2]);
  const ghostScale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1.05]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-5 py-32 sm:px-8"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ x: ghostX, opacity: ghostOpacity, scale: ghostScale }}
      >
        <span className="text-outline-strong font-display text-[28vw] font-bold uppercase leading-none tracking-tighter">
          {t("ghost")}
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <h2 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl sr-only">
          {t("line1")} {t("line2")} {t("line3")}
        </h2>
        <p aria-hidden className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
          <WordReveal text={t("line1")} />
          <br />
          <span className="text-soft">
            <WordReveal text={t("line2")} delay={0.25} />
          </span>{" "}
          <WordReveal text={t("line3")} delay={0.5} className="gradient-text" />
        </p>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 flex items-center gap-4"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-nebula/40 to-transparent" />
          <div className="h-1.5 w-1.5 rotate-45 bg-neon" />
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neon/40 to-transparent" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mx-auto mt-8 max-w-lg font-mono text-xs uppercase tracking-[0.3em] text-soft/60"
        >
          {t("line2")} {t("line3")}
        </motion.p>
      </div>
    </section>
  );
}