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
  getCopy,
} from "@/lib/content";
import { extractToc, formatDate, readingTime } from "@/lib/markdown";
import { fill } from "@/lib/utils";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    const copy = await getCopy();
    return { title: copy["blog.notFound"] };
  }
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

function TocList({
  toc,
  labels,
}: {
  toc: ReturnType<typeof extractToc>;
  labels: { nav: string; heading: string };
}) {
  if (toc.length < 2) return null;
  return (
    <nav aria-label={labels.nav}>
      <p className="mb-3 text-sm text-soft">{labels.heading}</p>
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
  const [post, copy] = await Promise.all([getPost(slug), getCopy()]);
  if (!post) notFound();

  const [toc, related, adjacent] = await Promise.all([
    Promise.resolve(extractToc(post.contentMD)),
    getRelatedPosts(post, 3),
    getAdjacentPosts(slug),
  ]);
  const url = `${site.url}/blog/${post.slug}`;
  const tocLabels = { nav: copy["blog.tocAria"], heading: copy["blog.onThisPage"] };

  return (
    <Container>
      <article className="py-20 md:py-24">
        <header className="max-w-[680px]">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-soft">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{fill(copy["post.readTime"], { n: readingTime(post.contentMD) })}</span>
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
              {copy["blog.onThisPage"]}
            </summary>
            <div className="mt-3">
              <TocList toc={toc} labels={tocLabels} />
            </div>
          </details>
        )}

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,680px)_240px]">
          <div className="min-w-0">
            <Markdown
              codeLabels={{ copy: copy["code.copy"], copied: copy["code.copied"] }}
            >
              {post.contentMD}
            </Markdown>

            {post.attachments.length > 0 && (
              <section
                className="mt-10"
                aria-labelledby="attachments-heading"
              >
                <h2 id="attachments-heading" className="text-xl">
                  {copy["blog.attachments"]}
                </h2>
                {post.attachments.some((a) => a.kind === "IMAGE") && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {post.attachments
                      .filter((a) => a.kind === "IMAGE")
                      .map((a) => (
                        <figure key={a.id}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.url}
                            alt={a.filename}
                            width={a.width ?? undefined}
                            height={a.height ?? undefined}
                            loading="lazy"
                            className="w-full rounded-lg border border-line bg-line/30"
                          />
                          <figcaption className="mt-1.5 text-xs text-soft">
                            {a.filename}
                          </figcaption>
                        </figure>
                      ))}
                  </div>
                )}
                {post.attachments.some((a) => a.kind !== "IMAGE") && (
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {post.attachments
                      .filter((a) => a.kind !== "IMAGE")
                      .map((a) => (
                        <li key={a.id}>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm text-soft transition-colors hover:border-accent hover:text-accent"
                          >
                            {a.filename}
                          </a>
                        </li>
                      ))}
                  </ul>
                )}
              </section>
            )}

            <div className="mt-12 border-t border-line pt-6">
              <ShareLinks
                title={post.title}
                url={url}
                labels={{
                  share: copy["share.label"],
                  x: copy["share.x"],
                  linkedin: copy["ui.linkedin"],
                  copy: copy["share.copy"],
                  copied: copy["share.copied"],
                }}
              />
            </div>
          </div>

          {/* Desktop table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TocList toc={toc} labels={tocLabels} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl">
              {copy["blog.related"]}
            </h2>
            <div className="mt-4">
              {related.map((p) => (
                <PostRow key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}

        <nav
          aria-label={copy["blog.postNavAria"]}
          className="mt-12 flex flex-col justify-between gap-4 border-t border-line pt-8 sm:flex-row"
        >
          {adjacent.prev ? (
            <Link
              href={`/blog/${adjacent.prev.slug}`}
              prefetch={false}
              className="link-underline max-w-[45%] text-soft hover:text-ink"
            >
              {fill(copy["blog.postNewer"], { title: adjacent.prev.title })}
            </Link>
          ) : (
            <span />
          )}
          {adjacent.next ? (
            <Link
              href={`/blog/${adjacent.next.slug}`}
              prefetch={false}
              className="link-underline max-w-[45%] text-right text-soft hover:text-ink sm:text-right"
            >
              {fill(copy["blog.postOlder"], { title: adjacent.next.title })}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </Container>
  );
}
