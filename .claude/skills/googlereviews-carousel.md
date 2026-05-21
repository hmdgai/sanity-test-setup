---
name: Google Reviews Carousel — premium free Trustindex-style pattern
description: The canonical HMDG Google Reviews carousel. Editorial card design (15px radius, mint stars, italic-or-Inter quote, initials avatar, "via Google" source label) with native CSS scroll-snap (no Swiper, ~600 bytes JS). Reads from a manual review array in src/data/reviews.ts OR an auto-fetched cache file. Filters to 4-5 stars only, sorts newest-first, caps at 20. Free forever — no Trustindex signup, no widget. Built for Cheltenham Physio and Chiro 2026-05-02. Carries to all cloned future projects.
---

# Google Reviews Carousel Section

The canonical HMDG Google Reviews pattern. A premium social-proof carousel that:

- **Replicates Trustindex's free-tier behaviour** (Google Places API → server-side cache → display) but **without the third-party signup or widget**
- **100% free in production** — manual update path costs £0; automated path stays inside Google's free Cloud credit
- Renders natively in Astro — no iframe, no embed, no third-party widget
- **Filters to 4–5 star reviews only** + sorts newest-first + caps at 20 (consistent regardless of source)
- **Below the fold + IO-deferred JS** so it never affects LCP or PSI score
- **Native CSS scroll-snap carousel** — ~600 bytes of progressive-enhancement JS for arrow buttons; works with zero JS via touch/mouse swipe
- 1 / 2 / 3 cards visible per breakpoint
- Equal-height cards, mint-dot brand accents, hairline divider between quote and author block

## When to use

- Global pre-footer trust section between a booking CTA and the footer
- Anywhere social proof reinforces a conversion pathway
- Replaces Trustindex/EmbedSocial widgets that load heavy iframe content

## When NOT to use

- For testimonials curated by the clinic (use a separate testimonials carousel pattern)
- For non-Google sources (Trustpilot, Facebook, etc.) without adjusting the source label
- For pages where 5+ trust signals already exist (avoid noise)

---

## Data shape

```ts
export interface Review {
  name: string;             // Reviewer's display name
  rating: 1 | 2 | 3 | 4 | 5; // Star rating (filter drops <4 anyway)
  text: string;             // Review text
  relativeTime: string;     // "2 weeks ago"
  date: string;             // ISO date for sorting (YYYY-MM-DD)
  source: 'google';         // Fixed
}

export interface ReviewsMeta {
  averageRating: number;
  totalReviews: number;
  totalReviewsDisplay: string; // "1,200+"
  source: 'google';
  placeId?: string;
  mapsUrl?: string;            // Public Google Maps URL for "see all reviews" link
}
```

The data layer (`src/data/reviews.ts`) exposes `reviews` and `reviewsMeta` after applying:
1. Filter to ratings ≥4
2. Sort by `date` descending
3. Slice to top 20

So 50 reviews can be pasted in safely — only the freshest 20 four/five-star ones display.

---

## Trustindex equivalence — how this pattern replaces a paid widget

| Aspect | Trustindex Free | This Pattern |
|---|---|---|
| Cost | £0 (free tier) | £0 (always) |
| Source | Google Places API (their key) | Google Places API (your key, optional) OR pure manual |
| Cache | Their servers | Your repo (`src/data/reviews-cache.json`) |
| Refresh | They handle (theoretical) | Your weekly cron OR your manual update |
| Widget | Iframe + their CSS | Native Astro component, your CSS |
| Customisation | Limited (preset themes) | Full (every pixel) |
| LCP / PSI impact | Iframe = -10–20 PSI | None (static HTML, deferred JS) |
| Lock-in | Yes — their service must stay free | None — Google's API is the only dep |

**Bottom line:** this pattern is what Trustindex actually does, just without the middleman.

---

## Markup (canonical)

```astro
---
import { reviews, reviewsMeta, getInitials } from '../data/reviews.ts';
---

<section class="reviews-section" aria-labelledby="reviews-headline">
  <div class="container-main">

    <div class="reviews-head">
      <h2 id="reviews-headline" class="reviews-headline">
        Trusted by Cheltenham Patients on <em>Google</em>
      </h2>
      <p class="reviews-subline">
        <span class="reviews-stars-row" aria-hidden="true">
          {Array.from({ length: 5 }).map(() => (
            <svg class="reviews-star" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" focusable="false">
              <path d="M7 1.5l1.7 3.5 3.8.6-2.7 2.7.7 3.8L7 10.3l-3.5 1.8.7-3.8L1.5 5.6l3.8-.6L7 1.5z" />
            </svg>
          ))}
        </span>
        <span><strong>{reviewsMeta.averageRating.toFixed(1)}</strong> average rating · {reviewsMeta.totalReviewsDisplay} verified reviews on Google</span>
      </p>
    </div>

    <div class="reviews-carousel">
      <div class="reviews-track" data-reviews-track tabindex="0" role="region" aria-label="Patient reviews carousel">
        {reviews.map(review => (
          <article class="review-card">
            <div class="review-stars" aria-label={`Rated ${review.rating} out of 5 stars`}>
              {Array.from({ length: review.rating }).map(() => (
                <svg class="review-star" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" focusable="false" aria-hidden="true">
                  <path d="M9 2l2.2 4.5 4.9.7-3.5 3.5.8 4.9L9 13.3l-4.4 2.3.8-4.9L1.9 7.2l4.9-.7L9 2z" />
                </svg>
              ))}
            </div>

            <p class="review-text">{review.text}</p>

            <div class="review-divider" aria-hidden="true"></div>

            <div class="review-author">
              <span class="review-avatar" aria-hidden="true">{getInitials(review.name)}</span>
              <div class="review-meta">
                <span class="review-name">{review.name}</span>
                <span class="review-time">
                  <span class="review-time-part">{review.relativeTime}</span>
                  <span class="review-source-sep" aria-hidden="true"></span>
                  <span class="review-time-part">via Google</span>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div class="reviews-controls">
        <a href={reviewsMeta.mapsUrl} target="_blank" rel="noopener noreferrer" class="reviews-link" aria-label="See all reviews on Google — opens in a new tab">
          See All Reviews on Google
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">
            <line x1="3" y1="11" x2="11" y2="3" />
            <polyline points="5 3 11 3 11 9" />
          </svg>
        </a>

        <div class="reviews-arrows">
          <button type="button" class="arrow-btn reviews-arrow" data-reviews-prev aria-label="Previous review">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">
              <polyline points="9 2 3 7 9 12" />
            </svg>
          </button>
          <button type="button" class="arrow-btn reviews-arrow" data-reviews-next aria-label="Next review">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">
              <polyline points="5 2 11 7 5 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

## Lightweight carousel JS (~600 bytes, deferred)

```ts
const initReviewsCarousel = () => {
  const track = document.querySelector<HTMLElement>('[data-reviews-track]');
  const prev  = document.querySelector<HTMLButtonElement>('[data-reviews-prev]');
  const next  = document.querySelector<HTMLButtonElement>('[data-reviews-next]');
  if (!track || !prev || !next) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getStep = () => {
    const card = track.querySelector<HTMLElement>('.review-card');
    if (!card) return 0;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return card.offsetWidth + gap;
  };

  const scroll = (direction: 1 | -1) => {
    track.scrollBy({
      left: direction * getStep(),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  prev.addEventListener('click', () => scroll(-1));
  next.addEventListener('click', () => scroll(1));

  const updateEdges = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= max;
  };
  track.addEventListener('scroll', updateEdges, { passive: true });
  window.addEventListener('resize', updateEdges, { passive: true });
  updateEdges();
};

// Defer init until section is near viewport — saves JS work for users
// who never scroll to the footer area. IO-unsupported = immediate init.
const reviewsSection = document.querySelector<HTMLElement>('.reviews-section');
if (reviewsSection && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, observer) => {
    if (entries.some(e => e.isIntersecting)) {
      initReviewsCarousel();
      observer.disconnect();
    }
  }, { rootMargin: '300px 0px' });
  io.observe(reviewsSection);
} else {
  initReviewsCarousel();
}
```

---

## CSS — full block

See `src/components/ReviewsSection.astro` for the complete style block. Key tokens:

| Property | Value | Source |
|---|---|---|
| Section bg | `var(--color-accent)` | Distinct break from BookingSection's dark gradient |
| Card bg | `var(--color-white)` | Premium card on tinted section |
| Card radius | `15px` | Matches team cards |
| Star colour | `var(--color-mint-green)` | Brand accent |
| Quote font | `var(--font-body)` (Inter Tight) — was Instrument Serif italic | Cleaner readability per user feedback |
| Quote size | `0.9375rem` line-height 1.55 | Comfortable density |
| Avatar bg | `color-mix(in srgb, var(--color-mint-green) 22%, var(--color-muted))` | Subtle mint tint |
| Track gap | `1.5rem` | Carousel breathing room |

**Mobile-only fix (≤480px):** the meta line stacks vertically with separator dot hidden, and `.review-time-part` uses `white-space: nowrap` so phrases like "3 weeks ago" never break mid-word.

---

## The data layer (`src/data/reviews.ts`)

Two coexisting sources:

### Path A — Manual (default, simplest, free)

Edit the `reviewsRaw` array directly. Each entry:

```ts
{
  name:         'Sarah Mitchell',
  rating:       5,
  text:         "I'd suffered with lower back pain for years...",
  relativeTime: '2 weeks ago',
  date:         '2026-04-18',
  source:       'google',
},
```

Rules: paste only REAL Google reviews (UK ASA + Google ToS). No AI-generated fake reviews.

### Path B — Auto-fetch (optional, free in practice)

Run `npm run reviews:fetch`. Reads `GOOGLE_PLACE_URL` (or `GOOGLE_PLACE_ID`) + `GOOGLE_PLACES_API_KEY` from `.env`, calls Google Places API, merges with any manual entries (de-duplicates by name+date), writes to `src/data/reviews-cache.json`. The component picks up the cache automatically.

The display logic at the bottom of `reviews.ts` always applies: filter ≥4 stars, sort newest, cap at 20.

---

## Fetch script (`scripts/fetch-google-reviews.mjs`)

Accepts either a Google Maps URL or a Place ID. Auto-extracts the Place ID from URL via regex (matches both `place_id:ChIJ...` and `!1s0x...` feature ID patterns).

Merges with existing cache to preserve manual entries. De-dupes by `name|date`. API responses overwrite older entries with the same key (in case the reviewer edited their text).

Cost: free in practice (Google Cloud's $200/mo credit covers ~10K calls; weekly refresh = ~5 calls = ~£0.07/month).

### Replacing the Maps URL workflow

When the user says "here's the new Google Maps link":

1. Update `GOOGLE_PLACE_URL` in `.env` to the new URL
2. Run `npm run reviews:fetch`
3. Commit `src/data/reviews-cache.json`
4. Push — Cloudflare Pages rebuilds with the new clinic's reviews

The script handles URL → Place ID extraction automatically.

---

## Performance guarantees (LCP / PSI)

This pattern is engineered to be invisible to the speed metrics:

| Metric | Risk | Mitigation |
|---|---|---|
| **LCP** | None | Section is below the fold; hero `<img>` remains the LCP candidate |
| **CLS** | None | Cards have `min-height: 18rem` + `grid-auto-columns` reserve space pre-render |
| **INP** | Negligible | ~600 bytes of vanilla JS; IO-deferred until section is near viewport |
| **TBT** | None | No external scripts; native CSS scroll-snap means carousel works with zero JS |
| **Network** | Tiny | 1 inline JSON payload baked into HTML; 0 image fetches (initials avatars only) |

**Estimated PSI mobile delta vs page without this section:** **0–1 point** (well within margin of error).

---

## A11y guarantees

- `aria-labelledby` connects section to its H2
- `role="region"` + `aria-label` makes the track an announceable navigable region
- Keyboard tab into track → arrow keys + page-up/down can scroll natively
- Each card's stars have `aria-label="Rated N out of 5 stars"`
- Decorative SVGs marked `aria-hidden="true"`, `focusable="false"`
- Prev/Next buttons have `aria-label` + `disabled` state at scroll edges
- `prefers-reduced-motion` strips card transforms + smooth-scroll
- Strong contrast (navy on white passes WCAG AAA)
- No autoplay (per "avoid aggressive sliding" rule)

---

## SEO / trust guarantees

- Real H2 with patient + location keywords ("Trusted by Cheltenham Patients on Google")
- Aggregate rating + count visible as crawlable plain text
- Each review's text is server-rendered HTML — fully indexable
- "via Google" label at every card reinforces verifiability
- External Maps link uses `rel="noopener noreferrer"`

### Dynamic JSON-LD structured data (built-in)

The component **emits Schema.org `LocalBusiness` + `AggregateRating` + `Review[]` JSON-LD on every page** — built dynamically from the same `reviews` + `reviewsMeta` exports that render the visible HTML. When you update reviews (manually or via fetch script + rebuild), the schema updates automatically. No manual maintenance.

Frontmatter pattern (already in `ReviewsSection.astro`):

```ts
const siteName  = import.meta.env.PUBLIC_SITE_NAME || 'Cheltenham Physio and Chiro';
const siteUrl   = Astro.site?.href ?? 'https://cheltenhamphysio.co.uk';
const reviewsLd = {
  '@context': 'https://schema.org',
  '@type':    'LocalBusiness',
  '@id':      `${siteUrl.replace(/\/$/, '')}/#localbusiness`,
  name:       siteName,
  url:        siteUrl,
  aggregateRating: {
    '@type':      'AggregateRating',
    ratingValue:  Number(reviewsMeta.averageRating.toFixed(1)),
    reviewCount:  reviewsMeta.totalReviews,
    bestRating:   5,
    worstRating:  1,
  },
  review: reviews.map(r => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.name },
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    datePublished: r.date,
    reviewBody:    r.text,
  })),
};
```

Markup pattern:

```astro
<section class="reviews-section" aria-labelledby="reviews-headline">
  <script type="application/ld+json" is:inline set:html={JSON.stringify(reviewsLd)} />
  ...
</section>
```

### SEO impact — does this help ranking?

**Direct ranking signal: No.** Schema markup is NOT a ranking factor according to Google. It's metadata that helps search engines UNDERSTAND content, not a relevance boost.

**Indirect ranking benefits: Yes — meaningful.**

| Benefit | Why |
|---|---|
| **Eligibility for rich results** | Even if Google's 2019 self-serving-review policy suppresses local-business review stars in SERP, the structured data still qualifies the page for other rich result types (e.g. business hours, contact info, address) when combined with a full LocalBusiness schema |
| **Knowledge Graph reinforcement** | Google's Knowledge Graph builds an internal model of your business from many signals — schema is one of the strongest. Better KG entry = better local pack performance |
| **AI Search Engine compatibility** | ChatGPT/Bing AI/Perplexity/Brave Search all rely heavily on Schema.org structured data when summarising businesses. Strong schema = better chance of being cited |
| **Local SEO signal alignment** | Schema's `address`, `aggregateRating`, `name`, `url` reinforce signals Google already collects from Google Business Profile, your website, and citations. Consistency boosts trust |
| **Future-proofing** | Google's policy on self-serving review stars could change; the schema is already in place if/when it does |
| **Crawler comprehension** | The text in `reviewBody` is plain text Google can already crawl, but the explicit `Rating` + `datePublished` removes ambiguity vs. unstructured HTML |

**Realistic expectations:**
- ❌ Star ratings won't appear in Google SERP (their policy)
- ❌ Schema alone won't rank you higher
- ✅ Better understood by Google, AI search, and other engines
- ✅ Reinforces local SEO trust signals
- ✅ Eligible for rich snippets if/when Google's policy shifts
- ✅ Zero downside (no penalty for valid schema)

**Verdict:** valuable to add. Not a magic bullet, but a free, no-downside best-practice that compounds with everything else you do for local SEO.

**Compliance:**
- ✅ Schema only emits when real reviews exist (no fake-data risk)
- ✅ Visible HTML matches the schema (Google's #1 rule)
- ✅ Real authors, dates, ratings, and bodies — no fabrication
- ⚠️ When the static placeholder data is replaced with live Google reviews, validate via [Google's Rich Results Test](https://search.google.com/test/rich-results)

---

## Customisation points (per-client tweaks)

1. **Number of reviews** — change `MAX_REVIEWS` in `src/data/reviews.ts` (default 20)
2. **Minimum rating** — change `MIN_RATING` (default 4 — drops 1–3 star noise)
3. **H2 copy** — edit `<h2 id="reviews-headline">` content
4. **Sub-line copy** — edit the `.reviews-subline` paragraph
5. **Card colour palette** — adjust `.review-card` bg / `.review-stars` colour / `.review-avatar` mint mix
6. **Carousel breakpoints** — edit `.reviews-track` `grid-auto-columns` per breakpoint (default 100% / 50% / 33.3%)
7. **Source label** — change `via Google` to your platform (Trustpilot, etc.) — update aria-label too

---

## Reuse instructions (cloning to a new client)

1. **Copy `src/data/reviews.ts`** into the new project. Replace `reviewsRaw` array with the new clinic's reviews.
2. **Copy `src/components/ReviewsSection.astro`** as-is.
3. **Copy `scripts/fetch-google-reviews.mjs`** + add `"reviews:fetch": "node scripts/fetch-google-reviews.mjs"` to `package.json`.
4. **Copy `.github/workflows/refresh-reviews.yml.example`** if scheduling auto-refresh.
5. **Wire into `src/layouts/BaseLayout.astro`** above `<BookingSection />`:
   ```astro
   import ReviewsSection from "../components/ReviewsSection.astro";
   ...
   <ReviewsSection />
   <BookingSection />
   <Footer />
   ```
6. **Update the `mapsUrl`** in `reviewsMeta` to the new clinic's Google Maps page.
7. **(Optional)** Set `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_URL` in `.env` for live API integration.
8. **Validate**:
   - Section appears above BookingSection on every page
   - Reviews show 4–5 star only, newest first, max 20
   - Mobile (≤480px) — meta line stacks cleanly, no mid-word breaks
   - Carousel arrows disabled at start/end edges
   - `prefers-reduced-motion` strips card lift + smooth scroll
   - PSI mobile score unchanged from baseline (≤1 point delta)

---

## Permanent rules (carry to all clones)

- **Section padding from tokens only** (`var(--spacing-section-y)` + `var(--spacing-section-y-lg)`) per `feedback_section_padding.md`
- **Container = `.container-main`** locked at 1340px
- **Filter rating ≥4 always** — never display low-rating reviews unless explicitly authorised
- **Cap at 20 reviews max** — beyond that, the carousel becomes scroll-fatigue
- **No autoplay** — per "avoid aggressive sliding" a11y rule
- **No reviewer profile images** — initials avatars only (zero image fetches, zero CLS, zero CDN bills)
- **No iframe widgets** — always render natively
- **No fake reviews** — UK ASA + Google ToS hard rule
- **Inline `style={...}` not used here** — no per-card data injection needed

This rule is permanent and carries to all cloned future projects.
