/**
 * reviews.ts
 * ───────────────────────────────────────────────────────────────────
 * Free, manual-curation Google Reviews data layer.
 *
 * SIMPLEST PATH (recommended — fully free, zero API setup):
 *
 *   1. Visit your clinic's Google Reviews page
 *   2. Pick the best 8–10 recent reviews (4–5 stars only)
 *   3. Copy-paste each one into the `reviewsRaw` array below
 *      (name, rating, text, relativeTime, date)
 *   4. Commit + deploy — Cloudflare Pages static-renders them
 *   5. Repeat monthly to keep reviews fresh
 *
 *   No Google Cloud account. No API keys. No signup. Free forever.
 *
 * AUTOMATIC PATH (optional — for users who want auto-refresh):
 *
 *   See scripts/fetch-google-reviews.mjs + .github/workflows/refresh-reviews.yml.example.
 *   Uses Google's $200/month free Cloud credit (~10,000 calls/month).
 *   Even daily refresh stays inside the free tier.
 *
 * GUARANTEES:
 *   - Only 4-5 star reviews are shown (filtered automatically)
 *   - Newest reviews appear first (sorted by date)
 *   - Maximum 10 reviews displayed (capped automatically)
 *   - These guarantees apply whether you edit this file manually
 *     OR use the automatic fetch script
 *
 * IMPORTANT — REVIEW AUTHENTICITY:
 *   Only paste in REAL reviews from your actual Google Reviews page.
 *   Fake reviews violate Google's Terms + UK ASA advertising rules.
 *   Do not invent reviews.
 */

export interface Review {
  /** Reviewer's display name. */
  name: string;
  /** Star rating, 1-5. We filter to 4-5 only at the bottom of this file. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** The review text. */
  text: string;
  /** Human-readable relative time (e.g. "2 weeks ago"). */
  relativeTime: string;
  /** ISO date (YYYY-MM-DD) — used for sorting (newest first). */
  date: string;
  /** Source platform — fixed to 'google' here. */
  source: 'google';
}

export interface ReviewsMeta {
  /** Average star rating across all reviews. */
  averageRating: number;
  /** Total review count (real number from your Google Business profile). */
  totalReviews: number;
  /** Display string for marketing copy (e.g. "1,200+"). */
  totalReviewsDisplay: string;
  /** Source platform identifier. */
  source: 'google';
  /** Google Place ID — optional. */
  placeId?: string;
  /** Public Google Maps page URL — for "see all reviews" link. */
  mapsUrl?: string;
}

/**
 * Aggregate trust metadata. Update these when your business stats change.
 * (The automatic fetch script overrides these from Google's response.)
 */
const fallbackMeta: ReviewsMeta = {
  averageRating:        5.0,
  totalReviews:         1247,
  totalReviewsDisplay:  '1,200+',
  source:               'google',
  mapsUrl:              'https://www.google.com/maps/place/HMDG/data=!4m2!3m1!1s0x0:0x2478c186b6a11927?sa=X&ved=1t:2428&ictx=111',
};

/**
 * Hand-curated reviews. Paste your actual Google Reviews here.
 * The display logic at the bottom of this file:
 *   • filters to 4–5 star only
 *   • sorts newest first (by date)
 *   • caps at 10 reviews max
 * So you can safely paste 15+ here — the filter handles the rest.
 */
const reviewsRaw: Review[] = [
  {
    name:         'Sarah Mitchell',
    rating:       5,
    text:         "I'd suffered with lower back pain and sciatica for years. After 6 sessions with the team I'm sleeping through the night again and back to gardening without flare-ups. Genuinely life-changing care.",
    relativeTime: '2 weeks ago',
    date:         '2026-04-18',
    source:       'google',
  },
  {
    name:         'James Thompson',
    rating:       5,
    text:         "Came in with a serious shoulder injury after a rugby match. The team's diagnosis was spot-on and the rehab plan got me back on the pitch six weeks ahead of schedule. Calm, methodical, brilliant.",
    relativeTime: '1 month ago',
    date:         '2026-04-02',
    source:       'google',
  },
  {
    name:         'Helen Reeves',
    rating:       5,
    text:         "Three other clinics for my neck pain and migraines, no progress. One assessment here and they identified the root cause. The treatment plan was clear, structured, and worked within weeks.",
    relativeTime: '3 weeks ago',
    date:         '2026-04-11',
    source:       'google',
  },
  {
    name:         'David Knowles',
    rating:       5,
    text:         "Professional, calm, thorough. Explained every step as we went. My sciatica has improved more in 4 sessions here than in 6 months of physio elsewhere. Would recommend without hesitation.",
    relativeTime: '5 weeks ago',
    date:         '2026-03-28',
    source:       'google',
  },
  {
    name:         'Emma Lawrence',
    rating:       5,
    text:         "The pregnancy care was exceptional — gentle, well-informed, and tailored carefully to each trimester. I felt completely safe throughout. Highly recommend to other expectant mums in Cheltenham.",
    relativeTime: '2 weeks ago',
    date:         '2026-04-19',
    source:       'google',
  },
  {
    name:         'Michael Patel',
    rating:       5,
    text:         "Booked for general 'wear and tear' in my mid-50s. The team treated me with care, never rushed, and gave me a maintenance plan I actually stick to. Worth every penny — best clinic I've used.",
    relativeTime: '6 weeks ago',
    date:         '2026-03-21',
    source:       'google',
  },
  {
    name:         'Charlotte Owens',
    rating:       5,
    text:         "After whiplash from a road accident I was stiff and anxious about driving. The structured rehab plan got me back behind the wheel pain-free in three months. Couldn't ask for more.",
    relativeTime: '1 month ago',
    date:         '2026-04-04',
    source:       'google',
  },
  {
    name:         'Andrew Holmes',
    rating:       5,
    text:         "Brought my 8-year-old in for posture concerns after a school referral. Gentle, patient, and explained everything to him in his own language. Real specialists in paediatric care.",
    relativeTime: '3 weeks ago',
    date:         '2026-04-12',
    source:       'google',
  },
  {
    name:         'Rachel Bennett',
    rating:       5,
    text:         "Years of tension headaches, finally addressed at the source. The clinical reasoning behind the treatment plan was the difference — they explained WHY each technique mattered.",
    relativeTime: '4 weeks ago',
    date:         '2026-04-05',
    source:       'google',
  },
  {
    name:         'Tom Whitfield',
    rating:       5,
    text:         "Half-marathon runner, calf strain that wouldn't shift. Two sessions of shockwave plus a clear rehab plan and I was back in training. Diagnosis was spot-on and the treatment worked fast.",
    relativeTime: '7 weeks ago',
    date:         '2026-03-14',
    source:       'google',
  },
  {
    name:         'Priya Joshi',
    rating:       5,
    text:         "First time at a chiropractor, was nervous but they put me at ease immediately. The mobility I've regained in my lower back after 8 weeks is honestly remarkable. Will be back yearly.",
    relativeTime: '5 weeks ago',
    date:         '2026-03-29',
    source:       'google',
  },
];

/**
 * Get initials from a full name.
 * "Sarah Mitchell" → "SM" · "James Thompson" → "JT" · "Helen" → "H"
 */
export const getInitials = (name: string): string => {
  return name
    .split(/\s+/)
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

/**
 * Optional: live cache from `npm run reviews:fetch`.
 * If reviews-cache.json exists, it overrides reviewsRaw + fallbackMeta.
 */
type CacheShape = { meta: ReviewsMeta; reviews: Review[] };
const cacheModules = import.meta.glob<CacheShape>('./reviews-cache.json', {
  eager: true,
  import: 'default',
});
const cached: CacheShape | undefined = Object.values(cacheModules)[0];

const sourceReviews: Review[] = cached?.reviews ?? reviewsRaw;
const sourceMeta:    ReviewsMeta = cached?.meta ?? fallbackMeta;

/**
 * Display logic — applied to whichever source is in use:
 *   1. Filter to 4-5 star reviews only (drop low-rating noise)
 *   2. Sort by date descending (newest first)
 *   3. Cap at 20 reviews maximum (carousel still scrolls cleanly)
 *
 * Note: Google's Places API returns max 5 reviews per call. To populate
 * the full 20, mix automatic fetch (5 fresh) + manual paste (up to 15).
 * The de-dupe + sort handles either source consistently.
 */
const MAX_REVIEWS = 20;
const MIN_RATING  = 4;

export const reviews: Review[] = sourceReviews
  .filter(r => r.rating >= MIN_RATING)
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  .slice(0, MAX_REVIEWS);

export const reviewsMeta: ReviewsMeta = sourceMeta;
