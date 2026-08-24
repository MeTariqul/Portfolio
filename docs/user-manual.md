# User Manual — Md. Tariqul Islam Portfolio

Everything about the site's pages, what they show, and how to edit every piece of content.

**Site:** single-page cinematic portfolio (dark mode) · **Public URL:** `https://portfolio-mauve-psi-hzxxy2n3ei.vercel.app` · **Admin:** `/admin`

---

## 1. Pages Overview

| Page | URL | What it is |
|---|---|---|
| Home | `/` → `/en` | The full one-page portfolio: hero, marquee, about, services, projects, skills, process, experience, blog preview, testimonials, CTA, contact, footer |
| Blog index | `/en/blog` | List of all blog posts |
| Blog post | `/en/blog/<slug>` | Single article (headings, paragraphs, lists, code blocks) |
| Admin panel | `/admin` | Password-protected CMS for every piece of content |
| 404 | any unknown URL | Not-found page with a back link |

---

## 2. Home Page (`/en`) — Section by Section

The page loads a preloader (progress bar: `fonts ✓` / `scenes ✓`), then scrolls through the sections below.

### 2.1 Hero (top of page)
- Greeting, name, rotating role titles, subtitle, status pill, "Open to work" pill, live visitor count, two buttons (**Explore My Work** / **Download CV**), scroll hint, 3D starfield canvas.
- **Edit:** role titles, subtitle, status → `/admin` → Sections → Hero. All other hero copy (greeting, name, button labels, pills) → Settings → Site content → "Hero copy".

### 2.2 Marquee (tech ticker)
- Infinite scrolling strip of technologies (React, Next.js, TypeScript, …).
- **Edit:** Settings → Site content → "Marquee ticker" — one item per line.

### 2.3 Statement
- Big three-line statement with a ghost text behind it.
- **Edit:** Settings → Site content → "Statement".

### 2.4 About (01)
- Photo card, terminal window (`> whoami` … lines), animated counters (public projects, technologies, years freelancing — set real numbers via Sections → About), skill badges, availability pill.
- **Edit:** stats, badges, terminal lines → Sections → About. Section label/heading/terminal title → Settings → Site content → "About copy".

### 2.5 Services (02)
- 5 service cards (title, description, tags).
- **Edit:** cards → Sections → Services. Section label/heading/subtitle → Settings → Site content.

### 2.6 Word Divider
- Big scrolling words: **Build · Create · Ship**.
- **Edit:** Settings → Site content → "Word dividers" — one word per line.

### 2.7 Projects (03)
- Horizontally scrolling pinned section with project cards. Each card: gradient header, title, description, tags, **Code** button, **Live** button.
  - **Code** opens the project's GitHub repository.
  - **Live** opens the deployed site.
- Plus a final "And more on GitHub" card linking to your GitHub profile.
- **Edit:** cards (title, description, tags, category, Code URL, Live URL, featured flag, sort order) → `/admin` → Projects tab. Section copy → Settings → Site content → "Projects section".
- **Tip:** use "Sync from GitHub" to import repos; the GitHub URL is prefilled and the Live URL is prefilled from the repo's homepage when set. URLs you leave empty are not clickable (Live shows dimmed).

### 2.8 Skills (04)
- 4 orbit rings with labels (Frontend / Backend / AI / Python), each with chips orbiting in 3D.
- **Edit:** ring labels + chips → Settings → Site content → "Skills section + orbit rings" (one chip per line).

### 2.9 Process (05)
- Sticky pinned section, 4 steps (number, title, description).
- **Edit:** steps → Sections → Process. Section copy → Settings → Site content.

### 2.10 Experience (06)
- Timeline: role, organization, period, description.
- **Edit:** entries → Sections → Experience. Section copy → Settings → Site content.

### 2.11 Blog preview (07)
- Featured post + 2 more, **View all** → `/en/blog`.
- **Edit:** posts → `/admin` → Blog tab. Section copy → Settings → Site content → "Blog section".

### 2.12 Testimonials (08)
- Auto-rotating quotes with name, role, star rating.
- **Edit:** entries → Sections → Testimonials. Section copy → Settings → Site content.

### 2.13 CTA band
- "Have an idea?" panel with a button that jumps to the contact form.
- **Edit:** Settings → Site content → "CTA band".

### 2.14 Contact (09)
- Left: email, location, availability, social links. Right: contact form (name, email, message).
- The form stores the message in the admin inbox, emails you a confirmation, and notifies you (see §5).
- **Edit:** email/location/availability → Settings tab (top form). All form copy, labels, error messages, confirmation-email subject/body → Settings → Site content → "Contact section".

### 2.15 Footer
- Name, rights line, "Built with" line, back-to-top, total visitor count.
- **Edit:** Settings → Site content → "Footer".

---

## 3. Blog Pages

### 3.1 Blog index (`/en/blog`)
- Heading + all published posts as cards (category, date, read time, title, description). First post renders larger.
- **Edit:** posts → `/admin` → Blog tab. Page title/description (SEO) come from the same Blog section copy in Settings.

### 3.2 Blog post (`/en/blog/<slug>`)
- Title, category, date, read time, then content blocks: headings (h2), paragraphs, bullet lists, and code blocks (with language label). Back link + author name at the bottom.
- **Edit:** `/admin` → Blog tab → Edit post → the "Blocks" JSON editor (`h2` / `p` / `list` / `code` types; see the format inside the editor).
- Unknown slugs show the 404 page.

---

## 4. Admin Panel (`/admin`)

Sign in with the admin email + password (Supabase Auth). "Not configured" card = Supabase env vars missing on the server.

**Tabs:**

### 4.1 Messages
- Every contact-form submission: name, email, message, date. Mark as read / delete.
- Blue dot = unread. New submissions appear here as they arrive.

### 4.2 Blog
- List of posts (title, published/featured flags). **New post** / **Edit** / **Delete**.
- Post fields: title, slug (URL), description, date, read time, category, featured (top of home preview), published (visible on site), gradient (card color), and the JSON Blocks editor.
- Keep slug unique; changing it changes the URL.

### 4.3 Projects
- List of project cards. **New project** / **Edit** / **Delete**.
- Fields: title, tags (comma-separated), description, category, **Link** (= Live button URL → deployed site), **GitHub URL** (= Code button URL → repository), sort order, featured flag.
- **Sync from GitHub** fetches your repos → click **Import** to add one as a project (prefills GitHub URL + homepage).

### 4.4 Sections
- Six sub-tabs:
  - **Services** — add/edit/delete cards (title, description, tags, order).
  - **Process** — steps (number shown on card, title, description, order).
  - **Experience** — timeline entries (role, organization, period, description, order).
  - **Testimonials** — quotes (quote, name, role, rating 1–5, order).
  - **Hero** — rotating roles (one per line), subtitle, status pill.
  - **About** — stats (value, suffix, label), badges (one per line), terminal lines (one per line).

### 4.5 Settings
- **Contact info:** email, location, availability (used by the contact section).
- **Site content (full editor):** every remaining string on the site, grouped into cards:
  - Meta / SEO (browser tab title, description, social-share description)
  - Navigation (nav labels incl. "Hire Me")
  - Hero copy, About copy, Statement, Preloader
  - Services / Process / Experience / Skills / Projects / Blog / Testimonials / CTA / Contact / Footer / 404 copy
  - Marquee ticker items, Word dividers, Skills orbit chips (one per line)
- Buttons: **Save all content** (publishes the whole snapshot) and **Reset to defaults** (re-applies the built-in English defaults).

---

## 5. Contact Form Behaviour

1. Visitor fills the form → message is stored in **Messages** (admin inbox).
2. Visitor receives a confirmation email (Brevo) — subject/body editable in Settings → Site content → Contact.
3. You receive a notification email (Resend) to the address set in `CONTACT_EMAIL`.
4. If email services are not configured, the form runs in **demo mode** (marked on screen) and only validates.

## 6. How Changes Appear on the Site

- Admin edits are visible **immediately** (site cache is refreshed on save).
- If the page was cached by a CDN, wait up to ~60 seconds — that is the max refresh window.
- Content that exists in the database always wins over the built-in fallbacks; empty lists/fields fall back to defaults, so the site never looks broken.

## 7. Quick Reference — "Where do I change…?"

| I want to change… | Go to |
|---|---|
| Project card / its Code / Live URLs | Admin → Projects → Edit |
| Blog post / featured post | Admin → Blog |
| Services / Process / Experience / Testimonials cards | Admin → Sections |
| Hero roles / subtitle / status | Admin → Sections → Hero |
| About stats / badges / terminal lines | Admin → Sections → About |
| Email / location / availability | Admin → Settings (contact form) |
| Any other text (nav, headings, buttons, footer, meta, marquee, rings, emails…) | Admin → Settings → Site content |
| CV / profile links / socials | Code files (`src/lib/site.ts` + `public/cv/`) — not editable in admin |