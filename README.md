# Portfolio

Personal portfolio site with a full admin dashboard. The public site is static where it can be (ISR), and every public word can be edited from the dashboard without touching code.

Live: https://metariqul.vercel.app  
Repo: https://github.com/MeTariqul/Portfolio

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Prisma 6 + Postgres (Supabase)
- NextAuth v5 (credentials login at `/admin/login`)
- Supabase Storage for media uploads (bucket `portfolio-media`)
- Brevo for contact-form notification email
- Deployed on Vercel

## Local setup

```bash
npm install              # runs prisma generate via postinstall
cp .env.example .env     # then fill in the values
npm run db:push          # create the tables
npm run db:seed          # sample content + admin login
npm run dev              # http://localhost:3000
```

Sign in at `http://localhost:3000/admin/login` with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you put in `.env`.

`npm run db:seed` is safe to re-run: it only fills empty tables, only adds settings that are missing, and only creates the admin if that email does not exist yet. Deleting a seeded row in the admin keeps it deleted.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build (includes typecheck) |
| `npm run start` | serve the build |
| `npm run lint` | eslint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | push `prisma/schema.prisma` to the database |
| `npm run db:seed` | seed sample content and the admin user |
| `npm run db:studio` | Prisma Studio |

## Environment variables

`.env.example` lists every variable the app reads.

| Variable | Used for |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Postgres connection (Prisma) |
| `AUTH_SECRET` | NextAuth session signing |
| `NEXT_PUBLIC_SITE_URL` | canonical URL for SEO, OG and auth redirects (optional on Vercel, falls back to `https://$VERCEL_URL`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | admin account created by `db:seed` (local only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (media) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client-side upload token |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side upload/delete (never expose to the browser) |
| `BREVO_API_KEY` | sending contact notification email |
| `CONTACT_EMAIL` | sender address for that email (must be verified in Brevo) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | optional. Upstash Redis rate limiting; without them the app falls back to in-memory limiting |

`RESEND_API_KEY`, `GROQ_API_KEY` and `CLOUDINARY_*` are not read by the current code.

## Deploy (Vercel)

1. Import the repo in Vercel. Framework preset: Next.js, no extra build settings.
2. Add the environment variables above to the project (Production and Preview). `ADMIN_EMAIL`/`ADMIN_PASSWORD` are not needed at runtime.
3. Point `DATABASE_URL`/`DIRECT_URL` at the production database. Run `npm run db:push` (and `npm run db:seed` once) from a machine whose `.env` holds the production URL.
4. Make sure the `portfolio-media` bucket exists in Supabase Storage.
5. Deploy. Every push to `main` builds and goes live.

Pages revalidate every 60 seconds, RSS and sitemap every hour, so content edits reach the site without a redeploy.

## Editing content

Nothing on the site is hardcoded in a page file:

- **Copy** (`/admin/copy`): every public string, grouped by page. SEO titles and descriptions, screen-reader labels and form validation messages are included. An empty field means "use the default", and the defaults live in `lib/copy.ts`.
- **Settings** (`/admin/settings`): home headline and intro, availability, about story.
- **Posts** and **Projects**: writing and case studies, with drafts, SEO fields and attachments.
- **Services, Experience, Skills, Uses** (`/admin/content/...`): the list-based content types.

## How to add a content type

The dashboard routes under `app/admin/(dashboard)/content/[kind]` serve every content type, so a new type is four small steps (also documented in the `lib/content-specs.ts` header):

1. Add a model to `prisma/schema.prisma`, then run `npm run db:push`.
2. Extend the `ContentKind` union and add an entry to `CONTENT_SPECS` in `lib/content-specs.ts` (fields, labels, validation, which pages to refresh).
3. Add a case to the switch in `lib/content-rows.ts` (list, get, upsert, delete) so the server can type the model.
4. Add a `NavLink` in `app/admin/(dashboard)/layout.tsx` so the sidebar links to it.

The list, new, edit and delete screens then work as-is.

## Where things live

- `app/(site)`: the public pages
- `app/admin`: dashboard (login, posts, projects, content, copy, messages, media, settings)
- `lib/copy.ts`: the wording catalogue and its defaults (the single source for all public text)
- `lib/content.ts`: data reads, including `getCopy()` which merges admin overrides over the defaults
- `lib/content-specs.ts` / `lib/content-rows.ts`: content-type specs and their database access
- `lib/site.ts`: identity: name, public email, links, location
- `components/site`: header, footer and other public chrome
