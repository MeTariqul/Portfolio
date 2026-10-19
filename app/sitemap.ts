import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content";
import { site } from "@/lib/site";

// /sitemap.xml — otherwise it 404s and crawlers have no map of the site.
// Regenerated hourly, and whenever an admin action revalidates the paths it
// lists.
export const revalidate = 3600;

const staticPages = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "yearly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/services", priority: 0.8, changeFrequency: "yearly" },
  { path: "/uses", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "yearly" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, projects } = await getSitemapEntries();
  const now = new Date();

  return [
    ...staticPages.map((p) => ({
      url: `${site.url}${p.path}`,
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    // The date a page really changed. Reporting "now" for everything tells a
    // crawler that every page on the site is new on every fetch, which makes
    // it discount the whole sitemap instead of trusting the entries.
    ...posts.map((p) => ({
      url: `${site.url}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...projects.map((p) => ({
      url: `${site.url}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
