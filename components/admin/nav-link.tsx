"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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
