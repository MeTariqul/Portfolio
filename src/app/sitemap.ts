import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { posts } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pagePaths = ["", "/blog", ...posts.map((p) => `/blog/${p.slug}`)];

  return pagePaths.map((page) => ({
    url: `${site.url}${page}`,
    lastModified: now,
    changeFrequency: (page === "" ? "monthly" : "weekly") as
      | "monthly"
      | "weekly",
    priority: page === "" ? 1 : 0.7,
  }));
}