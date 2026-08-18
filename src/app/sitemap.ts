import type { MetadataRoute } from "next";
import { getSite, getBlogPosts } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const s = await getSite();
  const dbPosts = await getBlogPosts();
  const slugs = dbPosts?.map((p) => `/blog/${p.slug}`) ?? [];

  const pagePaths = ["", "/blog", ...slugs];

  return pagePaths.map((page) => ({
    url: `${s.url}${page}`,
    lastModified: now,
    changeFrequency: (page === "" ? "monthly" : "weekly") as
      | "monthly"
      | "weekly",
    priority: page === "" ? 1 : 0.7,
  }));
}