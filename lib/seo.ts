import { site } from "@/lib/site";

// SEO helpers: absolute URLs for Open Graph / canonical tags, plus the
// JSON-LD blocks Google reads for rich results. Kept as plain objects so the
// pages stay declarative and the schema shapes are testable in isolation.

/** Site-default share image. Used when a page has no cover of its own. */
export const defaultOgImage = `${site.url}/profile.jpg`;

/** Resolves a path (or an already-absolute URL) against the site origin. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The Person behind the site — reused as author/publisher across schemas. */
export const personJsonLd = () => ({
  "@type": "Person",
  name: site.name,
  url: site.url,
  image: defaultOgImage,
  sameAs: [site.github, site.linkedin],
});

export type BreadcrumbItem = { name: string; path: string };

/**
 * BreadcrumbList. Google renders these as sitelinks under a result, which
 * takes more of the SERP and pushes competing results further down.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Site identity, emitted once from the root layout. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: "en",
    publisher: personJsonLd(),
    sameAs: [site.github, site.linkedin],
  };
}

type BlogPostingInput = {
  title: string;
  description: string;
  path: string;
  date: string;
  image?: string | null;
  tags?: string[];
  category?: string | null;
};

/**
 * BlogPosting: the schema behind "article" rich results. Headline is capped
 * at 110 characters because longer values are rejected by the rich-results
 * validator and the markup silently stops being eligible.
 */
export function blogPostingJsonLd(input: BlogPostingInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title.slice(0, 110),
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(input.path),
    },
    image: absoluteUrl(input.image || defaultOgImage),
    datePublished: input.date,
    dateModified: input.date,
    inLanguage: "en",
    author: personJsonLd(),
    publisher: personJsonLd(),
    ...(input.category ? { articleSection: input.category } : {}),
    ...(input.tags?.length ? { keywords: input.tags.join(", ") } : {}),
  };
}

type CreativeWorkInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  sameAs?: string | null;
};

/**
 * CreativeWork for a portfolio project case study. Deliberately NOT
 * SoftwareApplication/Product: those invite extra required properties and
 * review-style markup we cannot honestly provide, and mismatched schema is
 * treated as spam rather than as a boost.
 */
export function creativeWorkJsonLd(input: CreativeWorkInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: absoluteUrl(input.image || defaultOgImage),
    inLanguage: "en",
    creator: personJsonLd(),
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
    ...(input.sameAs ? { sameAs: input.sameAs } : {}),
  };
}
