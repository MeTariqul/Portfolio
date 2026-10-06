import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deletePost } from "@/app/admin/(dashboard)/posts/actions";
import { ConfirmForm } from "@/components/admin/confirm-form";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};

const chip = (on: boolean) =>
  `rounded-full border px-2.5 py-0.5 text-xs ${
    on ? "border-accent text-accent" : "border-line text-soft"
  }`;

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Posts</h1>
          <p className="mt-2 text-soft">{posts.length} total</p>
        </div>
        <Link
          href="/admin/posts/new"
          prefetch={false}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          No posts yet.
        </p>
      )}

      <div className="mt-8">
        {posts.map((p) => (
          <article
            key={p.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line py-5 first:border-t-0 first:pt-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate">
                <Link
                  href={`/admin/posts/${p.id}`}
                  prefetch={false}
                  className="link-underline hover:text-accent"
                >
                  {p.title}
                </Link>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-soft">
                <span className={chip(p.status === "PUBLISHED")}>
                  {p.status === "PUBLISHED" ? "Published" : "Draft"}
                </span>
                {p.featured && <span className={chip(true)}>Featured</span>}
                <span>/blog/{p.slug}</span>
                <span aria-hidden>·</span>
                <span>
                  updated{" "}
                  {p.updatedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/blog/${p.slug}`}
                prefetch={false}
                className="link-underline text-soft hover:text-ink"
                target="_blank"
              >
                View
              </Link>
              <Link
                href={`/admin/posts/${p.id}`}
                prefetch={false}
                className="link-underline text-soft hover:text-ink"
              >
                Edit
              </Link>
              <ConfirmForm
                action={deletePost.bind(null, p.id)}
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
