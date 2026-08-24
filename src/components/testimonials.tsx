"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Quote, Star } from "lucide-react";
import { SectionHeading } from "./section-heading";
import type { Testimonial } from "@/lib/content";

const INTERVAL = 5200;

export function Testimonials({ items: propItems }: { items?: Testimonial[] }) {
  const t = useTranslations("testimonials");
  const items = propItems ?? (t.raw("items") as Testimonial[]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!items?.length) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), INTERVAL);
    return () => clearInterval(id);
  }, [items.length]);

  if (!items?.length) return null;

  const current = items[index];

  return (
    <section id="testimonials" className="relative mx-auto max-w-5xl px-5 py-28 sm:px-8 lg:py-36">
      <SectionHeading
        number="08"
        label={t("label")}
        title={t("heading")}
        sub={t("sub")}
        align="center"
      />

      <div className="relative mt-16 min-h-[320px] sm:min-h-[280px]">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong relative mx-auto max-w-3xl rounded-3xl p-10 text-center sm:p-14"
          >
            <span className="gradient-text absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <Quote size={40} className="bg-bg fill-current" />
            </span>

            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
              ))}
            </div>

            <p className="mt-6 font-display text-xl font-medium leading-relaxed sm:text-2xl">
              “{current.quote}”
            </p>

            <footer className="mt-8">
              <p className="font-display text-lg font-semibold">{current.name}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-soft">
                {current.role}
              </p>
            </footer>
          </motion.blockquote>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-center gap-2.5">
          {items.map((item, i) => (
            <button
              key={item.name}
              onClick={() => setIndex(i)}
              aria-label={`Testimonial ${i + 1}`}
              data-cursor="link"
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index
                  ? "w-8 bg-gradient-to-r from-nebula to-neon"
                  : "w-1.5 bg-line hover:bg-soft/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}