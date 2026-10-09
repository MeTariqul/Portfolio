import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PostRow } from "@/components/post-row";
import { getPosts, getAllTags, getCopy } from "@/lib/content";
import { cn, fill } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy["blog.title"],
    description: copy["blog.metaDescription"],
  };
}

type Props = {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
};

function pageHref(params: { q?: string; tag?: string; page: number }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.tag) qs.set("tag", params.tag);
  if (params.page > 1) qs.set("page", String(params.page));
  const s = qs.toString();
  return s ? `/blog?${s}` : "/blog";
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tag = (sp.tag ?? "").trim();
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 6;

  const [{ posts, total }, tags, copy] = await Promise.all([
    getPosts({ q: q || undefined, tag: tag || undefined, page, perPage }),
    getAllTags(),
    getCopy(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <Container>
      <section className="py-20 md:py-24">
        <h1 className="text-4xl">{copy["blog.title"]}</h1>
        <p className="mt-6 max-w-[680px] text-lg text-soft">
          {copy["blog.intro"]}
        </p>

        <form
          action="/blog"
          method="get"
          className="mt-10 flex max-w-[480px] gap-2"
          role="search"
        >
          <label htmlFor="q" className="sr-only">
            {copy["blog.search"]}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={copy["blog.search"]}
            className="h-11 w-full rounded-full border border-line bg-surface px-5 text-[0.95rem] placeholder:text-soft focus:border-accent focus:outline-none"
          />
          {tag && <input type="hidden" name="tag" value={tag} />}
          <button
            type="submit"
            className="h-11 shrink-0 rounded-full bg-accent px-5 text-[0.95rem] font-medium text-accent-contrast transition-opacity hover:opacity-90"
          >
            {copy["blog.searchBtn"]}
          </button>
        </form>

        {tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2" aria-label={copy["blog.tagAria"]}>
            <Link
              href={pageHref({ q: q || undefined, page: 1 })}
              prefetch={false}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                !tag
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line text-soft hover:text-ink",
              )}
            >
              {copy["ui.all"]}
            </Link>
            {tags.map((t) => (
              <Link
                key={t}
                href={pageHref({ q: q || undefined, tag: t, page: 1 })}
                prefetch={false}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  tag === t
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-line text-soft hover:text-ink",
                )}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {(q || tag) && (
          <p className="mt-8 text-sm text-soft" aria-live="polite">
            {total} {total === 1 ? "post" : "posts"} matching
            {q && <> “{q}”</>}
            {tag && <> in {tag}</>}
            {", "}
            <Link
              href="/blog"
              prefetch={false}
              className="link-underline text-accent hover:text-ink"
            >
              {copy["blog.clear"]}
            </Link>
          </p>
        )}

        <div className="mt-4">
          {posts.map((p) => (
            <PostRow key={p.slug} post={p} />
          ))}
        </div>

        {posts.length === 0 && (
          <p className="mt-8 border-t border-line pt-8 text-soft">
            {copy["blog.noPosts"]}
          </p>
        )}

        {totalPages > 1 && (
          <nav
            aria-label={copy["blog.pageAria"]}
            className="mt-10 flex items-center justify-between border-t border-line pt-6"
          >
            {page > 1 ? (
              <Link
                href={pageHref({
                  q: q || undefined,
                  tag: tag || undefined,
                  page: page - 1,
                })}
                prefetch={false}
                className="link-underline text-accent"
              >
                {copy["blog.newer"]}
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-soft">
              {fill(copy["blog.pageOf"], { page, total: totalPages })}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref({
                  q: q || undefined,
                  tag: tag || undefined,
                  page: page + 1,
                })}
                prefetch={false}
                className="link-underline text-accent"
              >
                {copy["blog.older"]}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </Container>
  );
}
