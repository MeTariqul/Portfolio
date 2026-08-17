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
  const ghostX = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const ghostOpacity = useTransform(scrollYProgress, [0, 0.5], [0.12, 0.35]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-28 sm:px-8"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ x: ghostX, opacity: ghostOpacity }}
      >
        <span className="text-outline-strong font-display text-[26vw] font-bold uppercase leading-none tracking-tighter">
          {t("ghost")}
        </span>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          <WordReveal text={t("line1")} />
          <br />
          <span className="text-soft">
            <WordReveal text={t("line2")} delay={0.25} />
          </span>{" "}
          <span className="gradient-text">
            <WordReveal text={t("line3")} delay={0.5} />
          </span>
        </p>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-10 h-px w-40 bg-gradient-to-r from-transparent via-neon to-transparent"
        />
      </div>
    </section>
  );
}