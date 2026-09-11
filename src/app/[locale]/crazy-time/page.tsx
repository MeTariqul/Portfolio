import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

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
    robots: { index: false, follow: false },
  };
}

type CrazyTimePost = {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
  return match?.[1] ?? null;
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
        <div className="mt-16 space-y-12">
          {posts.map((post) => (
            <article
              key={post.id}
              className="glass overflow-hidden rounded-3xl border border-line"
            >
              {post.image_url && (
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {post.youtube_url && extractYouTubeId(post.youtube_url) && (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(post.youtube_url)}`}
                    title={post.title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gradient-to-r from-nebula to-neon bg-clip-text font-mono text-xs font-bold uppercase tracking-widest text-transparent">
                    {post.category}
                  </span>
                  <span className="font-mono text-xs text-soft">
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {post.title}
                </h2>
                <p className="mt-3 text-soft">{post.description}</p>

                {post.content && (
                  <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-soft sm:text-base">
                    {post.content}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  {post.doc_url && (
                    <a
                      href={post.doc_url}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="link"
                      className="glass flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-soft transition-colors hover:border-neon/40 hover:text-ink"
                    >
                      {t("viewDoc")} →
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
