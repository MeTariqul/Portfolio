import Link from "next/link";
import type { Project } from "@/lib/content";
import { Tag } from "@/components/ui/tag";

// Project tile for the 12-column projects grid.
export function ProjectTile({ project }: { project: Project }) {
  return (
    <article className="col-span-12 flex flex-col rounded-xl border border-line bg-surface p-6 md:col-span-6 lg:col-span-4">
      {project.screenshots[0] && (
        <div className="mb-5 overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.screenshots[0].url}
            alt={project.screenshots[0].alt}
            className="aspect-video w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <p className="text-sm text-soft">{project.category}</p>
      <h3 className="mt-1 text-xl">
        <Link
          href={`/projects/${project.slug}`}
          className="link-underline hover:text-accent"
        >
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-[0.95rem] text-soft">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.stack.slice(0, 4).map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
    </article>
  );
}

// Project row for the home page: numbered, editorial, no boxes.
export function ProjectRow({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  return (
    <article className="border-t border-line py-7">
      <div className="flex flex-wrap items-baseline gap-x-4">
        <span className="font-mono text-sm text-soft" aria-hidden>
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-2xl">
          <Link
            href={`/projects/${project.slug}`}
            className="link-underline hover:text-accent"
          >
            {project.title}
          </Link>
        </h3>
        <span className="text-sm text-soft">{project.category}</span>
      </div>
      <p className="mt-2 max-w-[680px] text-soft">{project.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {project.stack.slice(0, 5).map((s) => (
          <Tag key={s}>{s}</Tag>
        ))}
      </div>
    </article>
  );
}
