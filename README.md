# Premium Level Portfolio

A single-page, dark-mode, cinematic portfolio for **Md. Tariqul Islam** — full-stack web developer (Next.js/React/TypeScript + Python/AI).

Built with Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, framer-motion, Lenis smooth scroll, and three.js WebGL scenes.

## Features

- 9-section cinematic home page: hero (3D stars), tech marquee, statement, about (terminal + counters), services, pinned horizontal projects scroll, 3D orbit-ring skills, process, experience, blog, testimonials, contact
- 3D scenes with viewport-aware frameloop pausing and mobile DPR caps
- Blog (4 posts, SSG)
- Contact form with Supabase storage, Brevo confirmation email to the submitter, and Resend admin notification (demo mode without keys)
- `/admin` panel (Supabase Auth) — read, mark read/unread, delete messages
- Live visitor counter (Upstash Redis)
- next-intl (single locale `en`), static OG image, robots/sitemap

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build      # SSG; /admin and /api/visitors are dynamic
npm run start
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (flat config)
npm run generate:og  # regenerate public/opengraph.png
npm run generate:cv  # regenerate public/cv PDF
```

## Environment

Copy `.env.example` to `.env` and fill in the values. All services degrade gracefully when unset (contact form falls back to demo mode, visitor counter hides, `/admin` shows a "not configured" card).

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` / `CONTACT_EMAIL` | Admin notification for contact messages (Resend) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Live visitor counter (Upstash Redis) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Admin auth + message storage (public keys) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for contact message inserts |
| `BREVO_API_KEY` | Confirmation email to the contact form submitter |

### Admin panel setup (one-time)

1. Create a Supabase project, then run the `messages` table + RLS SQL in **SQL Editor** (see `AGENTS.md` §5.8)
2. Create the admin user in **Authentication → Users** (email + password)
3. Verify `CONTACT_EMAIL` as a sender in **Brevo**
4. Add the keys to `.env` and visit `/admin`

## Documentation

- `AGENTS.md` — authoritative developer guide: architecture, conventions, special systems (preloader, frameloop, scroll, security), and known TODOs. **Read it before modifying anything.** It is updated at the end of every work session.

## License

All rights reserved — this is a personal portfolio.
