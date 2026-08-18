import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSite();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${s.url}/sitemap.xml`,
  };
}
