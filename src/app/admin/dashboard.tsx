"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut, Mail, Trash2 } from "lucide-react";
import {
  deleteMessage,
  listMessages,
  markMessageRead,
  signOut,
  type AdminMessage,
} from "@/app/actions/admin";
import { BlogManager } from "./blog-manager";
import { ProjectsManager } from "./projects-manager";
import { SettingsManager } from "./settings-manager";
import { SectionsManager } from "./sections-manager";

type Tab = "messages" | "blog" | "projects" | "sections" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "messages", label: "Messages" },
  { id: "blog", label: "Blog" },
  { id: "projects", label: "Projects" },
  { id: "sections", label: "Sections" },
  { id: "settings", label: "Settings" },
];

export function AdminDashboard({ email }: { email: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("messages");
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await listMessages();
    if (res.ok && res.messages) {
      setMessages(res.messages);
      setError("");
    } else if (!res.ok) {
      setError(res.error);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    listMessages().then((res) => {
      if (!alive) return;
      if (res.ok && res.messages) {
        setMessages(res.messages);
        setError("");
      } else if (!res.ok) {
        setError(res.error);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  async function toggleRead(id: string, read: boolean) {
    const res = await markMessageRead(id, !read);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  async function remove(id: string) {
    const res = await deleteMessage(id);
    if (res.ok) await refresh();
    else setError(res.error);
  }

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  const unread = messages?.filter((m) => !m.read).length ?? 0;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-3xl px-6 py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            <span className="gradient-text">
              {TABS.find((t) => t.id === tab)?.label}
            </span>
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-soft">
            {unread} unread · signed in as {email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-red-400/40 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-2xl px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest transition-colors ${
              tab === t.id
                ? "bg-ink text-bg"
                : "border border-line bg-surface text-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {tab === "blog" && <BlogManager />}
      {tab === "projects" && <ProjectsManager />}
      {tab === "sections" && <SectionsManager />}
      {tab === "settings" && <SettingsManager />}

      {tab === "messages" &&
        (messages === null ? (
          <div className="grid place-items-center rounded-3xl border border-line bg-surface py-20 text-soft">
            Loading…
          </div>
        ) : messages.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-line bg-surface py-20 text-center">
          <Mail className="mb-4 h-8 w-8 text-soft/50" aria-hidden />
          <p className="text-soft">No messages yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-3xl border border-line bg-surface p-6 transition-colors ${
                m.read ? "opacity-60" : ""
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {!m.read && (
                    <span className="h-2 w-2 rounded-full bg-nebula" aria-hidden />
                  )}
                  <span className="font-display font-semibold text-ink">
                    {m.name}
                  </span>
                  <a
                    href={`mailto:${m.email}`}
                    className="font-mono text-xs text-nebula transition-opacity hover:opacity-80"
                  >
                    {m.email}
                  </a>
                </div>
                <time
                  dateTime={m.created_at}
                  className="font-mono text-xs text-soft"
                >
                  {new Date(m.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-soft">
                {m.message}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => toggleRead(m.id, m.read)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {m.read ? "Mark unread" : "Mark read"}
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}