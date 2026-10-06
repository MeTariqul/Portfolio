"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu when the route changes (adjust-during-render
  // pattern, which keeps setState out of effects per our lint rules).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="font-display text-lg tracking-tight hover:text-accent"
        >
          {site.shortName}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "link-underline text-[0.95rem] text-soft transition-colors hover:text-ink",
                pathname === l.href && "text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-soft"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="border-t border-line bg-bg md:hidden"
        >
          <div className="mx-auto flex max-w-[1120px] flex-col px-6 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 text-soft transition-colors hover:text-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
