import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "@/lib/auth.config";

// How many devices may be signed into /admin at the same time. A third
// sign-in deletes the oldest AdminSession row, and that device is signed
// out on its next request because the row it points at is gone.
const MAX_SESSIONS = 2;

// Called on a successful sign-in: records the new device, then keeps only
// this one plus the most recent of the others. The device that logged in
// first is the one that loses its row.
async function registerSession(userId: string): Promise<string> {
  const row = await prisma.adminSession.create({ data: { userId } });

  const others = await prisma.adminSession.findMany({
    where: { userId, id: { not: row.id } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_SESSIONS - 1,
    select: { id: true },
  });
  await prisma.adminSession.deleteMany({
    where: { userId, id: { notIn: [row.id, ...others.map((o) => o.id)] } },
  });

  return row.id;
}

// Full Auth.js config (Node runtime only; never imported by proxy.ts).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !verifyPassword(password, user.passwordHash)) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Runs on every session read in Node (layouts, server actions,
    // /api/auth/session) — never on the edge, where proxy.ts uses
    // authConfig instead and therefore never touches the database.
    async jwt({ token, user }) {
      // A sign-in registers this device and applies the cap above.
      // Auth.js fills in a string id before this runs (see the credentials
      // path in @auth/core), so the check is only there for TypeScript.
      if (user?.id) {
        token.sid = await registerSession(user.id);
        return token;
      }

      // Every later read has to find the row, otherwise this device was
      // kicked out by a newer sign-in or signed out elsewhere, and the
      // cookie is turned off (Auth.js clears it when this returns null).
      const sid = typeof token.sid === "string" ? token.sid : null;
      if (!sid) return null;
      const row = await prisma.adminSession.findUnique({
        where: { id: sid },
        select: { id: true },
      });
      return row ? token : null;
    },
  },
  events: {
    // Signing out frees the slot immediately instead of leaving the row
    // for the next sign-in to prune. Auth.js passes either a token (the
    // JWT strategy we use) or an adapter session, hence the narrowing.
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const sid = token && typeof token.sid === "string" ? token.sid : null;
      if (sid) await prisma.adminSession.deleteMany({ where: { id: sid } });
    },
  },
});

// Guard for server actions: without a live session this device has been
// signed out somewhere else, so send it back to the login page. Call it
// before any try/catch — redirect() throws, and a catch would swallow it.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
}
