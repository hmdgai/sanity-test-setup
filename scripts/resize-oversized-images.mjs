#!/usr/bin/env node
/**
 * resize-oversized-images.mjs
 * ─────────────────────────────────────────────────────────────
 * Walks public/images/ and resizes any .webp larger than the
 * configured max dimensions, re-encoding at quality 82 with sharp.
 *
 * Why this exists
 *   PageSpeed flags any image whose intrinsic dimensions exceed
 *   roughly 2× its largest displayed dimension. Designers tend to
 *   export images at full source size (4K masters, etc.) which
 *   then ship to the visitor 5–10× too large. This script trims
 *   them to a reasonable upper bound while preserving aspect ratio.
 *
 * Usage
 *   npm run resize-images           # defaults — max 1920×1920
 *   npm run resize-images -- --max 1600   # tighter cap
 *   npm run resize-images -- --dry        # preview without writing
 *
 * Behaviour
 *   - Reads every .webp under public/images/ recursively
 *   - If width OR height exceeds the max → resize keeping aspect
 *   - Re-encodes at quality 82 (sharp default for webp)
 *   - Writes back to the same path (in-place)
 *   - Prints a per-file before/after summary
 *
 * Hero images note
 *   For LCP-critical hero images, consider running this twice —
 *   once for the desktop variant (max 1920) and once for the mobile
 *   variant (max 800). Keep both files and select via media-query
 *   <link rel="preload" media> in BaseLayout.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, dirname }          from 'node:path';
import { fileURLToPath }          from 'node:url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('[resize-images] sharp is not installed. Run: npm i -D sharp');
  process.exit(1);
}

const __dirname    = dirname(fileURLToPath(import.meta.url));
const projectRoot  = join(__dirname, '..');
const targetDir    = join(projectRoot, 'public', 'images');

const args = process.argv.slice(2);
const dry  = args.includes('--dry');
const maxIdx = args.indexOf('--max');
const maxDim = maxIdx >= 0 ? Number(args[maxIdx + 1]) : 1920;

if (!Number.isFinite(maxDim) || maxDim < 100) {
  console.error(`[resize-images] invalid --max value: ${maxDim}`);
  process.exit(1);
}

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && /\.webp$/i.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(targetDir);
if (files.length === 0) {
  console.log(`[resize-images] no .webp files found under ${targetDir}`);
  process.exit(0);
}

console.log(`[resize-images] scanning ${files.length} .webp file(s) — max ${maxDim}px${dry ? ' (DRY RUN)' : ''}`);

let resized = 0;
let kept    = 0;

for (const abs of files) {
  const before = statSync(abs).size;
  const meta   = await sharp(abs).metadata();
  const w      = meta.width  ?? 0;
  const h      = meta.height ?? 0;

  if (w <= maxDim && h <= maxDim) {
    kept++;
    continue;
  }

  const rel = abs.slice(projectRoot.length + 1).replace(/\\/g, '/');

  if (dry) {
    console.log(`  WOULD RESIZE  ${rel}  ${w}×${h}  →  fit ${maxDim}`);
    resized++;
    continue;
  }

  const buffer = await sharp(abs)
    .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  // Write back in-place. sharp can't read+write the same file in one
  // pipeline (locks), hence the toBuffer() then writeFile dance.
  const { writeFileSync } = await import('node:fs');
  writeFileSync(abs, buffer);

  const after = buffer.byteLength;
  const savedKb = ((before - after) / 1024).toFixed(1);
  console.log(`  resized       ${rel}  ${w}×${h}  →  fit ${maxDim}  (saved ${savedKb} KB)`);
  resized++;
}

console.log(`[resize-images] Done. Resized ${resized}, kept ${kept}.`);
