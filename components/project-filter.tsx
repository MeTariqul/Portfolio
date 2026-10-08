"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/content";
import { ProjectTile } from "@/components/project-tile";
import { cn } from "@/lib/utils";

// Client-side filter for the projects page: category chips + tech chips.
// No page reloads, keyboard accessible, results announced politely.
export function ProjectFilter({ projects }: { projects: Project[] }) {
  const [category, setCategory] = useState<string>("All");
  const [tech, setTech] = useState<string>("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects],
  );
  const techs = useMemo(
    () => ["All", ...Array.from(new Set(projects.flatMap((p) => p.stack)))],
    [projects],
  );

  const visible = projects.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (tech === "All" || p.stack.includes(tech)),
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
    return <p className="text-soft">No projects to show yet.</p>;
  }

  return (
    <div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={chip(category === c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
          {techs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTech(t)}
              aria-pressed={tech === t}
              className={chip(tech === t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {visible.length} projects shown
      </p>

      <div className="mt-10 grid grid-cols-12 gap-6">
        {visible.map((p) => (
          <ProjectTile key={p.slug} project={p} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-soft">
          Nothing matches that combination. Try clearing a filter.
        </p>
      )}
    </div>
  );
}
