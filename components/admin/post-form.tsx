"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import Link from "next/link";
import {
  savePost,
  autosavePost,
  requestPostUpload,
  discardPostUpload,
  discardSavedAttachment,
  type PostFormState,
} from "@/app/admin/(dashboard)/posts/actions";
import {
  classifyUpload,
  fileExtension,
  formatBytes,
  UPLOAD_LIMITS,
  type AttachmentKind,
} from "@/lib/uploads";

type AttachmentItem = {
  id?: string;
  url: string;
  filename: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
};

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
  attachments?: AttachmentItem[];
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

// Stable signature of the form so autosave only fires when something
// actually changed.
function serializeForm(fd: FormData): string {
  const parts: string[] = [];
  fd.forEach((value, key) => {
    parts.push(`${key}=${typeof value === "string" ? value : "file"}`);
  });
  return parts.join("\u0000");
}

async function imageDims(
  file: File,
): Promise<{ width: number; height: number } | null> {
  try {
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () =>
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

type ToolOpts = { wrap?: [string, string]; linePrefix?: string; placeholder?: string };

const TOOLS: { label: string; title: string; opts: ToolOpts }[] = [
  { label: "H2", title: "Heading", opts: { linePrefix: "## " } },
  { label: "B", title: "Bold", opts: { wrap: ["**", "**"], placeholder: "bold text" } },
  { label: "I", title: "Italic", opts: { wrap: ["_", "_"], placeholder: "italic text" } },
  {
    label: "Link",
    title: "Link",
    opts: { wrap: ["[", "](https://)"], placeholder: "link text" },
  },
  { label: "</>", title: "Inline code", opts: { wrap: ["`", "`"], placeholder: "code" } },
  { label: "Quote", title: "Quote", opts: { linePrefix: "> " } },
  { label: "List", title: "List item", opts: { linePrefix: "- " } },
];

export function PostForm({ post }: { post?: PostLike }) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(
    savePost,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [postId, setPostId] = useState<string | undefined>(post?.id);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(
    post?.attachments ?? [],
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

  // Autosave bookkeeping: `rev` bumps on every edit; the effect below
  // debounces that into one server call every couple of seconds.
  const [rev, setRev] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved">(
    "idle",
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const sigRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  // Once the Save button is pressed the autosave backs off for good; the
  // manual save owns the form from that point on.
  const submittedRef = useRef(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const bump = () => {
    setRev((r) => r + 1);
    setSaveState("dirty");
  };

  useEffect(() => {
    if (rev === 0) return;
    const form = formRef.current;
    if (!form) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || submittedRef.current) return;
      if (busyRef.current) {
        // A save is still in flight — re-arm the debounce so the newest
        // keystrokes are picked up right after it finishes.
        setRev((r) => r + 1);
        return;
      }
      const fd = new FormData(form);
      const sig = serializeForm(fd);
      if (sig === sigRef.current) return;
      sigRef.current = sig;
      busyRef.current = true;
      setSaveState("saving");
      setAutosaveError(null);
      try {
        const res = await autosavePost(fd);
        if (cancelled) return;
        if (res.ok) {
          setSaveState("saved");
          setSavedAt(res.savedAt ?? null);
          if (res.id) setPostId(res.id);
          if (res.attachments) {
            // Remember the row ids the server just wrote so the next save
            // keeps these files instead of re-creating them.
            const known = res.attachments;
            setAttachments((prev) =>
              prev.map((item) => {
                if (item.id) return item;
                const match = known.find((s) => s.url === item.url);
                return match ? { ...item, id: match.id } : item;
              }),
            );
          }
        } else if (res.incomplete) {
          setSaveState("dirty");
        } else {
          setSaveState("dirty");
          setAutosaveError(res.error ?? "Autosave failed. Press Save.");
        }
      } catch {
        if (!cancelled) {
          setSaveState("dirty");
          setAutosaveError("Autosave failed. Press Save to keep your work.");
        }
      } finally {
        busyRef.current = false;
      }
    }, 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rev]);

  // Warn before closing the tab while edits are not saved yet.
  useEffect(() => {
    if (saveState !== "dirty") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveState]);

  function applyTool(opts: ToolOpts) {
    const el = contentRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);

    if (opts.linePrefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      el.value = value.slice(0, lineStart) + opts.linePrefix + value.slice(lineStart);
      const caret = start + opts.linePrefix.length;
      el.focus();
      el.setSelectionRange(caret, caret + selected.length);
    } else if (opts.wrap) {
      const [pre, post] = opts.wrap;
      const content = selected || opts.placeholder || "";
      el.value = value.slice(0, start) + pre + content + post + value.slice(end);
      el.focus();
      el.setSelectionRange(start + pre.length, start + pre.length + content.length);
    }
    bump();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    if (!file) return;
    setUploadError(null);

    const kind = classifyUpload(file.type, file.name);
    if (!kind) {
      setUploadError("Unsupported type. Photos, videos, PDF, Office, text and zip files only.");
      inputEl.value = "";
      return;
    }
    if (file.size > UPLOAD_LIMITS[kind]) {
      setUploadError(
        `Too big: the limit is ${Math.round(UPLOAD_LIMITS[kind] / (1024 * 1024))} MB for ${kind === "IMAGE" ? "photos" : kind === "VIDEO" ? "videos" : "files"}.`,
      );
      inputEl.value = "";
      return;
    }
    if (attachments.length >= 12) {
      setUploadError("12 files per post is the maximum.");
      inputEl.value = "";
      return;
    }

    setUploading(true);
    try {
      const signed = await requestPostUpload(file.name, file.type, file.size);
      if (!signed.uploadUrl || !signed.publicUrl) {
        setUploadError(signed.error ?? "Upload failed.");
        return;
      }
      const headers: Record<string, string> = {
        "Content-Type": file.type || "application/octet-stream",
      };
      // Same header pair supabase-js sends; storage rejects requests that
      // carry only one of them.
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
        setUploadError(`Upload failed (storage returned ${res.status}).`);
        return;
      }
      const dims = kind === "IMAGE" ? await imageDims(file) : null;
      setAttachments((prev) => [
        ...prev,
        {
          url: signed.publicUrl as string,
          filename: file.name,
          kind,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
        },
      ]);
      // Autosave picks the new file up without a manual save.
      bump();
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      inputEl.value = "";
    }
  }

  function removeAttachment(item: AttachmentItem) {
    setAttachments((prev) => prev.filter((x) => x.url !== item.url));
    if (item.id) {
      // Saved already: drop the row and its storage file right away.
      void discardSavedAttachment(item.id, post?.slug ?? "").catch(() => {});
    } else {
      // Uploaded but never saved: delete the file so it does not linger.
      void discardPostUpload(item.url).catch(() => {});
    }
    bump();
  }

  const statusText = autosaveError ? (
    <span className="text-accent">{autosaveError}</span>
  ) : saveState === "saving" ? (
    "Saving…"
  ) : saveState === "saved" && savedAt ? (
    `Saved ${savedAt}`
  ) : saveState === "dirty" ? (
    "Unsaved changes"
  ) : (
    ""
  );

  return (
    <form
      ref={formRef}
      action={action}
      onInput={bump}
      onSubmit={() => {
        submittedRef.current = true;
      }}
      className="space-y-6"
    >
      <input type="hidden" name="id" value={postId ?? ""} />
      <input type="hidden" name="attachments" value={JSON.stringify(attachments)} />

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

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor="contentMD" className="block text-sm text-soft">
            Content (Markdown)
          </label>
          <span className="text-xs text-soft">## for headings, ``` for code blocks.</span>
        </div>
        <div className="flex flex-wrap gap-1 border border-line bg-surface px-2 py-1.5">
          {TOOLS.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              onClick={() => applyTool(tool.opts)}
              className="h-7 rounded px-2 text-xs text-soft transition-colors hover:bg-line/50 hover:text-ink"
            >
              {tool.label}
            </button>
          ))}
        </div>
        <textarea
          id="contentMD"
          name="contentMD"
          ref={contentRef}
          required
          rows={20}
          defaultValue={post?.contentMD}
          className={`${input} mt-2 rounded-t-none font-mono text-[0.85rem] leading-relaxed`}
          spellCheck={false}
        />
      </div>

      <section aria-labelledby="files-heading" className="border-t border-line pt-6">
        <h2 id="files-heading" className="text-lg">
          Files
        </h2>
        <p className="mt-1 mb-4 text-sm text-soft">
          Photos show on the post page. Videos and documents show as a button
          that opens them. Photos 8 MB, videos 30 MB, other files 20 MB.
        </p>

        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.id ?? a.url}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
              >
                <span className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-soft">
                  {fileExtension(a.filename).slice(0, 5) || a.kind.toLowerCase()}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm" title={a.filename}>
                  {a.filename}
                </span>
                <span className="shrink-0 text-xs text-soft">
                  {formatBytes(a.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a)}
                  className="shrink-0 text-xs text-soft transition-colors hover:text-accent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <label htmlFor="file" className="mb-1.5 block text-sm text-soft">
            Add a file
          </label>
          <input
            id="file"
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv,.md"
            disabled={uploading || attachments.length >= 12}
            onChange={handleFile}
            className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-contrast disabled:opacity-60"
          />
          {uploading && (
            <p className="mt-2 text-xs text-soft" role="status">
              Uploading…
            </p>
          )}
          {uploadError && (
            <p role="alert" className="mt-2 text-xs text-accent">
              {uploadError}
            </p>
          )}
        </div>
      </section>

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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </button>
        <span className="text-xs text-soft" aria-live="polite">
          {statusText}
        </span>
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
