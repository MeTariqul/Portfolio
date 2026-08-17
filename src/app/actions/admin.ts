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