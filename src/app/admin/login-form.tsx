"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/app/actions/admin";

export function LoginForm({ error: presetError }: { error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(presetError ?? "");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

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

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    const result = await requestPasswordReset(forgotEmail);
    setForgotLoading(false);

    if (result.ok) {
      setForgotSuccess(true);
    } else {
      setForgotError(result.error || "Failed to send reset email");
    }
  }

  if (showForgot) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface">
              <Mail className="h-5 w-5 text-nebula" aria-hidden />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              <span className="gradient-text">Reset Password</span>
            </h1>
            <p className="mt-2 text-sm text-soft">
              Enter your recovery email to receive a reset link.
            </p>
          </div>

          {forgotSuccess ? (
            <div className="text-center">
              <p className="text-sm text-soft">
                If <span className="text-ink">{forgotEmail}</span> is a
                registered recovery email, you&apos;ll receive a reset link
                shortly.
              </p>
              <p className="mt-3 text-xs text-soft/60">
                Check your inbox and spam folder. The link expires in 1 hour.
              </p>
              <button
                onClick={() => {
                  setShowForgot(false);
                  setForgotSuccess(false);
                  setForgotEmail("");
                }}
                className="mt-6 w-full rounded-2xl bg-ink px-6 py-4 font-mono text-sm font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block font-mono text-xs uppercase tracking-widest text-soft"
                >
                  Recovery Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
                  placeholder="you@example.com"
                />
              </div>

              {forgotError && (
                <p className="text-sm text-red-400" role="alert">
                  {forgotError}
                </p>
              )}

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-2xl bg-ink px-6 py-4 font-mono text-sm font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {forgotLoading ? "Sending…" : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotError("");
                }}
                className="flex w-full items-center justify-center gap-2 text-sm text-soft transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} />
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    );
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setForgotEmail(email);
              }}
              className="font-mono text-xs text-neon/80 transition-colors hover:text-neon"
            >
              Forgot password?
            </button>
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
