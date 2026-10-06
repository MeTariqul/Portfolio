import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { Markdown } from "@/components/markdown";
import { getProject } from "@/lib/content";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
  };
}

function Screenshot({ url, alt }: { url: string; alt: string }) {
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div
          className="flex items-center gap-1.5 border-b border-line px-4 py-2.5"
          aria-hidden
        >
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="w-full" loading="lazy" />
      </div>
      <figcaption className="mt-2 text-sm text-soft">{alt}</figcaption>
    </figure>
  );
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <Container>
      <article className="py-20 md:py-24">
        <p className="text-sm text-soft">
          <Link
            href="/projects"
            prefetch={false}
            className="link-underline hover:text-ink"
          >
            Projects
          </Link>
          <span aria-hidden> / </span>
          {project.category}
        </p>

        <h1 className="mt-4 max-w-[680px] text-4xl">{project.title}</h1>
        <p className="mt-5 max-w-[680px] text-lg text-soft">
          {project.summary}
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {project.liveUrl && (
            <ButtonLink href={project.liveUrl} size="sm">
              Live site
            </ButtonLink>
          )}
          {project.githubUrl && (
            <ButtonLink
              href={project.githubUrl}
              variant="secondary"
              size="sm"
            >
              GitHub
            </ButtonLink>
          )}
          <div className="flex flex-wrap gap-2 sm:ml-2">
            {project.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </div>

        <section className="mt-14 max-w-[680px]">
          <h2 className="text-2xl">The problem</h2>
          <p className="mt-4">{project.problem}</p>
        </section>

        <section className="mt-12 max-w-[680px]">
          <h2 className="text-2xl">What I built</h2>
          <div className="mt-4">
            <Markdown>{project.solutionMD}</Markdown>
          </div>
        </section>

        {project.screenshots.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl">Screenshots</h2>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {project.screenshots.map((s) => (
                <Screenshot key={s.url} url={s.url} alt={s.alt} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 max-w-[680px]">
          <h2 className="text-2xl">What I learned</h2>
          <div className="mt-4">
            <Markdown>{project.learnedMD}</Markdown>
          </div>
        </section>

        <p className="mt-16 border-t border-line pt-8">
          <Link
            href="/projects"
            prefetch={false}
            className="link-underline text-accent"
          >
            Back to all projects
          </Link>
        </p>
      </article>
    </Container>
  );
}
