import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [
    postsPublished,
    postsDrafts,
    projects,
    messagesTotal,
    messagesUnread,
    media,
  ] = await Promise.all([
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.post.count({ where: { status: "DRAFT" } }),
    prisma.project.count(),
    prisma.message.count(),
    prisma.message.count({ where: { read: false } }),
    prisma.media.count(),
  ]);

  const latest = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "Published posts", value: postsPublished, href: "/admin/posts" },
    { label: "Drafts", value: postsDrafts, href: "/admin/posts" },
    { label: "Projects", value: projects, href: "/admin/projects" },
    { label: "Unread messages", value: messagesUnread, href: "/admin/messages" },
    { label: "Media files", value: media, href: "/admin/media" },
  ];

  return (
    <div>
      <h1 className="text-3xl">Dashboard</h1>
      <p className="mt-2 text-soft">Everything on your site, at a glance.</p>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            prefetch={false}
            className="bg-surface p-4 transition-colors hover:bg-bg"
          >
            <p className="text-2xl tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-soft">{s.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="latest-messages">
        <div className="flex items-baseline justify-between">
          <h2 id="latest-messages" className="text-xl">
            Latest messages
          </h2>
          <Link href="/admin/messages" prefetch={false} className="link-underline text-accent text-sm">
            {messagesTotal > 5 ? "View all" : "Open inbox"}
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
            No messages yet. When someone uses the contact form, it lands here.
          </p>
        ) : (
          <div className="mt-4">
            {latest.map((m) => (
              <div
                key={m.id}
                className="border-t border-line py-4 first:border-t-0 first:pt-0"
              >
                <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  {!m.read && (
                    <span
                      className="inline-block h-2 w-2 rounded-full bg-accent"
                      aria-label="Unread"
                    />
                  )}
                  <span className="font-medium">{m.name}</span>
                  <span className="text-soft">{m.email}</span>
                  <time
                    dateTime={m.createdAt.toISOString()}
                    className="ml-auto text-xs text-soft"
                  >
                    {m.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </p>
                <p className="mt-1 max-w-[680px] text-sm text-soft line-clamp-2">
                  {m.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
