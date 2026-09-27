# AGENTS.md — Project Metadata & Developer Guide

> This file is the authoritative reference for **any AI model or developer** working on this repository.
> Read it first — it explains the architecture, conventions, and traps that are NOT obvious from the code alone.
>
> **Maintenance rule (mandatory):** update this file at the END of every work session to reflect anything
> that changed (new components/files, renamed or removed sections, new conventions, verification results,
> new placeholders). The file must never describe a stale state. Last updated: 2026-09-27 (MASTER SEO pass: crawlable nav links, WebPage JSON-LD everywhere, branded og/twitter titles, CSP img-src fix, a11y contrast fixes, notFound hardening — see §5.11).

---

## 1. Project Snapshot

**What this is:** A single-page, dark-mode, cinematic portfolio website for **Md. Tariqul Islam** — a full-stack web developer (Next.js/React/TypeScript + Python/AI) from Savar, Dhaka, Bangladesh.

**Stack (from `package.json`):**

| Area | Tech |
|---|---|
| Framework | Next.js **16.3.1** (Turbopack, App Router) |
| React | 19.2.8 |
| Language | TypeScript 5 (strict), `@/*` → `./src/*` path alias |
| Styling | Tailwind CSS **v4** (`@import "tailwindcss"`, `@theme inline` tokens) |
| i18n | next-intl 4.13.6 — single locale `en`, prefix `as-needed` |
| Animation | framer-motion 13, Lenis 1.3 (smooth scroll) |
| 3D | three 0.185, @react-three/fiber 9, drei 10.7, @react-three/postprocessing 3.0.5 |
| Forms | react-hook-form + zod |
| Auth/data | Supabase (@supabase/supabase-js + @supabase/ssr) — admin login + CMS storage (9 tables: messages/blogs/projects/settings/services/process/experience/testimonials/sections) |
| Email | resend (admin notification) + Brevo REST API (user confirmation email) |
| Analytics/ops | @upstash/redis (visitor counter), @vercel/og (devDep, OG image generator), @vercel/analytics + @vercel/speed-insights (Vercel Web Analytics / Speed Insights — dashboard-enabled, rendered in `[locale]/layout.tsx`) |
| Icons | lucide-react + custom `brand-icons.tsx` |

**Commands:**

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build (SSG; /api/visitors is dynamic)
npm run start        # serve production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npm run seed         # scripts/seed-content.mjs — (re)seeds settings.site_content + sections.hero/about from en.json + code constants (idempotent upserts)
npm run generate:og  # regenerates public/opengraph.png via @vercel/og
npm run generate:cv  # CV generator (scripts/generate-cv.mjs)
```

**Environment (`.env` — copy from `.env.example`, NEVER commit):**

```bash
RESEND_API_KEY=...        # contact form admin notification; without it form runs in demo mode
CONTACT_EMAIL=...         # recipient for contact form + Brevo sender (must be verified in Brevo)
KV_REST_API_URL=...       # Upstash Redis REST URL
KV_REST_API_TOKEN=...     # Upstash Redis REST token
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL (public — inlined client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=...       # SERVER ONLY — never expose client-side (contact inserts)
BREVO_API_KEY=...         # Brevo transactional API key (user confirmation emails)
```

All services degrade gracefully when unset: the form falls back to demo mode (records attempts, stores/sends nothing), the visitor counter hides itself, and `/admin` shows a "not configured" login card. Note the `NEXT_PUBLIC_` prefix is REQUIRED for browser-accessible Supabase keys (client bundle inlining).

---

## 2. Architecture & File Map

```
next.config.ts        # next-intl plugin + security headers (env-aware CSP)
eslint.config.mjs     # flat config; ignores .next/out/build/next-env.d.ts
tsconfig.json         # strict; @/* alias; "next" plugin
postcss.config.mjs    # tailwindcss v4 postcss plugin
.npmrc                # allow-scripts=  → installs require explicit opt-in (see §7)
.env.example          # documented env keys (see §1)
scripts/
  generate-og.mjs     # renders public/opengraph.png (React.createElement, no JSX — do NOT add JSX)
  generate-cv.mjs     # CV generator
  seed-content.mjs    # (re)seeds settings.site_content + sections.hero/about into the live DB (npm run seed)
docs/
  user-manual.md      # END-USER manual for all pages + admin panel (how to edit every piece of content)
  quality-report.md   # Quality assessment report (2026-08-18, 30/30 checks passed) — see §8
public/
  opengraph.png       # STATIC OG image (no dynamic /opengraph-image route — Turbopack can't run it)
  cv/Md-Tariqul-Islam-CV.pdf
  icon.svg            # favicon
src/
  app/
    layout.tsx        # ROOT layout: metadata + viewport(themeColor) ONLY; renders children (locale layout)
    globals.css       # Tailwind v4 import + @theme tokens + keyframes + noise overlay
    [locale]/
      layout.tsx      # fonts (Space Grotesk/Inter/JetBrains Mono via next/font), Providers, Navbar, Footer — passes DB-merged messages (getMergedMessages) to NextIntlClientProvider
      page.tsx        # HOME: Preloader(waitForScenes) + all 9 sections + generateMetadata (DB-merged meta, OG/Twitter images)
      blog/page.tsx   # blog index (ISR, revalidate 60 — DB via content.ts, falls back to posts.ts; metadata from merged messages)
      blog/[slug]/page.tsx  # blog post (dynamic, revalidate 60 — DB via content.ts, falls back to posts.ts; no generateStaticParams)
      projects/page.tsx    # PROJECTS listing (SSG, revalidate 60 — getAllProjects(): DB rows, else en.json projects.items; BreadcrumbList+ItemList JSON-LD)
      projects/[slug]/page.tsx # project detail (dynamic, revalidate 60 — slug = projectSlug(title); notFound() on unknown; CreativeWork/SoftwareSourceCode + BreadcrumbList JSON-LD)
    api/visitors/route.ts  # Upstash visitor counter (GET)
    admin/                # ADMIN PANEL — outside [locale], excluded from proxy/sitemap/robots (§5.8)
      page.tsx            # server: session ? <AdminDashboard/> : <LoginForm/> (dynamic, noindex)
      login-form.tsx      # client: supabase.auth.signInWithPassword
      dashboard.tsx       # client: tabbed CMS (Messages / Blog / Projects / Settings) + sign out
      blog-manager.tsx    # client: blog CRUD (list, JSON blocks editor, featured/published flags)
      projects-manager.tsx# client: project CRUD + GitHub repo sync/import (§5.9)
      sections-manager.tsx# client: Sections CMS — Services/Process/Experience/Testimonials CRUD + Hero/About editors (§5.8)
      settings-manager.tsx# client: Settings CMS — contact editor + FULL site-content editor (every en.json namespace + marquee items, word dividers, skills rings; deep-merges DB over en.json defaults, saves the whole snapshot) (§5.8)
    actions/
      send-contact.ts     # server action: Supabase insert + Brevo confirm + Resend notify — email copy from MERGED messages (§5.5)
      admin.ts            # server actions: messages CRUD + blog/project/section/settings CRUD + getSetting/saveSetting + GitHub fetch (§5.8/5.9)
  proxy.ts                # next-intl middleware (Next 16 renamed it) — admin excluded from matcher
  components/         # all client components (see §3 for the section list)
  i18n/
    routing.ts        # locales: ["en"], defaultLocale "en", prefix "as-needed"
    navigation.ts     # typed <Link>/useRouter wrappers (use for ALL navigation)
  lib/
    site.ts           # CENTRAL identity config (name, github, email, url…) — defaults overridden by DB `settings.site` row via getSite()
    posts.ts          # STATIC FALLBACK blog posts (4 posts; frontmatter-style objects)
    content.ts        # SERVER-ONLY content layer: getBlogPosts/getBlogPost/getProjects/getSettings + getServices/getProcessSteps/getExperience/getTestimonials/getHero/getAbout/getSite/getSiteContent + getAllProjects/getProjectBySlug/projectSlug (§5.9) — home + blog + projects pages use it
    messages.ts       # SERVER-ONLY: imports en.json, mergeDeep + getMergedMessages() (DB site_content deep-merged over en.json — the messages handed to the provider) + getMetaContent() (§5.9)
    utils.ts          # cn() = clsx + tailwind-merge
    lenis-store.ts    # module-scope Lenis singleton + hardened scrollToId() (§5)
    render-store.ts   # scene-ready pub/sub used by the preloader (§5)
    use-frameloop-on-view.ts  # IntersectionObserver hook → frameloop "never"/"always" (§5)
    supabase/
      client.ts       # createBrowserClient (login form — NEXT_PUBLIC_ keys only)
      server.ts       # createServerClient with cookie session (admin page + admin actions)
      admin.ts        # service-role client (createAdminClient) — SERVER-ONLY imports (§5.8)
  structured-data.tsx (in components/)  # SERVER-usable JSON-LD helpers: BreadcrumbJsonLd/FaqJsonLd/ItemListJsonLd/ProjectJsonLd/WebPageJsonLd + homeCrumb() (§5.10)
  messages/en.json    # ALL user-facing copy, namespaced per section (§4)
```

**Data flow (important):** user-facing strings live **only** in `src/messages/en.json` and are read with `useTranslations("namespace")` (client) or `getTranslations` (server). Since the full-site content store, the messages handed to the NextIntlClientProvider are `getMergedMessages()` — the DB row `settings.site_content` (a full en.json snapshot + `marquee.items`, `wordDividers.build/design`, `skills.rings`) deep-merged over `src/messages/en.json` — so every `useTranslations` call is DB-aware. Components never hardcode copy; identity/link config lives in `src/lib/site.ts`. Editable content (blogs/projects/services/process/experience/testimonials/hero/about/sections + ALL site copy) is served by `src/lib/content.ts` with static fallbacks — never edit content inside admin-facing components directly. Run `npm run seed` to re-sync the DB snapshot from en.json + code constants (after en.json edits).

**Routes:** `/` (canonical; with `localePrefix: "as-needed"` the `/en`-prefixed URLs **307-redirect to the unprefixed ones** — `/en` → `/`, `/en/about` → `/about`; AGENTS' older "redirects to /en" claim was wrong, verified 2026-09-26), `/about`, `/blog`, `/blog/[slug]` (dynamic — DB-first, static fallback), `/projects` (SSG), `/projects/[slug]` (dynamic), `/crazy-time` + `/crazy-time/[id]`, `/admin` (dynamic, noindex — outside the locale tree), `/api/visitors`, plus `robots.txt` (disallows `/admin`, explicit Googlebot/Bingbot/CCBot/OAI/GPTBot rules), `sitemap.xml` (ISR revalidate 1h — includes /projects + project detail URLs), `manifest.webmanifest` (auto-generated by Next), `llms.txt` (static AI summary in `public/`).

---

## 3. Design System

**Theme tokens (`globals.css` `@theme inline`):** colors are CSS vars → Tailwind names:

| Var | Tailwind class | Value |
|---|---|---|
| `--bg` | `bg-bg` | `#05060a` |
| `--surface` | `bg-surface` | `#0b0d15` |
| `--border` | `border-line` | `rgba(255,255,255,0.09)` |
| `--text` | `text-ink` | `#f4f4f5` |
| `--muted` | `text-soft` | `rgba(244,244,245,0.62)` |
| `--accent` | `text-nebula` | `#8b5cf6` (violet) |
| `--accent-2` | `text-neon` | `#ec4899` (pink) |
| `--accent-3` | `text-aqua` | `#22d3ee` (cyan) |

**Fonts:** `font-display` = Space Grotesk, `font-body` = Inter (default), `font-mono` = JetBrains Mono. All self-hosted via `next/font/google`.

**Signature styles:** `glass` / `glass-strong` panels, `gradient-text` (nebula→neon→aqua), gradient hairline dividers, `noise-overlay` global div, rounded-3xl cards with hover glow + sliding gradient underline. Sections use a numbered `SectionHeading` (`01`–`09`) with `WordReveal` titles.

**Visual identity rules:** dark-only, English-only, no emojis, no images beyond SVG/favicon/OG — visuals are CSS + WebGL. `prefers-reduced-motion` disables Lenis (native scroll remains). Custom cursor was deliberately removed; do not re-add.

---

## 4. Content Structure (Home Page)

Section order in `src/app/[locale]/page.tsx` (ids + heading numbers are coordinated — keep them sequential):

| # | id | Component | en.json ns |
|---|---|---|---|
| — | — | `Preloader` (waitForScenes) | — |
| — | — | `Hero` (+ `HeroScene` 3D canvas) | `hero` |
| — | — | `Marquee` (tech ticker — items from `site_content.marquee.items`) | `marquee`* |
| — | — | `Statement` | `statement` |
| 01 | `about` | `About` (photo card + `Terminal` + counters + badges) | `about` |
| 02 | `services` | `Services` (5 cards) | `services` |
| — | — | `WordDivider` (`site_content.wordDividers.build` → ["Build","Create","Ship"]) | `wordDividers`* |
| 03 | `projects` | `Projects` (sticky pinned horizontal scroll, 6 cards + GitHub tile) | `projects` |
| 04 | `skills` | `Skills` (3D orbit rings — `site_content.skills.rings` + labels) | `skills` |
| 05 | `process` | `Process` (sticky pin, 4 steps) | `process` |
| 06 | `experience` | `Experience` (timeline) | `experience` |
| — | — | `WordDivider` (`site_content.wordDividers.design` → ["Design","Code","Repeat"]) | `wordDividers`* |
| 07 | `blog` | `BlogSection` (featured + 2 more, "View all" → /blog) | `blog` |
| 08 | `testimonials` | `Testimonials` (auto-rotating — section HIDES entirely when no reviews exist; only real reviews, added via admin Sections → Testimonials) | `testimonials` |
| — | — | `CtaBand` | `cta` |
| 09 | `contact` | `Contact` (+ `ContactForm`) | `contact` |
| — | — | `Footer` (visitor count) | `footer` |

> `*` = namespaces that exist ONLY in `settings.site_content` (added by `mergeDeep` in `messages.ts`); they are NOT in `src/messages/en.json` (marquee items, word dividers, skills rings are code constants seeded by `scripts/seed-content.mjs`).

> Note: `#fuel` (movies) and `#lab` (creative posters) sections were **removed** deliberately — the site is strictly developer-focused. Do not re-add entertainment content.

**Adding content (the common tasks):**
- **Any user-facing string (meta, nav, hero, about, statement, sections' labels/headings, projects/blog section copy, cta, contact incl. confirmation email copy + error messages, footer, 404, marquee items, word dividers, skills rings):** edit at runtime from `/admin` → Settings tab → "Site content" editor (every namespace + marquee/wordDividers/skills rings; DB deep-merges over en.json, saves the whole snapshot). Sections-tab data (services/process/experience/testimonials cards, hero roles/subtitle/status, about stats/badges/terminal lines) is separate (§5.8).
- **After editing `en.json`:** run `npm run seed` to re-sync the DB snapshot (idempotent upserts of `settings.site_content` + `sections.hero/about`). The settings-manager "Reset to defaults" button re-applies the en.json snapshot client-side.
- **Project card / blog post / contact info / section content (services, process, experience, testimonials, hero, about):** editable at runtime from `/admin` (tabs: Projects / Blog / Sections / Settings). Static fallbacks live in `en.json` — DB wins when it has content. Do NOT edit admin manager components to change content.
- **New section:** create component with `<section id="...">`, add `SectionHeading` with the next number, register in `page.tsx`, add en.json namespace, optionally add to navbar `LINKS` array (navbar only lists: about, projects, skills, experience, blog, contact).

---

## 5. Special Systems (critical knowledge)

### 5.1 Preloader + scene readiness
- `Preloader` lives ONLY on the home page (`waitForScenes` prop). It shows a progress bar + status ticks (`fonts ✓`, `scenes ✓`) until: ≥1.6s elapsed, `document.readyState === "complete"`, `document.fonts.status === "loaded"`, and both 3D scenes reported ready via `render-store.ts` (7s safety cap).
- Scenes call `setSceneReady("hero"|"skills")` in `Canvas onCreated`; `SceneBoundary` (error boundary) calls the same via `onFallback` and renders `null` on failure so the preloader never hangs on a WebGL crash.
- Do NOT move the Preloader into the layout — blog pages have no scenes and would wait the full 7s.

### 5.2 3D scenes & performance (recently optimized — don't regress)
- Both scenes are mounted at page load (NOT gated by IntersectionObserver) and wrapped by `useFrameloopOnView` (`src/lib/use-frameloop-on-view.ts`): `frameloop="never"` when the canvas is out of view (120px margin), `"always"` when near. R3F v9 applies frameloop changes via re-configure — this is verified working.
- **Known side effect (by design):** the frameloop toggle re-runs drei `OrbitControls`' effect once, which disposes the controls from the `<canvas>` and re-connects them to the R3F wrapper div. Net result (verified in headless Edge): canvas `touch-action` ends as `auto` → mobile page scroll over the skills canvas works; desktop mouse drag-rotate still works via the div. `onCreated` sets `gl.domElement.style.touchAction = "pan-y"` as a deterministic guard. Don't "fix" this by force-setting `touchAction: none`.
- Mobile perf: hero `Stars` count drops 4200→1400 and DPR caps at 1.25 under 768px (`hero-scene.tsx`).
- Skills labels are **canvas-texture sprites** (`TextSprite` in `skills.tsx`) — NOT drei `<Text>` (troika-worker-utils broke the production build; troika must never come back).
- The site uses `dvh` units for full-viewport sections (hero/process/projects sticky) to avoid mobile URL-bar jumps.

### 5.3 Smooth scroll & cross-page navigation
- Lenis runs in `Providers` (skipped for reduced-motion users). The instance lives in `lenis-store.ts` (module singleton).
- `scrollToId(id)` (lenis-store) is the ONLY way to programmatically scroll: Lenis `scrollTo` with `offset: -72`, falling back to `scrollIntoView`.
- Sections exist only on the home page. The navbar `go(id)` (`navbar.tsx`) checks `document.getElementById(id)`; if missing it does `router.push("/#id")` via `@/i18n/navigation` (never plain next/router). `Providers` handles `hashchange` + initial hash; the Preloader re-scrolls to the hash 900ms after finishing.
- **Always use `@/i18n/navigation` (`Link`, `useRouter`)** for client-side navigation, not `next/link`.

### 5.4 Visitor counter (`/api/visitors`)
- Upstash Redis. 24h cookie `mt_visitor` dedupes unique counts; `mt_session` cookie + `visitors:live:*` keys with 3-min TTL track "live now" (SCAN pattern). Returns `{count, live}` or `{count:null, live:null}` without env config.
- `VisitorCount` (client) polls every 30s, renders nothing when data is null. Used in hero pill (live) + footer (total).

### 5.5 Contact form
- `react-hook-form` + zod (client) → `useActionState` server action `send-contact.ts` (3 steps, each optional): ① insert into Supabase `messages` via service-role client (bypasses RLS — inserts need no policy), ② Brevo confirmation email to the submitter (subject/body copy from MERGED `contact` messages — DB-aware via `getMergedMessages()`; `{name}` interpolation is a manual `.replace`), ③ Resend notification to `CONTACT_EMAIL`.
- Client validation GATES submission: `handleSubmit` builds a `FormData` and calls `formAction(fd)` inside `startTransition` (the native `action` prop is NOT used). Invalid fields show per-field messages; the server action validates again. Verified headless: invalid submit blocked client-side, valid submit renders the success card.
- `demo: true` is returned ONLY when none of the three ran (no keys) — UI shows a demo-mode notice. Success state resets the form.

### 5.6 Security & headers
- `next.config.ts` adds: CSP (dev gets `'unsafe-eval'`, prod does NOT — never enable unsafe-eval in prod), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS, DNS-prefetch, `poweredByHeader: false`.
- CSP `connect-src` is env-aware: when `NEXT_PUBLIC_SUPABASE_URL` is set, its hostname is appended (required for the browser-side auth call from `/admin`). Vercel Analytics hosts (`va.vercel-scripts.com`, `vitals.vercel-insights.com`, `*.vercel-insights.com` img) are always allowed — needed by `<Analytics/>`/`<SpeedInsights/>` in `[locale]/layout.tsx` (note: `/admin` is outside `[locale]` and is therefore NOT tracked — by design).
- `allowedDevOrigins: ["192.168.0.10"]` for LAN device testing on the dev server.
- `themeColor` lives in the `viewport` export of the root layout (Next 16 requirement — metadata export would warn).

### 5.7 Static OG image
- `public/opengraph.png` is generated by `scripts/generate-og.mjs` (`npm run generate:og`) using `@vercel/og` with `React.createElement` (no JSX in .mjs). Page metadata references it via `openGraph.images`/`twitter.images`. Do not recreate the dynamic `opengraph-image.tsx` route — it fails under Turbopack dev.

### 5.8 Admin panel (`/admin`) + content storage
- Route lives OUTSIDE `[locale]` (top-level, like `/api`): uses the ROOT layout only (no navbar/footer/fonts — plain system fonts there, by design). `export const dynamic = "force-dynamic"`, `robots: noindex`, and excluded from the next-intl proxy matcher (`src/proxy.ts` — keep `admin` in the negative lookahead), `robots.txt` (`Disallow: /admin`), and `sitemap.ts` (whitelist-based — never add it).
- Auth = **Supabase Auth email+password** (single admin user created in the Supabase dashboard). `login-form.tsx` calls `signInWithPassword` → `router.refresh()`. Page checks `supabase.auth.getUser()` server-side via cookie session (`createServerClient`).
- **Dashboard is a 5-tab CMS:** Messages (list/mark read/delete), Blog (`blog-manager.tsx` — CRUD + JSON blocks editor + featured/published flags + gradient picker), Projects (`projects-manager.tsx` — CRUD + GitHub repo sync/import), Sections (`sections-manager.tsx` — Services/Process/Experience/Testimonials CRUD + Hero/About forms), Settings (`settings-manager.tsx` — contact email/location/availability + **full "Site content" editor**: every en.json namespace + marquee items + word dividers + skills rings, config-driven via `CARDS`; loads the DB row via `getSetting("site_content")`, deep-merges it over en.json defaults, saves the whole snapshot via `saveSetting("site_content", …)`; lines fields are newline-joined arrays; "Reset to defaults" re-applies the en.json snapshot client-side). Tab UI is hardcoded English (outside locale tree, by design). All mutations call `revalidatePath("/", "layout")` for instant propagation.
- **Tables** (consolidated one-shot SQL in `supabase/init.sql` — messages + blogs + projects + settings + services + process + experience + testimonials + sections + RLS + seed settings row; run the whole file in SQL Editor, it is idempotent incl. policies via drop-if-exists):

```sql
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
-- blogs: id uuid pk, slug text unique, title, description, date, read_time int,
--        category, featured bool, gradient text, blocks jsonb, published bool default true
-- projects: id uuid pk, title, desc, tags text[], category, link, github, featured bool, sort int
-- services: id uuid pk, title, desc, tags text[], sort int
-- process: id uuid pk, title, desc, sort int
-- experience: id uuid pk, role, org, period, desc, sort int
-- testimonials: id uuid pk, quote, name, role, rating int, sort int
-- settings: key text pk, value jsonb  (rows: key='contact' {email,location,availability}; key='site_content' = FULL en.json snapshot + marquee.items + wordDividers.{build,design} + skills.rings — seeded by scripts/seed-content.mjs)
-- sections: key text pk, value jsonb  (rows: key='hero' value={roles[],subtitle,status}; key='about' value={stats[],badges[],terminalLines[]})
-- all: RLS enabled; public read via `using (true)`; write via `auth.uid() is not null`
```

- Server actions in `actions/admin.ts` run through the user-session client, so RLS applies (authenticated admin only): messages CRUD + `listBlogs/saveBlog/deleteBlog`, `listProjects/saveProject/deleteProject`, `getSettingsMap/saveContactSettings`, `getSetting(key)/saveSetting(key, value)` (generic settings — used by the site-content editor), section CRUD (`listServices/saveService/deleteService` + process/experience/testimonials equivalents, `getSection/saveSection` for hero/about), `getGithubRepos` (fetches `https://api.github.com/users/MeTariqul/repos`). All section actions are `async` — Next 16 requires server actions to be async functions (non-async wrappers break the build). Contact-form inserts use the **service-role** client (`lib/supabase/admin.ts`, `persistSession: false`) which bypasses RLS — that module must NEVER be imported from client code. When the page loads without Supabase env keys it renders the login card with a "not configured" note instead of crashing.

### 5.9 Content layer (DB-first with static fallback)
- `src/lib/content.ts` (SERVER-ONLY, service-role reads): `getBlogPosts()`, `getBlogPost(slug)`, `getProjects()`, `getSettings()`, `getServices()`, `getProcessSteps()`, `getExperience()`, `getTestimonials()`, `getHero()`, `getAbout()`, **`getSite()`**, **`getSiteContent()`** — each returns `null` when tables/keys are missing (never throws), and callers fall back to `src/lib/posts.ts` / `en.json` per-section namespaces / `src/lib/site.ts`. `getSite()` reads the `settings.site` row and merges with `site.ts` defaults. `getSiteContent()` reads the `settings.site_content` row.
- `src/lib/messages.ts` (SERVER-ONLY): imports `src/messages/en.json` (tsconfig has `resolveJsonModule: true`), `mergeDeep(base, override)`, `getMergedMessages()` = DB `site_content` deep-merged over en.json (used by `[locale]/layout.tsx` for the provider + `send-contact.ts` for email copy), `getMetaContent()` = merged `meta` namespace (used by `generateMetadata` on home + blog index).
- Home page (`[locale]/page.tsx`) + blog pages have `export const revalidate = 60` (ISR): DB content appears within 60s of admin edits. Home passes `Marquee items` / `WordDivider words` / `Skills rings` props from `getSiteContent()` (with code fallbacks). `blog/[slug]/page.tsx` is DYNAMIC (no `generateStaticParams` — slugs are DB-driven) and `notFound()`s on unknown slugs. Home passes props via `withItems()` (returns array as-is, `null`/`undefined` → fallback to en.json) and destructured `dbHero`/`dbAbout` fields. `sitemap.ts`, `robots.ts`, `manifest.ts` are now async and read `getSite()` for dynamic profile.
- **Instant admin revalidation:** every mutating server action in `actions/admin.ts` (incl. `saveSetting`) calls `revalidatePath("/", "layout")` after a successful DB write, so admin edits appear on the site without waiting for the 60s ISR interval.
- `getSettings()` maps the `settings.contact` row to email/location/availability; the Contact section renders those when present, else `site.ts`/en.json fallbacks. Do NOT revert blog pages to static-only — the fallback chain is the safety net.
- **Project helpers (2026-09-26):** `projectSlug(title)` (lowercase + NFKD-diacritics + hyphenate — used by the projects listing/detail pages AND `sitemap.ts`, so never change its algorithm without re-generating slugs), `getAllProjects()` (DB rows when non-empty, else `en.json` `projects.items`), `getProjectBySlug(slug)`. `/projects` pages, sitemap, and llms.txt all depend on these staying in sync.

### 5.10 AI/SEO discoverability layer (2026-09-26)
- **Identity copy decision (user-approved 2026-09-26, SUPERSEDED 2026-09-27):** the Master SEO prompt (§8/§9) mandates home meta title `Md. Tariqul Islam | Web Developer from Bangladesh` + an education-bearing description — this now overrides the earlier "keeps Full-Stack Web Developer" wording. `en.json` meta was rewritten accordingly AND re-seeded to `settings.site_content` (`npm run seed`, 2026-09-27). If the live meta shows keyword-stuffed copy again, someone re-edited it in `/admin` → Settings.
- **Structured data:** `src/components/structured-data.tsx` exports `BreadcrumbJsonLd`/`FaqJsonLd`/`ItemListJsonLd`/`ProjectJsonLd`/`homeCrumb` (server components, no `"use client"`). Wired: about = Breadcrumb+FAQPage, blog index = Breadcrumb+ItemList, blog post = Article+Breadcrumb (inline), projects index = Breadcrumb+ItemList, project detail = Breadcrumb+CreativeWork (`SoftwareSourceCode` + `codeRepository` when a github url exists), crazy-time index/detail = Breadcrumb, home = Person/WebSite/ProfilePage/ProfessionalService/SiteNavigationElement (`person-json-ld.tsx`). Do not duplicate these inline — extend the helpers.
- **Titles/canonicals:** home uses `title: { absolute }` (root layout template would otherwise append "| Md. Tariqul Islam" a second time); every page's canonical is on the UNPREFIXED path (`site.url + /route`, never `/en/...`); `aboutPage.title` must stay `"About"` (template appends the name). `og:url` = canonical on every page.
- **robots.ts** lists Googlebot, Bingbot/msnbot, CCBot, OAI-SearchBot, GPTBot, ChatGPT-User, Google-Extended, PerplexityBot, ClaudeBot, Anthropic-ai, Bytespider, `*` — all `Disallow: /admin`. **sitemap.ts** has `revalidate = 3600` (it is prerendered; without it project/blog URLs go stale until rebuild). `public/llms.txt` has a "Key Pages" section (/, /about, /projects, /blog).
- **Verified 2026-09-26:** typecheck ✓, lint ✓ (0 errors, 20 pre-existing `<img>` warnings), build ✓ (13/13), vitest `npm run test:run` ✓ (67/67), 32/32 HTTP metadata/JSON-LD checks, 18/18 headless-Chrome checks (375/768/1440 — no overflow, no console errors, nav Home→/projects→detail works). DB `projects` table now holds all 7 en.json projects (user-approved upsert: CoverVerse sort 0, AI Study Platform sort 2, Python Automation Suite sort 3).

### 5.11 MASTER SEO pass (2026-09-27)
- **Crawlable navigation (was all `<button>`s):** `navbar.tsx` now renders `<Link>` from `@/i18n/navigation` for every item (logo, desktop/mobile links, `/crazy-time`, Hire CTA); `handleNav(e,id)` still prevents default and calls `scrollToId` when the anchor exists on the home page, else `router.push`. `MotionLink = motion.create(Link)` keeps the animation wrapper. Footer got a real `<nav aria-label="Footer">` quick-links block (about/projects/blog/crazyTime via `tn` from the nav ns). `about.tsx` showMore is a `<Link href="/about">`. Home project cards: `page.tsx` maps DB/fallback projects with `slug: projectSlug(p.title)` and `projects.tsx` wraps each `<h3>` in `<Link href={/projects/${slug}}>`. Do NOT re-introduce plain `<button>` navigation.
- **WebPage JSON-LD:** `WebPageJsonLd(name, description, url)` helper in `structured-data.tsx`, wired into about, projects index/detail, blog index, crazy-time index/detail (blog post keeps Article — do not duplicate). Home relies on ProfilePage (a WebPage subtype).
- **Branded social titles:** every inner page's `openGraph.title` (and explicit `twitter.title` on blog/project detail) is `` `${title} | ${site.name}` `` — plain page titles gave un-branded social cards (`og:title="About"`). Root layout holds the fallback og values; home uses the absolute title. If you add a page with its own `openGraph.title`, suffix `site.name` the same way.
- **CSP `img-src` now includes the Supabase origin** (computed `supabaseHost`), mirroring `connect-src` — Supabase-Storage-hosted images (crazy-time uploads) were BLOCKED by CSP in production (console CSP violations, broken images) before this fix.
- **notFound hardening:** `/crazy-time/[id]` with an unknown id now `notFound()`s (was a 200 soft-404 with "Post not found." and no metadata).
- **A11y/contrast fixes (kept visual design):** decorative background numerals in process/services/blog/crazy-time got `aria-hidden`; statement caption `text-soft/60`→`text-soft`, projects Live label `text-soft/50`→`text-soft`; navbar logo `aria-label="MT — Md. Tariqul Islam, home"` (label-content-name mismatch); footer marquee watermark container `aria-hidden`. **Known accepted finding:** Lighthouse home a11y=96 because its axe fork still flags the 7%-opacity footer watermark text (contrast 1.12) even inside `aria-hidden` — axe-core itself passes it as decorative; do NOT brighten the watermark just to chase 100.
- **Meta copy (en.json, seeded):** `meta.title` = `Md. Tariqul Islam | Web Developer from Bangladesh`; `meta.description`/`ogDescription` = identity + Gono Bishwabidyalay CSE education line; `aboutPage.heading` = `About Md. Tariqul Islam` (`aboutPage.title` stays `"About"` for the template); aboutPage description/intro rewritten; terminal line = `Md. Tariqul Islam — Web Developer`. Root layout: `twitter.title/description` removed (they froze root values on every page — Next now falls back per page), dead `fonts.googleapis/gstatic` preconnects removed (self-hosted fonts only).
- **Images:** profile img has `width={400} height={400}` + descriptive alt; blog images use `loading="lazy" decoding="async"`.
- **Verified 2026-09-27 (local prod build, port 3100):** typecheck ✓, lint ✓ (0 errors/20 pre-existing img warnings), build ✓ 13/13, vitest 67/67, headless verify script 57/57 (36 viewport×page overflow checks at 320–1440, zero console errors incl. CSP, axe serious/critical clean on 6 pages, accessible link names, home→project-detail links present); Lighthouse (headless, lab): SEO 100 + a11y 100 on /about /projects /blog, home a11y 96 (watermark, see above), perf 90–92 on inner pages; home perf score ~36 in SIMULATED mobile mode is a SwiftShader/WebGL lab artifact (unthrottled: FCP 0.3s, LCP 1.9s = hero `p.mt-6` gated by the 1.6s preloader floor, CLS 0.002, main-thread "other" 43s = software-rendered 3D canvases) — re-measure live/on-GPU before treating it as a real score. Local HTTP audit: all statuses/canonicals/JSON-LD/og:title clean, `/en*` → 307 to unprefixed, `/admin` noindex, unknown slugs/ids → 404.
- **Verified LIVE 2026-09-27 after push `0dbcd87` (Vercel success):** full HTTP audit clean (0 fails — new titles/branded og:titles/WebPage JSON-LD/canonicals all serving, `/en*` 307, `/admin` noindex, `crazy-time/1`→404), CSP header on live now includes the Supabase host in `img-src` (test image → 200), headless suite **57/57 against production** (real Vercel analytics active, zero console errors). Live Lighthouse (headless lab): **SEO 100** on all 4 tested pages; **a11y 100 + BP 100** on /about (93 perf), /projects (95), /blog (92); home = 37 perf / 96 a11y (watermark) / 96 BP / 100 SEO, unthrottled home FCP 2.6s LCP 3.1s CLS 0.002 (TBT/TTI not computable — rAF loop never idles; home mobile-perf score remains a SwiftShader lab artifact).

---

## 6. Conventions & Guardrails (follow these)

1. **Copy:** every user-facing string → `src/messages/en.json`; read via `useTranslations`. Identity/links → `src/lib/site.ts`.
2. **Client vs server:** components with hooks/animation/3D get `"use client"` at the top. Server components (layout, page, blog pages) must not use hooks.
3. **Lint (strict, enforced):** ESLint next core-web-vitals + typescript. Known hard rules: `react-hooks/set-state-in-effect` (no synchronous setState in `useEffect` body — use async callbacks, IO observers, etc.), immutability rules, no unused vars. `require()` is banned in project files — test scripts live OUTSIDE the project (e.g. temp dirs) or in `scripts/*.mjs` with ESM imports.
4. **Comments:** do not add code comments unless explicitly asked.
5. **Tailwind v4:** no config file; theme via `@theme inline` in globals.css; arbitrary values like `min-h-dvh`, `pb-[max(env(safe-area-inset-bottom),2.5rem)]` are used deliberately (safe-area handling in navbar/footer/mobile menu).
6. **No `next lint` command exists** — use `npm run lint` (eslint) and `npm run typecheck`.
7. **Testing pattern:** headless verification uses `puppeteer-core` + system Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`), installed temporarily as a devDependency and REMOVED after (its absence keeps lint clean). Prod checks run `npm run start -- -p 3100` (never collide with the dev server on 3000).
8. **Windows/PowerShell traps for agents:** use `workdir` instead of `cd`; `-LiteralPath` is REQUIRED for paths with `[locale]` (wildcard chars); never name variables `$HOME`; avoid `&&` (use `; if ($?) { ... }`).

---

## 7. Known Placeholders / TODOs (outstanding work)

- `src/lib/site.ts`: `url` is `https://metariqul.vercel.app` (TODO: real domain) and `email` is `hello@metariqul.dev` — verify before launch. CV is at `public/cv/Md-Tariqul-Islam-CV.pdf` (real PDF already in place).
- **Admin panel setup (user-provided, in progress):** Supabase URL + publishable/secret keys are configured in `.env` (new `sb_publishable_`/`sb_secret_` key format, supported by supabase-js 2.112). Verified: both keys authenticate from Node (PowerShell gets 401 — Supabase's browser-protection on secret keys; this is expected), auth API is live. Brevo key + sender (`CONTACT_EMAIL = print-edge@outlook.com`, verified Brevo sender) configured and WORKING (test emails sent). Admin user `gbtarif37@gmail.com` created via Admin API (`email_confirm: true`) and login verified through a real headless-Edge browser session on the prod build (dashboard renders with all 5 tabs, real contact messages visible → the `messages` table EXISTS). **All 9 tables were created via the Management API** (project URL `https://zxumxmmoymxupfqxwvmd.supabase.co`, PAT `sbp_ebc35794...` — user was advised to REVOKE it after use) and verified; `settings` contains the seeded `contact` + `site_content` rows, `sections` has `hero` + `about`. `npm run seed` re-syncs `site_content` + hero/about from en.json + code constants (idempotent). The full-site content store E2E was verified headless (Aug 2026): editor loads DB values → save through the UI → `revalidatePath` + double-fetch serves the edit on `/en` → revert also propagates (4/4 checks; only expected localhost 404s for Vercel analytics scripts). STILL PENDING: Resend/Upstash keys; the deployed Vercel build is STALE (see below) so admin saves fail there until redeployed.
- CMS verification (headless Edge, prod build on 3100, Aug 2026): blog/projects/sections/settings tabs show graceful empty states + "table not found" banner; all 6 Sections sub-tabs (Services/Process/Experience/Testimonials/Hero/About) render + edit forms open; GitHub sync fetches real repos (factory_erp, Pixels-on-Paper, Running-Project…); blog post pages serve static fallback with unknown slugs → 404; typecheck + lint + build all green.
- The testimonials section is hidden by design until real client reviews exist (placeholder reviews were removed 2026-08-18 — never re-add fake testimonials; add real ones via admin Sections → Testimonials).
- `.env.example` values are examples — real keys go in `.env` (gitignored).
- **Vercel deployment (user-provided, pending):** repo is `MeTariqul/Portfolio` (main). Import in Vercel (framework auto-detects Next.js), copy ALL `.env` keys into Project → Settings → Environment Variables (`NEXT_PUBLIC_*` vars are inlined at build — required for the deployed site), then enable **Web Analytics** + **Speed Insights** in the project dashboard (components already render on all public pages; `/admin` is excluded by design). The current live deployment `portfolio-mauve-psi-hzxxy2n3ei.vercel.app` is STALE (no analytics script in HTML, old admin build — probably missing env vars); `metariqul.vercel.app` returns DEPLOYMENT_NOT_FOUND. Redeploy required before the deployed admin/analytics work.
- **Git safety rule (user directive):** commits need explicit user approval (granted 2026-09-26 → `b47e375` on `main`, the AI/SEO pass + previously-pending worktree changes); **pushes still require explicit approval** — and per global rules, ask which GitHub account (remote is `MeTariqul/Portfolio`) before every push. `OpenCode_CLI_Setup_Manual.pdf` in the repo root is unrelated and must stay untracked.
- The GitHub tile in Projects ("more" card) shows neutral copy in en.json (`projects.moreDesc`) — no numeric claims, since counts go stale (real public repo count was 15, not "20+").

## 8. Quick Verification Checklist (run before finishing any task)

```bash
npm run typecheck && npm run lint && npm run build && npm run test:run
```

Then, for UI/UX changes, verify with a headless browser (puppeteer-core + system Chrome/Edge, temp install with `--no-save`, script OUTSIDE the project) at 375px / 768px / 1440px: no horizontal overflow (`scrollWidth <= innerWidth`), no console errors (ignore `/_vercel/insights` + `/_vercel/speed-insights` 404s — expected off-Vercel), sections reachable, nav working. The 2026-09-26 pass: 32/32 metadata/JSON-LD checks + 18/18 browser checks + 67/67 vitest; the 2026-09-27 MASTER SEO pass: 57/57 headless checks + clean local HTTP audit + Lighthouse SEO 100 (details in §5.11); the 2026-08-18 quality assessment passed 30/30 (see `docs/quality-report.md`).

**Known layout trap:** `process.tsx` and `experience.tsx` slide cards in from `x: 48` (framer-motion `initial`), which pokes 28px past the viewport at 375px until scrolled into view. Both `<section>`s carry `overflow-x-clip` — do not remove it.