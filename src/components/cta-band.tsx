"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { WordReveal } from "./word-reveal";
import { Magnetic } from "./magnetic";
import { scrollToId } from "@/lib/lenis-store";

export function CtaBand() {
  const t = useTranslations("cta");

  return (
    <section className="relative overflow-hidden px-5 py-32 sm:px-8 lg:py-40">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_65%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:30px_30px] opacity-25"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl lg:text-8xl">
          <WordReveal text={t("title")} />
          <br />
          <span className="gradient-text">
            <WordReveal text={t("title2")} delay={0.25} />
          </span>
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 font-mono text-xs uppercase tracking-[0.35em] text-soft"
        >
          {t("sub")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-10 flex justify-center"
        >
          <Magnetic strength={0.3}>
            <button
              onClick={() => scrollToId("contact")}
              data-cursor="link"
              className="group relative overflow-hidden rounded-full bg-ink px-10 py-5 font-mono text-xs font-semibold uppercase tracking-widest text-bg"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {t("button")}
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-nebula via-neon to-aqua transition-transform duration-500 ease-out group-hover:translate-x-0" />
            </button>
          </Magnetic>
        </motion.div>
      </div>
    </section>
  );
}