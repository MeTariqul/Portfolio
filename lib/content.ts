import { cache } from "react";
import { prisma } from "@/lib/prisma";
import sample from "@/lib/sample-content.json";
import { copyDefaults, type Copy, type CopyKey } from "@/lib/copy";

// Content layer: every function reads the database first. It falls back to
// lib/sample-content.json only while the database is unreachable or has never
// been seeded — prisma/seed.mjs writes Setting{key:"seeded"} to say which
// state it is in. Pages render the fallback during setup; after that the
// database wins, an emptied table renders empty rather than resurrecting the
// sample copy, and admin edits show up within the ISR window.

export type PostAttachment = {
  id: string;
  url: string;
  filename: string;
  kind: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

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
  attachments: PostAttachment[];
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

// prisma/seed.mjs writes Setting{key:"seeded"} once the sample content is in
// the database. Until that row exists the pages fall back to
// lib/sample-content.json, so a fresh clone still renders something. After it,
// the database is the only source of truth: a table you emptied in the admin
// renders empty instead of quietly serving the sample copy behind your back.
const seeded = cache(async (): Promise<boolean> => {
  try {
    return (
      (await prisma.setting.findUnique({ where: { key: "seeded" } })) !== null
    );
  } catch {
    return false; // database unreachable → stay on the sample fallback
  }
});

// Reads one content table, keeping three cases apart:
//   • query threw → the sample fallback, as before (database down);
//   • rows found  → the database wins, however few;
//   • zero rows   → sample content only while the database is unseeded.
async function table<T>(query: () => Promise<T[]>, sample: () => T[]): Promise<T[]> {
  const rows = await safe<T[] | undefined>(query, undefined);
  if (rows === undefined) return sample();
  if (rows.length > 0) return rows;
  return (await seeded()) ? rows : sample();
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

// Overrides for every site word, written by the admin Copy screen
// (app/admin/copy). A key wins only when the `copy` setting holds a
// non-empty string for it; everything else — including a database that is
// unreachable — falls back to the defaults in lib/copy.ts, so the site can
// never render a missing word as blank.
export const getCopy = cache(async (): Promise<Copy> => {
  const overrides = await safe<Record<string, unknown>>(async () => {
    const row = await prisma.setting.findUnique({ where: { key: "copy" } });
    return (row?.value ?? {}) as Record<string, unknown>;
  }, {});

  const merged: Copy = { ...copyDefaults };
  for (const [key, value] of Object.entries(overrides)) {
    if (
      typeof value === "string" &&
      value !== "" &&
      key in copyDefaults
    ) {
      merged[key as CopyKey] = value;
    }
  }
  return merged;
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
  attachments?: PostAttachment[];
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
    attachments: p.attachments ?? [],
  };
}

const samplePublished = sample.posts
  .filter((p) => p.status === "PUBLISHED")
  .map((p) => ({ ...p, attachments: [] as PostAttachment[] }));

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

    const db = await safe<{ total: number; posts: Post[] } | null | undefined>(
      async () => {
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
      undefined,
    );
    // The database answers, and either has something to show or has been
    // seeded — so "nothing matched" is reported as nothing, not as sample.
    if (db && (db.total > 0 || (await seeded()))) {
      return { ...db, page, perPage };
    }

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
  const samplePost = () => samplePublished.find((p) => p.slug === slug) ?? null;
  const db = await safe<Post | null | undefined>(
    async () => {
      const row = await prisma.post.findUnique({
        where: { slug },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      });
      return row && isPublished(row) ? mapPost(row) : null;
    },
    undefined,
  );
  if (db === undefined) return samplePost(); // database unreachable
  if (db) return db;
  // Missing, or still a draft: once seeded, a post you unpublished or deleted
  // stops being served from the sample copy.
  return (await seeded()) ? null : samplePost();
});

export const getFeaturedPosts = cache(async (limit = 1): Promise<Post[]> =>
  table<Post>(
    async () => {
      const rows = await prisma.post.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
      });
      return rows.filter(isPublished).map(mapPost);
    },
    () => samplePublished.filter((p) => p.featured).slice(0, limit),
  ),
);

export const getLatestPosts = cache(async (limit = 3): Promise<Post[]> => {
  const posts = await table<Post>(
    async () => {
      const rows = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: limit + 1,
      });
      return rows.filter(isPublished).map(mapPost);
    },
    () => samplePublished,
  );
  return posts.slice(0, limit);
});

// Only the tag names of published posts — the blog page builds its tag
// cloud from this instead of pulling every full post body out of the DB.
export const getAllTags = cache(async (): Promise<string[]> =>
  table<string>(
    async () => {
      const rows = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        select: { tags: true, publishedAt: true },
      });
      const visible = rows.filter(
        (r) => r.publishedAt && r.publishedAt.getTime() <= Date.now(),
      );
      return Array.from(new Set(visible.flatMap((r) => r.tags))).sort();
    },
    () => Array.from(new Set(samplePublished.flatMap((p) => p.tags))).sort(),
  ),
);

const relevance = (
  item: { category: string | null; tags: string[] },
  ref: Post,
) =>
  (item.category && item.category === ref.category ? 2 : 0) +
  item.tags.filter((t) => ref.tags.includes(t)).length;

export const getRelatedPosts = cache(
  async (post: Post, limit = 3): Promise<Post[]> => {
    const sampleRelated = () => {
      const all = samplePublished.filter((p) => p.slug !== post.slug);
      return all
        .map((p) => ({ p, s: relevance(p, post) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map((x) => x.p);
    };
    return table<Post>(
      async () => {
        const rows = await prisma.post.findMany({
          where: { status: "PUBLISHED", slug: { not: post.slug } },
          orderBy: { publishedAt: "desc" },
          select: { slug: true, category: true, tags: true, publishedAt: true },
        });
        const scored = rows
          .filter((r) => r.publishedAt && r.publishedAt.getTime() <= Date.now())
          .map((r) => ({ slug: r.slug, s: relevance(r, post) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, limit);
        // Hydrate only the winners (getPost is per-request cached).
        const posts = await Promise.all(scored.map((x) => getPost(x.slug)));
        return posts.filter((p): p is Post => p !== null);
      },
      sampleRelated,
    );
  },
);

// Newer/older neighbours for the post footer. Two tiny indexed lookups
// instead of loading up to 100 full posts to find two slugs.
export const getAdjacentPosts = cache(
  async (slug: string): Promise<{ prev: Post | null; next: Post | null }> => {
    const none = { prev: null, next: null } as const;
    const sampleAdjacent = (): { prev: Post | null; next: Post | null } => {
      const i = samplePublished.findIndex((p) => p.slug === slug);
      if (i === -1) return none;
      return {
        prev: i > 0 ? samplePublished[i - 1] : null,
        next: i < samplePublished.length - 1 ? samplePublished[i + 1] : null,
      };
    };
    const db = await safe<
      { prev: Post | null; next: Post | null } | null | undefined
    >(
      async () => {
        const any = await prisma.post.findFirst({ select: { id: true } });
        if (!any) return null; // empty table
        const row = await prisma.post.findUnique({
          where: { slug },
          select: { publishedAt: true, status: true },
        });
        const now = new Date();
        const publishedAt =
          row?.status === "PUBLISHED" ? row.publishedAt : null;
        if (!publishedAt || publishedAt.getTime() > now.getTime()) {
          return none;
        }

        const [newer, older] = await Promise.all([
          prisma.post.findFirst({
            where: {
              status: "PUBLISHED",
              publishedAt: { gt: publishedAt, lte: now },
            },
            orderBy: { publishedAt: "asc" },
            select: { slug: true },
          }),
          prisma.post.findFirst({
            where: {
              status: "PUBLISHED",
              publishedAt: { lt: publishedAt },
            },
            orderBy: { publishedAt: "desc" },
            select: { slug: true },
          }),
        ]);
        const [prev, next] = await Promise.all([
          newer ? getPost(newer.slug) : null,
          older ? getPost(older.slug) : null,
        ]);
        return { prev, next };
      },
      undefined,
    );
    if (db === undefined) return sampleAdjacent(); // database unreachable
    if (db) return db;
    return (await seeded()) ? none : sampleAdjacent();
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

export const getProjects = cache(async (): Promise<Project[]> =>
  table<Project>(
    async () => {
      const rows = await prisma.project.findMany({ orderBy: { order: "asc" } });
      return rows.map(mapProject);
    },
    () => [...sample.projects].sort(byOrder),
  ),
);

export const getFeaturedProjects = cache(
  async (limit = 3): Promise<Project[]> => {
    const all = await getProjects();
    const featured = all.filter((p) => p.featured);
    return (featured.length > 0 ? featured : all).slice(0, limit);
  },
);

export const getProject = cache(
  async (slug: string): Promise<Project | null> => {
    const sampleProject = () => sample.projects.find((p) => p.slug === slug) ?? null;
    const db = await safe<Project | null | undefined>(
      async () => {
        const row = await prisma.project.findUnique({ where: { slug } });
        return row ? mapProject(row) : null;
      },
      undefined,
    );
    if (db === undefined) return sampleProject(); // database unreachable
    if (db) return db;
    // Deleted in the admin: stop serving its page out of the sample JSON.
    return (await seeded()) ? null : sampleProject();
  },
);

export const getSkills = cache(async (): Promise<Skill[]> =>
  table<Skill>(
    async () => [...(await prisma.skill.findMany())].sort(byOrder),
    () => sample.skills,
  ),
);

export const getExperience = cache(async (): Promise<ExperienceItem[]> =>
  table<ExperienceItem>(
    async () => [...(await prisma.experience.findMany())].sort(byOrder),
    () => sample.experience,
  ),
);

export const getServices = cache(async (): Promise<Service[]> =>
  table<Service>(
    async () => [...(await prisma.service.findMany())].sort(byOrder),
    () => sample.services,
  ),
);

export const getUses = cache(async (): Promise<UsesItem[]> =>
  table<UsesItem>(
    async () => [...(await prisma.usesItem.findMany())].sort(byOrder),
    () => sample.uses,
  ),
);
