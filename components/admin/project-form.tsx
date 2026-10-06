"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveProject,
  type ProjectFormState,
} from "@/app/admin/(dashboard)/projects/actions";

type ProjectLike = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problem: string;
  solutionMD: string;
  learnedMD: string;
  stack: string[];
  category: string;
  screenshots: { url: string; alt: string }[];
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  order: number;
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

export function ProjectForm({ project }: { project?: ProjectLike }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(
    saveProject,
    {},
  );
  const [title, setTitle] = useState(project?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(!!project);
  const [slugValue, setSlugValue] = useState(project?.slug ?? "");
  // Slug follows the title until it is edited by hand.
  const slug = slugEdited
    ? slugValue
    : title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

  return (
    <form action={action} className="space-y-6">
      {project && <input type="hidden" name="id" value={project.id} />}

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
        <Field label="Slug" htmlFor="slug" hint="URL: /projects/your-slug">
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

      <Field label="Summary" htmlFor="summary" hint="One or two sentences.">
        <textarea
          id="summary"
          name="summary"
          required
          maxLength={500}
          rows={2}
          defaultValue={project?.summary}
          className={input}
        />
      </Field>

      <Field label="The problem" htmlFor="problem">
        <textarea
          id="problem"
          name="problem"
          required
          rows={3}
          defaultValue={project?.problem}
          className={input}
        />
      </Field>

      <Field
        label="What I built (Markdown)"
        htmlFor="solutionMD"
        hint="## for headings, ``` for code blocks."
      >
        <textarea
          id="solutionMD"
          name="solutionMD"
          required
          rows={8}
          defaultValue={project?.solutionMD}
          className={`${input} font-mono text-[0.85rem] leading-relaxed`}
          spellCheck={false}
        />
      </Field>

      <Field label="What I learned (Markdown)" htmlFor="learnedMD">
        <textarea
          id="learnedMD"
          name="learnedMD"
          required
          rows={6}
          defaultValue={project?.learnedMD}
          className={`${input} font-mono text-[0.85rem] leading-relaxed`}
          spellCheck={false}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Category" htmlFor="category">
          <input
            id="category"
            name="category"
            required
            maxLength={100}
            defaultValue={project?.category}
            className={input}
          />
        </Field>
        <Field label="Stack (comma separated)" htmlFor="stack">
          <input
            id="stack"
            name="stack"
            defaultValue={project?.stack.join(", ")}
            className={input}
          />
        </Field>
        <Field label="Sort order" htmlFor="order" hint="Lower shows first.">
          <input
            id="order"
            name="order"
            type="number"
            min={0}
            max={999}
            defaultValue={project?.order ?? 0}
            className={input}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Live URL" htmlFor="liveUrl">
          <input
            id="liveUrl"
            name="liveUrl"
            type="url"
            placeholder="https://…"
            defaultValue={project?.liveUrl ?? ""}
            className={input}
          />
        </Field>
        <Field label="GitHub URL" htmlFor="githubUrl">
          <input
            id="githubUrl"
            name="githubUrl"
            type="url"
            placeholder="https://github.com/…"
            defaultValue={project?.githubUrl ?? ""}
            className={input}
          />
        </Field>
      </div>

      <Field
        label="Screenshots (optional)"
        htmlFor="screenshots"
        hint='One per line: https://url/image.png | Alt text describing what it shows'
      >
        <textarea
          id="screenshots"
          name="screenshots"
          rows={4}
          defaultValue={(project?.screenshots ?? [])
            .map((s) => `${s.url} | ${s.alt}`)
            .join("\n")}
          className={`${input} font-mono text-[0.85rem]`}
          spellCheck={false}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={project?.featured}
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
          {pending ? "Saving…" : project ? "Save changes" : "Create project"}
        </button>
        <Link
          href="/admin/projects"
          prefetch={false}
          className="link-underline text-sm text-soft hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
