"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { verifyResetToken, resetPassword } from "@/app/actions/admin";

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenState, setTokenState] = useState<"loading" | "valid" | "invalid">(
    token ? "loading" : "invalid"
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    verifyResetToken(token).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error || "Invalid reset link");
        setTokenState("invalid");
      } else if (result.email) {
        setEmail(result.email);
        setTokenState("valid");
      } else {
        setError("Invalid reset link");
        setTokenState("invalid");
      }
    });

    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, password);
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error || "Failed to reset password");
    }
  }

  if (tokenState === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-nebula" />
          <p className="mt-4 font-mono text-xs text-soft">
            Verifying reset link...
          </p>
        </div>
      </div>
    );
  }

  if (tokenState === "invalid" || error) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/30 bg-red-400/10">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Invalid Link
          </h1>
          <p className="mt-3 text-sm text-red-400">
            {error || "No reset token provided. Please use the link from your email."}
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-2xl bg-ink px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="glass-strong w-full max-w-sm rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Password Reset
          </h1>
          <p className="mt-3 text-sm text-soft">
            Your password has been updated successfully.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-block rounded-2xl bg-ink px-6 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85"
          >
            Sign In
          </Link>
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
            <span className="gradient-text">Reset Password</span>
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-soft">
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-soft"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-soft"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60"
              placeholder="Repeat your password"
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
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <Link
          href="/admin"
          className="mt-6 block text-center text-sm text-soft transition-colors hover:text-ink"
        >
          ← Back to login
        </Link>
      </div>
    </div>
  );
}
