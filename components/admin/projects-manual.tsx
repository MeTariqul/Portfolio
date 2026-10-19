import Link from "next/link";
import { Manual } from "@/components/admin/manual";

// The how-to that sits on the Projects pages, so the process lives in the
// dashboard instead of only in someone's memory.

const FIELDS: { name: string; required: boolean; note: string }[] = [
  {
    name: "Title",
    required: true,
    note: "Shown on the grid, the detail page and in search results.",
  },
  {
    name: "Slug",
    required: true,
    note: "The URL: /projects/your-slug. Unique, lowercase letters, numbers and dashes. Changing it later breaks any link you already shared.",
  },
  {
    name: "Summary",
    required: true,
    note: "One or two sentences — the card blurb and the meta description.",
  },
  {
    name: "The problem",
    required: true,
    note: "Plain text. What was wrong before you built this.",
  },
  {
    name: "What I built",
    required: true,
    note: "Markdown: ## for headings, ``` for code blocks.",
  },
  {
    name: "What I learned",
    required: true,
    note: "Markdown. The part readers remember.",
  },
  {
    name: "Category",
    required: true,
    note: "Powers the filter on /projects. Reuse the exact same spelling across projects, or the filter grows two chips for one category.",
  },
  {
    name: "Stack",
    required: false,
    note: "Comma separated. Each item becomes a technology filter chip.",
  },
  {
    name: "Sort order",
    required: false,
    note: "Lower numbers show first.",
  },
  {
    name: "Live URL, GitHub URL",
    required: false,
    note: "Buttons on the project's page.",
  },
  {
    name: "Download file",
    required: false,
    note: "Upload a zip, PDF, Office or text file (20 MB max), or paste a direct link such as a GitHub release. Archives and documents only — no .exe or .msi. Adds a Download button.",
  },
  {
    name: "Screenshots",
    required: false,
    note: "One per line: https://…/shot.png | Alt text. The first line becomes the card thumbnail, and the alt text is required.",
  },
  {
    name: "Featured",
    required: false,
    note: "Puts the project on the home page too.",
  },
];

export function ProjectsManual({ className }: { className?: string }) {
  return (
    <Manual title="Manual: adding and tracking a project" className={className}>
      <div className="space-y-7">
        <section>
          <h3 className="text-sm font-medium text-ink">Adding a project</h3>
          <p className="mt-2">
            Want screenshots? Upload them in{" "}
            <Link href="/admin/media" prefetch={false} className="link-underline text-accent">
              Media
            </Link>{" "}
            first and copy the URLs it gives you. Then, in one pass through{" "}
            <span className="text-ink">Projects → New project</span>:
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-[minmax(0,10rem)_1fr]">
            {FIELDS.map((field) => (
              <div key={field.name} className="contents">
                <dt className="text-ink">
                  {field.name}
                  {!field.required && <span className="text-soft"> · optional</span>}
                </dt>
                <dd>{field.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">
            Saving publishes it straight away: the project appears on{" "}
            <span className="text-ink">/projects</span> (with the category and stack
            filters), on its own <span className="text-ink">/projects/&lt;slug&gt;</span> page,
            in the home page grid if it is featured, and in the sitemap.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-medium text-ink">Tracking a project</h3>
          <p className="mt-2">
            Two different questions need two different tools. The dashboard&apos;s visitor
            counter answers &ldquo;is anyone here?&rdquo; — one global page-view total, not
            per project. For per-project numbers:
          </p>
          <ol className="mt-4 space-y-3">
            <li>
              <span className="text-ink">Which link worked.</span> In{" "}
              <Link href="/admin/links" prefetch={false} className="link-underline text-accent">
                Links
              </Link>
              , make a short link pointing at <span className="text-ink">/projects/your-slug</span>
              , then share the <span className="text-ink">/go/…</span> URL. Its page logs every
              click with the time, IP, country/region/city, device and referrer, plus a country
              roll-up — so you can tell outreach from a lucky guess.
            </li>
            <li>
              <span className="text-ink">All traffic, not just your links.</span> Vercel Analytics
              (already wired into the site) reports per-page views, visitors, top pages and
              referrers in the Vercel dashboard. It counts search visitors too, which a short
              link never sees. Note the beacon only loads after the visitor interacts, so
              instant bounces go uncounted.
            </li>
          </ol>
          <p className="mt-4 text-soft">
            Not tracked anywhere today: per-project view counts inside this admin, and Download
            button clicks. Both are small additions if you want them.
          </p>
        </section>
      </div>
    </Manual>
  );
}
