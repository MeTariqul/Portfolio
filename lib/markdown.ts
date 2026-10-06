import GithubSlugger from "github-slugger";

// Reading time: ~200 words per minute.
export function readingTime(md: string): number {
  const words = md.replace(/```[\s\S]*?```/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export type TocItem = { id: string; text: string; level: number };

// Table of contents from markdown headings (## and ###),
// with the same slug ids rehype-slug generates.
export function extractToc(md: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      items.push({ id: slugger.slug(text), text, level: m[1].length });
    }
  }
  return items;
}

const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export { formatDate };
