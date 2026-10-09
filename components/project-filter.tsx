"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/content";
import { ProjectTile } from "@/components/project-tile";
import { cn, fill } from "@/lib/utils";

// Client-side filter for the projects page: category chips + tech chips.
// No page reloads, keyboard accessible, results announced politely.
// Every label arrives as a prop so the admin Copy screen can reword them.
type FilterLabels = {
  all: string;
  categoryAria: string;
  techAria: string;
  shownSr: string;
  empty: string;
  noMatch: string;
};

export function ProjectFilter({
  projects,
  labels,
}: {
  projects: Project[];
  labels: FilterLabels;
}) {
  // "" is the internal "no filter" sentinel; it renders as labels.all, so a
  // real category called "All" can never collide with it.
  const ALL = "";
  const [category, setCategory] = useState<string>(ALL);
  const [tech, setTech] = useState<string>(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );
  const techs = useMemo(
    () => [ALL, ...Array.from(new Set(projects.flatMap((p) => p.stack)))],
    [projects],
  );

  const visible = projects.filter(
    (p) =>
      (category === ALL || p.category === category) &&
      (tech === ALL || p.stack.includes(tech)),
  );

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active
        ? "border-accent bg-accent text-accent-contrast"
        : "border-line text-soft hover:text-ink",
    );

  // No projects at all is different from no matches, and saying "try clearing
  // a filter" when there is nothing to filter would be a lie.
  if (projects.length === 0) {
    return <p className="text-soft">{labels.empty}</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.categoryAria}>
          {categories.map((c) => (
            <button
              key={c || "all"}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={chip(category === c)}
            >
              {c === ALL ? labels.all : c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.techAria}>
          {techs.map((t) => (
            <button
              key={t || "all"}
              type="button"
              onClick={() => setTech(t)}
              aria-pressed={tech === t}
              className={chip(tech === t)}
            >
              {t === ALL ? labels.all : t}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {fill(labels.shownSr, { n: visible.length })}
      </p>

      <div className="mt-10 grid grid-cols-12 gap-6">
        {visible.map((p) => (
          <ProjectTile key={p.slug} project={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-soft">{labels.noMatch}</p>
      )}
    </div>
  );
}
