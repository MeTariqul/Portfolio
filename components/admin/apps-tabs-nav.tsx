"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sub-navigation for the Apps section. Lives in the page instead of the
// sidebar so the four licensing screens read as one place.
const TABS = [
  { href: "/admin/apps", label: "Apps" },
  { href: "/admin/apps/licenses", label: "Keys" },
  { href: "/admin/apps/requests", label: "Requests" },
  { href: "/admin/apps/bans", label: "Bans" },
] as const;

// Paths under /admin/apps that are screens of their own rather than the app
// list (an app's own page is /admin/apps/<cuid>, which belongs to "Apps").
const SIBLINGS = new Set(["licenses", "requests", "bans"]);

export function AppsTabsNav({ pending }: { pending: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Licensing sections" className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin/apps"
            ? pathname === "/admin/apps" ||
              (pathname.startsWith("/admin/apps/") &&
                !SIBLINGS.has(pathname.split("/")[3] ?? ""))
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              active
                ? "border-accent text-accent"
                : "border-line text-soft hover:border-accent/50 hover:text-ink",
            )}
          >
            {tab.label}
            {tab.href === "/admin/apps/requests" && pending > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] text-accent-contrast tabular-nums">
                {pending}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
