import Link from "next/link";
import type { Post } from "@/lib/content";
import { formatDate, readingTime } from "@/lib/markdown";
import { Tag } from "@/components/ui/tag";

// A blog list row: date, title, excerpt, reading time. Calm hairline rows
// instead of identical cards.
export function PostRow({ post }: { post: Post }) {
  return (
    <article className="border-t border-line py-7">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-soft">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden>·</span>
        <span>{readingTime(post.contentMD)} min read</span>
        {post.category && (
          <>
            <span aria-hidden>·</span>
            <span>{post.category}</span>
          </>
        )}
      </div>
      <h3 className="mt-2 text-2xl">
        <Link
          href={`/blog/${post.slug}`}
          prefetch={false}
          className="link-underline hover:text-accent"
        >
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 max-w-[680px] text-soft">{post.excerpt}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
    </article>
  );
}
