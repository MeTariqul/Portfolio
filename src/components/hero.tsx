"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./brand-icons";
import { HeroScene } from "./hero-scene";
import { Magnetic } from "./magnetic";
import { VisitorCount } from "./visitor-count";
import { WordReveal } from "./word-reveal";
import { scrollToId } from "@/lib/lenis-store";
import { site } from "@/lib/site";

const ROLE_INTERVAL = 2400;

export function Hero({
  roles: propRoles,
  subtitle: propSubtitle,
  status: propStatus,
}: {
  roles?: string[];
  subtitle?: string;
  status?: string;
}) {
  const t = useTranslations("hero");
  const roles = propRoles ?? (t.raw("roles") as string[]);

  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setRoleIndex((i) => (i + 1) % roles.length),
      ROLE_INTERVAL
    );
    return () => clearInterval(id);
  }, [roles.length]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const textX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const textY = useTransform(sy, [-0.5, 0.5], [10, -10]);

  const onMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    mx.set(e.clientX / innerWidth - 0.5);
    my.set(e.clientY / innerHeight - 0.5);
  };

  return (
    <section
      id="home"
      onMouseMove={onMouseMove}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-28 sm:px-8"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_65%)]"
      />
      <HeroScene />

      <motion.div
        className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center"
        style={{ x: textX, y: textY }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="glass mb-8 flex items-center gap-3 rounded-full px-4 py-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full rounded-full bg-emerald-400 animate-pulse-dot" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-soft">
            {t("openToWork")}
          </span>
          <span className="hidden h-3 w-px bg-line sm:block" />
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-soft sm:block">
            {propStatus ?? t("status")}
          </span>
          <span className="hidden h-3 w-px bg-line sm:block" />
          <VisitorCount
            mode="live"
            className="hidden font-mono text-[11px] uppercase tracking-[0.25em] text-neon sm:block"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-mono text-xs uppercase tracking-[0.45em] text-soft sm:text-sm"
        >
          {t("greet")}
        </motion.p>

        <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-[92px]">
          <WordReveal text={t("name")} delay={0.35} />
        </h1>

        <div className="mt-5 h-10 overflow-hidden sm:h-14">
          <AnimatePresence mode="wait">
            <motion.p
              key={roleIndex}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-2xl font-semibold text-soft sm:text-4xl"
            >
              <span className="gradient-text">{roles[roleIndex]}</span>
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-soft sm:text-lg"
        >
          {propSubtitle ?? t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Magnetic>
            <button
              onClick={() => scrollToId("projects")}
              data-cursor="link"
              className="group relative overflow-hidden rounded-full bg-ink px-8 py-4 font-mono text-xs font-semibold uppercase tracking-widest text-bg"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t("ctaWork")}
                <ArrowDown
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-y-1"
                />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-nebula via-neon to-aqua transition-transform duration-500 ease-out group-hover:translate-x-0" />
            </button>
          </Magnetic>

          <Magnetic>
            <a
              href={site.cvPath}
              data-cursor="link"
              className="group glass flex items-center gap-2 rounded-full px-8 py-4 font-mono text-xs font-semibold uppercase tracking-widest transition-colors hover:border-neon/40"
            >
              {t("ctaCv")}
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex items-center gap-4"
        >
          {[
            { href: site.github, icon: GitHubIcon, label: "GitHub" },
            { href: site.linkedin, icon: LinkedInIcon, label: "LinkedIn" },
            { href: `mailto:${site.email}`, icon: Mail, label: "Email" },
          ].map(({ href, icon: Icon, label }) => (
            <Magnetic key={label} strength={0.5}>
              <a
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noreferrer"
                aria-label={label}
                data-cursor="link"
                className="glass flex h-11 w-11 items-center justify-center rounded-full text-soft transition-all duration-300 hover:scale-110 hover:text-neon"
              >
                <Icon width={17} height={17} />
              </a>
            </Magnetic>
          ))}
        </motion.div>
      </motion.div>

      <motion.button
        onClick={() => scrollToId("about")}
        data-cursor="link"
        aria-label={t("scroll")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-soft">
            {t("scroll")}
          </span>
          <div className="flex h-10 w-6 items-start justify-center rounded-full border border-line p-1.5">
            <motion.span
              animate={{ y: [0, 14, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-1 rounded-full bg-gradient-to-b from-nebula to-neon"
            />
          </div>
        </div>
      </motion.button>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-bg to-transparent"
      />
    </section>
  );
}
