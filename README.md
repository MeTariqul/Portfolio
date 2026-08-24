# Portfolio

This is my personal portfolio — a single-page, dark-mode site built to showcase the things I've actually shipped.

I chose this stack because it matches how I work: Next.js 16 for fast page loads and server components, Three.js for the 3D scenes I wanted to experiment with, and Tailwind CSS v4 because utility-first is faster than writing custom CSS. The whole thing is TypeScript because I got tired of runtime errors in production.

## Why this design

I wanted something that felt cinematic, not corporate. The hero has a 3D starfield because I was learning Three.js and needed a reason to use it. The projects section scrolls horizontally because a vertical list felt boring. The skills orbit in 3D because static badge grids are everywhere.

Everything you see is CSS + WebGL — no images beyond the favicon and OG preview. I wanted to prove you can build something visually interesting without shipping megabytes of assets.

## What's in here

- 9-section home page: hero (3D stars), tech marquee, statement, about (terminal + counters), services, pinned horizontal projects scroll, 3D orbit-ring skills, process, experience, blog, testimonials, contact
- 3D scenes that pause when off-screen and cap resolution on mobile
- Blog with 4 posts (static, ISR)
- Contact form: Supabase storage, Brevo confirmation email, Resend admin notification (works in demo mode without API keys)
- `/admin` panel with Supabase Auth for managing messages, blog posts, projects, and site content
- Live visitor counter via Upstash Redis
- next-intl setup for future i18n (currently English only)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build      # SSG; /admin and /api/visitors are dynamic
npm run start
```

Other commands:

```bash
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run generate:og  # Regenerate the OG image
npm run generate:cv  # Regenerate the CV PDF
```

## Environment

Copy `.env.example` to `.env`. Everything degrades gracefully without keys — the contact form enters demo mode, the visitor counter hides itself, and `/admin` shows a "not configured" card.

| Variable | What it does |
|---|---|
| `RESEND_API_KEY` / `CONTACT_EMAIL` | Admin notification when someone contacts me |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Live visitor counter (Upstash Redis) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Admin auth + message storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side contact form inserts |
| `BREVO_API_KEY` | Confirmation email to the person who submitted the form |

### Admin panel setup

1. Create a Supabase project and run the SQL in `supabase/init.sql` (creates tables + RLS policies)
2. Create an admin user in Supabase Authentication
3. Verify your sender email in Brevo
4. Add the keys to `.env` and visit `/admin`

## Documentation

- `AGENTS.md` — the full technical guide: architecture, conventions, known traps, and what's still TODO. Read it before modifying anything.

## License

All rights reserved.
