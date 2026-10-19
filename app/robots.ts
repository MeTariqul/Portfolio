import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// /robots.txt — otherwise it 404s, which is the first thing a crawler asks for.
//
// Three groups of rules:
//
//   • The admin and the API are not content. /admin is behind a login, /api
//     is machine-only, and neither belongs in an index.
//
//   • /go/ is a short-link redirector. The pages it points at are indexed
//     in their own right; letting a crawler walk the redirector only adds
//     duplicate URLs of the same destination.
//
//   • AI crawlers are named explicitly, and they are split by what they do.
//     The search and answer agents (OAI-SearchBot, ClaudeBot, PerplexityBot
//     and the rest) are welcomed: the point of this site is to be found, and
//     being the source an AI quotes is worth more than refusing it. The
//     training crawlers — GPTBot, CCBot, Bytespider and the rest — are
//     declined, so the writing can be cited without being scraped into a
//     training set.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/go/"],
      },
      // Search and answer engines: welcome.
      {
        userAgent: [
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Applebot-Extended",
          "Amazonbot",
          "meta-externalagent",
        ],
        allow: "/",
        disallow: ["/admin/", "/api/", "/go/"],
      },
      // Model-training crawlers: not for answering questions, so no.
      {
        userAgent: [
          "GPTBot",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Bytespider",
          "Diffbot",
          "FacebookBot",
          "omgili",
          "Webzio-Extended",
          "YouBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
