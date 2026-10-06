import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="text-sm text-soft">
          <p>
            {site.name} · {site.location}
          </p>
          <p className="mt-1">
            © {year}. Built by me, in plain Next.js.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-5 text-sm">
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-soft hover:text-ink"
          >
            Email
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-soft hover:text-ink"
          >
            GitHub
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-soft hover:text-ink"
          >
            LinkedIn
          </a>
          <Link href="/uses" className="link-underline text-soft hover:text-ink">
            Uses
          </Link>
          <Link href="/rss.xml" className="link-underline text-soft hover:text-ink">
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  );
}
