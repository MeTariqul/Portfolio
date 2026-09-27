"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BrainCircuit, Gauge, LayoutTemplate, Rocket } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { TiltCard } from "./tilt-card";
import type { ServiceItem } from "@/lib/content";

const ICONS = [LayoutTemplate, BrainCircuit, Rocket, Gauge];

export function Services({ items: propItems }: { items?: ServiceItem[] }) {
  const t = useTranslations("services");
  const items = propItems ?? (t.raw("items") as ServiceItem[]);

  return (
    <section id="services" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <SectionHeading number="02" label={t("label")} title={t("heading")} sub={t("sub")} />

      <div className="mt-16 grid gap-6 sm:grid-cols-2">
        {items.map((item, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <TiltCard
                intensity={7}
                className="group relative h-full [perspective:1200px]"
              >
                <div
                  className="relative h-full overflow-hidden rounded-3xl border border-line p-8 transition-colors duration-500 group-hover:border-neon/40"
                >
                  <span aria-hidden className="absolute right-7 top-6 font-display text-5xl font-bold text-soft/10 transition-colors duration-500 group-hover:text-neon/20">
                    0{i + 1}
                  </span>

                  <div className="glass flex h-14 w-14 items-center justify-center rounded-2xl text-neon transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-soft">{item.desc}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 12%, transparent), transparent 45%)",
                    }}
                  />
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}