import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// /robots.txt — otherwise it 404s, which is the first thing a crawler asks for.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
