"use client";

import Link from "next/link";
import { deleteShortLink, toggleShortLink } from "@/app/admin/(dashboard)/links/actions";

// Row actions for one short link: pause/resume tracking, open the click
// log, delete (with confirmation — the click history goes with it).
export function LinkActions({ id, active }: { id: string; active: boolean }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <form action={() => toggleShortLink(id, !active)}>
        <button
          type="submit"
          className="link-underline text-soft hover:text-ink"
        >
          {active ? "Pause" : "Resume"}
        </button>
      </form>
      <Link href={`/admin/links/${id}`} prefetch={false} className="link-underline text-accent hover:text-ink">
        View log
      </Link>
      <form
        action={() => deleteShortLink(id)}
        onSubmit={(e) => {
          if (
            !confirm(
              "Delete this short link? Its whole click history is deleted with it.",
            )
          )
            e.preventDefault();
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
