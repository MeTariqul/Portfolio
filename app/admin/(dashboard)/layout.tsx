import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { doSignOut } from "@/app/admin/actions";
import { NavLink } from "@/components/admin/nav-link";
import { SessionWatch } from "@/components/admin/session-watch";

// Admin shell. proxy.ts already redirects visitors to /admin/login;
// this check is defense in depth (and covers direct server rendering).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const unread = await prisma.message.count({ where: { read: false } });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SessionWatch />
      <aside className="flex shrink-0 flex-col border-b border-line bg-surface md:min-h-screen md:w-60 md:border-r md:border-b-0">
        <div className="border-b border-line px-5 py-4">
          <p className="text-lg">Tariqul</p>
          <p className="text-xs text-soft">Admin</p>
        </div>

        <nav
          aria-label="Admin"
          className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:overflow-visible"
        >
          <NavLink href="/admin" label="Dashboard" />
          <NavLink href="/admin/posts" label="Posts" />
          <NavLink href="/admin/projects" label="Projects" />
          <NavLink href="/admin/content/services" label="Services" />
          <NavLink href="/admin/content/experience" label="Experience" />
          <NavLink href="/admin/content/skills" label="Skills" />
          <NavLink href="/admin/content/uses" label="Uses" />
          <NavLink href="/admin/copy" label="Copy" />
          <NavLink href="/admin/messages" label="Messages" badge={unread} />
          <NavLink href="/admin/media" label="Media" />
          <NavLink href="/admin/settings" label="Settings" />
        </nav>

        <div className="mt-auto hidden border-t border-line px-5 py-4 md:block">
          <p className="truncate text-xs text-soft" title={session.user.email ?? ""}>
            {session.user.email}
          </p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <Link
              href="/"
              className="link-underline text-soft hover:text-ink"
              target="_blank"
            >
              View site
            </Link>
            <form action={doSignOut}>
              <button
                type="submit"
                className="text-soft transition-colors hover:text-accent"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        {children}
        <div className="mt-10 flex gap-4 border-t border-line pt-6 text-sm md:hidden">
          <Link href="/" className="link-underline text-soft" target="_blank">
            View site
          </Link>
          <form action={doSignOut}>
            <button type="submit" className="text-soft hover:text-accent">
              Sign out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
