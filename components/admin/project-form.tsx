"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { classifyUpload, UPLOAD_LIMITS } from "@/lib/uploads";
import {
  saveProject,
  requestProjectDownload,
  discardProjectDownload,
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
  downloadUrl?: string | null;
  downloadFilename?: string | null;
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
  // The download is one pair of values: paste a link, or upload a file, which
  // fills the same URL field. Kept in state rather than as a live input so an
  // upload can set both halves at once.
  const [downloadUrl, setDownloadUrl] = useState(project?.downloadUrl ?? "");
  const [downloadFilename, setDownloadFilename] = useState(
    project?.downloadFilename ?? "",
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  // Slug follows the title until it is edited by hand.
  const slug = slugEdited
    ? slugValue
    : title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

  // Uploads the picked file straight to storage, then points the form at it.
  async function handleDownloadPick(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    setDownloadError("");

    // Same rule the server enforces — failing here just saves a round trip.
    if (classifyUpload(file.type, file.name) !== "FILE") {
      setDownloadError(
        "Upload an archive or document: zip, pdf, Office or text files.",
      );
      inputEl.value = "";
      return;
    }
    if (file.size > UPLOAD_LIMITS.FILE) {
      setDownloadError(
        `Files must be under ${Math.round(UPLOAD_LIMITS.FILE / (1024 * 1024))} MB.`,
      );
      inputEl.value = "";
      return;
    }

    setDownloading(true);
    try {
      const signed = await requestProjectDownload(
        file.name,
        file.type,
        file.size,
      );
      if (!signed.uploadUrl || !signed.publicUrl) {
        setDownloadError(signed.error ?? "Upload failed.");
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": file.type || "application/octet-stream",
      };
      // Supabase rejects a signed PUT carrying only one of these headers.
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (anon) {
        headers.Authorization = `Bearer ${anon}`;
        headers.apikey = anon;
      }
      const res = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers,
        body: file,
      });
      if (!res.ok) {
        setDownloadError(`Upload failed (storage returned ${res.status}).`);
        return;
      }
      setDownloadUrl(signed.publicUrl);
      setDownloadFilename(file.name);
    } catch {
      setDownloadError("Upload failed. Check your connection and try again.");
    } finally {
      setDownloading(false);
      inputEl.value = "";
    }
  }

  // Clears the field. Only a file uploaded during this edit is deleted right
  // away; the one already saved is left for saveProject to retire, so
  // pressing Remove and then Cancel cannot break a live Download button.
  function removeDownload() {
    const current = downloadUrl;
    setDownloadUrl("");
    setDownloadFilename("");
    setDownloadError("");
    if (current && current !== (project?.downloadUrl ?? "")) {
      void discardProjectDownload(current).catch(() => {});
    }
  }

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

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Download file (optional)"
          htmlFor="downloadFile"
          hint="Adds a Download button to the project page. Archives and documents up to 20 MB — zip your build, not the executable itself."
        >
          <input
            id="downloadFile"
            type="file"
            accept=".zip,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
            onChange={handleDownloadPick}
            disabled={downloading}
            className="block w-full text-sm text-soft file:mr-3 file:rounded-full file:border file:border-line file:bg-surface file:px-4 file:py-2 file:text-sm file:text-ink hover:file:border-accent/50"
          />
        </Field>
        <Field
          label="…or paste a download link"
          htmlFor="downloadUrl"
          hint="A GitHub release or any direct file URL."
        >
          <input
            id="downloadUrl"
            name="downloadUrl"
            type="url"
            placeholder="https://…"
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            className={input}
          />
        </Field>
      </div>

      <input type="hidden" name="downloadFilename" value={downloadFilename} />

      {(downloading || downloadError || (downloadUrl && downloadFilename)) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {downloading && <span className="text-soft">Uploading…</span>}
          {downloadError && (
            <span role="alert" className="text-accent">
              {downloadError}
            </span>
          )}
          {!downloading && downloadFilename && (
            <>
              <span className="text-soft">{downloadFilename}</span>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="link-underline text-soft hover:text-ink"
              >
                Test
              </a>
              <button
                type="button"
                onClick={removeDownload}
                className="link-underline text-accent"
              >
                Remove
              </button>
            </>
          )}
        </div>
      )}

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
