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
  jobTitle: site.role,
  description: `${site.name} — ${site.role} based in ${site.location}.`,
  sameAs: [site.github, site.linkedin],
  knowsAbout: [
    "Web development",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "PostgreSQL",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location,
  },
});

/**
 * The person as a profile page, for /about.
 *
 * A Person node on its own says "somebody exists"; a ProfilePage says "this
 * page is about that person", which is what lets a search engine attach the
 * page to a knowledge panel.
 */
export function profilePageJsonLd(input: { path: string; headline: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: input.headline,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntity: personJsonLd(),
  };
}

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
    // The blog is searchable, and the search action is what tells a search
    // engine the site can answer a question directly instead of only
    // returning links.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * A list of the things on a page, for the index pages (projects, services,
 * blog). An ItemList with positions is how a search engine decides which
 * entry in a list is the top one.
 */
export function itemListJsonLd(input: {
  name: string;
  path: string;
  items: { name: string; path: string; description?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.path),
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

/**
 * A service on offer, for /services.
 *
 * Deliberately not given a price: the schema allows a range, but inventing
 * one that does not match what is written on the page is the kind of
 * mismatch that gets a page flagged.
 */
export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  priceNote?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: personJsonLd(),
    serviceType: input.name,
    areaServed: "Worldwide",
    ...(input.priceNote ? { description: `${input.description} ${input.priceNote}` } : {}),
  };
}

type BlogPostingInput = {
  title: string;
  description: string;
  path: string;
  date: string;
  /** Last edit, as a date string. Falls back to the publish date. */
  updatedAt?: string | null;
  image?: string | null;
  tags?: string[];
  category?: string | null;
  /** The post's own words, for the engines that read the article body. */
  body?: string;
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
    // The real last edit, when there is one. Claiming a post was modified on
    // the day it was published is the kind of thing that makes a search
    // engine distrust the other dates on the page.
    dateModified: input.updatedAt || input.date,
    inLanguage: "en",
    author: personJsonLd(),
    publisher: personJsonLd(),
    ...(input.category ? { articleSection: input.category } : {}),
    ...(input.tags?.length ? { keywords: input.tags.join(", ") } : {}),
    // The words of the post, in full, for the search engines that read them.
    ...(input.body ? { articleBody: input.body } : {}),
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
