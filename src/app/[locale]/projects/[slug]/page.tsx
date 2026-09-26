import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import {
  getAllProjects,
  getProjectBySlug,
  projectSlug,
  type ProjectItem,
} from "@/lib/content";
import { GitHubIcon } from "@/components/brand-icons";
import {
  BreadcrumbJsonLd,
  ProjectJsonLd,
  homeCrumb,
} from "@/components/structured-data";

export const revalidate = 60;

async function findProject(slug: string): Promise<ProjectItem | null> {
  return getProjectBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.desc,
    keywords: [project.category, ...project.tags, "Md. Tariqul Islam", "Web Developer", "Bangladesh"],
    alternates: {
      canonical: `${site.url}/projects/${slug}`,
    },
    openGraph: {
      title: project.title,
      description: project.desc,
      url: `${site.url}/projects/${slug}`,
      siteName: site.name,
      type: "article",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: `${project.title} — Md. Tariqul Islam`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.desc,
      images: ["/opengraph.png"],
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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const project = await findProject(slug);
  if (!project) notFound();

  const t = await getTranslations("projectsPage");
  const all = await getAllProjects();
  const more = all.filter((p) => projectSlug(p.title) !== slug);
  const projectIndex = all.findIndex((p) => projectSlug(p.title) === slug);
  const gradient =
    gradientTiles[(projectIndex >= 0 ? projectIndex : 0) % gradientTiles.length];

  return (
    <div className="mx-auto max-w-4xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[
          homeCrumb(),
          { name: "Projects", url: `${site.url}/projects` },
          { name: project.title, url: `${site.url}/projects/${slug}` },
        ]}
      />
      <ProjectJsonLd project={project} />

      <Link
        href="/projects"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("heading")}
      </Link>

      <div
        aria-hidden
        className={`relative mt-8 h-56 overflow-hidden rounded-3xl border border-line bg-gradient-to-br sm:h-72 ${gradient}`}
      >
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-7xl font-bold text-white/85 drop-shadow-lg sm:text-8xl">
            {project.title.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-soft">
        <span className="rounded-full border border-line px-3 py-1 text-neon">
          {project.category}
        </span>
        {project.featured && (
          <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1">
            <Star size={11} className="fill-amber-300 text-amber-300" />
            {t("featured")}
          </span>
        )}
      </div>

      <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {project.title}
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-soft">
        {project.desc}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-soft">
          {t("stackLabel")}
        </span>
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-line px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-soft"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-nebula to-neon px-6 py-3 font-medium text-white transition-all hover:scale-105"
          >
            {t("live")}
            <ArrowUpRight size={15} />
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className="glass inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-medium text-soft transition-colors hover:border-neon/50 hover:text-neon"
          >
            <GitHubIcon width={15} height={15} />
            {t("code")}
          </a>
        )}
      </div>

      {more.length > 0 && (
        <div className="mt-24 border-t border-line pt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {t("moreHeading")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {more.slice(0, 4).map((item) => (
              <Link
                key={item.title}
                href={`/projects/${projectSlug(item.title)}`}
                data-cursor="link"
                className="glass group rounded-2xl border border-line p-5 transition-colors duration-300 hover:border-neon/40"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
                  {item.category}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold transition-colors duration-300 group-hover:text-neon">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
