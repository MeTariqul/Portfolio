import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { posts } from "@/lib/posts";
import { getBlogPosts } from "@/lib/content";
import { getMergedMessages } from "@/lib/messages";
import { site } from "@/lib/site";
import {
  BreadcrumbJsonLd,
  ItemListJsonLd,
  homeCrumb,
} from "@/components/structured-data";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMergedMessages();
  return {
    title: messages.blog.heading,
    description: messages.blog.sub,
    keywords: [
      "blog",
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
    alternates: {
      canonical: `${site.url}/blog`,
    },
    openGraph: {
      title: messages.blog.heading,
      description: messages.blog.sub,
      url: `${site.url}/blog`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Blog — Md. Tariqul Islam",
        },
      ],
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const all = (await getBlogPosts()) ?? posts;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[homeCrumb(), { name: "Blog", url: `${site.url}/blog` }]}
      />
      <ItemListJsonLd
        name="Blog — Md. Tariqul Islam"
        description="Technical articles and case studies by Md. Tariqul Islam, full-stack web developer."
        url={`${site.url}/blog`}
        items={all.map((post) => ({
          name: post.title,
          url: `${site.url}/blog/${post.slug}`,
          description: post.description,
        }))}
      />
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-soft">
        09 · {t("label")}
      </p>
      <h1 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
        {t("heading")}
      </h1>
      <p className="mt-4 max-w-xl text-soft">{t("sub")}</p>

      <div className="mt-16 space-y-6">
        {all.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            data-cursor="link"
            className={`group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-line p-8 transition-all duration-300 hover:-translate-y-1 hover:border-neon/40 sm:min-h-[220px] ${
              i === 0 ? "min-h-[320px]" : "min-h-[180px]"
            }`}
          >
            {post.image_url ? (
              <img
                src={post.image_url}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-15 transition-opacity duration-500 group-hover:opacity-25`}
              />
            )}
            <span className="absolute right-6 top-6 font-display text-6xl font-bold text-soft/10">
              0{i + 1}
            </span>
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon">
                {post.category} · {post.date} · {post.readTime} {t("readTime")}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {post.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-soft">{post.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
