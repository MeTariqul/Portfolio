import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { getSite, getAbout, getExperience } from "@/lib/content";
import { Terminal } from "@/components/terminal";
import { Counter, type Stat } from "@/components/counters";
import { SectionHeading } from "@/components/section-heading";
import { BreadcrumbJsonLd, FaqJsonLd, homeCrumb } from "@/components/structured-data";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "Md. Tariqul Islam",
      "Web Developer",
      "Bangladesh",
      "Next.js Developer",
      "React Developer",
      "Python Developer",
      "Django Developer",
    ],
    alternates: {
      canonical: `${site.url}/about`,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/about`,
      type: "profile",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Md. Tariqul Islam — About",
        },
      ],
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tp = await getTranslations("aboutPage");
  const tf = await getTranslations("faq");

  const [dbAbout, dbExperience, dbSite] = await Promise.all([
    getAbout(),
    getExperience(),
    getSite(),
  ]);

  const location = dbSite.location ?? site.location;
  const lines = dbAbout?.terminalLines ?? (t.raw("terminalLines") as string[]);
  const stats = dbAbout?.stats ?? (t.raw("stats") as Stat[]);
  const badges = dbAbout?.badges ?? (t.raw("badges") as string[]);
  const experience = dbExperience ?? [];
  const faqItems = tf.raw("items") as { question: string; answer: string }[];

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[homeCrumb(), { name: "About", url: `${site.url}/about` }]}
      />
      <FaqJsonLd items={faqItems} pageUrl={`${site.url}/about`} />
      <Link
        href="/#about"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("label")}
      </Link>

      <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
        {tp("heading")}
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-soft">
        {tp("intro")}
      </p>

      <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-line bg-black">
            <img
              src="/profile.jpg"
              alt="Md. Tariqul Islam, full-stack web developer from Bangladesh"
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
          </div>

          <div className="glass absolute -bottom-5 -right-3 flex rotate-2 items-center gap-2 rounded-full px-5 py-2.5 sm:-right-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-soft">
              {location}
            </span>
          </div>
        </div>

        <div>
          <Terminal lines={lines} title={t("terminalTitle")} />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {stats.map((stat, i) => (
          <Counter key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        {badges.map((badge) => (
          <span
            key={badge}
            className="glass rounded-full px-4 py-2 font-mono text-xs text-soft transition-colors duration-300 hover:border-neon/50 hover:text-ink"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-24">
        <SectionHeading number="01" label={tp("storyLabel")} title={tp("storyHeading")} sub={tp("storySub")} />
      </div>

      <div className="mt-12 space-y-6 text-base leading-relaxed text-soft sm:text-lg">
        <p>{tp("story1")}</p>
        <p>{tp("story2")}</p>
        <p>{tp("story3")}</p>
      </div>

      {experience.length > 0 && (
        <div className="mt-24">
          <SectionHeading number="02" label={t("label")} title={tp("journeyHeading")} sub={tp("journeySub")} />
          <div className="mt-12 space-y-8">
            {experience.map((item) => (
              <div key={item.role} className="glass rounded-2xl p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{item.role}</h3>
                    <p className="mt-1 font-mono text-sm text-neon">{item.org}</p>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
                    {item.period}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-soft sm:text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-24 text-center">
        <p className="text-lg text-soft">{tp("ctaText")}</p>
        <Link
          href="/#contact"
          data-cursor="link"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-nebula to-neon px-8 py-3 font-medium text-white transition-all hover:scale-105"
        >
          {tp("ctaButton")}
        </Link>
      </div>

      <div className="mt-24">
        <SectionHeading number="03" label={tf("label")} title={tf("heading")} sub={tf("sub")} align="center" />
        <div className="mt-12 space-y-4">
          {faqItems.map((item, i) => (
            <details
              key={item.question}
              className="group glass overflow-hidden rounded-2xl border border-line"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 font-display text-lg font-semibold tracking-tight sm:text-xl">
                <span className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-nebula to-neon" />
                  {item.question}
                </span>
                <span className="shrink-0 text-soft transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-line px-6 pb-6 pt-4">
                <p className="text-base leading-relaxed text-soft sm:text-lg">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
