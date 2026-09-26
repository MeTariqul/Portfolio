import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { getAllProjects, projectSlug } from "@/lib/content";
import { GitHubIcon } from "@/components/brand-icons";
import {
  BreadcrumbJsonLd,
  ItemListJsonLd,
  homeCrumb,
} from "@/components/structured-data";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "projectsPage" });
  return {
    title: t("heading"),
    description: t("sub"),
    keywords: [
      "Md. Tariqul Islam",
      "Projects",
      "Web Developer",
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "AI",
      "Bangladesh",
    ],
    alternates: {
      canonical: `${site.url}/projects`,
    },
    openGraph: {
      title: t("heading"),
      description: t("sub"),
      url: `${site.url}/projects`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Projects — Md. Tariqul Islam",
        },
      ],
    },
  };
}

const gradientTiles = [
  "from-violet-600 to-fuchsia-500",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-rose-500",
  "from-emerald-500 to-cyan-500",
  "from-amber-500 to-rose-500",
  "from-blue-600 to-violet-600",
];

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("projectsPage");
  const items = await getAllProjects();

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[homeCrumb(), { name: "Projects", url: `${site.url}/projects` }]}
      />
      <ItemListJsonLd
        name="Projects — Md. Tariqul Islam"
        description={t("sub")}
        url={`${site.url}/projects`}
        items={items.map((item) => ({
          name: item.title,
          url: `${site.url}/projects/${projectSlug(item.title)}`,
          description: item.desc,
        }))}
      />

      <Link
        href="/"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("back")}
      </Link>

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.35em] text-soft">
        {t("label")}
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
        {t("heading")}
      </h1>
      <p className="mt-4 max-w-2xl text-soft">{t("sub")}</p>

      {items.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-lg text-soft">{t("empty")}</p>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-neon transition-colors hover:text-ink"
          >
            <GitHubIcon width={14} height={14} />
            {t("viewGitHub")}
            <ArrowUpRight size={13} />
          </a>
        </div>
      ) : (
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const slug = projectSlug(item.title);
            return (
              <article
                key={item.title}
                className="glass group flex flex-col overflow-hidden rounded-3xl border border-line transition-colors duration-300 hover:border-neon/40"
              >
                <Link
                  href={`/projects/${slug}`}
                  data-cursor="link"
                  className="block"
                >
                  <div
                    className={`relative h-40 overflow-hidden bg-gradient-to-br ${gradientTiles[i % gradientTiles.length]}`}
                  >
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-5xl font-bold text-white/85 drop-shadow-lg">
                        {item.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
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
                    <h2 className="font-display text-xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-neon">
                      {item.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-soft">
                      {item.desc}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-soft"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-4 border-t border-line px-6 py-4">
                  {item.github && (
                    <a
                      href={item.github}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="link"
                      className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:text-neon"
                    >
                      <GitHubIcon width={13} height={13} />
                      {t("code")}
                    </a>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="link"
                      className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:text-neon"
                    >
                      {t("live")}
                      <ArrowUpRight size={13} />
                    </a>
                  )}
                  <Link
                    href={`/projects/${slug}`}
                    data-cursor="link"
                    className="ml-auto flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-neon transition-colors hover:text-ink"
                  >
                    {t("details")} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-16 text-center">
        <a
          href={site.github}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:text-neon"
        >
          <GitHubIcon width={14} height={14} />
          {t("viewGitHub")}
          <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
