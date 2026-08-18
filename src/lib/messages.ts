import en from "@/messages/en.json";
import { getSiteContent } from "./content";

export type Messages = typeof en;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeDeep<T>(base: T, override: unknown): T {
  if (!isPlainObject(override)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override)) {
    const baseValue = out[key];
    out[key] =
      isPlainObject(value) && isPlainObject(baseValue)
        ? mergeDeep(baseValue, value)
        : value;
  }
  return out as T;
}

export async function getMergedMessages(): Promise<Messages> {
  const db = await getSiteContent();
  if (!db) return en;
  return mergeDeep(en, db);
}

export async function getMetaContent(): Promise<Messages["meta"]> {
  const messages = await getMergedMessages();
  return messages.meta;
}