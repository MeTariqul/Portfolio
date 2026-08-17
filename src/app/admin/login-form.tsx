"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ error: presetError }: { error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(presetError ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="glass-strong w-full max-w-sm rounded-3xl p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface">
            <Lock className="h-5 w-5 text-nebula" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            <span className="gradient-text">Admin</span>
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-soft">
            Restricted area
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-soft"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-soft"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink px-6 py-4 font-mono text-sm font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link
          href="/en"
          className="mt-6 block text-center text-sm text-soft transition-colors hover:text-ink"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}