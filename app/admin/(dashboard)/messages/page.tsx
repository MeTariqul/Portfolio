import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MessageActions } from "@/components/admin/message-actions";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default async function MessagesPage() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-3xl">Messages</h1>
      <p className="mt-2 text-soft">
        Everything sent through the contact form.
      </p>

      {messages.length === 0 && (
        <p className="mt-8 rounded-xl border border-dashed border-line p-6 text-sm text-soft">
          Inbox is empty.
        </p>
      )}

      <div className="mt-8">
        {messages.map((m) => (
          <article
            key={m.id}
            className={`border-t border-line py-6 first:border-t-0 first:pt-0 ${
              m.read ? "opacity-70" : ""
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {!m.read && (
                <span
                  className="inline-block h-2 w-2 rounded-full bg-accent"
                  aria-label="Unread"
                />
              )}
              <h2 className="text-lg">{m.name}</h2>
              <a
                href={`mailto:${m.email}`}
                className="link-underline text-sm text-soft hover:text-ink"
              >
                {m.email}
              </a>
              <time
                dateTime={m.createdAt.toISOString()}
                className="ml-auto text-xs text-soft"
              >
                {formatDate(m.createdAt)}
              </time>
            </div>
            <p className="mt-3 max-w-[680px] whitespace-pre-wrap text-soft">
              {m.content}
            </p>
            <MessageActions id={m.id} read={m.read} email={m.email} />
          </article>
        ))}
      </div>
    </div>
  );
}
