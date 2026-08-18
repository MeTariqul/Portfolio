// Seeds ALL site content into Supabase: settings.site_content (full en.json snapshot
// + marquee/wordDividers/skills rings) and sections.hero / sections.about.
// Idempotent (upserts). Run: node scripts/seed-content.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    console.warn("WARN: .env not found — expecting real env vars");
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const en = JSON.parse(readFileSync(join(root, "src", "messages", "en.json"), "utf8"));

const MARQUEE_DEFAULT = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Redis",
  "Tailwind CSS",
  "Three.js",
  "Framer Motion",
  "AI / LLM",
  "Vercel",
  "Cloudflare",
];

const RINGS_DEFAULT = {
  frontend: ["React", "Next.js", "TypeScript", "Tailwind", "Framer Motion", "Three.js", "shadcn/ui", "Zustand"],
  backend: ["Node.js", "PostgreSQL", "Prisma", "Redis", "REST", "JWT", "Vercel", "Cloudflare"],
  ai: ["OpenAI", "Gemini", "LangChain", "OCR", "PDF", "RAG", "Pipelines", "Prompt Eng"],
  python: ["Python", "FastAPI", "Django", "pandas", "NumPy", "Selenium", "BeautifulSoup", "Scikit-learn"],
};

const siteContent = {
  ...en,
  marquee: { items: MARQUEE_DEFAULT },
  wordDividers: { build: ["Build", "Create", "Ship"], design: ["Design", "Code", "Repeat"] },
  skills: { ...en.skills, rings: RINGS_DEFAULT },
};

const supabase = createClient(url, key, { auth: { persistSession: false } });

const settingsRows = [{ key: "site_content", value: siteContent }];
const { error: settingsError } = await supabase
  .from("settings")
  .upsert(settingsRows, { onConflict: "key" });
if (settingsError) {
  console.error("ERROR upserting settings:", settingsError.message);
  process.exit(1);
}
console.log("OK settings.site_content upserted (", JSON.stringify(siteContent).length, "chars )");

const sectionsRows = [
  {
    key: "hero",
    value: {
      roles: en.hero.roles,
      subtitle: en.hero.subtitle,
      status: en.hero.status,
    },
  },
  {
    key: "about",
    value: {
      stats: en.about.stats,
      badges: en.about.badges,
      terminalLines: en.about.terminalLines,
    },
  },
];
const { error: sectionsError } = await supabase
  .from("sections")
  .upsert(sectionsRows, { onConflict: "key" });
if (sectionsError) {
  console.error("ERROR upserting sections:", sectionsError.message);
  process.exit(1);
}
console.log("OK sections.hero + sections.about upserted");