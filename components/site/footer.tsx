import Link from "next/link";
import { site } from "@/lib/site";
import { getCopy } from "@/lib/content";
import { fill } from "@/lib/utils";

export async function Footer() {
  const copy = await getCopy();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="text-sm text-soft">
          <p>
            {site.name} · {site.location}
          </p>
          <p className="mt-1">
            {fill(copy["footer.copyright"], { year })}
          </p>
        </div>

        <nav
          aria-label={copy["footer.nav"]}
          className="flex flex-wrap items-center gap-5 text-sm"
        >
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-soft hover:text-ink"
          >
            {copy["footer.email"]}
          </a>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-soft hover:text-ink"
          >
            {copy["ui.github"]}
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-soft hover:text-ink"
          >
            {copy["ui.linkedin"]}
          </a>
          <Link
            href="/uses"
            prefetch={false}
            className="link-underline text-soft hover:text-ink"
          >
            {copy["footer.uses"]}
          </Link>
          <Link
            href="/rss.xml"
            prefetch={false}
            className="link-underline text-soft hover:text-ink"
          >
            {copy["footer.rss"]}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
