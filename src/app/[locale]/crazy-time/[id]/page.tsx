import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { site } from "@/lib/site";
import { notFound } from "next/navigation";
import {
  BreadcrumbJsonLd,
  WebPageJsonLd,
  homeCrumb,
} from "@/components/structured-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "crazyTime" });
  const post = await getPost(id);
  if (!post) return { title: t("title") };
  const url = `${site.url}/crazy-time/${id}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${post.title} | ${site.name}`,
      description: post.description,
      url,
      siteName: site.name,
      type: "article",
      locale: "en_US",
      publishedTime: post.created_at,
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: `${post.title} — Md. Tariqul Islam`,
        },
      ],
    },
  };
}

type CrazyTimePost = {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  file_url: string;
  file_name: string;
  youtube_url: string;
  doc_url: string;
  category: string;
  created_at: string;
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1] ?? null;
}

async function getPost(id: string): Promise<CrazyTimePost | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("crazy_time")
    .select("*")
    .eq("id", id)
    .single();
  return (data as CrazyTimePost) ?? null;
}

export default async function CrazyTimeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("crazyTime");
  const post = await getPost(id);

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[
          homeCrumb(),
          { name: "Crazy Time", url: `${site.url}/crazy-time` },
          { name: post.title, url: `${site.url}/crazy-time/${id}` },
        ]}
      />
      <WebPageJsonLd
        name={`${post.title} — Md. Tariqul Islam`}
        description={post.description || post.title}
        url={`${site.url}/crazy-time/${id}`}
      />
      <Link
        href="/crazy-time"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("back")}
      </Link>

      <div className="mt-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
          {post.category}
        </span>
        <span className="mx-3 text-soft">·</span>
        <span className="font-mono text-xs text-soft">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
        {post.title}
      </h1>

      {post.image_url && (
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-3xl border border-line">
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {post.youtube_url && extractYouTubeId(post.youtube_url) && (
        <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-3xl border border-line">
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(post.youtube_url)}`}
            title={post.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {post.description && (
        <p className="mt-8 text-lg leading-relaxed text-soft">{post.description}</p>
      )}

      {post.content && (
        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-soft">
          {post.content}
        </div>
      )}

      {post.file_url && (
        <a
          href={post.file_url}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          className="mt-8 inline-flex items-center gap-2 glass rounded-full px-6 py-3 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:border-neon/40 hover:text-ink"
        >
          {post.file_name || "View File"} →
        </a>
      )}
    </div>
  );
}
