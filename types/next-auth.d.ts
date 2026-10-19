import type { AdminRole } from "@prisma/client";

// Tells Auth.js that a session carries the admin's role.
//
// The role in the session is a snapshot taken at sign-in and is used only to
// decide what the interface shows. What an action is *allowed* to do is
// decided by requireOwner() in lib/auth.ts, which reads the role from the
// database — so a demotion takes effect at once instead of when the session
// token happens to expire.
declare module "next-auth" {
  interface User {
    role?: AdminRole;
  }
}

// The JWT type is declared in @auth/core/jwt (next-auth/jwt only re-exports
// it), so that is where it has to be augmented. JWT extends
// Record<string, unknown>, so without this the role would be typed `unknown`.
declare module "@auth/core/jwt" {
  interface JWT {
    role?: AdminRole;
  }
}
