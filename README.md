# Portfolio

Personal portfolio site with a full admin dashboard. The public site is static where it can be (ISR), and every public word can be edited from the dashboard without touching code.

Live: https://metariqul.vercel.app  
Repo: https://github.com/MeTariqul/Portfolio

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Prisma 6 + Postgres (Supabase)
- NextAuth v5 (credentials login at `/admin/login`)
- Supabase Storage for media uploads (bucket `portfolio-media`)
- Gmail SMTP via nodemailer for contact-form and licence-key email
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

Two dependency details are worth knowing:

`prisma.config.ts` holds the schema path and the seed command. Prisma 7 removes the old `prisma` block from `package.json`, so this file is the replacement. The CLI stops reading `.env` by itself once the file exists, which is why the config loads it explicitly and guards the call — on Vercel and in CI the variables are already in the environment and no `.env` file is present.

`allowScripts` in `package.json` is npm's install-script approval list. Prisma and `unrs-resolver` need their postinstall hooks to fetch native binaries, and npm warns about any hook it has not seen approved. The entries are pinned to exact versions, so a Prisma upgrade re-opens the warning on purpose: review it, then approve the new version with `npm install-scripts approve <pkg>`.

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
| `npm run db:backup` | write every table to a JSON file |
| `npm run db:restore -- <file> --yes` | put a backup back (replaces the rows) |

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
| `GMAIL_USER` | Gmail account mail is sent from, and the SMTP login |
| `GMAIL_APP_PASSWORD` | App Password for that account (needs 2-Step Verification on) |
| `CONTACT_EMAIL` | where contact-form notifications are delivered |
| `GMAIL_SMTP_PORT` | optional. 465 by default; 587 is the fallback |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | optional. Upstash Redis rate limiting. Without them the limits that matter (license keys, sign-in) run on the database instead, so they are still global; see [Rate limiting](#rate-limiting) |

`RESEND_API_KEY`, `GROQ_API_KEY` and `CLOUDINARY_*` are not read by the current code.

## Deploy (Vercel)

1. Import the repo in Vercel. Framework preset: Next.js, no extra build settings.
2. Add the environment variables above to the project (Production and Preview). `ADMIN_EMAIL`/`ADMIN_PASSWORD` are not needed at runtime.
3. Point `DATABASE_URL`/`DIRECT_URL` at the production database. Run `npm run db:push` (and `npm run db:seed` once) from a machine whose `.env` holds the production URL.
4. Make sure the `portfolio-media` bucket exists in Supabase Storage.
5. Deploy. Every push to `main` builds and goes live.

Pages revalidate every 60 seconds, RSS and sitemap every hour, so content edits reach the site without a redeploy.

Post and project pages are prerendered at build time (`generateStaticParams`), so
a visit is served from the cache instead of re-reading the database. A post
published after the build is generated on its first request and cached from
then on.

## Deploy (Docker)

The repository builds into a small production image as well:

```bash
docker build -t portfolio .
docker run -p 3000:3000 --env-file .env portfolio
```

Three stages: dependencies, build, runtime. The runtime image carries only
the standalone server, the static assets and Prisma's query engine — no
source, no dev dependencies. `NEXT_STANDALONE=1` is set in the build stage
only, which is what turns on Next's standalone output; everywhere else the
app builds the way Vercel expects and `npm run start` keeps working.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and every pull
request:

- the Prisma schema is validated, checked for formatting drift, and applied
  to a clean Postgres — the project deploys with `db push` rather than
  migrations, so this is the equivalent of "the migration applies"
- type-check, ESLint, and a full production build
- the Docker image is built and checked that it answers requests
- a non-blocking job compares the schema with the production database and
  prints the difference, so drift is visible before it becomes a surprise

Set a `PRODUCTION_DATABASE_URL` repository secret to turn the drift check on.

## Rate limiting

`lib/rate-limit.ts` has two scopes:

- **instance** — a counter in the process's memory. Cheap, and it is what the
  page-view beacon uses, because that fires on every page view and must not
  write to the database.
- **global** — one counter for the whole site, which is what the license
  endpoints, the sign-in and the contact form use. A counter in memory counts
  per instance, so on serverless a limit of 10 is really 10 times the number
  of instances; that is fine for a beacon and useless as a security
  boundary.

A global counter uses Upstash Redis when `KV_REST_API_URL` and
`KV_REST_API_TOKEN` are set (one round trip, nothing written to the main
database). Without them it uses the `RateLimit` table instead — a single
atomic upsert, so two requests arriving together cannot both see the same
count. Only if both are unavailable does it fall back to memory, and the
security-sensitive callers refuse the request instead of allowing it.

## Backing the database up

The database is the whole site: the content, the licences, the bans, the
signing keys. Nothing else holds a copy, and the application keeps no history
of what it deleted — a row that goes is gone.

```bash
npm run db:backup                     # -> backups/portfolio-<date>.json
npm run db:restore -- <file> --yes    # put it back
```

`db:backup` reads every table and writes one JSON file. `db:restore` replaces
the rows in the tables the backup holds, and refuses to do anything without
`--yes` — it prints what it is about to change first.

The `backups/` folder is gitignored on purpose: a backup contains the admin's
password hash and the private signing key, so it must never be pushed. It is
also not a backup while it sits on the same disk as the database — copy it
somewhere else.

Run a backup before any change to `prisma/schema.prisma`.

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
cannot race for the last seat), optional expiry (empty = lifetime), block/unblock
(the `LicenseStatus.SUSPENDED` switch the API reports as `suspended`),
per-device revoke/restore, reset activations, custom or generated keys
(`MYAPP-7QK4-2XP9-MZ34`). A machine holds **one key per app**: activating a
different key releases it from the key it held before, so a user can change keys
without a support step and the old key gets its device slot back (the release
happens in the same transaction as the new seat, so a swap onto a full key fails
as a whole). Tokens stay valid offline for the app's own re-check window (7 days
by default) in `lib/licensing.ts`, so a block, ban, expiry or revoked device takes
effect at the next online re-check. Everything is stored in the dashboard: no
third-party service, and the signing keys live in the `Setting` table
(`license_keys`), generated on first use. Each app page carries the endpoint list,
the public key and a copy-paste client snippet.

### Self-service keys (the request window inside your app)

A user can ask for a key from inside the app instead of you typing one out.
The app calls `POST /api/license/request` with its API key plus the user's email;
what happens next is the app's **request mode** on its dashboard page:

| Mode | Behaviour |
| --- | --- |
| `Off` | the endpoint refuses; nothing is issued |
| `Auto` | a single-device key is created (or the existing one reused) and emailed at once |
| `Review` | the request waits in **Requests** until you approve or reject it |

New apps start `Auto`, so a request gets a key by email without you touching
anything; switch an app to `Review` when you want to vet each request, or
`Off` to close it completely.
Keys are mailed over Gmail SMTP (`lib/license-mail.ts`); if the send fails the
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

**Device ids are never stored.** A device id is a fingerprint the app computes
on the user's machine, so it identifies the person as much as the machine. The
server validates it, lowercases it, and keeps only its SHA-256 digest; the
token carries the fingerprint itself (the app has to check it) and a `h` claim
with the digest. The admin screens show the first twelve characters of the
digest, which is enough to tell two machines apart and not enough to
identify one. A device ban is stored against the same digest, so a ban still
matches after a change of firmware.

**The offline window is per app.** Each app sets how long its token stays
valid without checking in (7 days by default, 1–90). It is the longest a
blocked licence or a revoked device keeps working offline, so shorten it when
that matters and lengthen it when the app should not phone home too often.

**Rotating an API key does not break installed copies.** The key from the
last rotation keeps working for 30 days, and the app's page shows it with the
date it stops. That is long enough to ship an update carrying the new key,
and *Stop accepting it* ends the grace period early. Without this, rotating
a key cut off every copy of the app that was already installed — which is
exactly what happened when the app was deleted and re-registered.

`docs/activation-client-prompt.md` is a paste-ready prompt that describes this
whole contract for the agent working on the software itself.

`npm run verify:license` (with `npm run dev` running) exercises the whole
activation flow against throwaway apps it creates and deletes: seat limits,
suspension, per-device revocation, expiry, offline token verification including
a tampered-token check, all three request modes, the no-duplicate-key rule,
key swaps that release the old device without touching another app, the
device-digest rules, and email/device bans with a lift. It uses
`@example.invalid` addresses, which the mail provider refuses, so it never
mails a person. Alternatively point it at production with
`TEST_BASE=https://metariqul.vercel.app` — it only touches its own temp rows.

## Who may do what in the dashboard

One admin account is the norm here, but the account carries a role:

- **Owner** — everything.
- **Editor** — content: posts, projects, copy, media, messages, and the
  normal key-request queue.

Owner-only: deleting an app, a licence or a request; banning or unbanning an
email or a device; blocking or unblocking a licence; revoking a device;
resetting a licence's activations; rotating an app's API key; and switching
an app's request mode. Those are the actions that remove data or lock a
customer out.

Enforcement is `requireOwner()` in `lib/auth.ts`, which reads the role from the
database rather than from the session token, so a demotion takes effect at
once instead of when the token happens to expire.

## Being found by search engines, including AI ones

- `/sitemap.xml` reports the date each page really changed, not the date the
  file was generated — a sitemap that says every page is new on every fetch
  is one a crawler learns to ignore.
- `/robots.txt` keeps the admin and the API out of the index, keeps the
  short-link redirector out of it, and splits the AI crawlers by what they
  do: the search and answer agents (OAI-SearchBot, ClaudeBot, PerplexityBot
  and the rest) are welcome, the model-training crawlers (GPTBot, CCBot,
  Bytespider and the rest) are declined. The writing can be cited without
  being scraped into a training set.
- `/llms.txt` is a plain-markdown summary of the site for a language model:
  what it is, what it offers, and which pages are worth reading. It is
  generated from the same database as the site, so it cannot go stale.
- JSON-LD covers the person, the profile page, the site (with a search
  action), each project, each service, each post, and the breadcrumbs. The
  post markup carries the real last-edit date and the article body.

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
4. Add an entry to the `nav` array in `app/admin/(dashboard)/layout.tsx` so the sidebar links to it.

The list, new, edit and delete screens then work as-is.

## Where things live

- `app/(site)`: the public pages
- `app/admin`: dashboard (login, posts, projects, content, copy, messages, media, settings)
- `lib/copy.ts`: the wording catalogue and its defaults (the single source for all public text)
- `lib/content.ts`: data reads, including `getCopy()` which merges admin overrides over the defaults
- `lib/content-specs.ts` / `lib/content-rows.ts`: content-type specs and their database access
- `lib/site.ts`: identity: name, public email, links, location
- `components/site`: header, footer and other public chrome
