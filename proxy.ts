import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Protects /admin: unauthenticated visitors are redirected to /admin/login
// (see the `authorized` callback in lib/auth.config.ts). Runs on the edge,
// so the config here must stay free of database/Node-only imports.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
