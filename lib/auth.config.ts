import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config: no database, no Node APIs. Used by proxy.ts so
// /admin requests are checked before any page renders. The full config
// (with the credentials provider) lives in lib/auth.ts.
export const authConfig = {
  // Accept whatever host the request comes from (localhost, 127.0.0.1,
  // the Vercel domain). Session cookies are only issued with a valid
  // AUTH_SECRET signature either way.
  trustHost: true,
  // Empty here on purpose: this config only validates session cookies.
  // The real provider lives in lib/auth.ts.
  providers: [],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 3, // admin sessions expire after 3 days
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      // The proxy runs on every page now, not only /admin. Public pages
      // always pass; only the admin area is gated below.
      if (!pathname.startsWith("/admin")) return true;

      // The login page decides for itself. It reads the session in Node,
      // where the two-device cap is enforced; the edge only checks the
      // cookie signature and cannot tell a revoked session apart, so
      // redirecting from here would bounce a signed-out device between
      // /admin and /admin/login forever.
      if (pathname === "/admin/login") return true;

      // Any other /admin route requires a session; otherwise Auth.js
      // redirects to the signIn page (/admin/login).
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
