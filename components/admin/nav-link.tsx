"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** True when the path is `href` itself, or sits underneath it. */
function under(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({
  href,
  label,
  badge,
  siblings = [],
}: {
  href: string;
  label: string;
  badge?: number;
  /**
   * The other links in the same nav. When a longer one also matches the
   * current path it owns the page, so the shorter prefix stays unlit:
   * /admin/apps/licenses lights Keys alone, not Apps as well.
   */
  siblings?: string[];
}) {
  const pathname = usePathname();
  const active =
    under(pathname, href) &&
    !siblings.some(
      (other) => other.length > href.length && under(pathname, other),
    );

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent/10 text-accent"
          : "text-soft hover:bg-line/40 hover:text-ink",
      )}
      aria-current={active ? "page" : undefined}
    >
      {label}
      {typeof badge === "number" && badge > 0 && (
        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.65rem] font-medium text-accent-contrast tabular-nums">
          {badge}
        </span>
      )}
    </Link>
  );
}
