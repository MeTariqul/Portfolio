"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // failClosed: a sign-in limit that only holds on one instance is no limit
  // at all, and this is the door to the whole dashboard. There is also a
  // second bucket below, per email address, because rotating addresses is
  // the obvious way around a per-network limit.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const allowed = await Promise.all([
    rateLimit(`login:${ip}`, 10, 15 * 60 * 1000, { scope: "global", failClosed: true }),
    email
      ? rateLimit(`login-mail:${email}`, 10, 15 * 60 * 1000, { scope: "global", failClosed: true })
      : Promise.resolve(true),
  ]);
  if (!allowed[0] || !allowed[1]) {
    return {
      error: "Too many attempts. Wait a few minutes and try again.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Wrong email or password." };
    }
    throw error;
  }

  redirect("/admin");
}
