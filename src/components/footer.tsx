"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, Rocket } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "./brand-icons";
import { Magnetic } from "./magnetic";
import { VisitorCount } from "./visitor-count";
import { scrollToId } from "@/lib/lenis-store";
import { site } from "@/lib/site";
import type { SiteProfile } from "@/lib/content";

export function Footer({ siteProfile }: { siteProfile?: SiteProfile }) {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const s = siteProfile ?? site;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div aria-hidden className="overflow-hidden py-6 opacity-[0.07]">
        <div className="flex w-max animate-marquee-slow whitespace-nowrap">
          {[0, 1].map((n) => (
            <span
              key={n}
              className="font-display text-[11vw] font-bold uppercase leading-none tracking-tight text-ink"
            >
              {s.shortName} ✦ {s.shortName} ✦ {s.shortName} ✦ {s.shortName} ✦{" "}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 pt-10 pb-[max(env(safe-area-inset-bottom),2.5rem)] sm:flex-row sm:justify-between sm:px-8">
        <div className="text-center sm:text-left">
          <p className="font-display text-lg font-bold">
            <span className="gradient-text">MT</span> — {s.name}
          </p>
          <p className="mt-1 font-mono text-[11px] text-soft">
            © {year} {s.name}. {t("rights")}
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-soft sm:justify-start">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-neon/60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-neon" />
            </span>
            <VisitorCount mode="total" />
          </p>
          <nav
            aria-label="Footer"
            className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start"
          >
            {[
              { href: "/about", key: "about" },
              { href: "/projects", key: "projects" },
              { href: "/blog", key: "blog" },
              { href: "/crazy-time", key: "crazyTime" },
            ].map(({ href, key }) => (
              <Link
                key={href}
                href={href}
                data-cursor="link"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-soft transition-colors hover:text-ink"
              >
                {tn(key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {[
            { href: s.github, icon: GitHubIcon, label: "GitHub" },
            { href: s.linkedin, icon: LinkedInIcon, label: "LinkedIn" },
            { href: `mailto:${s.email}`, icon: Mail, label: "Email" },
          ].map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto") ? undefined : "_blank"}
              rel="noreferrer"
              aria-label={label}
              data-cursor="link"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-soft transition-all duration-300 hover:scale-110 hover:text-neon"
            >
              <Icon width={16} height={16} />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-soft md:block">
            {t("built")}
          </p>
          <Magnetic strength={0.5}>
            <button
              onClick={() => scrollToId("home")}
              data-cursor="link"
              aria-label={t("top")}
              className="group glass flex h-12 w-12 items-center justify-center rounded-full text-soft transition-all duration-300 hover:text-neon"
            >
              <Rocket
                size={18}
                className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-45"
              />
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}
