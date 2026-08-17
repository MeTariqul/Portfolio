"use server";

import { createClient } from "@/lib/supabase/server";

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
};

type ActionResult =
  | { ok: true; messages?: AdminMessage[] }
  | { ok: false; error: string };

async function requireClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return supabase;
}

export async function listMessages(): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("messages")
    .select("id, name, email, message, created_at, read")
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, messages: (data ?? []) as AdminMessage[] };
}

export async function markMessageRead(
  id: string,
  read: boolean
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("messages")
    .update({ read })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("messages").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type AdminBlog = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  read_time: number;
  category: string;
  featured: boolean;
  gradient: string;
  blocks: unknown[];
  published: boolean;
};

export type AdminProject = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  category: string;
  link: string;
  github: string;
  featured: boolean;
  sort: number;
};

export type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stars: number;
};

export type ContactSettings = {
  email?: string;
  location?: string;
  availability?: string;
};

export async function listBlogs(): Promise<ActionResult & { blogs?: AdminBlog[] }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, blogs: (data ?? []) as AdminBlog[] };
}

export async function saveBlog(blog: AdminBlog): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const payload = {
    slug: blog.slug.trim(),
    title: blog.title.trim(),
    description: blog.description.trim(),
    date: blog.date,
    read_time: blog.read_time,
    category: blog.category.trim(),
    featured: blog.featured,
    gradient: blog.gradient,
    blocks: blog.blocks,
    published: blog.published,
  };
  if (!payload.slug || !payload.title) {
    return { ok: false, error: "Slug and title are required" };
  }

  const { error } = blog.id
    ? await supabase.from("blogs").update(payload).eq("id", blog.id)
    : await supabase.from("blogs").insert(payload);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteBlog(id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listProjects(): Promise<ActionResult & { projects?: AdminProject[] }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, projects: (data ?? []) as AdminProject[] };
}

export async function saveProject(project: AdminProject): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const payload = {
    title: project.title.trim(),
    desc: project.desc.trim(),
    tags: project.tags.map((t) => t.trim()).filter(Boolean),
    category: project.category.trim(),
    link: project.link.trim(),
    github: project.github.trim(),
    featured: project.featured,
    sort: project.sort,
  };
  if (!payload.title) return { ok: false, error: "Title is required" };

  const { error } = project.id
    ? await supabase.from("projects").update(payload).eq("id", project.id)
    : await supabase.from("projects").insert(payload);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getSettingsMap(): Promise<ActionResult & { contact?: ContactSettings }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) return { ok: false, error: error.message };

  const contact = (data ?? []).find((r) => r.key === "contact")?.value as
    | ContactSettings
    | undefined;
  return { ok: true, contact };
}

export async function saveContactSettings(
  contact: ContactSettings
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("settings").upsert(
    { key: "contact", value: contact },
    { onConflict: "key" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getGithubRepos(): Promise<
  ActionResult & { repos?: GithubRepo[] }
> {
  try {
    const res = await fetch(
      "https://api.github.com/users/MeTariqul/repos?per_page=100&sort=updated",
      { headers: { Accept: "application/vnd.github+json", "User-Agent": "portfolio-admin" } }
    );
    if (!res.ok) return { ok: false, error: `GitHub API ${res.status}` };

    const repos = (await res.json()) as {
      id: number;
      name: string;
      description: string | null;
      language: string | null;
      html_url: string;
      stargazers_count: number;
    }[];
    return {
      ok: true,
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        language: r.language,
        html_url: r.html_url,
        stars: r.stargazers_count,
      })),
    };
  } catch {
    return { ok: false, error: "GitHub API unreachable" };
  }
}