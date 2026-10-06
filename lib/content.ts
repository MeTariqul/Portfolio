import { cache } from "react";
import { prisma } from "@/lib/prisma";
import sample from "@/lib/sample-content.json";

// Content layer: every function reads the database first and falls back to
// lib/sample-content.json when a table is empty or the database is unreachable.
// Pages render with the fallback during setup; after `npm run db:seed` the
// database wins, and admin edits show up within the ISR window.

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  contentMD: string;
  coverImage: string | null;
  coverAlt: string | null;
  category: string | null;
  tags: string[];
  date: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solutionMD: string;
  learnedMD: string;
  stack: string[];
  category: string;
  screenshots: { url: string; alt: string }[];
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  order: number;
};

export type Skill = { name: string; group: string; order: number };

export type ExperienceItem = {
  kind: string;
  title: string;
  org: string;
  period: string;
  description: string;
  order: number;
};

export type Service = {
  title: string;
  descriptionMD: string;
  priceNote: string | null;
  order: number;
};

export type UsesItem = {
  title: string;
  description: string;
  group: string | null;
  order: number;
};

export type SiteSettings = typeof sample.settings & {
  about: typeof sample.about;
};

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

const sampleSettings: SiteSettings = {
  ...sample.settings,
  about: sample.about,
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  return safe(
    async () => {
      const rows = await prisma.setting.findMany({
        where: { key: { in: ["availability", "home", "about", "newsletter"] } },
      });
      const map = new Map(rows.map((r) => [r.key, r.value]));
      const as = <K extends keyof SiteSettings>(key: K): SiteSettings[K] =>
        (map.get(key) as SiteSettings[K] | undefined) ?? sampleSettings[key];
      return {
        availability: as("availability"),
        home: as("home"),
        about: as("about"),
        newsletter: as("newsletter"),
      };
    },
    sampleSettings,
  );
});

const isPublished = (p: { status: string; publishedAt: Date | null }) =>
  p.status === "PUBLISHED" &&
  p.publishedAt !== null &&
  p.publishedAt.getTime() <= Date.now();

function mapPost(p: {
  slug: string;
  title: string;
  excerpt: string;
  contentMD: string;
  coverImage: string | null;
  coverAlt: string | null;
  category: string | null;
  tags: string[];
  publishedAt: Date | null;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}): Post {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    contentMD: p.contentMD,
    coverImage: p.coverImage,
    coverAlt: p.coverAlt,
    category: p.category,
    tags: p.tags,
    date: p.publishedAt ? p.publishedAt.toISOString().slice(0, 10) : "",
    featured: p.featured,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

const samplePublished = sample.posts
  .filter((p) => p.status === "PUBLISHED")
  .map((p) => ({ ...p }));

export const getPosts = cache(
  async (opts: { q?: string; tag?: string; page?: number; perPage?: number } = {}) => {
    const { q, tag, page = 1, perPage = 6 } = opts;
    const where = {
      status: "PUBLISHED" as const,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
              { contentMD: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    };

    const db = await safe(
      async () => {
        const anyCount = await prisma.post.count();
        if (anyCount === 0) return null; // empty table → use sample content
        const [total, rows] = await Promise.all([
          prisma.post.count({ where }),
          prisma.post.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
          }),
        ]);
        return { total, posts: rows.filter(isPublished).map(mapPost) };
      },
      null,
    );
    if (db) return { ...db, page, perPage };

    // Fallback: filter the sample posts with the same rules.
    const match = (p: Post) =>
      (!q ||
        `${p.title} ${p.excerpt} ${p.contentMD}`
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!tag || p.tags.includes(tag));
    const all = samplePublished.filter(match);
    const start = (page - 1) * perPage;
    return {
      total: all.length,
      posts: all.slice(start, start + perPage),
      page,
      perPage,
    };
  },
);

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const db = await safe(
    async () => {
      const row = await prisma.post.findUnique({ where: { slug } });
      return row && isPublished(row) ? mapPost(row) : null;
    },
    null,
  );
  if (db !== null) return db;
  return samplePublished.find((p) => p.slug === slug) ?? null;
});

export const getFeaturedPosts = cache(async (limit = 1): Promise<Post[]> => {
  const db = await safe(
    async () => {
      const rows = await prisma.post.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
      });
      return rows.filter(isPublished).map(mapPost);
    },
    [] as Post[],
  );
  if (db.length > 0) return db;
  return samplePublished.filter((p) => p.featured).slice(0, limit);
});

export const getLatestPosts = cache(async (limit = 3): Promise<Post[]> => {
  const db = await safe(
    async () => {
      const rows = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: limit + 1,
      });
      return rows.filter(isPublished).map(mapPost);
    },
    [] as Post[],
  );
  const posts = db.length > 0 ? db : samplePublished;
  return posts.slice(0, limit);
});

export const getRelatedPosts = cache(
  async (post: Post, limit = 3): Promise<Post[]> => {
    const all = (await getPosts({ perPage: 100 })).posts.filter(
      (p) => p.slug !== post.slug,
    );
    const score = (p: Post) =>
      (p.category && p.category === post.category ? 2 : 0) +
      p.tags.filter((t) => post.tags.includes(t)).length;
    return all
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.p);
  },
);

export const getAdjacentPosts = cache(
  async (slug: string): Promise<{ prev: Post | null; next: Post | null }> => {
    const { posts } = await getPosts({ perPage: 100 });
    const i = posts.findIndex((p) => p.slug === slug);
    return {
      prev: i > 0 ? posts[i - 1] : null,
      next: i >= 0 && i < posts.length - 1 ? posts[i + 1] : null,
    };
  },
);

const mapProject = (p: {
  slug: string;
  title: string;
  summary: string;
  problem: string;
  solutionMD: string;
  learnedMD: string;
  stack: string[];
  category: string;
  screenshots: unknown;
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  order: number;
}): Project => ({
  slug: p.slug,
  title: p.title,
  summary: p.summary,
  problem: p.problem,
  solutionMD: p.solutionMD,
  learnedMD: p.learnedMD,
  stack: p.stack,
  category: p.category,
  screenshots: (p.screenshots as Project["screenshots"]) ?? [],
  liveUrl: p.liveUrl,
  githubUrl: p.githubUrl,
  featured: p.featured,
  order: p.order,
});

export const getProjects = cache(async (): Promise<Project[]> => {
  const db = await safe(
    async () => {
      const rows = await prisma.project.findMany({ orderBy: { order: "asc" } });
      return rows.map(mapProject);
    },
    [] as Project[],
  );
  return db.length > 0 ? db : [...sample.projects].sort(byOrder);
});

export const getFeaturedProjects = cache(
  async (limit = 3): Promise<Project[]> => {
    const all = await getProjects();
    const featured = all.filter((p) => p.featured);
    return (featured.length > 0 ? featured : all).slice(0, limit);
  },
);

export const getProject = cache(
  async (slug: string): Promise<Project | null> => {
    const db = await safe(
      async () => {
        const row = await prisma.project.findUnique({ where: { slug } });
        return row ? mapProject(row) : null;
      },
      null,
    );
    if (db) return db;
    return sample.projects.find((p) => p.slug === slug) ?? null;
  },
);

export const getSkills = cache(async (): Promise<Skill[]> => {
  const db = await safe(() => prisma.skill.findMany(), [] as Skill[]);
  return db.length > 0 ? [...db].sort(byOrder) : sample.skills;
});

export const getExperience = cache(async (): Promise<ExperienceItem[]> => {
  const db = await safe(() => prisma.experience.findMany(), []);
  return db.length > 0 ? [...db].sort(byOrder) : sample.experience;
});

export const getServices = cache(async (): Promise<Service[]> => {
  const db = await safe(() => prisma.service.findMany(), []);
  return db.length > 0 ? [...db].sort(byOrder) : sample.services;
});

export const getUses = cache(async (): Promise<UsesItem[]> => {
  const db = await safe(() => prisma.usesItem.findMany(), []);
  return db.length > 0 ? [...db].sort(byOrder) : sample.uses;
});
