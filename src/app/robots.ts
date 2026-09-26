import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSite();
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: ["Bingbot", "msnbot"],
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: ["ChatGPT-User", "Google-Extended", "PerplexityBot", "ClaudeBot", "Anthropic-ai", "Bytespider"],
        allow: "/",
        disallow: "/admin",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin",
      },
    ],
    sitemap: `${s.url}/sitemap.xml`,
  };
}