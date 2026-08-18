"use client";

import { useEffect, useState } from "react";
import { getSetting, getSettingsMap, saveContactSettings, saveSetting } from "@/app/actions/admin";
import en from "@/messages/en.json";

const inputClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-soft/50 focus:border-nebula/60";

const labelClass =
  "mb-2 block font-mono text-xs uppercase tracking-widest text-soft";

function isPlain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeDeep(base: unknown, override: unknown): Record<string, unknown> {
  if (!isPlain(override)) return isPlain(base) ? base : {};
  const out: Record<string, unknown> = { ...(isPlain(base) ? base : {}) };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlain(value) && isPlain(out[key]) ? mergeDeep(out[key], value) : value;
  }
  return out;
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, p) => {
    if (isPlain(acc)) return acc[p];
    return undefined;
  }, obj);
}

function updatePath(
  state: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const next = structuredClone(state);
  const parts = path.split(".");
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = isPlain(cur[parts[i]]) ? cur[parts[i]] : {};
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

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

function defaultContent(): Record<string, unknown> {
  return mergeDeep(en, {
    marquee: { items: MARQUEE_DEFAULT },
    wordDividers: { build: ["Build", "Create", "Ship"], design: ["Design", "Code", "Repeat"] },
    skills: { rings: RINGS_DEFAULT },
  });
}

type FieldDef = {
  path: string;
  label: string;
  textarea?: boolean;
  lines?: boolean;
};

type CardDef = { ns: string; title: string; fields: FieldDef[] };

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CARDS: CardDef[] = [
  {
    ns: "meta",
    title: "Meta / SEO",
    fields: [
      { path: "title", label: "Title" },
      { path: "description", label: "Description", textarea: true },
      { path: "ogDescription", label: "OG description", textarea: true },
    ],
  },
  {
    ns: "nav",
    title: "Navigation",
    fields: ["home", "about", "projects", "skills", "experience", "blog", "contact", "hire"].map(
      (k) => ({ path: k, label: cap(k) })
    ),
  },
  {
    ns: "hero",
    title: "Hero copy (roles / subtitle / status live in Sections → Hero)",
    fields: [
      { path: "greet", label: "Greeting" },
      { path: "name", label: "Name" },
      { path: "ctaWork", label: "CTA — explore work" },
      { path: "ctaCv", label: "CTA — download CV" },
      { path: "openToWork", label: "Open-to-work pill" },
      { path: "visitors", label: "Visitors label" },
      { path: "scroll", label: "Scroll label" },
      { path: "view", label: "View" },
      { path: "visit", label: "Visit" },
    ],
  },
  {
    ns: "about",
    title: "About copy (stats / badges / terminal lines live in Sections → About)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "terminalTitle", label: "Terminal title" },
    ],
  },
  {
    ns: "statement",
    title: "Statement",
    fields: [
      { path: "line1", label: "Line 1" },
      { path: "line2", label: "Line 2" },
      { path: "line3", label: "Line 3" },
      { path: "ghost", label: "Ghost text" },
    ],
  },
  {
    ns: "preloader",
    title: "Preloader",
    fields: [
      { path: "loading", label: "Loading text" },
      { path: "loadingFonts", label: "Loading fonts status" },
      { path: "fontsOk", label: "Fonts done status" },
      { path: "renderingData", label: "Rendering data status" },
      { path: "dataOk", label: "Data done status" },
      { path: "renderingScenes", label: "Rendering scenes status" },
      { path: "scenesOk", label: "Scenes done status" },
    ],
  },
  {
    ns: "services",
    title: "Services section (cards live in Sections → Services)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
    ],
  },
  {
    ns: "process",
    title: "Process section (steps live in Sections → Process)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
    ],
  },
  {
    ns: "experience",
    title: "Experience section (entries live in Sections → Experience)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
    ],
  },
  {
    ns: "skills",
    title: "Skills section + orbit rings",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
      { path: "frontend", label: "Frontend ring label" },
      { path: "backend", label: "Backend ring label" },
      { path: "ai", label: "AI ring label" },
      { path: "python", label: "Python ring label" },
      { path: "rings.frontend", label: "Frontend chips (one per line)", lines: true },
      { path: "rings.backend", label: "Backend chips (one per line)", lines: true },
      { path: "rings.ai", label: "AI chips (one per line)", lines: true },
      { path: "rings.python", label: "Python chips (one per line)", lines: true },
    ],
  },
  {
    ns: "projects",
    title: "Projects section (cards live in Projects tab)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
      { path: "featured", label: "Featured badge" },
      { path: "code", label: "Code" },
      { path: "live", label: "Live" },
      { path: "more", label: "More card title" },
      { path: "moreDesc", label: "More card description" },
      { path: "visitGitHub", label: "Visit GitHub" },
    ],
  },
  {
    ns: "blog",
    title: "Blog section (posts live in Blog tab)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
      { path: "read", label: "Read article" },
      { path: "readTime", label: "Read time suffix" },
      { path: "all", label: "All posts" },
      { path: "viewAll", label: "View all" },
    ],
  },
  {
    ns: "testimonials",
    title: "Testimonials section (cards live in Sections → Testimonials)",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
    ],
  },
  {
    ns: "cta",
    title: "CTA band",
    fields: [
      { path: "title", label: "Title" },
      { path: "title2", label: "Title 2" },
      { path: "sub", label: "Subtitle" },
      { path: "button", label: "Button" },
    ],
  },
  {
    ns: "contact",
    title: "Contact section",
    fields: [
      { path: "label", label: "Label" },
      { path: "heading", label: "Heading" },
      { path: "sub", label: "Subtitle" },
      { path: "name", label: "Name placeholder" },
      { path: "email", label: "Email placeholder" },
      { path: "message", label: "Message placeholder" },
      { path: "send", label: "Send button" },
      { path: "sending", label: "Sending label" },
      { path: "successTitle", label: "Success title" },
      { path: "successDesc", label: "Success description" },
      { path: "sendAnother", label: "Send another" },
      { path: "emailLabel", label: "Email label" },
      { path: "locationLabel", label: "Location label" },
      { path: "followLabel", label: "Follow label" },
      { path: "confirmSubject", label: "Confirm email subject" },
      { path: "confirmGreeting", label: "Confirm email greeting" },
      { path: "confirmBody", label: "Confirm email body" },
      { path: "confirmSignature", label: "Confirm email signature" },
      { path: "errors.name", label: "Error — name" },
      { path: "errors.email", label: "Error — email" },
      { path: "errors.message", label: "Error — message" },
    ],
  },
  {
    ns: "footer",
    title: "Footer",
    fields: [
      { path: "rights", label: "Rights" },
      { path: "built", label: "Built with" },
      { path: "top", label: "Back to top" },
      { path: "visitors", label: "Visitors label" },
    ],
  },
  {
    ns: "notFound",
    title: "404 page",
    fields: [
      { path: "title", label: "Title" },
      { path: "desc", label: "Description" },
      { path: "back", label: "Back button" },
    ],
  },
  {
    ns: "marquee",
    title: "Marquee ticker",
    fields: [{ path: "items", label: "Items (one per line)", lines: true }],
  },
  {
    ns: "wordDividers",
    title: "Word dividers",
    fields: [
      { path: "build", label: "Divider 1 words (one per line)", lines: true },
      { path: "design", label: "Divider 2 words (one per line)", lines: true },
    ],
  },
];

function SiteContentEditor() {
  const [content, setContent] = useState<Record<string, unknown>>(defaultContent);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSetting("site_content").then((res) => {
      if (res.ok && res.value && Object.keys(res.value).length > 0) {
        setContent(mergeDeep(defaultContent(), res.value));
      } else if (!res.ok) {
        setError(res.error);
      }
      setLoaded(true);
    });
  }, []);

  function update(ns: string, field: string, raw: string) {
    setContent((prev) => {
      const path = `${ns}.${field}`;
      const current = getPath(prev, path);
      const nextValue =
        Array.isArray(current) && typeof current[0] === "string"
          ? raw.split("\n").map((l) => l.trim()).filter(Boolean)
          : raw;
      return updatePath(prev, path, nextValue);
    });
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSetting("site_content", content);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  function handleReset() {
    setContent(defaultContent());
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-soft">
          Every site string — saved to the database, published within 60s
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-line bg-surface px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-soft transition-colors hover:text-ink"
          >
            Reset to defaults
          </button>
          <button
            type="submit"
            disabled={saving || !loaded}
            className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save all content"}
          </button>
        </div>
      </div>

      {saved && <p className="text-sm text-emerald-400">Saved — the site will update within 60s</p>}
      {error && (
        <p className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {CARDS.map((card) => (
        <div key={card.ns} className="rounded-3xl border border-line bg-surface p-6">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-nebula">
            {card.title}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {card.fields.map((field) => {
              const current = getPath(content, `${card.ns}.${field.path}`);
              const value =
                Array.isArray(current) && typeof current[0] === "string"
                  ? current.join("\n")
                  : String(current ?? "");
              return (
                <div key={field.path} className={field.lines || field.textarea ? "sm:col-span-2" : ""}>
                  <label className={labelClass}>{field.label}</label>
                  {field.lines ? (
                    <textarea
                      className={`${inputClass} resize-none font-mono text-xs`}
                      rows={5}
                      value={value}
                      onChange={(e) => update(card.ns, field.path, e.target.value)}
                    />
                  ) : field.textarea ? (
                    <textarea
                      className={`${inputClass} resize-none`}
                      rows={2}
                      value={value}
                      onChange={(e) => update(card.ns, field.path, e.target.value)}
                    />
                  ) : (
                    <input
                      className={inputClass}
                      value={value}
                      onChange={(e) => update(card.ns, field.path, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </form>
  );
}

function ProfileEditor() {
  const [profile, setProfile] = useState({
    name: "",
    shortName: "",
    role: "",
    location: "",
    education: "",
    github: "",
    linkedin: "",
    email: "",
    url: "",
    cvPath: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSetting("site").then((res) => {
      if (res.ok && res.value && Object.keys(res.value).length > 0) {
        setProfile((prev) => ({ ...prev, ...(res.value as Record<string, string>) }));
      }
      setLoaded(true);
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveSetting("site", profile);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  const fields: { key: keyof typeof profile; label: string }[] = [
    { key: "name", label: "Full Name" },
    { key: "shortName", label: "Short Name" },
    { key: "role", label: "Role" },
    { key: "location", label: "Location" },
    { key: "education", label: "Education" },
    { key: "github", label: "GitHub URL" },
    { key: "linkedin", label: "LinkedIn URL" },
    { key: "email", label: "Email" },
    { key: "url", label: "Site URL" },
    { key: "cvPath", label: "CV Path (e.g. /cv/file.pdf)" },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-3xl border border-line bg-surface p-6">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-nebula">
          Profile / Identity — drives name, socials, CV link across the entire site
        </p>

        {error && (
          <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className={labelClass}>{f.label}</label>
              <input
                className={inputClass}
                value={profile[f.key]}
                onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || !loaded}
            className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && <p className="text-sm text-emerald-400">Saved</p>}
        </div>
      </div>
    </form>
  );
}

export function SettingsManager() {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsMap().then((res) => {
      if (res.ok) {
        setEmail(res.contact?.email ?? "");
        setLocation(res.contact?.location ?? "");
        setAvailability(res.contact?.availability ?? "");
        setLoaded(true);
      } else if (!res.ok) {
        setError(res.error);
        setLoaded(true);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await saveContactSettings({ email, location, availability });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-soft">
            Contact info — shown in the contact section
          </p>

          {error && (
            <p className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                className={inputClass}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Savar, Dhaka, Bangladesh"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className={labelClass}>Availability</label>
            <input
              className={inputClass}
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Currently open to freelance & full-time opportunities"
            />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={saving || !loaded}
              className="rounded-2xl bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-bg transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {saved && <p className="text-sm text-emerald-400">Saved</p>}
          </div>
        </div>
      </form>

      <SiteContentEditor />

      <ProfileEditor />
    </div>
  );
}