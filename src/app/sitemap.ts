import type { MetadataRoute } from "next";
import { getSite, getBlogPosts } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSite();
  const dbPosts = await getBlogPosts();

  const homepage = {
    url: s.url,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 1,
  };

  const blogIndex = {
    url: `${s.url}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };

  const blogPosts =
    dbPosts?.map((post) => ({
      url: `${s.url}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) ?? [];

  return [homepage, blogIndex, ...blogPosts];
}