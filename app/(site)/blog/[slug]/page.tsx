import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/markdown";
import { PostRow } from "@/components/post-row";
import { ShareLinks } from "@/components/share-links";
import { site } from "@/lib/site";
import {
  getPost,
  getRelatedPosts,
  getAdjacentPosts,
} from "@/lib/content";
import { extractToc, formatDate, readingTime } from "@/lib/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      publishedTime: post.date,
      url: `${site.url}/blog/${post.slug}`,
    },
  };
}

function TocList({ toc }: { toc: ReturnType<typeof extractToc> }) {
  if (toc.length < 2) return null;
  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-sm text-soft">On this page</p>
      <ul className="space-y-2 text-sm">
        {toc.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "pl-4" : undefined}
          >
            <a
              href={`#${item.id}`}
              className="link-underline text-soft hover:text-ink"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [toc, related, adjacent] = await Promise.all([
    Promise.resolve(extractToc(post.contentMD)),
    getRelatedPosts(post, 3),
    getAdjacentPosts(slug),
  ]);
  const url = `${site.url}/blog/${post.slug}`;

  return (
    <Container>
      <article className="py-20 md:py-24">
        <header className="max-w-[680px]">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{readingTime(post.contentMD)} min read</span>
            {post.category && (
              <>
                <span aria-hidden>·</span>
                <span>{post.category}</span>
              </>
            )}
          </p>
          <h1 className="mt-4 text-4xl">{post.title}</h1>
          <p className="mt-5 text-lg text-soft">{post.excerpt}</p>
        </header>

        {/* Mobile table of contents */}
        {toc.length >= 2 && (
          <details className="mt-8 max-w-[680px] rounded-lg border border-line p-4 lg:hidden">
            <summary className="cursor-pointer text-sm text-soft">
              On this page
            </summary>
            <div className="mt-3">
              <TocList toc={toc} />
            </div>
          </details>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,680px)_240px]">
          <div className="min-w-0">
            <Markdown>{post.contentMD}</Markdown>

            <div className="mt-12 border-t border-line pt-6">
              <ShareLinks title={post.title} url={url} />
            </div>
          </div>

          {/* Desktop table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TocList toc={toc} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl">
              Related posts
            </h2>
            <div className="mt-4">
              {related.map((p) => (
                <PostRow key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}

        <nav
          aria-label="Post navigation"
          className="mt-12 flex flex-col justify-between gap-4 border-t border-line pt-8 sm:flex-row"
        >
          {adjacent.prev ? (
            <Link
              href={`/blog/${adjacent.prev.slug}`}
              className="link-underline max-w-[45%] text-soft hover:text-ink"
            >
              ← Newer: {adjacent.prev.title}
            </Link>
          ) : (
            <span />
          )}
          {adjacent.next ? (
            <Link
              href={`/blog/${adjacent.next.slug}`}
              className="link-underline max-w-[45%] text-right text-soft hover:text-ink sm:text-right"
            >
              Older: {adjacent.next.title} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </Container>
  );
}
