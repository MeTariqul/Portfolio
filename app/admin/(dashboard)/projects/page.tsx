import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProject } from "@/app/admin/(dashboard)/projects/actions";
import { ConfirmForm } from "@/components/admin/confirm-form";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function AdminProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Projects</h1>
          <p className="mt-2 text-soft">{projects.length} total</p>
        </div>
        <Link
          href="/admin/projects/new"
          prefetch={false}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          New project
        </Link>
      </div>

      {projects.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No projects yet.
        </p>
      )}

      <div className="mt-8">
        {projects.map((p) => (
          <article
            key={p.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-5 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <Link
                  href={`/admin/projects/${p.id}`}
                  prefetch={false}
                  className="link-underline hover:text-accent"
                >
                  {p.title}
                </Link>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-soft">
                <span className="rounded-full border border-line px-2.5 py-0.5">
                  {p.category}
                </span>
                {p.featured && (
                  <span className="rounded-full border border-accent px-2.5 py-0.5 text-accent">
                    Featured
                  </span>
                )}
                <span>/projects/{p.slug}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/projects/${p.slug}`}
                prefetch={false}
                className="link-underline text-soft hover:text-ink"
                target="_blank"
              >
                View
              </Link>
              <Link
                href={`/admin/projects/${p.id}`}
                prefetch={false}
                className="link-underline text-soft hover:text-ink"
              >
                Edit
              </Link>
              <ConfirmForm
                action={deleteProject.bind(null, p.id)}
                confirmText={`Delete "${p.title}"?`}
              >
                <button
                  type="submit"
                  className="text-soft transition-colors hover:text-accent"
                >
                  Delete
                </button>
              </ConfirmForm>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
