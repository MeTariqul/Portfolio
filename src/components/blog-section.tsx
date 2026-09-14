"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Clock } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Link } from "@/i18n/navigation";
import { posts, type Post } from "@/lib/posts";

export function BlogSection({ posts: propPosts }: { posts?: Post[] }) {
  const t = useTranslations("blog");
  const all = propPosts ?? posts;

  if (!all.length) return null;

  const [featured, ...rest] = all;

  return (
    <section id="blog" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:py-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          number="07"
          label={t("label")}
          title={t("heading")}
          sub={t("sub")}
        />
        <Link
          href="/blog"
          data-cursor="link"
          className="group glass flex items-center gap-2 rounded-full px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-all duration-300 hover:border-neon/40 hover:text-neon"
        >
          {t("viewAll")}
          <ArrowUpRight
            size={14}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2"
        >
          <Link
            href={`/blog/${featured.slug}`}
            data-cursor="link"
            className="group relative block h-full min-h-[320px] overflow-hidden rounded-3xl border border-line"
          >
            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={featured.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                aria-hidden
                className={`absolute inset-0 bg-gradient-to-br ${featured.gradient} opacity-90 transition-transform duration-700 group-hover:scale-105`}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.25),transparent_50%)]"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
            />
            <div className="relative flex h-full flex-col justify-end p-8">
              <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/80">
                <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-md">
                  {featured.category}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={11} />
                  {featured.readTime} {t("readTime")}
                </span>
              </div>
              <h3 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                {featured.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm text-white/80">
                {featured.description}
              </p>
              <span className="mt-6 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white">
                {t("read")}
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </span>
            </div>
            <span className="absolute right-6 top-6 font-display text-7xl font-bold text-white/15">
              01
            </span>
          </Link>
        </motion.div>

        <div className="flex flex-col gap-6">
          {rest.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{
                duration: 0.8,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex-1"
            >
              <Link
                href={`/blog/${post.slug}`}
                data-cursor="link"
                className="group glass relative flex h-full min-h-[150px] flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neon/40"
              >
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${post.gradient}`}
                  />
                )}
                <div className="relative">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon">
                    {post.category} · {post.readTime} {t("readTime")}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold leading-snug">
                    {post.title}
                  </h3>
                </div>
                <span className="relative mt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-soft transition-colors group-hover:text-neon">
                  {t("read")}
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
