import { createAdminClient } from "@/lib/supabase/admin";
import { posts, type Post, type BlogBlock } from "@/lib/posts";

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
    if (error) return null;
    return (data ?? []).map(mapProjectRow);
  } catch {
    return null;
  }
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

export { posts as staticPosts };