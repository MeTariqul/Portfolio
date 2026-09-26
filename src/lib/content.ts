import { createAdminClient } from "@/lib/supabase/admin";
import { posts, type Post, type BlogBlock } from "@/lib/posts";
import { site } from "@/lib/site";
import en from "@/messages/en.json";

export type SiteProfile = typeof site;

export type ProjectItem = {
  title: string;
  desc: string;
  tags: string[];
  category: string;
  featured?: boolean;
  link?: string;
  github?: string;
};

export type SiteSettings = {
  email?: string;
  location?: string;
  availability?: string;
};

export type SettingsMap = {
  contact?: SiteSettings;
};

export type ServiceItem = {
  title: string;
  desc: string;
  tags: string[];
};

export type ProcessStep = {
  title: string;
  desc: string;
};

export type ExperienceItem = {
  role: string;
  org: string;
  period: string;
  desc: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  rating: number;
};

export type Stat = {
  value: number;
  suffix: string;
  label: string;
};

export type HeroContent = {
  roles?: string[];
  subtitle?: string;
  status?: string;
};

export type AboutContent = {
  stats?: Stat[];
  badges?: string[];
  terminalLines?: string[];
};

function mapBlogRow(row: Record<string, unknown>): Post {
  return {
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    date: String(row.date ?? ""),
    readTime: Number(row.read_time ?? 5),
    category: String(row.category ?? "Engineering"),
    featured: Boolean(row.featured),
    gradient: String(row.gradient ?? "from-violet-600 via-fuchsia-500 to-cyan-400"),
    blocks: (row.blocks ?? []) as BlogBlock[],
  };
}

function mapProjectRow(row: Record<string, unknown>): ProjectItem {
  return {
    title: String(row.title),
    desc: String(row.desc ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    category: String(row.category ?? "Featured"),
    featured: Boolean(row.featured),
    link: String(row.link ?? ""),
    github: String(row.github ?? ""),
  };
}

export async function getBlogPosts(): Promise<Post[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false });
    if (error) return null;
    return (data ?? []).map(mapBlogRow);
  } catch {
    return null;
  }
}

export async function getBlogPost(slug: string): Promise<Post | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapBlogRow(data);
  } catch {
    return null;
  }
}

export async function getProjects(): Promise<ProjectItem[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[content/getProjects] Supabase error:", error.message);
      return null;
    }
    return (data ?? []).map(mapProjectRow);
  } catch (e) {
    console.error("[content/getProjects] Exception:", e);
    return null;
  }
}

export function projectSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fallbackProjects = (en as { projects?: { items?: ProjectItem[] } }).projects
  ?.items ?? [];

export async function getAllProjects(): Promise<ProjectItem[]> {
  const db = await getProjects();
  return db && db.length > 0 ? db : fallbackProjects;
}

export async function getProjectBySlug(slug: string): Promise<ProjectItem | null> {
  const all = await getAllProjects();
  return all.find((p) => projectSlug(p.title) === slug) ?? null;
}

export async function getSettings(): Promise<SettingsMap | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from("settings").select("key, value");
    if (error) return null;
    const map: SettingsMap = {};
    for (const row of data ?? []) {
      map[row.key as keyof SettingsMap] = row.value as SiteSettings;
    }
    return map;
  } catch {
    return null;
  }
}

function mapServiceRow(row: Record<string, unknown>): ServiceItem {
  return {
    title: String(row.title),
    desc: String(row.desc ?? ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
  };
}

function mapProcessRow(row: Record<string, unknown>): ProcessStep {
  return {
    title: String(row.title),
    desc: String(row.desc ?? ""),
  };
}

function mapExperienceRow(row: Record<string, unknown>): ExperienceItem {
  return {
    role: String(row.role),
    org: String(row.org ?? ""),
    period: String(row.period ?? ""),
    desc: String(row.desc ?? ""),
  };
}

function mapTestimonialRow(row: Record<string, unknown>): Testimonial {
  return {
    quote: String(row.quote),
    name: String(row.name ?? ""),
    role: String(row.role ?? ""),
    rating: Number(row.rating ?? 5),
  };
}

export async function getServices(): Promise<ServiceItem[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return null;
    return (data ?? []).map(mapServiceRow);
  } catch {
    return null;
  }
}

export async function getProcessSteps(): Promise<ProcessStep[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("process")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return null;
    return (data ?? []).map(mapProcessRow);
  } catch {
    return null;
  }
}

export async function getExperience(): Promise<ExperienceItem[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("experience")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return null;
    return (data ?? []).map(mapExperienceRow);
  } catch {
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return null;
    return (data ?? []).map(mapTestimonialRow);
  } catch {
    return null;
  }
}

async function getSectionValue<T>(key: string): Promise<T | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("sections")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.value as T;
  } catch {
    return null;
  }
}

export function getHero(): Promise<HeroContent | null> {
  return getSectionValue<HeroContent>("hero");
}

export function getAbout(): Promise<AboutContent | null> {
  return getSectionValue<AboutContent>("about");
}

export type SiteContentMap = Record<string, Record<string, unknown>>;

export async function getSiteContent(): Promise<SiteContentMap | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site_content")
      .maybeSingle();
    if (error || !data) return null;
    const value = data.value as SiteContentMap;
    if (!value || typeof value !== "object") return null;
    return value;
  } catch {
    return null;
  }
}

export type CrazyTimePost = {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  file_url: string;
  file_name: string;
  youtube_url: string;
  doc_url: string;
  category: string;
  created_at: string;
};

export async function getCrazyTimePosts(): Promise<CrazyTimePost[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("crazy_time")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return null;
    return (data ?? []) as CrazyTimePost[];
  } catch {
    return null;
  }
}

export { posts as staticPosts };

export async function getSite(): Promise<SiteProfile> {
  const supabase = createAdminClient();
  if (!supabase) return site;
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "site")
      .maybeSingle();
    if (error || !data) return site;
    const dbProfile = data.value as Record<string, unknown> | null;
    if (!dbProfile || typeof dbProfile !== "object") return site;
    return { ...site, ...dbProfile } as SiteProfile;
  } catch {
    return site;
  }
}