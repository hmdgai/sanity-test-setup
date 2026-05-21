#!/usr/bin/env node
/**
 * fetch-google-reviews.mjs
 * ─────────────────────────────────────────────────────────────────
 * Fetches recent Google Reviews into a local cache file. Free tier
 * (Google Cloud's $200/month credit covers 10,000+ Place Details
 * calls — a weekly refresh costs <$0.10).
 *
 * USAGE:
 *
 *   1) Set ONE of the following in .env (or pass via env var):
 *        GOOGLE_PLACE_URL=https://www.google.com/maps/place/Your+Clinic/@...
 *        GOOGLE_PLACE_ID=ChIJ...
 *      (URL preferred — script auto-extracts the Place ID from it)
 *
 *   2) Set your API key:
 *        GOOGLE_PLACES_API_KEY=AIza...
 *
 *   3) Run:
 *        npm run reviews:fetch
 *
 *   4) Commit src/data/reviews-cache.json. Cloudflare Pages rebuilds.
 *
 * MERGE BEHAVIOUR:
 *   - The script preserves any reviews you've manually pasted into
 *     reviews-cache.json that aren't returned by the API.
 *   - It de-duplicates by name+date, so the same review never appears
 *     twice if it's both manually entered and API-fetched.
 *   - The displayed cap is 20 — enforced by src/data/reviews.ts at build.
 *   - All reviews must be ≥4 stars to display (filter applied at build).
 *
 * COST: free in practice
 *   - Google Cloud free tier: $200/month credit
 *   - Place Details endpoint: $17 / 1000 calls
 *   - Weekly refresh: 4–5 calls/month → ~$0.085/month → fully covered
 */

import fs   from 'node:fs/promises';
import path from 'node:path';

// ─── Tiny .env loader (no dependencies — keep this script lean) ───
async function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const content = await fs.readFile(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (e) {
    // .env not found — fall through to process.env
  }
}

await loadEnv();

const API_KEY    = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_URL  = process.env.GOOGLE_PLACE_URL;
const PLACE_ID_ENV = process.env.GOOGLE_PLACE_ID;
const CACHE_OUT  = path.resolve(process.cwd(), 'src/data/reviews-cache.json');

// ─── Resolve Place ID (from URL if given, else from env directly) ───
const PLACE_ID = PLACE_ID_ENV || extractPlaceIdFromUrl(PLACE_URL);

if (!API_KEY) {
  console.error('\n  ✘ Missing GOOGLE_PLACES_API_KEY');
  console.error('    Add to .env then re-run: npm run reviews:fetch\n');
  process.exit(1);
}
if (!PLACE_ID) {
  console.error('\n  ✘ Could not resolve a Place ID');
  console.error('    Set ONE of these in .env:');
  console.error('      GOOGLE_PLACE_URL=https://www.google.com/maps/place/...  (preferred)');
  console.error('      GOOGLE_PLACE_ID=ChIJ...');
  console.error('    For the URL path: copy the share-link of your business on Google Maps.\n');
  process.exit(1);
}

console.log(`\n  ⟳ Fetching reviews from Google Places API (Place ID: ${PLACE_ID.slice(0, 24)}…)`);

const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
url.searchParams.set('place_id', PLACE_ID);
url.searchParams.set('fields',   'reviews,rating,user_ratings_total,name,url');
url.searchParams.set('reviews_sort', 'newest');
url.searchParams.set('reviews_no_translations', 'true');
url.searchParams.set('key', API_KEY);

const res = await fetch(url.toString());
if (!res.ok) {
  console.error(`\n  ✘ HTTP ${res.status} ${res.statusText}\n`);
  process.exit(1);
}
const data = await res.json();
if (data.status !== 'OK') {
  console.error(`\n  ✘ Google Places API error: ${data.status}`);
  if (data.error_message) console.error(`    ${data.error_message}\n`);
  process.exit(1);
}

const place = data.result;

// ─── Transform Google's response to our Review[] type ───
const fetchedReviews = (place.reviews || [])
  .filter(r => r.rating >= 4) // 4-5 star only
  .map(r => ({
    name:         r.author_name,
    rating:       r.rating,
    text:         (r.text || '').trim(),
    relativeTime: r.relative_time_description,
    date:         new Date(r.time * 1000).toISOString().split('T')[0],
    source:       'google',
  }));

// ─── Merge with existing cache (preserve manual entries) ───
let existing = { meta: null, reviews: [] };
try {
  const existingRaw = await fs.readFile(CACHE_OUT, 'utf8');
  existing = JSON.parse(existingRaw);
} catch (e) {
  // No existing cache — that's fine, we're creating it now
}

// De-duplicate by `name + date` key. Newer (API) reviews overwrite
// any older entries with the same key (in case the text was edited).
const dedupKey = (r) => `${r.name}|${r.date}`;
const merged = new Map();
for (const r of (existing.reviews || [])) merged.set(dedupKey(r), r);
for (const r of fetchedReviews) merged.set(dedupKey(r), r); // API wins on conflict
const dedupedReviews = Array.from(merged.values())
  .filter(r => r.rating >= 4)
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  .slice(0, 20); // cap at 20

const meta = {
  averageRating:        place.rating,
  totalReviews:         place.user_ratings_total,
  totalReviewsDisplay:  formatTotal(place.user_ratings_total),
  source:               'google',
  placeId:              PLACE_ID,
  mapsUrl:              place.url || PLACE_URL || `https://maps.google.com/?q=place_id:${PLACE_ID}`,
  fetchedAt:            new Date().toISOString(),
};

await fs.writeFile(CACHE_OUT, JSON.stringify({ meta, reviews: dedupedReviews }, null, 2) + '\n', 'utf8');

console.log(`  ✓ Wrote ${dedupedReviews.length} reviews + meta → ${path.relative(process.cwd(), CACHE_OUT)}`);
console.log(`    Average rating: ${meta.averageRating} · Total: ${meta.totalReviews}`);
console.log(`    Fetched at: ${meta.fetchedAt}\n`);
console.log('  Next steps:');
console.log('    1. Commit src/data/reviews-cache.json');
console.log('    2. Push — Cloudflare Pages will static-render the new reviews\n');

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Extract a Place ID from a Google Maps URL. Supports:
 *   • Long form:  https://www.google.com/maps/place/Name/@lat,lng,zoom/data=...!1s0x4870bd...:0xc2eb...!8m...
 *   • Short form: https://maps.app.goo.gl/abc123  (NOT supported — needs HEAD-follow)
 *   • place_id form: https://maps.google.com/?cid=12345&q=place_id:ChIJ...
 *
 * Strategy: scan for either:
 *   - !1s<hex>:<hex>          (the embedded place feature ID, in /data= URLs)
 *   - place_id:ChIJ...        (in query strings)
 *   - !16s%2Fg%2F<id>         (Knowledge Graph reference — NOT a Place ID)
 *
 * If a feature ID is found, we use it directly — Google's API accepts both
 * Place IDs and feature ID hex pairs interchangeably. If neither is found,
 * the user must provide GOOGLE_PLACE_ID directly.
 */
function extractPlaceIdFromUrl(url) {
  if (!url) return null;
  // place_id:ChIJ... pattern
  const m1 = url.match(/place_id:([A-Za-z0-9_-]+)/);
  if (m1) return m1[1];
  // !1s<hex>:<hex> pattern (the embedded feature ID)
  const m2 = url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/);
  if (m2) return m2[1];
  // Decoded version (URL-decoded path component)
  const m3 = url.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

function formatTotal(n) {
  if (typeof n !== 'number' || n <= 0) return '0';
  if (n < 100)   return `${n}`;
  if (n < 1000)  return `${Math.floor(n / 100) * 100}+`;
  if (n < 10000) {
    const rounded = Math.floor(n / 100) * 100;
    return `${rounded.toLocaleString()}+`;
  }
  return `${Math.floor(n / 1000)}k+`;
}
