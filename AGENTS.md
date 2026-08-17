# AGENTS.md — Project Metadata & Developer Guide

> This file is the authoritative reference for **any AI model or developer** working on this repository.
> Read it first — it explains the architecture, conventions, and traps that are NOT obvious from the code alone.
>
> **Maintenance rule (mandatory):** update this file at the END of every work session to reflect anything
> that changed (new components/files, renamed or removed sections, new conventions, verification results,
> new placeholders). The file must never describe a stale state. Last updated: 2026-08-16.

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
| Auth/data | Supabase (@supabase/supabase-js + @supabase/ssr) — admin login + message storage |
| Email | resend (admin notification) + Brevo REST API (user confirmation email) |
| Analytics/ops | @upstash/redis (visitor counter), @vercel/og (devDep, OG image generator) |
| Icons | lucide-react + custom `brand-icons.tsx` |

**Commands:**

```bash
npm run dev          # dev server (Turbopack)
npm run build        # production build (SSG; /api/visitors is dynamic)
npm run start        # serve production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npm run generate:og  # regenerates public/opengraph.png via @vercel/og
npm run generate:cv  # CV generator (scripts/generate-cv.mjs)
```

**Environment (`.env.local` — copy from `.env.example`, NEVER commit):**

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
public/
  opengraph.png       # STATIC OG image (no dynamic /opengraph-image route — Turbopack can't run it)
  cv/Md-Tariqul-Islam-CV.pdf
  icon.svg            # favicon
src/
  app/
    layout.tsx        # ROOT layout: metadata + viewport(themeColor) ONLY; renders children (locale layout)
    globals.css       # Tailwind v4 import + @theme tokens + keyframes + noise overlay
    [locale]/
      layout.tsx      # fonts (Space Grotesk/Inter/JetBrains Mono via next/font), Providers, Navbar, Footer
      page.tsx        # HOME: Preloader(waitForScenes) + all 9 sections + generateMetadata (OG/Twitter images)
      blog/page.tsx   # blog index
      blog/[slug]/page.tsx  # blog post (generateStaticParams; posts from src/lib/posts.ts)
    api/visitors/route.ts  # Upstash visitor counter (GET)
    admin/                # ADMIN PANEL — outside [locale], excluded from proxy/sitemap/robots (§5.8)
      page.tsx            # server: session ? <AdminDashboard/> : <LoginForm/> (dynamic, noindex)
      login-form.tsx      # client: supabase.auth.signInWithPassword
      dashboard.tsx       # client: messages list + mark read/unread + delete + sign out
    actions/
      send-contact.ts     # server action: Supabase insert + Brevo confirm + Resend notify (§5.5)
      admin.ts            # server actions: listMessages / markMessageRead / deleteMessage / signOut
  proxy.ts                # next-intl middleware (Next 16 renamed it) — admin excluded from matcher
  components/         # all client components (see §3 for the section list)
  i18n/
    routing.ts        # locales: ["en"], defaultLocale "en", prefix "as-needed"
    navigation.ts     # typed <Link>/useRouter wrappers (use for ALL navigation)
  lib/
    site.ts           # CENTRAL identity config (name, github, email, url…) — edit identity here
    posts.ts          # blog posts data (4 posts; frontmatter-style objects)
    utils.ts          # cn() = clsx + tailwind-merge
    lenis-store.ts    # module-scope Lenis singleton + hardened scrollToId() (§5)
    render-store.ts   # scene-ready pub/sub used by the preloader (§5)
    use-frameloop-on-view.ts  # IntersectionObserver hook → frameloop "never"/"always" (§5)
    supabase/
      client.ts       # createBrowserClient (login form — NEXT_PUBLIC_ keys only)
      server.ts       # createServerClient with cookie session (admin page + admin actions)
      admin.ts        # service-role client (createAdminClient) — SERVER-ONLY imports (§5.8)
  messages/en.json    # ALL user-facing copy, namespaced per section (§4)
```

**Data flow (important):** user-facing strings live **only** in `src/messages/en.json` and are read with `useTranslations("namespace")` (client) or `getTranslations` (server, e.g. page metadata). `t.raw("items")` is used for arrays (e.g. projects, services, terminalLines). Never hardcode copy in components. Identity/link config lives in `src/lib/site.ts`.

**Routes:** `/` (redirects to `/en`), `/en`, `/en/blog`, `/en/blog/[slug]` (4 posts), `/admin` (dynamic, noindex — outside the locale tree), `/api/visitors`, plus `robots.txt` (disallows `/admin`), `sitemap.xml`, `manifest.webmanifest` (auto-generated by Next).

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
| — | — | `Marquee` (tech ticker) | hardcoded ITEMS |
| — | — | `Statement` | `statement` |
| 01 | `about` | `About` (photo card + `Terminal` + counters + badges) | `about` |
| 02 | `services` | `Services` (5 cards) | `services` |
| — | — | `WordDivider ["Build","Create","Ship"]` | — |
| 03 | `projects` | `Projects` (sticky pinned horizontal scroll, 6 cards + GitHub tile) | `projects` |
| 04 | `skills` | `Skills` (3D orbit rings + canvas-texture labels) | `skills` |
| 05 | `process` | `Process` (sticky pin, 4 steps) | `process` |
| 06 | `experience` | `Experience` (timeline) | `experience` |
| — | — | `WordDivider ["Design","Code","Repeat"]` | — |
| 07 | `blog` | `BlogSection` (featured + 2 more, "View all" → /blog) | `blog` |
| 08 | `testimonials` | `Testimonials` (auto-rotating) | `testimonials` |
| — | — | `CtaBand` | `cta` |
| 09 | `contact` | `Contact` (+ `ContactForm`) | `contact` |
| — | — | `Footer` (visitor count) | `footer` |

> Note: `#fuel` (movies) and `#lab` (creative posters) sections were **removed** deliberately — the site is strictly developer-focused. Do not re-add entertainment content.

**Adding content (the common tasks):**
- **Project card:** add object to `en.json → projects.items` (6 max before scroll-range math needs retuning — `Projects` computes its end transform from the measured track, so it adapts automatically).
- **Skill chip:** add to one of the 4 ring arrays in `skills.tsx` (FRONTEND/BACKEND/AI/PYTHON) — canvas textures regenerate automatically.
- **Blog post:** add object to `src/lib/posts.ts` + a markdown-ish body in the same file + a page in `src/app/[locale]/blog/` if content differs; keep slugs unique.
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
- `react-hook-form` + zod (client) → `useActionState` server action `send-contact.ts` (3 steps, each optional): ① insert into Supabase `messages` via service-role client (bypasses RLS — inserts need no policy), ② Brevo confirmation email to the submitter (subject/body copy from `en.json → contact.confirm*`; sender = `CONTACT_EMAIL`, must be verified in Brevo), ③ Resend notification to `CONTACT_EMAIL`.
- `demo: true` is returned ONLY when none of the three ran (no keys) — UI shows a demo-mode notice. Success state resets the form.

### 5.6 Security & headers
- `next.config.ts` adds: CSP (dev gets `'unsafe-eval'`, prod does NOT — never enable unsafe-eval in prod), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS, DNS-prefetch, `poweredByHeader: false`.
- CSP `connect-src` is env-aware: when `NEXT_PUBLIC_SUPABASE_URL` is set, its hostname is appended (required for the browser-side auth call from `/admin`).
- `allowedDevOrigins: ["192.168.0.10"]` for LAN device testing on the dev server.
- `themeColor` lives in the `viewport` export of the root layout (Next 16 requirement — metadata export would warn).

### 5.7 Static OG image
- `public/opengraph.png` is generated by `scripts/generate-og.mjs` (`npm run generate:og`) using `@vercel/og` with `React.createElement` (no JSX in .mjs). Page metadata references it via `openGraph.images`/`twitter.images`. Do not recreate the dynamic `opengraph-image.tsx` route — it fails under Turbopack dev.

### 5.8 Admin panel (`/admin`) + message storage
- Route lives OUTSIDE `[locale]` (top-level, like `/api`): uses the ROOT layout only (no navbar/footer/fonts — plain system fonts there, by design). `export const dynamic = "force-dynamic"`, `robots: noindex`, and excluded from the next-intl proxy matcher (`src/proxy.ts` — keep `admin` in the negative lookahead), `robots.txt` (`Disallow: /admin`), and `sitemap.ts` (whitelist-based — never add it).
- Auth = **Supabase Auth email+password** (single admin user created in the Supabase dashboard). `login-form.tsx` calls `signInWithPassword` → `router.refresh()`. Page checks `supabase.auth.getUser()` server-side via cookie session (`createServerClient`).
- Messages table + RLS (run this in Supabase → SQL Editor once):

```sql
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);
alter table messages enable row level security;
create policy "admins read messages" on messages for select using (auth.role() = 'authenticated');
create policy "admins update messages" on messages for update using (auth.role() = 'authenticated');
create policy "admins delete messages" on messages for delete using (auth.role() = 'authenticated');
```

- Server actions in `actions/admin.ts` (list/mark-read/delete) run through the user-session client, so RLS applies (authenticated admin only). Contact-form inserts use the **service-role** client (`lib/supabase/admin.ts`, `persistSession: false`) which bypasses RLS — that module must NEVER be imported from client code. When the page loads without Supabase env keys it renders the login card with a "not configured" note instead of crashing.

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
- **Admin panel setup (user-provided, pending):** create the Supabase project, run the §5.8 SQL, create the admin user in Authentication → Users, and add the 4 Supabase env keys + `BREVO_API_KEY` (and verify `CONTACT_EMAIL` as Brevo sender). Live end-to-end (login → read/mark/delete + Brevo confirmation email) is untested until the real keys are in `.env.local`. Without keys everything degrades gracefully (verified).
- `testimonials.sub` explicitly says "Placeholder reviews — replace with your real Fiverr feedback anytime."
- `.env.example` values are examples — real keys go in `.env.local` (gitignored).
- `dev-final.log/.pid`, `server.log`, `og3.log` etc. may reappear from test runs — they are safe to delete.
- The GitHub tile in Projects ("more" card) hardcodes count/stories text in en.json — update when real numbers change.

## 8. Quick Verification Checklist (run before finishing any task)

```bash
npm run typecheck && npm run lint && npm run build
```

Then, for UI/UX changes, verify with a headless browser (puppeteer-core + Edge, temp install) at 375px / 768px / 1440px: no horizontal overflow (`scrollWidth <= innerWidth`), no console errors, sections reachable, nav scrollspy + hash navigation working. The last full regression pass (Aug 2026) was 13/13 device checks + 9/9 content checks.