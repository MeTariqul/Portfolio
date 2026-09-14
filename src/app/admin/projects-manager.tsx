"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { GitHubIcon } from "@/components/brand-icons";
import { FileUpload } from "@/components/file-upload";
import {
  deleteProject,
  getGithubRepos,
  listProjects,
  saveProject,
  type AdminProject,
  type GithubRepo,
} from "@/app/actions/admin";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

function emptyProject(): AdminProject {
  return {
    id: "",
    title: "",
    desc: "",
    tags: [],
    category: "Featured",
    link: "",
    github: "",
    featured: false,
    sort: 0,
    image_url: "",
  };
}

export function ProjectsManager() {
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [reposError, setReposError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const res = await listProjects();
    if (res.ok && res.projects) {
      setProjects(res.projects);
      setError("");
    } else if (!res.ok) {
      setProjects([]);
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    listProjects().then((res) => {
      if (res.ok && res.projects) {
        setProjects(res.projects);
        setError("");
      } else if (!res.ok) {
        setProjects([]);
        setError(res.error);
      }
    });
  }, []);

  async function handleSync() {
    setSyncing(true);
    setReposError("");
    const res = await getGithubRepos();
    setSyncing(false);
    if (res.ok && res.repos) {
      setRepos(res.repos);
    } else if (!res.ok) {
      setReposError(res.error);
    }
  }

  async function handleImport(repo: GithubRepo) {
    setSaving(true);
    const res = await saveProject({
      ...emptyProject(),
      title: repo.name,
      desc: repo.description ?? "",
      tags: repo.language ? [repo.language] : [],
      link: repo.homepage ?? "",
      github: repo.html_url,
      sort: projects?.length ?? 0,
    });
    setSaving(false);
    if (res.ok) {
      setRepos((prev) => (prev ?? []).filter((r) => r.id !== repo.id));
      await refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const res = await saveProject(editing);
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      await refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteProject(id);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
          {projects ? `${projects.length} projects` : "Projects"}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula disabled:opacity-50"
          >
            <GitHubIcon width={16} height={16} />
            {syncing ? "Fetching…" : "Sync from GitHub"}
          </button>
          <button
            onClick={() => {
              setEditing(emptyProject());
            }}
            className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New project
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {reposError && (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {reposError}
        </p>
      )}

      {repos && repos.length > 0 && (
        <div className="mb-8 rounded-3xl border border-nebula/30 bg-nebula/5 p-6">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-nebula">
            GitHub repos — click Import to add as a project
          </p>
          <ul className="space-y-2">
            {repos.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-bg/60 p-4"
              >
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">
                    {r.name}
                    <span className="ml-2 font-mono text-[10px] text-soft">
                      {r.language ?? "—"} · {r.stars}★
                    </span>
                  </p>
                  <p className="mt-1 truncate text-xs text-soft">
                    {r.description ?? r.html_url}
                  </p>
                </div>
                <button
                  onClick={() => handleImport(r)}
                  disabled={saving}
                  className="rounded-xl border border-line bg-surface px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula disabled:opacity-50"
                >
                  Import
                </button>
              </li>
            ))}
          </ul>
        </div>
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
              <label className={labelClass}>Tags (comma-separated)</label>
              <input
                className={inputClass}
                value={editing.tags.join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value.split(","),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={editing.desc}
              onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
            <div>
              <label className={labelClass}>Link</label>
              <input
                className={inputClass}
                value={editing.link}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>GitHub URL</label>
              <input
                className={inputClass}
                value={editing.github}
                onChange={(e) =>
                  setEditing({ ...editing, github: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Sort order</label>
              <input
                type="number"
                className={inputClass}
                value={editing.sort}
                onChange={(e) =>
                  setEditing({ ...editing, sort: Number(e.target.value) })
                }
              />
            </div>
            <label className="flex items-center gap-3 pt-8 text-sm text-soft">
              <input
                type="checkbox"
                checked={editing.featured}
                onChange={(e) =>
                  setEditing({ ...editing, featured: e.target.checked })
                }
              />
              Featured
            </label>
          </div>

          <div>
            <FileUpload
              label="Project Image"
              accept="image/*"
              currentFile=""
              currentUrl={editing.image_url}
              onUpload={(_name, url) => setEditing({ ...editing, image_url: url })}
              onRemove={() => setEditing({ ...editing, image_url: "" })}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing.id ? "Save changes" : "Create project"}
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
      ) : projects === null ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          Loading…
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface py-16 text-center text-soft">
          No projects yet. Add one or import from GitHub.
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5"
            >
              <div className="min-w-0">
                <p className="truncate font-display font-semibold text-ink">
                  {p.title}
                  {p.featured && (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-neon">
                      featured
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-soft">
                  sort {p.sort} · {p.tags.join(", ") || "no tags"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
                >
                  <Edit3 className="h-4 w-4" aria-hidden />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
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