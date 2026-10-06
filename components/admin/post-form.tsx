"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { savePost, type PostFormState } from "@/app/admin/(dashboard)/posts/actions";

type PostLike = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentMD: string;
  coverImage: string | null;
  coverAlt: string | null;
  category: string | null;
  tags: string[];
  status: string;
  publishedAt: string | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

const input =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm placeholder:text-soft focus:border-accent focus:outline-none";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-soft">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-soft">{hint}</p>}
    </div>
  );
}

export function PostForm({ post }: { post?: PostLike }) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(
    savePost,
    {},
  );
  const [title, setTitle] = useState(post?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(!!post);
  const [slugValue, setSlugValue] = useState(post?.slug ?? "");
  // Slug follows the title until it is edited by hand.
  const slug = slugEdited
    ? slugValue
    : title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

  return (
    <form action={action} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={input}
          />
        </Field>
        <Field
          label="Slug"
          htmlFor="slug"
          hint="URL: /blog/your-slug"
        >
          <input
            id="slug"
            name="slug"
            required
            maxLength={200}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlugValue(e.target.value);
            }}
            className={input}
          />
        </Field>
      </div>

      <Field label="Excerpt" htmlFor="excerpt" hint="One or two sentences, shown in lists and search results.">
        <textarea
          id="excerpt"
          name="excerpt"
          required
          maxLength={500}
          rows={2}
          defaultValue={post?.excerpt}
          className={input}
        />
      </Field>

      <Field
        label="Content (Markdown)"
        htmlFor="contentMD"
        hint="## for headings, ``` for code blocks."
      >
        <textarea
          id="contentMD"
          name="contentMD"
          required
          rows={20}
          defaultValue={post?.contentMD}
          className={`${input} font-mono text-[0.85rem] leading-relaxed`}
          spellCheck={false}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Category" htmlFor="category">
          <input
            id="category"
            name="category"
            maxLength={100}
            defaultValue={post?.category ?? ""}
            className={input}
          />
        </Field>
        <Field label="Tags (comma separated)" htmlFor="tags">
          <input
            id="tags"
            name="tags"
            defaultValue={post?.tags.join(", ") ?? ""}
            className={input}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <select
            id="status"
            name="status"
            defaultValue={post?.status ?? "DRAFT"}
            className={input}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Publish date" htmlFor="publishedAt" hint="Used when status is Published.">
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={
              post?.publishedAt ? post.publishedAt.slice(0, 10) : ""
            }
            className={input}
          />
        </Field>
        <Field label="Cover image URL (optional)" htmlFor="coverImage">
          <input
            id="coverImage"
            name="coverImage"
            type="url"
            placeholder="https://…"
            defaultValue={post?.coverImage ?? ""}
            className={input}
          />
        </Field>
        <Field label="Cover alt text" htmlFor="coverAlt">
          <input
            id="coverAlt"
            name="coverAlt"
            maxLength={300}
            defaultValue={post?.coverAlt ?? ""}
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="SEO title (optional)" htmlFor="seoTitle">
          <input
            id="seoTitle"
            name="seoTitle"
            maxLength={200}
            defaultValue={post?.seoTitle ?? ""}
            className={input}
          />
        </Field>
        <Field label="SEO description (optional)" htmlFor="seoDescription">
          <input
            id="seoDescription"
            name="seoDescription"
            maxLength={300}
            defaultValue={post?.seoDescription ?? ""}
            className={input}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={post?.featured}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Featured (shown on the home page)
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <Link
          href="/admin/posts"
          prefetch={false}
          className="link-underline text-sm text-soft hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
