"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  deleteBlog,
  listBlogs,
  saveBlog,
  type AdminBlog,
} from "@/app/actions/admin";

const GRADIENTS = [
  "from-violet-600 via-fuchsia-500 to-cyan-400",
  "from-cyan-400 via-blue-500 to-violet-600",
  "from-fuchsia-500 via-rose-500 to-amber-400",
  "from-emerald-500 via-teal-500 to-cyan-400",
];

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

function emptyBlog(): AdminBlog {
  return {
    id: "",
    slug: "",
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    read_time: 5,
    category: "Engineering",
    featured: false,
    gradient: GRADIENTS[0],
    blocks: [{ type: "p", text: "" }],
    published: true,
  };
}

export function BlogManager() {
  const [blogs, setBlogs] = useState<AdminBlog[] | null>(null);
  const [editing, setEditing] = useState<AdminBlog | null>(null);
  const [blocksText, setBlocksText] = useState("");
  const [blocksError, setBlocksError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await listBlogs();
    if (res.ok && res.blogs) {
      setBlogs(res.blogs);
      setError("");
    } else if (!res.ok) {
      setBlogs([]);
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    listBlogs().then((res) => {
      if (res.ok && res.blogs) {
        setBlogs(res.blogs);
        setError("");
      } else if (!res.ok) {
        setBlogs([]);
        setError(res.error);
      }
    });
  }, []);

  function startEdit(blog: AdminBlog | null) {
    const b = blog ?? emptyBlog();
    setEditing(b);
    setBlocksText(JSON.stringify(b.blocks, null, 2));
    setBlocksError("");
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;

    let blocks: unknown[];
    try {
      const parsed = JSON.parse(blocksText);
      if (!Array.isArray(parsed)) throw new Error("must be an array");
      blocks = parsed;
    } catch (err) {
      setBlocksError("Invalid JSON — " + (err as Error).message);
      return;
    }

    setSaving(true);
    const res = await saveBlog({ ...editing, blocks });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteBlog(id);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
          {blogs ? `${blogs.length} posts` : "Blog posts"}
        </p>
        <button
          onClick={() => startEdit(null)}
          className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New post
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-3xl border border-line bg-surface p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input
                className={inputClass}
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                className={inputClass}
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Read time (min)</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={editing.read_time}
                onChange={(e) =>
                  setEditing({ ...editing, read_time: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input
                className={inputClass}
                value={editing.category}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Gradient</label>
              <select
                className={inputClass}
                value={editing.gradient}
                onChange={(e) =>
                  setEditing({ ...editing, gradient: e.target.value })
                }
              >
                {GRADIENTS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 pt-8 text-sm text-soft">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) =>
                  setEditing({ ...editing, featured: e.target.checked })
                }
              />
              Featured (top card)
            </label>
            <label className="flex items-center gap-3 pt-8 text-sm text-soft">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) =>
                  setEditing({ ...editing, published: e.target.checked })
                }
              />
              Published
            </label>
          </div>

          <div>
            <label className={labelClass}>
              Blocks (JSON: p / h2 / list / code)
            </label>
            <textarea
              className={`${inputClass} resize-none font-mono text-xs`}
              rows={10}
              value={blocksText}
              onChange={(e) => {
                setBlocksText(e.target.value);
                setBlocksError("");
              }}
            />
            {blocksError && (
              <p className="mt-2 text-xs text-red-400">{blocksError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing.id ? "Save changes" : "Create post"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-2xl border border-line px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : blogs === null ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          Loading…
        </div>
      ) : blogs.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          No posts yet. Create your first one.
        </div>
      ) : (
        <ul className="space-y-3">
          {blogs.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-ink">
                  {b.title}
                  {!b.published && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-soft">
                      draft
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-soft">
                  /blog/{b.slug} · {b.date} · {b.read_time} min
                  {b.featured ? " · featured" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(b)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
                >
                  <Edit3 className="h-4 w-4" aria-hidden />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}