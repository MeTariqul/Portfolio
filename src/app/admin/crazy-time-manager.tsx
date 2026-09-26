"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Edit3, Plus, Trash2, Upload, X } from "lucide-react";
import {
  deleteCrazyTimePost,
  deleteCrazyTimeFile,
  listCrazyTimePosts,
  saveCrazyTimePost,
  uploadCrazyTimeFile,
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
    file_url: "",
    file_name: "",
    youtube_url: "",
    doc_url: "",
    category: "Tech Tips",
    created_at: new Date().toISOString(),
  };
}

function FileUpload({
  label,
  accept,
  currentFile,
  currentUrl,
  onUpload,
  onRemove,
}: {
  label: string;
  accept: string;
  currentFile: string;
  currentUrl: string;
  onUpload: (fileName: string, fileUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Data = base64.split(",")[1];
      const res = await uploadCrazyTimeFile(file.name, base64Data, file.type);
      if (res.ok && res.url) {
        onUpload(file.name, res.url);
      } else {
        setError("Upload failed");
      }
    } catch {
      setError("Upload failed");
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {currentUrl ? (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <span className="min-w-0 flex-1 truncate text-sm text-soft">{currentFile}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove file"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-soft hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-6 text-sm text-soft transition-colors hover:border-neon/40 hover:text-ink disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? "Uploading…" : "Click to upload"}
          </button>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  );
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

  async function handleRemoveImage() {
    if (!editing) return;
    if (editing.image_url) {
      const path = editing.image_url.split("/crazy-time/")[1];
      if (path) await deleteCrazyTimeFile(`crazy-time/${path}`);
    }
    setEditing({ ...editing, image_url: "" });
  }

  async function handleRemoveFile() {
    if (!editing) return;
    if (editing.file_url) {
      const path = editing.file_url.split("/crazy-time/")[1];
      if (path) await deleteCrazyTimeFile(`crazy-time/${path}`);
    }
    setEditing({ ...editing, file_url: "", file_name: "" });
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
          <label className={labelClass}>Photo</label>
          <FileUpload
            label=""
            accept="image/*"
            currentFile=""
            currentUrl={editing.image_url}
            onUpload={(_name, url) => setEditing({ ...editing, image_url: url })}
            onRemove={handleRemoveImage}
          />
        </div>

        <div>
          <label className={labelClass}>File / Document</label>
          <FileUpload
            label=""
            accept=".pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx"
            currentFile={editing.file_name}
            currentUrl={editing.file_url}
            onUpload={(name, url) => setEditing({ ...editing, file_url: url, file_name: name })}
            onRemove={handleRemoveFile}
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
              <div className="flex items-center gap-4">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg font-display text-sm font-bold text-soft/30">
                    CT
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{post.title}</p>
                  <p className="mt-1 font-mono text-xs text-soft">
                    {post.category}
                    {post.file_name && ` · ${post.file_name}`}
                  </p>
                </div>
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
