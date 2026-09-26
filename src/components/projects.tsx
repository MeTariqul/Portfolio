"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { GitHubIcon } from "./brand-icons";
import { SectionHeading } from "./section-heading";
import { TiltCard } from "./tilt-card";
import { Magnetic } from "./magnetic";
import { site } from "@/lib/site";
import type { ProjectItem } from "@/lib/content";

export function Projects({
  items: propItems,
  githubUrl,
}: {
  items?: ProjectItem[];
  githubUrl?: string;
}) {
  const t = useTranslations("projects");
  const items = propItems ?? (t.raw("items") as ProjectItem[]);
  const gh = githubUrl ?? site.github;

  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 400;
    const gap = 24;
    const scrollAmount = direction === "left" ? -(cardWidth + gap) : cardWidth + gap;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  const gradientTiles = [
    "from-violet-600 to-fuchsia-500",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-rose-500",
    "from-emerald-500 to-cyan-500",
    "from-amber-500 to-rose-500",
    "from-blue-600 to-violet-600",
  ];

  return (
    <section id="projects" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <SectionHeading
        number="03"
        label={t("label")}
        title={t("heading")}
        sub={t("sub")}
      />

      <div className="relative mt-12">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, i) => (
            <TiltCard
              key={item.title}
              intensity={9}
              className="group relative w-[82vw] max-w-[400px] shrink-0 snap-start [perspective:1200px] sm:w-[400px]"
            >
              <div
                data-cursor="view"
                className="relative h-full min-h-[380px] overflow-hidden rounded-3xl border border-line p-px transition-colors duration-500 group-hover:border-neon/50"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface">
                  <div
                    className={`relative h-44 overflow-hidden bg-gradient-to-br ${gradientTiles[i % gradientTiles.length]}`}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-6xl font-bold text-white/85 drop-shadow-lg">
                        {item.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[linear-gradient(120deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)] bg-[length:250%_250%] transition-all duration-700 group-hover:bg-[position:0%_0%]"
                    />
                    {item.featured && (
                      <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-md">
                        <Star size={10} className="fill-amber-300 text-amber-300" />
                        {t("featured")}
                      </span>
                    )}
                    <span className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-soft">
                      {item.desc}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-soft"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
                      <a
                        href={item.github || gh}
                        target="_blank"
                        rel="noreferrer"
                        data-cursor="link"
                        className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:text-neon"
                      >
                        <GitHubIcon width={13} height={13} />
                        {t("code")}
                      </a>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          data-cursor="link"
                          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-soft transition-all duration-300 group-hover:translate-x-1 group-hover:text-neon"
                        >
                          {t("live")}
                          <ArrowUpRight size={13} />
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-soft/50">
                          {t("live")}
                          <ArrowUpRight size={13} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 45%)",
                    }}
                  />
                </div>
              </div>
            </TiltCard>
          ))}

          <Magnetic strength={0.25} className="w-[82vw] max-w-[400px] shrink-0 snap-start sm:w-[400px]">
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="glass-strong group flex h-full min-h-[380px] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-line p-10 text-center transition-colors duration-500 hover:border-neon/50"
            >
              <span className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-neon/15 blur-xl" />
                <GitHubIcon width={36} height={36} className="relative text-ink transition-transform duration-500 group-hover:rotate-[360deg]" />
              </span>
              <span className="font-display text-2xl font-semibold">{t("more")}</span>
              <span className="max-w-xs text-sm text-soft">{t("moreDesc")}</span>
              <span className="mt-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-neon">
                {t("visitGitHub")}
                <ArrowUpRight size={13} />
              </span>
            </a>
          </Magnetic>
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 sm:w-16" />

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={() => scroll("left")}
            className="glass flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors hover:border-neon/50 hover:text-neon"
            aria-label="Scroll left"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-soft">
            {t("swipe")}
          </span>
          <button
            onClick={() => scroll("right")}
            className="glass flex h-10 w-10 items-center justify-center rounded-full border border-line transition-colors hover:border-neon/50 hover:text-neon"
            aria-label="Scroll right"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/projects"
            data-cursor="link"
            className="group glass inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-mono text-xs uppercase tracking-widest text-soft transition-all duration-300 hover:border-neon/50 hover:text-neon"
          >
            {t("viewAll")}
            <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="sr-only" aria-hidden="false">
        <h3>{t("heading")}</h3>
        <p>{t("sub")}</p>
        {items.map((item) => (
          <article key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.desc}</p>
            <p>Category: {item.category}</p>
            {item.tags && (
              <p>Technologies: {item.tags.join(", ")}</p>
            )}
            {item.github && (
              <a href={item.github} rel="noopener">
                GitHub repository for {item.title}
              </a>
            )}
            {item.link && (
              <a href={item.link} rel="noopener">
                Live demo of {item.title}
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
