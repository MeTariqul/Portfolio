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

export type AdminService = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  sort: number;
};

export type AdminProcessStep = {
  id: string;
  title: string;
  desc: string;
  sort: number;
};

export type AdminExperienceItem = {
  id: string;
  role: string;
  org: string;
  period: string;
  desc: string;
  sort: number;
};

export type AdminTestimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  rating: number;
  sort: number;
};

export type SectionKey = "hero" | "about";
export type SectionValue = Record<string, unknown>;

async function listRows<T>(
  table: string
): Promise<ActionResult & { rows?: T[] }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: (data ?? []) as T[] };
}

async function upsertRow(
  table: string,
  row: Record<string, unknown>,
  id: string
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = id
    ? await supabase.from(table).update(row).eq("id", id)
    : await supabase.from(table).insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function removeRow(table: string, id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listServices(): Promise<ActionResult & { rows?: AdminService[] }> {
  return listRows<AdminService>("services");
}

export async function saveService(service: AdminService): Promise<ActionResult> {
  const { title, desc, tags, sort } = service;
  if (!title.trim()) return { ok: false, error: "Title is required" };
  return upsertRow(
    "services",
    {
      title: title.trim(),
      desc: desc.trim(),
      tags: tags.map((t) => t.trim()).filter(Boolean),
      sort,
    },
    service.id
  );
}

export async function deleteService(id: string): Promise<ActionResult> {
  return removeRow("services", id);
}

export async function listProcessSteps(): Promise<ActionResult & { rows?: AdminProcessStep[] }> {
  return listRows<AdminProcessStep>("process");
}

export async function saveProcessStep(step: AdminProcessStep): Promise<ActionResult> {
  const { title, desc, sort } = step;
  if (!title.trim()) return { ok: false, error: "Title is required" };
  return upsertRow("process", { title: title.trim(), desc: desc.trim(), sort }, step.id);
}

export async function deleteProcessStep(id: string): Promise<ActionResult> {
  return removeRow("process", id);
}

export async function listExperience(): Promise<ActionResult & { rows?: AdminExperienceItem[] }> {
  return listRows<AdminExperienceItem>("experience");
}

export async function saveExperienceItem(item: AdminExperienceItem): Promise<ActionResult> {
  const { role, org, period, desc, sort } = item;
  if (!role.trim()) return { ok: false, error: "Role is required" };
  return upsertRow(
    "experience",
    {
      role: role.trim(),
      org: org.trim(),
      period: period.trim(),
      desc: desc.trim(),
      sort,
    },
    item.id
  );
}

export async function deleteExperienceItem(id: string): Promise<ActionResult> {
  return removeRow("experience", id);
}

export async function listTestimonials(): Promise<ActionResult & { rows?: AdminTestimonial[] }> {
  return listRows<AdminTestimonial>("testimonials");
}

export async function saveTestimonial(t: AdminTestimonial): Promise<ActionResult> {
  const { quote, name, role, rating, sort } = t;
  if (!quote.trim()) return { ok: false, error: "Quote is required" };
  return upsertRow(
    "testimonials",
    { quote: quote.trim(), name: name.trim(), role: role.trim(), rating, sort },
    t.id
  );
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  return removeRow("testimonials", id);
}

export async function getSection(
  key: SectionKey
): Promise<ActionResult & { value?: SectionValue }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("sections")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, value: (data?.value ?? {}) as SectionValue };
}

export async function saveSection(
  key: SectionKey,
  value: SectionValue
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("sections")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}