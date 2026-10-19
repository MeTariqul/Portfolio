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

## Apps: activation server for your own software

`/admin/apps` turns the dashboard into a license server for apps you build and ship —
desktop, mobile or web. Register an app, get its API key, issue license keys, and its
users activate against `POST /api/license/activate`; the app re-checks with
`POST /api/license/verify` and verifies tokens offline with the public key from
`GET /api/license/pubkey` (Ed25519, so shipped apps can verify but never mint).

Per-key controls: device slots (1–100, enforced with a transaction so two devices
cannot race for the last seat), optional expiry (empty = lifetime), suspend/resume,
per-device revoke/restore, reset activations, custom or generated keys
(`MYAPP-7QK4-2XP9-MZ34`). Tokens stay valid offline for `RECHECK_DAYS` (7) in
`lib/licensing.ts`, so a suspension, expiry or revoked device takes effect at the
next online re-check. Everything is stored in the dashboard: no third-party service,
and the signing keys live in the `Setting` table (`license_keys`), generated on first
use. Each app page carries the endpoint list, the public key and a copy-paste client
snippet.

### Self-service keys (the request window inside your app)

A user can ask for a key from inside the app instead of you typing one out.
The app calls `POST /api/license/request` with its API key plus the user's email;
what happens next is the app's **request mode** on its dashboard page:

| Mode | Behaviour |
| --- | --- |
| `Off` | the endpoint refuses; nothing is issued |
| `Auto` | a single-device key is created (or the existing one reused) and emailed at once |
| `Review` | the request waits in **Requests** until you approve or reject it |

New apps start `Off`, so shipping an app never silently opens a key faucet.
Keys are mailed through Brevo (`lib/license-mail.ts`); if the send fails the
request is logged as **Failed** and **Retry send** sends the same key again —
a key is never minted twice for one address, and asking twice only resends.

The four surfaces are the tab row on every **Apps** screen:

- **Apps** — register apps, API key, request mode, endpoint list, client snippet
- **Keys** (`/admin/apps/licenses`) — every key on the server across all apps,
  with state, device slots, bound device and last re-check; filter by app,
  state or text
- **Requests** (`/admin/apps/requests`) — the queue behind the mode above, with
  approve / reject / retry / ban actions
- **Bans** (`/admin/apps/bans`) — banned emails and device ids

**Bans** are global and checked first on every request, activation and re-check:
a banned email is refused when it asks for a key *and* when it activates or
re-checks; a banned device is refused whatever key it presents. Nothing is
deleted, so lifting a ban restores access immediately. Bans can be added by
hand or with one click from a license, a device row or a request row.

`docs/activation-client-prompt.md` is a paste-ready prompt that describes this
whole contract for the agent working on the software itself.

`npm run verify:license` (with `npm run dev` running) exercises the whole
activation flow against throwaway apps it creates and deletes: seat limits,
suspension, per-device revocation, expiry, offline token verification including
a tampered-token check, all three request modes, the no-duplicate-key rule, and
email/device bans with a lift. It uses `@example.invalid` addresses, which the
mail provider refuses, so it never mails a person. Alternatively point it at
production with `TEST_BASE=https://metariqul.vercel.app` — it only touches its
own temp rows.

## Short links with click logging

`/admin/links` turns any URL into a short link of the form `https://<site>/go/<code>`
(custom code optional, auto-generated otherwise). Every hit is recorded silently from
server logs — IP address, country/region/city, device, referrer — and the visitor is
forwarded to the target **immediately**: no landing page, no notice, no prompt, ever.
Coarse location comes from Vercel's request headers (`x-vercel-ip-*`), so outside
Vercel those columns stay empty.

"View log" on a link shows the latest 500 clicks with a country roll-up.
Pausing a link sends visitors to the homepage instead of the target; deleting a
link deletes its click history.

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
