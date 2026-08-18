# Quality Assessment Report — Md. Tariqul Islam Portfolio

**Date:** 2026-08-18 · **Build:** Next.js 16.3.1 (Turbopack, production build) · **Report:** 30/30 checks passed

## 1. Static Analysis

| Check | Result |
|---|---|
| `npm run typecheck` (tsc --noEmit, strict) | PASS |
| `npm run lint` (eslint, next core-web-vitals + typescript) | PASS |
| `npm run build` (production build, SSG + ISR) | PASS |

## 2. Browser Verification (headless Edge, production server on port 3100)

### Responsive / layout — 375px mobile, 768px tablet, 1440px desktop

| Check | 375px | 768px | 1440px |
|---|---|---|---|
| No horizontal overflow (`scrollWidth <= innerWidth`) | PASS (0px) | PASS (0px) | PASS (0px) |
| All 9 sections render (about, services, projects, skills, process, experience, blog, testimonials, contact) | PASS | PASS | PASS |
| Hero renders | PASS | PASS | PASS |
| Marquee renders | PASS | PASS | PASS |
| Footer renders | PASS | PASS | PASS |
| Navbar link scrolls to section (desktop: direct; mobile/tablet: via hamburger menu) | PASS | PASS | PASS |
| No console errors | PASS | PASS | PASS |

### Navigation / pages

| Check | Result |
|---|---|
| Hash navigation `/en#contact` lands on the contact section | PASS |
| Blog index renders 4 post cards + heading ("Notes from the lab") | PASS |
| Blog post renders title + meta + content blocks | PASS |
| Unknown blog slug returns 404 | PASS |
| `/api/visitors` serves the visitor count (Upstash Redis) | PASS (no console errors, no request failures) |

### Admin panel (`/admin`)

| Check | Result |
|---|---|
| Login + dashboard renders with all 5 tabs (Messages / Blog / Projects / Sections / Settings) | PASS |
| Settings tab site-content editor renders | PASS |
| No console errors | PASS |

## 3. Defects Found & Fixed

1. **Horizontal overflow on mobile (28px at 375px)** — `process.tsx` and `experience.tsx` entrance animations slide cards in from `x: 48`; while off-screen the pre-animation transform poked 48px past the container padding (measurable at 375px). **Fix:** added `overflow-x-clip` to both `<section>` elements. Verified: overflow delta 0px at 375/768/1440.
2. **Test-only issues (no product defect):** nav links are `<button>`s (not anchors) — the mobile nav test now opens the hamburger menu first; blog post URLs render without the `/en` prefix (middleware redirects) — the test now accepts both; localhost 404s for Vercel Web Analytics / Speed Insights scripts are expected noise (those scripts only exist on the deployed domain) — filtered via a response listener; the mobile menu items are prefixed with numbers ("06Contact") — matching now uses suffix match.

## 4. Notes / Known Environment Noise

- Console 404s for `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` on localhost are expected (analytics run only on the deployed Vercel domain).
- The live deployment (`portfolio-mauve-psi-hzxxy2n3ei.vercel.app`) was stale at the time of this report (no analytics script in HTML, old admin build) — redeploy after connecting the GitHub repo `MeTariqul/Portfolio` and adding env vars in Vercel.
- Test tooling (`puppeteer-core`) is installed temporarily and removed after the run; test scripts live outside the repo (`%TEMP%\opencode\`).