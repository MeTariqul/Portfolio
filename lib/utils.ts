import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Replaces {token} placeholders in a copy string: fill("{n} min read",
// { n: 5 }) → "5 min read". Unknown tokens are left alone so a typo in one
// place never eats a word.
export function fill(
  template: string,
  tokens: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in tokens ? String(tokens[name]) : match,
  );
}
