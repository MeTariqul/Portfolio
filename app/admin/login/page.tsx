import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[400px]">
        <p className="mb-6 text-center text-xl">
          <Link href="/" className="link-underline">
            Tariqul
          </Link>
        </p>
        <div className="rounded-xl border border-line bg-surface p-7">
          <h1 className="text-2xl">Sign in</h1>
          <p className="mt-1 mb-6 text-sm text-soft">
            Admin access only.
          </p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-soft">
          <Link href="/" className="link-underline hover:text-ink">
            Back to site
          </Link>
        </p>
      </div>
    </main>
  );
}
