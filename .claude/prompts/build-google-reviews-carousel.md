---
name: Build the HMDG Google Reviews Carousel (Trustindex-style, free)
description: Self-contained Claude Code prompt to build the full HMDG premium Google Reviews carousel in any Astro + Tailwind v4 + Cloudflare Pages project. Trustindex-equivalent functionality without the third-party widget. Native CSS scroll-snap carousel (~600 byte JS), dynamic LocalBusiness/AggregateRating/Review[] JSON-LD schema baked at build time, manual + automatic data paths, mobile-responsive nowrap fix, ≥4-star filter + sort newest + cap at 20. Built 2026-05-04.
---

# Build Prompt: HMDG Google Reviews Carousel

Paste the block below into a fresh Claude Code session inside any Astro + Tailwind v4 + Cloudflare Pages project (or HMDG base template) to build the complete reviews carousel system. Self-contained — Claude can execute without seeing any other file.

---

````
Build a premium Google Reviews carousel section called ReviewsSection — Trustindex-style but native Astro, fully free, dynamic JSON-LD schema. This is for an HMDG-pattern Astro + Tailwind v4 + Cloudflare Pages base template.

PIPELINE: ux-architect → ui-designer → frontend-builder → a11y-reviewer → performance-reviewer → performance-optimisation → seo-reviewer → conversion-reviewer.

POSITIONING:
- Add to BaseLayout.astro between the page <slot /> and the existing pre-footer BookingSection (or directly above Footer if no BookingSection exists)
- Global section — appears on every page

DATA LAYER (src/data/reviews.ts):
1. TypeScript interfaces:
   - Review: { name, rating: 1|2|3|4|5, text, relativeTime, date (YYYY-MM-DD), source: 'google' }
   - ReviewsMeta: { averageRating, totalReviews, totalReviewsDisplay, source, placeId?, mapsUrl? }
2. Hand-curated `reviewsRaw: Review[]` array with 8–11 sample reviews (clinic-appropriate text, mixed reviewer names, 4-5 star only, ISO dates)
3. `fallbackMeta: ReviewsMeta` with averageRating, totalReviews, totalReviewsDisplay (e.g. "1,200+"), placeId, mapsUrl
4. `getInitials(name)` helper — returns up to 2 initials uppercase
5. Optional cache file loader using import.meta.glob('./reviews-cache.json'):
   - If reviews-cache.json exists, override reviewsRaw + fallbackMeta
6. Display logic applied to whichever source is in use:
   - Filter rating ≥4 only
   - Sort by date descending (newest first)
   - Slice to top 20
7. Export `reviews` and `reviewsMeta` after the filtering

COMPONENT (src/components/ReviewsSection.astro):

FRONTMATTER:
- Import `reviews`, `reviewsMeta`, `getInitials` from data layer
- Build a JSON-LD object: LocalBusiness with @id, name, url (from Astro.site or env), AggregateRating (ratingValue, reviewCount, bestRating: 5, worstRating: 1), and a Review[] array mapping each review to schema.org Review with author Person, reviewRating Rating with bestRating 5, datePublished, reviewBody. Use Number(reviewsMeta.averageRating.toFixed(1)) for the rating value.

MARKUP:
- <section class="reviews-section" aria-labelledby="reviews-headline">
  - <script type="application/ld+json" is:inline set:html={JSON.stringify(reviewsLd)} />
  - .container-main wrapper
    - .reviews-head with H2 "Trusted by [Location] Patients on Google" (italic <em>Google</em>) and .reviews-subline with 5 mint stars + "5.0 average rating · 1,200+ verified reviews on Google"
    - .reviews-carousel with:
      - .reviews-track [data-reviews-track] tabindex="0" role="region" aria-label="Patient reviews carousel"
        - .review-card per review:
          - .review-stars (aria-label="Rated N out of 5 stars") with N inline-SVG mint stars
          - .review-text with the review body
          - .review-divider hairline
          - .review-author with .review-avatar (initials in mint circle), .review-meta containing .review-name and .review-time (with two .review-time-part spans wrapping relativeTime and "via Google", separated by .review-source-sep dot)
      - .reviews-controls: .reviews-link to mapsUrl ("See All Reviews on Google" + NE arrow), .reviews-arrows with prev/next buttons (data-reviews-prev / data-reviews-next, aria-labels)

CSS:
- Section: padding from token system (var(--spacing-section-y) / var(--spacing-section-y-lg) at 1200px), bg var(--color-accent), overflow-x hidden
- .reviews-headline: serif, clamp(2.5rem, 4.8vw, 4.25rem), italic <em> in primary navy
- .reviews-subline: mono uppercase, var(--text-2xs), 5 mint stars inline
- .reviews-track: display grid, grid-auto-flow column, grid-auto-columns calc(100% - 2rem) base / calc(50% - 0.75rem) at 600px / calc(33.333% - 1rem) at 960px, gap 1.5rem, overflow-x auto, scroll-snap-type x mandatory, scroll-behavior smooth, hidden scrollbar
- .review-card: white bg, 15px radius, padding 2rem, flex column, min-height 18rem, gap 1.25rem, scroll-snap-align start, hover translateY(-2px) with shadow
- .review-stars: inline-flex gap 0.25rem, color mint
- .review-text: var(--font-body) (Inter Tight), font-size 0.9375rem, line-height 1.55, color headline, flex 1 (so cards equal-height)
- .review-divider: 1px hairline rule
- .review-avatar: 2.625rem circle, mint-tinted bg via color-mix, mono semibold initials
- .review-name: Inter Tight 0.9375rem semibold
- .review-time: inline-flex with flex-wrap, mono uppercase 0.6875rem, opacity 0.65, 0.1em letter-spacing
- .review-time-part: white-space nowrap (CRITICAL — prevents "3 WEEKS / AGO" mid-word break on mobile)
- @media (max-width: 480px): .review-time becomes flex-direction column, hide .review-source-sep
- .reviews-controls: flex row space-between, mint-link with grow-gap on hover, arrow buttons reuse .arrow-btn class
- prefers-reduced-motion: cuts transitions to 0.01s, removes transforms, scroll-behavior auto

JS (LCP-safe):
- Vanilla, no Swiper/library
- Define initReviewsCarousel(): grabs track + prev + next, computes step from card width + gap, scrollBy on click, updateEdges to disable buttons at scroll start/end
- IntersectionObserver with rootMargin '300px 0px' defers init until section is near viewport, then disconnects after first intersection
- Fallback: immediate init if IO not supported

OPTIONAL FETCH SCRIPT (scripts/fetch-google-reviews.mjs):
- Tiny .env loader (no dependencies)
- Reads GOOGLE_PLACES_API_KEY + (GOOGLE_PLACE_URL OR GOOGLE_PLACE_ID) from env
- extractPlaceIdFromUrl() supports place_id: pattern, !1s<hex>:<hex> feature ID, and !1sChIJ... — auto-extracts from any Google Maps URL
- Fetches Place Details endpoint with fields=reviews,rating,user_ratings_total,name,url and reviews_sort=newest
- Filters ≥4 star, transforms to Review[] type
- Merges with existing reviews-cache.json (de-dupes by name|date key, API entries override on conflict)
- Caps at 20 reviews
- Writes src/data/reviews-cache.json
- Cost note: free in practice (Google Cloud's $200/mo credit covers ~10K calls — weekly refresh = ~5 calls/month = ~£0.07)

NPM SCRIPT (package.json):
- "reviews:fetch": "node scripts/fetch-google-reviews.mjs"

OPTIONAL GITHUB ACTIONS WORKFLOW (.github/workflows/refresh-reviews.yml.example):
- Weekly cron schedule: '0 6 * * 1' (Monday 06:00 UTC)
- workflow_dispatch for manual trigger
- permissions: contents: write
- Steps: checkout, setup-node v22, run fetch script with secrets, commit + push if changed
- Saved as .example so it doesn't auto-run until renamed

SEO / SCHEMA REQUIREMENTS:
- JSON-LD must be DYNAMIC — generated from the same `reviews` + `reviewsMeta` exports as the visible HTML, so updates to reviews automatically update the schema
- LocalBusiness type, with embedded AggregateRating + Review[]
- Schema only emits when real review data exists (no fake-data risk)
- Visible HTML must match schema content (Google's #1 rule)
- aggregateRating.reviewCount uses meta.totalReviews (the business's overall Google count)
- Each Review has author Person, reviewRating Rating with bestRating: 5, datePublished, reviewBody
- DOCUMENT in component header comment: Google's 2019 self-serving review-stars policy may suppress SERP rich result, but schema benefits AI search engines (ChatGPT/Bing AI/Perplexity) + Knowledge Graph + future-proofing

PERFORMANCE GUARANTEES (must hold):
- Section is BELOW the fold — must NOT compete with hero LCP
- All review images are inline SVG stars (no profile pics, initials only)
- JS deferred via IntersectionObserver — only initializes when within 300px of viewport
- Total JS ~600 bytes vanilla, no Swiper / no carousel library
- Native CSS scroll-snap means carousel works WITHOUT JS (touch swipe + arrow keys)
- Cards reserve space via min-height + grid-auto-columns (zero CLS)
- Animations use transform + opacity only (GPU-cheap)
- Static HTML baked at build — zero runtime API calls per page view

ACCESSIBILITY:
- aria-labelledby links section to H2
- role="region" + aria-label on the track
- tabindex="0" on track for keyboard scroll
- Each card's stars have aria-label="Rated N out of 5 stars"
- Decorative SVGs aria-hidden + focusable="false"
- Prev/Next buttons aria-label + disabled state at scroll edges (visual + assistive)
- prefers-reduced-motion strips card transforms + smooth-scroll
- Strong contrast (navy on white passes WCAG AAA)
- NO autoplay (per "avoid aggressive sliding" rule)

REVIEW QUALITY RULES:
- Only emit reviews where rating ≥ 4 (filter applied at build)
- Sort newest first by date
- Cap at 20 reviews max
- IMPORTANT: only paste REAL Google reviews — UK ASA + Google ToS forbid fake reviews. Document this in reviews.ts header.

DEFAULT TOKEN REFERENCES (must exist or be added in global.css :root or @theme):
--color-primary, --color-mint-green, --color-mint-green-accent, --color-accent, --color-muted, --color-headline, --color-body, --color-white, --rule-light, --font-serif, --font-body, --font-mono, --text-2xs, --spacing-section-y, --spacing-section-y-lg

REPLACE-THE-LINK WORKFLOW:
When the user provides a new Google Maps URL, the workflow is:
1. Update GOOGLE_PLACE_URL in .env to the new URL
2. Run npm run reviews:fetch
3. Commit src/data/reviews-cache.json
4. Push — Cloudflare Pages rebuilds with the new clinic's reviews
The script auto-extracts the Place ID from the URL via regex.

DELIVERABLES:
- src/components/ReviewsSection.astro (complete component with markup, scoped CSS, deferred JS, dynamic JSON-LD)
- src/data/reviews.ts (data layer with types + sample reviews + helpers + cache loader + filter/sort/cap)
- scripts/fetch-google-reviews.mjs (Node script, dependency-free, with URL→Place ID extraction)
- .github/workflows/refresh-reviews.yml.example (cron template)
- package.json updated with reviews:fetch script
- src/layouts/BaseLayout.astro updated to import + render ReviewsSection above any existing BookingSection / Footer
- Save the entire pattern as .claude/skills/googlereviews-carousel.md for future reuse

VALIDATION CHECKLIST:
- Section appears on every page above Footer
- Reviews show 4-5 star only, newest first, max 20
- Mobile (≤480px): meta line stacks cleanly, no mid-word breaks ("3 WEEKS AGO" stays one line)
- Carousel arrows disabled at scroll start/end edges
- prefers-reduced-motion strips card lift + smooth scroll
- JSON-LD validates in Google's Rich Results Test
- PSI mobile score unchanged from baseline (≤1 point delta)
- No console errors
- Schema dynamically reflects whatever's in the reviews array

Build it.
````
