"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  LogOut,
  Mail,
  Reply,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteMessage,
  generateReply,
  listMessages,
  markMessageRead,
  sendReply,
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

function ReplyModal({
  message,
  onClose,
  onSent,
}: {
  message: AdminMessage;
  onClose: () => void;
  onSent: () => void;
}) {
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    const res = await generateReply(message.name, message.message);
    setLoading(false);
    if (res.ok && res.reply) {
      setReply(res.reply);
    } else if (!res.ok) {
      setError(res.error);
    }
  }

  async function handleSend() {
    if (!reply.trim()) return;
    setLoading(true);
    setError("");
    const res = await sendReply(message.id, reply);
    setLoading(false);
    if (res.ok) {
      setSent(true);
      setTimeout(() => {
        onSent();
        onClose();
      }, 1200);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-bg p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              Reply to {message.name}
            </p>
            <p className="font-mono text-xs text-soft">{message.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-soft transition-colors hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-line bg-surface p-4">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-soft">
            Their message
          </p>
          <p className="whitespace-pre-wrap text-sm text-ink/80">
            {message.message}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {sent ? (
          <div className="grid place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 py-8">
            <Check className="mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm text-emerald-400">Reply sent!</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl border border-nebula/30 bg-nebula/10 px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-nebula transition-colors hover:bg-nebula/20 disabled:opacity-50"
              >
                <Sparkles size={14} />
                {loading ? "Generating…" : "AI Generate"}
              </button>
            </div>

            <textarea
              className="mb-4 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
              rows={6}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write your reply or click AI Generate..."
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-2xl border border-line bg-surface px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !reply.trim()}
                className="flex items-center gap-2 rounded-2xl bg-ink px-6 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                <Send size={14} />
                {loading ? "Sending…" : "Send reply"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard({ email }: { email: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("messages");
  const [messages, setMessages] = useState<AdminMessage[] | null>(null);
  const [error, setError] = useState("");
  const [replyTo, setReplyTo] = useState<AdminMessage | null>(null);

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
                  {m.replied && (
                    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                      Replied
                    </span>
                  )}
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
                  onClick={() => setReplyTo(m)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:border-nebula/50 hover:text-nebula"
                >
                  <Reply className="h-4 w-4" aria-hidden />
                  Reply
                </button>
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

      {replyTo && (
        <ReplyModal
          message={replyTo}
          onClose={() => setReplyTo(null)}
          onSent={refresh}
        />
      )}
    </div>
  );
}
