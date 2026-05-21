# Skill: WordPress → Astro Blog Migration Pipeline (Reusable)

End-to-end migration playbook for moving a WordPress blog (any post
count up to ~500) into an Astro project. Pulls full post HTML +
metadata from the WP REST API, strips Elementor / Rank Math /
wp-block scaffolding, downloads every featured + inline image,
converts everything to WebP, writes typed Astro page files using the
`BlogPostLayout` pattern, and sets up 301 redirects + sitemap +
middleware so the migration ships with working SEO equity transfer
on day one.

Production reference: ran against `physiolounge.co.uk` in May 2026.
Migrated 68 posts, downloaded + converted **252 WebP images** (68
featured + 184 inline), zero errors, all paths preserved with 301
redirects.

This skill is the **migration pipeline**. The **post template** it
fills is documented separately at `.claude/skills/blog-post.md` —
read both together when starting a fresh migration.

---

## When to use

- WordPress site with the REST API enabled (`/wp-json/wp/v2/posts`
  returns JSON) — every standard WP install since 4.7 has this by
  default
- 5–500 blog posts to migrate
- WP authoring used Elementor, Rank Math, classic editor, or
  Gutenberg blocks — the HTML cleaner handles all four
- Target site is Astro on Cloudflare Pages (the redirect + sitemap
  patterns assume Cloudflare's `_redirects` + Astro middleware
  hybrid)

**NOT for:**

- WP REST API blocked / disabled (some hardened installs disable
  it) — fall back to HTML scraping per-URL via WebFetch (~10× slower)
- Source content older than Gutenberg (~2018) with obscure plugin
  HTML (Visual Composer, WP Bakery, etc.) — the cleaner handles
  Elementor + native blocks; other page builders may need additional
  patterns
- Multi-author sites that need author profile pages — this pipeline
  treats all posts as authored by the organisation (no per-author
  bio support)
- Sites with custom post types beyond "post" — extend the WP REST
  endpoint URL to include the custom type (`?type=custom_post_type`)

---

## Pipeline overview

The migration runs in **six phases**. Each phase is independent and
can be re-run idempotently — re-running on already-done posts
overwrites the output cleanly.

| Phase | What it does | Time |
|---|---|---|
| 1 | URL plumbing (data file + redirects + sitemap + middleware) | 30 min |
| 2 | Generate page stubs from the WP post list | 5 min |
| 3 | Migrate content + download + WebP-convert images via WP REST | 5–60 min (depends on image count) |
| 4 | Fill empty alt-text attributes | 1 min |
| 5 | Build the blog index page + pagination | 30 min |
| 6 | Sitewide hero-zoom fix (related fix, optional) | 5 min |

The whole pipeline is one afternoon for a 68-post site. The
content-migration phase is the long pole because of image downloads
+ `sharp` WebP encoding.

---

## Prerequisites

Before starting, verify:

```bash
# 1. WP REST API is accessible + returns JSON
curl -s "https://yoursite.com/wp-json/wp/v2/posts?per_page=1&_embed=true" \
  | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));console.log('posts:',Array.isArray(d)?d.length:'NOT ARRAY')"

# 2. WP sitemap has the same post count as REST (cross-check)
curl -s "https://yoursite.com/post-sitemap.xml" | grep -c "<loc>"

# 3. Sharp is installed in the Astro project (devDep is fine)
npm ls sharp
```

Also check:
- ✅ Astro project already has the `BlogPostLayout` pattern (see
  `blog-post.md`) — if not, build it FIRST. The migration writes
  page files that import this layout.
- ✅ `public/_redirects` file exists with Cloudflare-style format
- ✅ `src/middleware.ts` exists (or be ready to create one)
- ✅ `src/lib/sitemap.ts` follows the project's group-classifier
  pattern (or be ready to add the blog group manually)

---

## Phase 1 — URL plumbing

**Goal: every old WP URL has a 301 to the new `/blog/<slug>/` path,
the sitemap emits the new URLs, and both layers (Cloudflare edge +
Astro middleware) cover the redirect so it works in dev + prod.**

### 1a. Extract the WP post list

Fetch every post URL + lastmod from the WP sitemap:

```bash
# Or use WebFetch + AI extraction for a one-shot dump
curl -s "https://yoursite.com/post-sitemap.xml" | grep -oE '<url>[\s\S]*?</url>'
```

### 1b. `src/data/blogPosts.ts` — canonical source of truth

```ts
/**
 * Canonical blog post data, migrated from the WordPress
 * post-sitemap on YYYY-MM-DD. Source of truth for:
 *   • the WP → Astro redirect block in public/_redirects
 *   • the SSR sitemap endpoint at src/pages/sitemap-blog.xml.ts
 *   • the /blog/[slug].astro page files
 *
 * Sorted descending by lastmod — newest first.
 */

export interface BlogPost {
  slug:    string;  // canonical slug; also the public URL component
  lastmod: string;  // ISO date YYYY-MM-DD from WP <lastmod>
}

export const blogPosts: BlogPost[] = [
  { slug: 'most-recent-post-slug',            lastmod: '2025-10-16' },
  { slug: 'second-most-recent-slug',          lastmod: '2025-08-09' },
  // … 68 entries total in the reference project
];
```

### 1c. `public/_redirects` — Cloudflare edge layer

Append a block before any catch-all rules:

```
# Blog posts — WordPress → Astro /blog/ migration
/most-recent-post-slug/  /blog/most-recent-post-slug/  301
/second-most-recent-slug/  /blog/second-most-recent-slug/  301
# … 68 lines
```

Generate the block programmatically from `blogPosts.ts` if you have
many:

```bash
node -e "
const { blogPosts } = await import('./src/data/blogPosts.ts');
blogPosts.forEach(p => console.log(\`/\${p.slug}/  /blog/\${p.slug}/  301\`));
"
```

### 1d. `src/middleware.ts` — second-layer Astro middleware

Cloudflare `_redirects` only runs in production. To make the
redirects work in `astro dev` too, mirror them in middleware:

```ts
import { defineMiddleware } from 'astro:middleware';
import { blogPosts }        from './data/blogPosts';

// Set lookup for O(1) match per request.
const WP_BLOG_SLUGS: ReadonlySet<string> = new Set(blogPosts.map((p) => p.slug));

const SAFE_METHODS = new Set(['GET', 'HEAD']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const method       = context.request.method.toUpperCase();

  if (SAFE_METHODS.has(method)) {
    const stripped = pathname.replace(/^\//, '').replace(/\/$/, '');
    if (stripped && WP_BLOG_SLUGS.has(stripped)) {
      return new Response(null, {
        status: 301,
        headers: {
          'Location':          `/blog/${stripped}/`,
          'Cache-Control':     'public, max-age=300',
          'X-Redirect-Reason': 'wp-blog-migration',
        },
      });
    }
  }

  return next();
});
```

In production Cloudflare wins on speed (edge before Worker); in dev
the middleware is the only layer. Belt + suspenders.

### 1e. `src/pages/sitemap-blog.xml.ts` — SSR endpoint

```ts
import type { APIRoute } from 'astro';
import { blogPosts } from '../data/blogPosts';

export const prerender = false;

const HMDG_CREDIT = '<!-- Generated by HMDG | hmdg.co.uk -->';

function xmlEscape(s: string): string {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export const GET: APIRoute = ({ url }) => {
  const origin = url.origin;

  const urls = blogPosts
    .map((p) => `  <url>
    <loc>${xmlEscape(`${origin}/blog/${p.slug}/`)}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
${HMDG_CREDIT}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    {
      headers: {
        'Content-Type':  'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    },
  );
};
```

**Important:** use the WP `lastmod` (not "today") so Google doesn't
treat every migrated post as freshly modified content and re-crawl
unnecessarily.

### 1f. `src/lib/sitemap.ts` — register the blog group

If the project uses a group-classifier sitemap (as this one does),
register the `blog` group so the master sitemap index picks it up:

```ts
import { blogPosts } from '../data/blogPosts';

export const groupMeta = {
  // … existing groups
  blog: {
    slug:       'blog',
    priority:   '0.6',
    changefreq: 'monthly',
  },
};

// In populatedGroups(), special-case the blog group because it's
// data-driven (not auto-scanner driven):
export function populatedGroups(): GroupKey[] {
  return (Object.keys(grouped) as GroupKey[]).filter((k) => {
    if (k === 'blog') return blogPosts.length > 0;
    return grouped[k].length > 0;
  });
}
```

---

## Phase 2 — Generate empty post stubs

**Goal: 68 `.astro` page files exist + return 200 even before
content migration runs. Lets the redirects land somewhere instead
of 404'ing.**

The `BlogPostLayout` from `blog-post.md` does the heavy lifting. The
stub generator just creates one page per slug with placeholder
content:

```js
// scripts/generate-blog-pages.mjs (one-shot, delete after)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { blogPosts } from '../src/data/blogPosts.ts';

const lowerWords = new Set(['is','it','with','for','in','at','to','by','of','on',
                            'and','or','as','the','a','an']);
function titleCase(slug) {
  return slug.split('-').map((w, i, arr) => {
    const edge = i === 0 || i === arr.length - 1;
    if (!edge && lowerWords.has(w.toLowerCase())) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

mkdirSync('src/pages/blog', { recursive: true });
for (const p of blogPosts) {
  const title = titleCase(p.slug);
  writeFileSync(join('src/pages/blog', `${p.slug}.astro`), `---
import BlogPostLayout from '../../layouts/BlogPostLayout.astro';
const post = {
  title:            "${title}",
  description:      "Article coming soon — Lorem ipsum.",
  category:         "Blog",
  publishedDate:    "${p.lastmod}",
  modifiedDate:     "${p.lastmod}",
  publishedDisplay: "${new Date(p.lastmod).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}",
  readMinutes:      3,
};
const body = \`<p>Lorem ipsum placeholder.</p>\`;
---
<BlogPostLayout post={post}><div set:html={body}></div></BlogPostLayout>
`);
}
```

After Phase 3 fills in real content, delete this script.

---

## Phase 3 — Migrate content + images

**This is the meat of the pipeline.** A single Node script:

1. Fetches all 68 posts via `/wp-json/wp/v2/posts?per_page=100&_embed=true`
2. Cleans Elementor + wp-block + Rank Math scaffolding from each
   `content.rendered` HTML
3. Promotes heading hierarchy where Rank Math skipped levels
   (H1→H3→H4 becomes H1→H2→H3)
4. Strips WP-only widgets (latest-posts, jp-relatedposts,
   share-buttons, etc.)
5. Replaces editorial placeholders like `[Your Clinic Name]`
6. Downloads the featured image via WP REST `_embedded`, with a
   `/blog/` archive `.elementor-post__thumbnail` fallback for posts
   missing `featured_media`
7. Downloads every inline `<img>` from the body HTML
8. Converts every image to WebP via `sharp` (quality 80, effort 6)
9. Saves all images to `public/images/blogs/` with naming:
   - `{slug}-featured-img.webp` for the featured image
   - `{slug}-img-{N}.webp` for inline images
10. Rewrites all image `src` paths in the body to the local WebP paths
11. Writes the final `.astro` file using the `BlogPostLayout` pattern
12. Tracks progress in `.wp-migration-progress.json` so `--batch N`
    resumes from where the previous batch stopped

### Script location + size

Lives at `scripts/migrate-wp-blog.mjs` (~526 lines). Too long to
embed inline — **copy the file verbatim** to the new project's
`scripts/` directory. The customisable knobs are at the top of the
file and are documented in the next section.

### CLI usage

```bash
# Migrate just one post (testing / debugging a specific slug):
node scripts/migrate-wp-blog.mjs --slug how-physiotherapy-can-support-you-through-menopause

# Migrate the next N un-done posts (resumable batches):
node scripts/migrate-wp-blog.mjs --batch 10

# Migrate everything in one go:
node scripts/migrate-wp-blog.mjs --all
```

The progress file is `.wp-migration-progress.json` at the project
root — list of slugs already migrated. Re-running with `--batch`
skips them. Delete the progress file to force a full re-migration.

### Customisation knobs (per-client edits)

At the top of `migrate-wp-blog.mjs`, edit these constants:

| Constant | What to change |
|---|---|
| WP REST URL | `https://yoursite.com/wp-json/wp/v2/posts?per_page=100&_embed=true` |
| Archive URL prefix | `https://yoursite.com/blog/` (for the thumbnail fallback) |
| Image quality | `sharp(buf).webp({ quality: 80, effort: 6 })` — bump to 85 for higher fidelity, drop to 75 for smaller files |
| Default category | `category: 'Physiotherapy'` — every migrated post defaults to this in the frontmatter; refine per-post later |

In the `cleanContent(rawHtml)` function:

| Block | What to change |
|---|---|
| Widget patterns (the `widgetPatterns` array) | Add or remove regex patterns for additional WP plugins specific to your client (e.g. Yoast share buttons, custom mailing-list widgets) |
| Heading promotion conditional | If your WP authors used proper H2 hierarchy, the `if (!hasH2)` block becomes a no-op — leave as-is, the conditional handles both cases |
| Editorial placeholders | The `[Your Clinic Name]` → `The Physio Lounge` swap. Add patterns specific to your client (e.g. `[Brand]`, `[Phone]`, `[Address]`) |

### What the script handles automatically

- **WordPress smart quotes** — `&#8217;` → `'`, `&#8211;` → `–`, etc.
- **Empty paragraphs** — collapsed to nothing
- **Repeated blank lines** — collapsed to single
- **Image alt text** — preserved when present (filled by Phase 4
  when empty)
- **`<figure>` wrapping** — converted to `.post-figure` (matches
  BlogPostLayout's figure styling)
- **Inline `<img>` `width` + `height` attributes** — stripped
  (Layout CSS uses `aspect-ratio` + `object-fit: cover`)
- **Image redirects** — `fetchBinary()` follows 301/302 redirects
  (some WP installs serve images from a different host than the
  REST API)

---

## Phase 4 — Alt-text cleanup

**Goal: fill any empty `alt=""` attributes left by WP authors.**

WordPress lets authors save inline images without alt text. The
migration script preserves whatever alt was in the source — so
empty alts come through to the migrated posts. WCAG 1.1.1 + SEO
both want descriptive alts.

Run this script AFTER the content migration:

```js
// scripts/fix-blog-alt-text.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = 'src/pages/blog';

const files = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.astro') && f !== 'index.astro');

let filesFixed = 0;
let imagesFixed = 0;

for (const file of files) {
  const path    = join(BLOG_DIR, file);
  const content = readFileSync(path, 'utf-8');

  // Extract post title from frontmatter
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  if (!titleMatch) continue;
  const title = titleMatch[1];

  // Fill each `alt=""` with `{Post Title} — figure N` (counter resets per file)
  let figureNum = 0;
  const updated = content.replace(
    /<img([^>]*?)\salt=""([^>]*?)>/g,
    (match, before, after) => {
      figureNum++;
      const newAlt = `${title} — figure ${figureNum}`;
      return `<img${before} alt="${newAlt}"${after}>`;
    },
  );

  if (updated !== content) {
    writeFileSync(path, updated);
    filesFixed++;
    imagesFixed += figureNum;
  }
}

console.log(`Done. ${imagesFixed} images fixed across ${filesFixed} files.`);
```

Idempotent — re-running on already-fixed files is a no-op. The
generated alts (`"{Post Title} — figure 1"`) are descriptive enough
for WCAG and give Google some keyword signal. **Human-written alt
text per image remains the gold standard** — flag the top-traffic
posts for manual review after launch.

### Reference outcome

On the Physio Lounge migration: **59 empty alts across 17 files**
got filled. The heaviest post (`squats-king-exercises`) had 12
images needing alts.

---

## Phase 5 — Blog index page + pagination

**Goal: discoverable archive landing page with all migrated posts.**

The index page needs all 68 posts' metadata — but that data is
distributed across 68 `.astro` files. Astro doesn't expose the
inline `const post = { … }` from `.astro` files via
`import.meta.glob`, so extract it to a shared data file first.

### 5a. Extract post metadata

```js
// scripts/extract-blog-meta.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = 'src/pages/blog';
const OUT_FILE = 'src/data/blogPostsMeta.ts';

const files = readdirSync(BLOG_DIR)
  .filter((f) => f.endsWith('.astro') && f !== 'index.astro');

const posts = [];

for (const file of files) {
  const slug = file.replace(/\.astro$/, '');
  const content = readFileSync(join(BLOG_DIR, file), 'utf-8');

  // Find the `const post = { … };` block. Multi-line, non-greedy.
  const match = content.match(/const post = (\{[\s\S]*?\n\});/);
  if (!match) continue;

  // Evaluate the object literal in a sandboxed Function. Safe because
  // we control the source files; would not be safe on untrusted input.
  const postObj = new Function(`return ${match[1]}`)();
  postObj.slug = slug;
  posts.push(postObj);
}

// Sort descending by publishedDate.
posts.sort((a, b) => String(b.publishedDate).localeCompare(String(a.publishedDate)));

writeFileSync(OUT_FILE, `/**
 * AUTO-GENERATED by scripts/extract-blog-meta.mjs.
 * Re-run when post frontmatter changes:
 *   node scripts/extract-blog-meta.mjs
 */

export interface BlogPostListItem {
  slug:             string;
  title:            string;
  description:      string;
  category:         string;
  publishedDate:    string;
  modifiedDate:     string;
  publishedDisplay: string;
  readMinutes:      number;
  image?:           string | null;
  imageAlt?:        string;
}

export const blogPostsMeta: BlogPostListItem[] = ${JSON.stringify(posts, null, 2)};
`);

console.log(`Wrote ${posts.length} entries to ${OUT_FILE}`);
```

Re-run any time post frontmatter changes (idempotent).

### 5b. Index page (page 1) + pagination route (pages 2+)

- **`src/pages/blog.astro`** — page 1 of the index grid. Renders
  the first 9 posts sorted descending by date.
- **`src/pages/blog/page/[page].astro`** — `getStaticPaths()`
  generates `/blog/page/2/` through `/blog/page/N/`.

The card pattern, fade-in cascade, pagination UI, and full code
live in the reference repository — copy the two files
(`src/pages/blog.astro` + `src/pages/blog/page/[page].astro`) and
swap the data import.

### 5c. Posts-per-page tuning

```ts
const POSTS_PER_PAGE = 9;  // 3 cols × 3 rows = clean grid
```

For 6 columns 4 rows = 24 per page → bulkier homepage but fewer
clicks to scan. For ~30 posts total, drop to 6 per page so
pagination still makes sense.

### 5d. LCP optimisation

The first row of cards is above the fold on desktop. Mark them as
LCP candidates:

```astro
{posts.map((post, i) => (
  <a href={`/blog/${post.slug}/`} class="blog-card">
    <img
      src={post.image}
      alt={post.imageAlt}
      loading={i < 3 ? 'eager' : 'lazy'}
      fetchpriority={i === 0 ? 'high' : 'auto'}
    />
    {/* … */}
  </a>
))}
```

---

## Phase 6 — Hero contrast fix (related, optional)

**Goal: solve the "gray gap at top of hero" issue that often surfaces
on mobile after migration.**

Stock clinic / agency photos used in `PageHero` backgrounds usually
have a light ceiling area at the top ~15% that reads as a grey strip
behind the transparent header on mobile. Adding a `transform:
scale(1.15)` to the hero image element crops out the light area
sitewide:

```css
.page-hero-img {
  object-position: center center;
  transform:        scale(1.15);
  transform-origin: center center;
}
```

This is sitewide (every page using `PageHero` benefits), not
blog-specific — but it's so commonly noticed AFTER a migration goes
live that flagging it here saves a round-trip.

---

## Order of operations

Run in this exact order. Each phase depends on the previous one:

1. **Phase 1 (URL plumbing)** — set up `blogPosts.ts` +
   `_redirects` + middleware + sitemap endpoint. Deploy to staging
   to verify redirects work before any content migration.
2. **Phase 2 (stubs)** — generate empty `.astro` files. After this
   step every `/blog/<slug>/` returns 200 with placeholder content.
3. **Phase 3 (content migration)** — run `migrate-wp-blog.mjs`. Use
   `--slug <one>` first to validate a single post, then `--batch
   10` repeatedly until all posts are done. Verify the build after
   every batch (`npx astro build`).
4. **Phase 4 (alt-text fix)** — run `fix-blog-alt-text.mjs` once
   after content migration completes.
5. **Phase 5 (index page)** — run `extract-blog-meta.mjs` → write
   the index + pagination files. Re-run the extractor any time the
   post frontmatter changes.
6. **Phase 6 (hero fix)** — apply if the migration's featured-image
   palette is light-heavy.

---

## Per-client customisation knobs

These are the ONLY things that should differ per migration:

| Knob | Where | Notes |
|---|---|---|
| WP REST URL | `migrate-wp-blog.mjs` `fetchJson()` call | Change the domain. The endpoint is standard. |
| Archive URL prefix | `migrate-wp-blog.mjs` `getArchiveThumbnails()` | For the featured-image fallback. Usually `/blog/`. |
| Default category | `migrate-wp-blog.mjs` `migrate()` function | Every post's `category` field defaults to this. |
| Image quality / WebP settings | `sharp(buf).webp({ quality: 80, effort: 6 })` | 80 is a good default. Drop to 75 for tiny files; bump to 85 for higher fidelity. |
| Widget patterns | `migrate-wp-blog.mjs` `cleanContent()` `widgetPatterns` array | Add regex for additional WP plugins the client used. |
| Editorial placeholders | `migrate-wp-blog.mjs` `cleanContent()` final block | `[Your Clinic Name]` → real client name. Add patterns specific to the source. |
| Brand booking URL | `src/data/site.ts` `bookingUrl` | Used by the closing CTA in every blog post. |
| Posts per page | `src/pages/blog.astro` `POSTS_PER_PAGE` | 9 (3×3) is the default. |
| Heading promotion | `cleanContent()` `if (!hasH2)` block | Safe-by-default — only promotes when WP post lacked H2s. |

---

## Validation checklist

After all phases complete:

- [ ] `npx astro build` succeeds with no errors
- [ ] Build output shows N+1 routes under `/blog/` (N posts + index)
- [ ] Pagination route generated `/blog/page/2/` through
      `/blog/page/N/` where N = `ceil(totalPosts / postsPerPage)`
- [ ] `curl -I http://localhost:4321/old-wp-slug/` returns
      `HTTP/1.1 301` with `Location: /blog/old-wp-slug/` (verifies
      middleware)
- [ ] `curl http://localhost:4321/sitemap-blog.xml` returns valid
      XML with the right post count
- [ ] `public/images/blogs/` contains all featured + inline images
      as `.webp` files
- [ ] `find src/pages/blog -name "*.astro" | xargs grep -l 'alt=""'`
      returns nothing (no empty alts)
- [ ] Spot-check 3 posts in the browser:
  - [ ] Hero band shows correct title in breadcrumb
  - [ ] Featured image renders 16:9
  - [ ] Heading hierarchy: H1 → H2 → H3, no skipped levels
  - [ ] Inline images render with alt text
  - [ ] Closing CTA links to the booking URL
  - [ ] Article + BreadcrumbList JSON-LD both present in the page source
- [ ] Index page `/blog/` renders 9 cards descending by date
- [ ] Pagination "Next" button on `/blog/` goes to `/blog/page/2/`
- [ ] Mobile (375px viewport): cards stack 1-col, pagination wraps,
      no horizontal scroll

---

## Troubleshooting

### "Some posts have no featured image even after the archive fallback"

→ Their WP `featured_media` field is `0` AND they don't appear in
the `/blog/` archive thumbnail list. The migration script logs
`"(no featured image found)"` for these. The `BlogPostLayout` is
already conditional on `post.image` — the page renders cleanly
without the featured figure. Worth flagging these slugs for
content-team backfill but not blocking.

### "The heading hierarchy got promoted too aggressively"

→ If a WP post used proper H1 → H2 → H3 structure already, the
`!hasH2` conditional in `cleanContent()` skips promotion. If the
result still looks wrong, the conditional may have misfired —
check the raw HTML returned by `content.rendered` for a single
post and verify whether H2s were actually present.

### "An Elementor widget wasn't stripped"

→ Add a new regex pattern to `widgetPatterns` in `cleanContent()`.
The script runs multiple passes so order doesn't matter.

### "Images downloaded but the post body still references the WP URLs"

→ Check that the `processImages()` `replacements.forEach()` block
ran correctly. The `originalImgTag` capture must exactly match the
content's `<img>` tag — including all attributes in the order WP
emitted them. If WP changes attribute order between fetches (rare
but possible), use a more forgiving regex.

### "WP REST API returns 5–10 posts instead of all N"

→ The default `per_page` is 10. Bump to 100 (the API maximum) via
`?per_page=100`. For 100+ posts, paginate the WP REST call:
`?per_page=100&page=2`.

### "Build is suddenly slow after migration"

→ Each blog post page now imports its own large body string (~5–50 KB
of HTML). Astro's per-page CSS scoping plus the per-page body
content adds up. Verify `BlogPostLayout` uses `:global()` selectors
for the `set:html`-rendered body (otherwise Astro scopes them out
and they render unstyled). The reference layout already does this.

---

## Reference implementation

Live on physiolounge.co.uk via the Astro project at
`github.com/felmerald-hmdg/physiolounge`. The canonical files:

- `scripts/migrate-wp-blog.mjs` (526 lines)
- `scripts/extract-blog-meta.mjs` (97 lines)
- `scripts/fix-blog-alt-text.mjs` (66 lines)
- `src/data/blogPosts.ts` (slug + lastmod data)
- `src/data/blogPostsMeta.ts` (auto-generated extended metadata)
- `src/middleware.ts` (WP redirect mirror)
- `src/pages/sitemap-blog.xml.ts` (SSR sitemap)
- `src/pages/blog.astro` + `src/pages/blog/page/[page].astro` (index + pagination)
- `src/pages/blog/*.astro` (68 individual post files)
- `public/images/blogs/*.webp` (252 migrated images)
- `public/_redirects` (68 × 301 redirects)
- `src/layouts/BlogPostLayout.astro` (the design layer — see
  `blog-post.md` for the full pattern)

When porting to a new project: copy the three scripts verbatim, the
middleware + sitemap endpoint pattern verbatim, and the layout
pattern from `blog-post.md`. Per-client customisation only touches
the constants documented in the knob table above.

---

## Performance summary (reference run)

| Metric | Value |
|---|---|
| Posts migrated | 68 |
| Featured images | 68 (100% success — WP REST + archive fallback) |
| Inline images | 184 |
| Total WebP files saved | 252 |
| Total image disk size | 8.7 MB |
| Migration time | ~25 minutes (batches of 10, 7 batches) |
| Build time after | ~18 seconds (Astro 6.1.9, ~140 routes total) |
| Empty alts found + fixed | 59 across 17 files |
| Build errors during migration | 0 |
| Old URLs preserved with 301 | 68 (100%) |
