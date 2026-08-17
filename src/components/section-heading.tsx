"use client";

import { motion } from "framer-motion";
import { WordReveal } from "./word-reveal";

export function SectionHeading({
  number,
  label,
  title,
  sub,
  align = "left",
}: {
  number: string;
  label: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "text-center" : ""}>
      <motion.div
        className="mb-6 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.35em] text-soft"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="gradient-text font-bold">{number}</span>
        <span className="h-px w-10 bg-gradient-to-r from-nebula to-transparent" />
        <span>{label}</span>
      </motion.div>

      <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        <WordReveal text={title} />
      </h2>

      {sub && (
        <motion.p
          className={cn_sub(centered)}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {sub}
        </motion.p>
      )}
    </div>
  );
}

function cn_sub(centered: boolean) {
  return `mt-5 max-w-2xl text-base leading-relaxed text-soft sm:text-lg ${
    centered ? "mx-auto" : ""
  }`;
}
