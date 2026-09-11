"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  deleteCrazyTimePost,
  listCrazyTimePosts,
  saveCrazyTimePost,
  type AdminCrazyTimePost,
} from "@/app/actions/admin";

const CATEGORIES = ["Tech Tips", "Tutorial", "Tools", "Random", "Quick Fix"];

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

function emptyPost(): AdminCrazyTimePost {
  return {
    id: "",
    title: "",
    description: "",
    content: "",
    image_url: "",
    youtube_url: "",
    doc_url: "",
    category: "Tech Tips",
    created_at: new Date().toISOString(),
  };
}

export function CrazyTimeManager() {
  const [posts, setPosts] = useState<AdminCrazyTimePost[] | null>(null);
  const [editing, setEditing] = useState<AdminCrazyTimePost | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const res = await listCrazyTimePosts();
    if (res.ok && res.posts) {
      setPosts(res.posts);
      setError("");
    } else if (!res.ok) {
      setPosts([]);
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    listCrazyTimePosts().then((res) => {
      if (res.ok && res.posts) {
        setPosts(res.posts);
        setError("");
      } else if (!res.ok) {
        setPosts([]);
        setError(res.error);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const res = await saveCrazyTimePost(editing);
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    const res = await deleteCrazyTimePost(id);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  if (posts === null) {
    return <p className="text-soft">Loading…</p>;
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">
            {editing.id ? "Edit Post" : "New Post"}
          </h3>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="font-mono text-xs text-soft hover:text-ink"
          >
            Cancel
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div>
          <label className={labelClass}>Title</label>
          <input
            required
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            className={inputClass}
            placeholder="Post title"
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            value={editing.category}
            onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <input
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className={inputClass}
            placeholder="Short description"
          />
        </div>

        <div>
          <label className={labelClass}>Content</label>
          <textarea
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            className={`${inputClass} min-h-[160px] resize-y`}
            placeholder="Write your post content here..."
          />
        </div>

        <div>
          <label className={labelClass}>Image URL</label>
          <input
            value={editing.image_url}
            onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
            className={inputClass}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className={labelClass}>YouTube URL</label>
          <input
            value={editing.youtube_url}
            onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })}
            className={inputClass}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>

        <div>
          <label className={labelClass}>Document URL</label>
          <input
            value={editing.doc_url}
            onChange={(e) => setEditing({ ...editing, doc_url: e.target.value })}
            className={inputClass}
            placeholder="https://example.com/document.pdf"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-ink py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Post"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">
          Crazy Time Posts ({posts.length})
        </h3>
        <button
          onClick={() => setEditing(emptyPost())}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-bg"
        >
          <Plus size={14} />
          New Post
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {posts.length === 0 ? (
        <p className="py-12 text-center text-soft">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{post.title}</p>
                <p className="mt-1 font-mono text-xs text-soft">
                  {post.category} · {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => setEditing(post)}
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-soft transition-colors hover:text-ink"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="glass flex h-9 w-9 items-center justify-center rounded-full text-soft transition-colors hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
