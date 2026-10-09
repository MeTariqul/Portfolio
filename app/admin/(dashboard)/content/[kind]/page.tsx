import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpec, type ContentSpec } from "@/lib/content-specs";
import { listRows, type ContentRow } from "@/lib/content-rows";
import { deleteContent } from "@/app/admin/(dashboard)/content/actions";
import { ConfirmForm } from "@/components/admin/confirm-form";

type Props = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  const spec = getSpec(kind);
  return {
    title: spec?.title ?? "Content",
    robots: { index: false, follow: false },
  };
}

// One line identifying the row: the preview fields joined, e.g.
// "Web development · From $200".
function previewOf(spec: ContentSpec, row: ContentRow): string {
  return spec.preview
    .map((key) => String(row[key] ?? ""))
    .filter(Boolean)
    .join(" · ");
}

export default async function ContentListPage({ params }: Props) {
  const { kind } = await params;
  const spec = getSpec(kind);
  if (!spec) notFound();

  const rows = await listRows(spec);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">{spec.title}</h1>
          <p className="mt-2 text-soft">{rows.length} total</p>
        </div>
        <Link
          href={`/admin/content/${spec.kind}/new`}
          prefetch={false}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          New {spec.singular}
        </Link>
      </div>

      {rows.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          Nothing here yet.
        </p>
      )}

      <div className="mt-8">
        {rows.map((row) => (
          <article
            key={row.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-5 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <Link
                  href={`/admin/content/${spec.kind}/${row.id}`}
                  prefetch={false}
                  className="link-underline hover:text-accent"
                >
                  {previewOf(spec, row)}
                </Link>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-soft">
                <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-soft">
                  order {String(row.order ?? 0)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/admin/content/${spec.kind}/${row.id}`}
                prefetch={false}
                className="link-underline text-soft hover:text-ink"
              >
                Edit
              </Link>
              <ConfirmForm
                action={deleteContent.bind(null, spec.kind, row.id)}
                confirmText={`Delete "${previewOf(spec, row)}"?`}
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
