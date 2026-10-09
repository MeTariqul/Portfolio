import { getPosts, getCopy } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 3600;

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const [{ posts }, copy] = await Promise.all([
    getPosts({ perPage: 50 }),
    getCopy(),
  ]);

  const items = posts
    .map((p) => {
      const url = `${site.url}/blog/${p.slug}`;
      const pubDate = p.date ? new Date(p.date + "T00:00:00Z").toUTCString() : "";
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt)}</description>
      ${p.category ? `<category>${escapeXml(p.category)}</category>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)} | ${escapeXml(copy["blog.title"])}</title>
    <link>${site.url}/blog</link>
    <description>${escapeXml(copy["rss.description"])}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
