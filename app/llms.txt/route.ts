import { getAllTags, getPosts, getProjects, getServices } from "@/lib/content";
import { site } from "@/lib/site";

// GET /llms.txt
//
// A plain-markdown summary of the site, written for a language model rather
// than a crawler: the convention (llmstxt.org) is that a model is pointed at
// this file to learn what the site is about and which pages are worth
// reading, before it reads any of them.
//
// It is generated from the same database as the site, so it cannot drift out
// of date the way a hand-written file does. Everything in it is already
// public — no addresses, no keys, nothing that is not already on a page.
export const revalidate = 3600;
export const runtime = "nodejs";

export async function GET() {
  const [posts, projects, services, tags] = await Promise.all([
    getPosts({ perPage: 25 }),
    getProjects(),
    getServices(),
    getAllTags(),
  ]);

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.role} in ${site.location}. ${site.education}.`,
    "",
    `Web developer building for the web — ${site.name} works on interfaces and the services behind them. This file is a summary of the site for language models; every page below is public.`,
    "",
    "## Pages",
    "",
    `- [Home](${site.url}/): who I am and what I have built.`,
    `- [About](${site.url}/about): background, experience, and the skills I work with.`,
    `- [Projects](${site.url}/projects): case studies — the problem, the solution, and what I took from each.`,
    `- [Blog](${site.url}/blog): written notes on what I have learned building things.`,
    `- [Services](${site.url}/services): what I offer and how the work runs.`,
    `- [Uses](${site.url}/uses): the tools and hardware I work with.`,
    `- [Contact](${site.url}/contact): how to get in touch.`,
  ];

  if (services.length) {
    lines.push("", "## Services", "");
    for (const s of services) {
      const note = s.priceNote ? ` — ${s.priceNote}` : "";
      lines.push(`- **${s.title}**${note}: ${plain(s.descriptionMD)}`);
    }
  }

  if (projects.length) {
    lines.push("", "## Projects", "");
    for (const p of projects) {
      lines.push(
        `- [${p.title}](${site.url}/projects/${p.slug}) (${p.category}): ${p.summary} — ${p.stack.join(", ")}`,
      );
    }
  }

  if (posts.posts.length) {
    lines.push("", "## Writing", "");
    for (const p of posts.posts) {
      const date = p.date ? ` (${p.date})` : "";
      lines.push(`- [${p.title}](${site.url}/blog/${p.slug})${date}: ${p.excerpt}`);
    }
  }

  if (tags.length) {
    lines.push("", "## Topics", "", tags.join(", "));
  }

  lines.push(
    "",
    "## Notes",
    "",
    `- Every page is a static route; content is written by hand and edited in the owner’s dashboard.`,
    `- The blog covers ${tags.slice(0, 8).join(", ") || "web development"}.`,
    `- Contact: the address is on the [contact page](${site.url}/contact).`,
    "",
  );

  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

// Strips the markdown syntax a model does not need.
function plain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
