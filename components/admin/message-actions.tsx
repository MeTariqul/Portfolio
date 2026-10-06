"use client";

import {
  toggleRead,
  deleteMessage,
} from "@/app/admin/(dashboard)/messages/actions";

// Row actions for one inbox message.
export function MessageActions({
  id,
  read,
  email,
}: {
  id: string;
  read: boolean;
  email: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-4 text-sm">
      <a
        href={`mailto:${email}`}
        className="link-underline text-accent hover:text-ink"
      >
        Reply
      </a>
      <form action={() => toggleRead(id, !read)}>
        <button
          type="submit"
          className="link-underline text-soft hover:text-ink"
        >
          Mark as {read ? "unread" : "read"}
        </button>
      </form>
      <form
        action={() => deleteMessage(id)}
        onSubmit={(e) => {
          if (!confirm("Delete this message?")) e.preventDefault();
        }}
      >
        <button
          type="submit"
          className="text-soft transition-colors hover:text-accent"
        >
          Delete
        </button>
      </form>
    </div>
  );
}
