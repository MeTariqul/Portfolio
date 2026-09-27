import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { site } from "@/lib/site";
import {
  BreadcrumbJsonLd,
  WebPageJsonLd,
  homeCrumb,
} from "@/components/structured-data";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "crazyTime" });
  return {
    title: t("title"),
    description: t("sub"),
    alternates: {
      canonical: `${site.url}/crazy-time`,
    },
    openGraph: {
      title: `${t("title")} | ${site.name}`,
      description: t("sub"),
      url: `${site.url}/crazy-time`,
      siteName: site.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph.png",
          width: 1200,
          height: 630,
          alt: "Crazy Time — Md. Tariqul Islam",
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

async function getCrazyTimePosts(): Promise<CrazyTimePost[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("crazy_time")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as CrazyTimePost[];
}

export default async function CrazyTimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("crazyTime");
  const posts = await getCrazyTimePosts();

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-36 sm:px-8">
      <BreadcrumbJsonLd
        items={[homeCrumb(), { name: "Crazy Time", url: `${site.url}/crazy-time` }]}
      />
      <WebPageJsonLd
        name="Crazy Time — Md. Tariqul Islam"
        description={t("sub")}
        url={`${site.url}/crazy-time`}
      />
      <Link
        href="/"
        data-cursor="link"
        className="font-mono text-xs uppercase tracking-[0.25em] text-soft transition-colors hover:text-neon"
      >
        ← {t("back")}
      </Link>

      <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
        {t("heading")}
      </h1>
      <p className="mt-4 max-w-xl text-soft">{t("sub")}</p>

      {posts.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-lg text-soft">{t("noPosts")}</p>
        </div>
      ) : (
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/crazy-time/${post.id}`}
              data-cursor="link"
              className="glass group overflow-hidden rounded-3xl border border-line transition-all duration-300 hover:-translate-y-1 hover:border-neon/40"
            >
              {post.image_url ? (
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-surface">
                  <span aria-hidden className="font-display text-4xl font-bold text-soft/20">CT</span>
                </div>
              )}

              <div className="p-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
                  {post.category}
                </span>
                <h2 className="mt-2 font-display text-lg font-semibold tracking-tight">
                  {post.title}
                </h2>
                {post.file_name && (
                  <p className="mt-2 truncate font-mono text-xs text-soft">
                    {post.file_name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
