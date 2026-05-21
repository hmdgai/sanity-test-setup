#!/usr/bin/env node
/**
 * patch-cloudflare-adapter.mjs
 * ─────────────────────────────────────────────────────────────
 * Renames the hardcoded "ASSETS" binding to "STATIC_ASSETS" inside
 * the @astrojs/cloudflare adapter so the project can deploy to
 * Cloudflare Pages.
 *
 * WHY THIS EXISTS
 * Cloudflare Pages reserves the binding name "ASSETS" for its
 * own internal use and rejects any deploy that declares a user
 * binding called "ASSETS" with:
 *   "The name 'ASSETS' is reserved in Pages projects."
 *
 * @astrojs/cloudflare v13.x hardcodes "ASSETS" as the static-assets
 * binding name in five files. Until Astro releases a fix upstream,
 * we rename the binding here at install time. Renaming to
 * "STATIC_ASSETS" sidesteps the reservation while staying
 * structurally identical.
 *
 * Wired via the postinstall npm script — runs automatically after
 * every `npm install`. Re-running is safe (idempotent — every
 * replacement is gated behind a "haven't done this yet" check).
 *
 * Affected files (all under node_modules/@astrojs/cloudflare/dist/):
 *   - wrangler.d.ts
 *   - wrangler.js
 *   - entrypoints/image-passthrough-endpoint.js
 *   - entrypoints/image-transform-endpoint.js
 *   - utils/handler.js
 *
 * What gets replaced:
 *   - The string literal "ASSETS"  →  "STATIC_ASSETS"
 *   - The property access env.ASSETS  →  env.STATIC_ASSETS
 *
 * The word-boundary regex `\bASSETS\b` does NOT match the `ASSETS`
 * substring inside `STATIC_ASSETS` (the underscore before it is a
 * word character so there's no boundary), making the script safe
 * to run repeatedly.
 *
 * If the adapter version no longer contains "ASSETS" (upstream fix
 * shipped, or a future major bump), the script logs a notice and
 * exits cleanly — does not error.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const adapterDir = join(projectRoot, 'node_modules', '@astrojs', 'cloudflare', 'dist');

if (!existsSync(adapterDir)) {
  // First install hasn't placed the adapter yet, or it was uninstalled.
  // Not an error — postinstall runs in odd contexts (e.g. `npm ci` failures).
  console.log('[patch-cloudflare-adapter] @astrojs/cloudflare not installed — skipping.');
  process.exit(0);
}

/** @type {string[]} Files to patch — relative to adapterDir. */
const targets = [
  'wrangler.d.ts',
  'wrangler.js',
  'entrypoints/image-passthrough-endpoint.js',
  'entrypoints/image-transform-endpoint.js',
  'utils/handler.js',
];

// Word-boundary match — "\bASSETS\b" matches the bare token but NOT
// the same letters inside STATIC_ASSETS (the `_` before ASSETS is a
// word character, so there's no boundary between `_` and `A`).
const ASSETS_RE = /\bASSETS\b/g;

let totalReplacements = 0;
let filesPatched      = 0;
let filesAlreadyDone  = 0;
let filesMissing      = 0;

for (const rel of targets) {
  const abs = join(adapterDir, rel);

  if (!existsSync(abs)) {
    // Adapter layout changed in a future version — log and continue.
    console.log(`[patch-cloudflare-adapter] not found: ${rel} (adapter may be a different version)`);
    filesMissing++;
    continue;
  }

  const original = readFileSync(abs, 'utf8');

  // Idempotency check: if the file no longer contains the bare token
  // ASSETS but DOES contain STATIC_ASSETS, the patch has already run.
  const hasBareToken = ASSETS_RE.test(original);
  ASSETS_RE.lastIndex = 0; // reset stateful global regex

  if (!hasBareToken) {
    if (original.includes('STATIC_ASSETS')) {
      filesAlreadyDone++;
    } else {
      // Neither token present — adapter has been updated upstream.
      console.log(`[patch-cloudflare-adapter] ${rel}: no ASSETS reference — adapter may have shipped an upstream fix.`);
      filesMissing++;
    }
    continue;
  }

  const patched = original.replace(ASSETS_RE, 'STATIC_ASSETS');
  const replacementsInFile = (original.match(ASSETS_RE) || []).length;

  writeFileSync(abs, patched, 'utf8');

  totalReplacements += replacementsInFile;
  filesPatched++;
  console.log(`[patch-cloudflare-adapter] ${rel}: ${replacementsInFile} replacement(s).`);
}

console.log(
  `[patch-cloudflare-adapter] Done. Patched ${filesPatched}/${targets.length} files ` +
  `(${totalReplacements} replacements, ${filesAlreadyDone} already-done, ${filesMissing} not found).`
);
