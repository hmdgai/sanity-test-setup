# Skill: Performance — Site-Wide Optimisations

The production-grade performance fixes shipped on Northern Medical
(client clone of this template) during pre-launch. Every new client
clone — and the base template itself — should inherit these patterns.

Each section below was diagnosed from a specific PageSpeed warning or
deploy failure. Don't skip any of them.

---

## When to use

- Starting any new client clone — verify each item before building features
- Pre-launch performance pass on an existing site
- Diagnosing a PageSpeed regression
- Diagnosing a Cloudflare Pages deploy failure ("ASSETS reserved" error)
- Migrating from YouTube to self-hosted MP4 hero video
- Migrating from GTM to Cloudflare Zaraz (post-domain task)

---

## Section 1 — Cloudflare adapter ASSETS-binding patch

**HARD blocker for Cloudflare Pages deploy.**

`@astrojs/cloudflare` v13.x hardcodes the binding name `ASSETS`, but Cloudflare Pages reserves that name and rejects the deploy with:

```
The name 'ASSETS' is reserved in Pages projects.
```

The patch script (`scripts/patch-cloudflare-adapter.mjs`) renames `ASSETS` → `STATIC_ASSETS` in 5 adapter files. It is wired to `npm postinstall` so it runs automatically after every install. Idempotent — re-running is safe.

**Verify on a fresh clone:**
- `scripts/patch-cloudflare-adapter.mjs` exists
- `package.json` has `"postinstall": "node scripts/patch-cloudflare-adapter.mjs"`
- After `npm install`, the script's "Patched 5/5 files" output appears

---

## Section 2 — Image optimisation

- All images `.webp` with explicit `width` + `height` + `decoding="async"`
- Above-the-fold heroes: `loading="eager"` + `fetchpriority="high"`
- Resize source images to ~2× the largest displayed dimension (PageSpeed flags anything beyond)
- Use `npm run resize-images` (sharp-based, in-place re-encode at quality 82)
- Hero LCP: ALWAYS preload via `<link rel="preload">`

### Dual mobile/desktop hero preload (when using two variants)

`BaseLayout.astro` exposes two props:

```astro
<BaseLayout
  heroImage="/images/hero-1920.webp"
  heroImageMobile="/images/hero-800.webp"
>
```

When both are set, the layout renders:

```html
<link rel="preload" as="image" href="/images/hero-1920.webp" media="(min-width: 768px)" fetchpriority="high">
<link rel="preload" as="image" href="/images/hero-800.webp"  media="(max-width: 767px)" fetchpriority="high">
```

Each device only fetches the variant it actually paints. Mobile saves the desktop image's bytes (often 5-10× larger) and vice versa.

### Resize workflow per client

```bash
# Drop oversized images in public/images/
npm run resize-images           # default cap 1920×1920
npm run resize-images -- --max 1600  # tighter cap
npm run resize-images -- --dry       # preview without writing
```

---

## Section 3 — Cache headers (`public/_headers`)

```
/_astro/*  max-age=31536000, immutable           # content-hashed, safe forever
/images/*  max-age=31536000, stale-while-revalidate=86400
/videos/*  max-age=31536000, stale-while-revalidate=86400
/fonts/*   max-age=31536000, immutable
/icons/*   max-age=31536000, immutable
/*.svg     max-age=604800
/*.ico     max-age=604800
```

Cloudflare Pages auto-purges its edge cache on every deploy, so 1-year caches are safe even for content-unhashed paths like `/images/`.

---

## Section 4 — GTM loading (interim, until Cloudflare Zaraz)

The base template's `BaseLayout.astro` defers GTM loading to:
1. `requestIdleCallback` (10s timeout) — modern browsers
2. First user interaction (`mouseenter` / `touchstart` / `scroll` / `keydown`) — whichever fires first
3. 6s `setTimeout` fallback — older Safari (no `requestIdleCallback`)

`dataLayer` + `gtm.start` push run synchronously so any `gtag()` / `dataLayer.push()` calls before GTM loads queue correctly — GTM consumes the queue once it boots.

This is the **interim** state. Once the domain is on Cloudflare proxy, migrate to Zaraz (Section 9 below) — it eliminates browser-side GTM JS entirely.

---

## Section 5 — Preconnects: be conservative

Only preconnect to origins the page WILL request within the PageSpeed measurement window (~5-6s). The base template currently uses `dns-prefetch` (cheaper) for GTM/GA, not `preconnect`.

**Do NOT preconnect to:**
- `https://www.youtube-nocookie.com`
- `https://i.ytimg.com`
- Any third-party origin loaded via a facade pattern

Even on pages with a YouTube embed, the facade pattern delays iframe load past the measurement window — PageSpeed flags the preconnect as "Unused" and the 50–100ms TLS savings are invisible behind the already-painted hero.

---

## Section 6 — robots.txt: ASCII only

Don't use Unicode box-drawing characters (`─`, `—`, `│`) in `robots.txt`. Cloudflare Pages serves it without `charset=utf-8`, clients fall back to Latin-1, decorative chars render as mojibake. Use plain ASCII (`---`, `-`, `|`).

---

## Section 7 — `_redirects` file constraints

Cloudflare Pages `_redirects` accepts only these status codes:

| Code | Use |
|---|---|
| 200 | Rewrite (keeps URL) |
| 301 | Permanent redirect |
| 302 | Temporary redirect (default if status omitted) |
| 303 | See other |
| 307 | Temporary redirect, preserves method |
| 308 | Permanent redirect, preserves method |

**Not supported here:** 404, 410. WordPress 410-Gone migration patterns must be implemented via Pages Functions (e.g. `functions/wp-[[path]].ts`), not via `_redirects`.

---

## Section 8 — `<html lang="en-GB">` (UK targeting)

Every HMDG client site targets the UK exclusively. `BaseLayout.astro` sets `<html lang="en-GB">` — NOT `lang="en"`. The `en-GB` BCP 47 tag gives:

- Stronger Google UK geo-targeting signal (vs ambiguous `en`)
- Correct screen-reader voice selection (British pronunciation)
- British-English spellcheck suggestions in form fields
- DeepL / Google Translate use British dialect as source
- Lighthouse / axe-core stop flagging "language ambiguous"

Set this once in BaseLayout. Every page inherits.

---

## Section 9 — Site-wide noindex enforcement

`BaseLayout.astro` defaults `noindex = true`. Every page inherits.

- **Permanent-noindex pages** (404, thank-you, thank-you-booking, thank-you-hmdg) explicitly pass `noindex={true}` so they stay noindex even after the launch flip.
- **Public-facing pages** (homepage, contact, services, etc.) inherit the default — currently noindex.

When the user explicitly says "go live" / "index the site" / "remove noindex":
1. Flip the default in BaseLayout: `noindex = true` → `noindex = false`
2. Permanent-noindex pages keep their explicit `noindex={true}` and remain unindexed
3. Everything else becomes indexable
4. Verify by curling `/contact/` and confirming the `<meta name="robots">` tag is GONE (default `false` means no tag)

**Don't flip this during normal work.** It's a one-line change that's reserved for launch.

---

## Section 10 — Cloudflare Zaraz migration plan (post-domain)

Zaraz is Cloudflare's edge-side tag manager — drop-in GTM replacement that runs at the edge, not in the browser. ZERO client-side JS for analytics.

### Pre-requisite

Domain must be on Cloudflare (proxied — orange cloud). Zaraz doesn't run on `*.pages.dev` preview URLs.

### User work in the Cloudflare dashboard (~30 min)

1. Connect custom domain to the Pages project
2. Enable Zaraz on the zone (free tier — sufficient up to 100k events/mo)
3. Add tools in Zaraz:
   - Google Analytics 4 (paste existing GA4 measurement ID)
   - Google Ads conversion (if any)
   - Custom triggers for `book_now_click`, `contact_submit`, `booking_complete` dataLayer events
4. Enable Consent API with two purposes: `analytics`, `marketing`. **DO NOT** use Zaraz's built-in modal — keep the existing `CookieConsent.astro` UI.

### Code work (single commit when ready)

| File | Change |
|---|---|
| `BaseLayout.astro` | Remove deferred-GTM `<script>` block. Keep `dataLayer` init. Remove `<noscript>` GTM iframe. Drop preconnect to googletagmanager. |
| `CookieConsent.astro` | Replace `gtag('consent', 'update', ...)` with `zaraz.consent.setAll(boolean)` / `zaraz.consent.set({...})`. |
| `cookie-consent.config.ts` | Remove `gtmId`. Keep `gtagId` for documentation only. |
| `public/_headers` + BaseLayout CSP | Drop GTM/GA origins from `script-src`. Zaraz is same-origin via `/cdn-cgi/zaraz/`. CSP gets shorter and tighter. |
| `api/book-now.ts` + `api/booking-complete.ts` | NO CHANGE. Server-side Measurement Protocol stays as redundancy path independent of Zaraz. |

### Expected impact post-migration

- PageSpeed mobile TBT drops to <100 ms
- Page weight reduces by 150-220 KB
- Zero third-party browser cookies on initial paint
- PageSpeed score lands solidly in green territory (90+ mobile)

---

## Section 11 — Hero video: self-hosted MP4

See `.claude/skills/hero-video.md` for the full pattern.

Key rules: MP4 H.264, `pix_fmt yuv420p`, JS-injected source (not `<source media>`), mobile + reduced-motion get poster only.

`Hero.astro` already implements this — pass the `video` prop to enable.

---

## Section 12 — Verification checklist for a new clone

Before building any new client features, verify each of these:

- [ ] `scripts/patch-cloudflare-adapter.mjs` is present + `npm postinstall` hook is set. **If missing, set it up FIRST — every Pages deploy will fail.**
- [ ] Cache headers in `public/_headers` match the spec above (1-year cache for `/images/`, `/videos/`, `/fonts/`, `/icons/`, `/_astro/`)
- [ ] `BaseLayout.astro`:
  - [ ] `noindex = true` default
  - [ ] `<html lang="en-GB">` (NOT `en`)
  - [ ] `heroImage` AND `heroImageMobile` props with media-query gated `<link rel="preload">` rendering
  - [ ] `schema?: object | object[]` prop rendering JSON-LD
  - [ ] Deferred GTM loader (idle/interaction/6s fallback) — not synchronous async
  - [ ] CSP includes `media-src 'self'`
- [ ] `Hero.astro` supports the optional `video` prop using JS-injected source. If a previous Hero is YouTube-based, schedule a refactor early — biggest perf win available.
- [ ] `scripts/optimise-hero-video.mjs` + `scripts/resize-oversized-images.mjs` are in place with their npm script entries (`npm run optimise-video`, `npm run resize-images`)
- [ ] `.claude/skills/` contains `contactform.md`, `hero-video.md`, `performance.md` (this file), and any client-specific skills
- [ ] `astro.config.mjs` has `site:` set to the production domain (drives canonical / OG / sitemap origin without env-var traps)
- [ ] `public/robots.txt` is pure ASCII (run: `perl -ne 'print if /[^\x00-\x7F]/' public/robots.txt` should print nothing)
- [ ] `public/_redirects` exists (placeholder OK) — documents the valid status codes (200/301/302/303/307/308)
- [ ] `npm run build` exits 0 with no `ASSETS`-binding warnings
- [ ] Run a fresh PageSpeed pass on the `*.pages.dev` preview URL after first deploy. Target: 90+ mobile, 90+ desktop. Below that on a fresh clone with no client-specific tuning = something in the template has regressed.

---

## Reference commits (Northern Medical, the proving ground)

| Commit | Change |
|---|---|
| `5c149d9` | patch-cloudflare-adapter (ASSETS binding rename) |
| `6f24c7d` | remove unsupported 410 codes from `_redirects` |
| `0ad8b16` | robots.txt encoding fix |
| `6e0be2b` | defer GTM script load |
| `b192e40` | resize 9 oversized images |
| `454c6af` | cache `/images/*` for 1 year |
| `d9ce1f0` | scope YouTube preconnects to homepage (interim, later removed) |
| `e2b7868` | dual mobile/desktop hero preload |
| `0f5ae2b` | replace YouTube hero iframe with self-hosted MP4 |
| `b3661f7` | add `<source media>` for mobile skip (REVERTED — broke Safari) |
| `fb50284` | JS-inject `<source>` for desktop-only video (Safari-safe) |
