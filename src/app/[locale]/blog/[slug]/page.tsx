import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { posts } from "@/lib/posts";
import { getBlogPost, getSite } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 60;

async function findPost(slug: string) {
  return (await getBlogPost(slug)) ?? posts.find((p) => p.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: [
      post.category,
      "web development",
      "full-stack developer",
      "Next.js",
      "React",
      "TypeScript",
      "Python",
      "Django",
      "Md. Tariqul Islam",
      "Bangladesh developer",
    ],
    authors: [{ name: "Md. Tariqul Islam", url: site.url }],
    alternates: {
      canonical: `${site.url}/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} | ${site.name}`,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: ["Md. Tariqul Islam"],
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ${site.name}`,
      description: post.description,
      images: ["/opengraph.png"],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");

  const post = await findPost(slug);
  if (!post) notFound();

  const s = await getSite();

  return (
    <article className="mx-auto max-w-3xl px-5 pb-32 pt-36 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: {
              "@type": "Person",
              name: s.name,
              url: s.url,
            },
            publisher: {
              "@type": "Person",
              name: s.name,
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${site.url}/blog/${slug}`,
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: site.url,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${site.url}/blog`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: post.title,
                item: `${site.url}/blog/${slug}`,
              },
            ],
          }),
        }}
      />
      <Link
        href="/blog"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("label")}
      </Link>

      {post.image_url && (
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-3xl border border-line">
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {post.title}
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-soft">
        <span className={`rounded-full bg-gradient-to-r ${post.gradient} bg-clip-text font-bold text-transparent`}>
          {post.category}
        </span>
        <span>{post.date}</span>
        <span>
          {post.readTime} {t("readTime")}
        </span>
      </div>

      <div className="mt-12 space-y-6">
        {post.blocks.map((block, i) => {
          switch (block.type) {
            case "h2":
              return (
                <h2 key={i} className="pt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {block.text}
                </h2>
              );
            case "p":
              return (
                <p key={i} className="text-base leading-relaxed text-soft sm:text-lg">
                  {block.text}
                </p>
              );
            case "list":
              return (
                <ul key={i} className="space-y-3 pl-1">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-base text-soft sm:text-lg">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-nebula to-neon" />
                      {item}
                    </li>
                  ))}
                </ul>
              );
            case "code":
              return (
                <div key={i} className="overflow-hidden rounded-2xl border border-line">
                  <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    <span className="ml-3 font-mono text-[11px] uppercase tracking-widest text-soft">
                      {block.lang}
                    </span>
                  </div>
                  <pre className="overflow-x-auto bg-black/60 p-5 font-mono text-[13px] leading-6 text-emerald-300">
                    <code>{block.code}</code>
                  </pre>
                </div>
              );
          }
        })}
      </div>

      <div className="mt-16 flex items-center justify-between border-t border-line pt-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
          {s.name}
        </p>
        <Link
          href="/blog"
          data-cursor="link"
          className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
        >
          {t("all")} →
        </Link>
      </div>
    </article>
  );
}
