"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidate() {
  revalidatePath("/", "layout");
}

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
  homepage: string | null;
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
  revalidate();
  return { ok: true };
}

export async function deleteBlog(id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function listProjects(): Promise<ActionResult & { projects?: AdminProject[] }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("sort", { ascending: true });

  if (error) {
    console.error("[admin/listProjects] Supabase error:", error.message);
    return { ok: false, error: error.message };
  }
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

  if (error) {
    console.error("[admin/saveProject] Supabase error:", error.message);
    return { ok: false, error: error.message };
  }
  revalidate();
  return { ok: true };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    console.error("[admin/deleteProject] Supabase error:", error.message);
    return { ok: false, error: error.message };
  }
  revalidate();
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
  revalidate();
  return { ok: true };
}

export async function getSetting(
  key: string
): Promise<ActionResult & { value?: Record<string, unknown> }> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, value: (data?.value ?? {}) as Record<string, unknown> };
}

export async function saveSetting(
  key: string,
  value: Record<string, unknown>
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
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
      homepage: string | null;
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
        homepage: r.homepage,
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
  revalidate();
  return { ok: true };
}

async function removeRow(table: string, id: string): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
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
  revalidate();
  return { ok: true };
}

// ─── Password Recovery ───────────────────────────────────────────────────────

import { createAdminClient } from "@/lib/supabase/admin";

export async function getRecoveryEmails(): Promise<
  ActionResult & { emails?: string[] }
> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "recovery_emails")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };

  const emails = (data?.value?.emails as string[]) ?? [];
  return { ok: true, emails };
}

export async function saveRecoveryEmails(
  emails: string[]
): Promise<ActionResult> {
  const supabase = await requireClient();
  if (!supabase) return { ok: false, error: "Unauthorized" };

  if (emails.length > 3) {
    return { ok: false, error: "Maximum 3 recovery emails allowed" };
  }

  const sanitized = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key: "recovery_emails", value: { emails: sanitized } },
      { onConflict: "key" }
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function requestPasswordReset(
  email: string
): Promise<ActionResult> {
  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) return { ok: false, error: "Admin client not configured" };

  // Check if email is in recovery list
  const { data: recoveryData } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("key", "recovery_emails")
    .maybeSingle();

  const recoveryEmails =
    (recoveryData?.value?.emails as string[]) ?? [];
  let isAuthorized = recoveryEmails.includes(email.toLowerCase());

  // Also check if email is an existing admin user
  if (!isAuthorized) {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const matchingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (matchingUser) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    // Still return success to prevent email enumeration
    return { ok: true };
  }

  // Use Supabase's resetPasswordForEmail which sends an actual email
  // Create a client with the user's session to trigger the reset
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, error: "Supabase not configured" };
  }

  // Create a client to call resetPasswordForEmail
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://metariqul.vercel.app";

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/admin/reset-password`,
  });

  if (error) {
    console.error("[requestPasswordReset] error:", error.message);
    // Still return success to prevent email enumeration
  }

  return { ok: true };
}

export async function verifyResetToken(
  token: string
): Promise<ActionResult & { email?: string }> {
  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) return { ok: false, error: "Admin client not configured" };

  const { data, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("email, expires_at, used")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "Invalid or expired reset link" };
  }

  if (data.used) {
    return { ok: false, error: "This reset link has already been used" };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { ok: false, error: "This reset link has expired" };
  }

  return { ok: true, email: data.email };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ActionResult> {
  const supabaseAdmin = createAdminClient();
  if (!supabaseAdmin) return { ok: false, error: "Admin client not configured" };

  // Verify token
  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("email, expires_at, used")
    .eq("token", token)
    .maybeSingle();

  if (tokenError || !tokenData) {
    return { ok: false, error: "Invalid reset link" };
  }

  if (tokenData.used) {
    return { ok: false, error: "Reset link already used" };
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return { ok: false, error: "Reset link expired" };
  }

  if (newPassword.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  // Find user by email and update password
  const { data: usersData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    return { ok: false, error: "Failed to verify user" };
  }

  const user = usersData.users.find(
    (u) => u.email?.toLowerCase() === tokenData.email.toLowerCase()
  );
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // Mark token as used
  await supabaseAdmin
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("token", token);

  return { ok: true };
}