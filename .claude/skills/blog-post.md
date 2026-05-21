# Skill: Blog Post Template (Reusable)

Premium editorial blog-post template using a single `BlogPostLayout`
that owns the visual chrome (band + featured image + meta bar + H1 +
closing CTA + JSON-LD) while each post page is a thin shell of frontmatter
data + slotted body content.

Production reference: `/blog/how-physiotherapy-can-support-you-through-menopause/`.

---

## When to use

Trigger this skill when the user asks for:

- A new blog post page (single article)
- A WordPress blog-post migration that needs visual parity across many
  posts (the Physio Lounge migration shipped 68 posts via this Layout)
- A premium editorial article with hero band, featured image, drop cap,
  pull quote, image figure, numbered list, and a closing CTA

**NOT for:**

- The blog index / listing page (separate pattern — card grid)
- Author bio pages or tag/category index pages
- Non-editorial article-like content (use the service-page template
  for clinical service write-ups; use the secondary-pages-hero for
  evergreen content)

---

## The rules (non-negotiable)

1. **Single H1 = `post.title`**, rendered inside `BlogPostLayout`. Each
   page passes its `post` object via Astro props; the Layout owns the
   markup. Never render a second H1 from the slot content.
2. **3-step breadcrumb mirrors the URL hierarchy:**
   `Home > Blog > <Post Title>`. The third item carries
   `aria-current="page"` (visible) and is omitted from the JSON-LD `item`
   field per Google's documented convention for the current page.
3. **Schema JSON-LD is dynamic.** Both `Article` and `BreadcrumbList`
   schemas pull from the `post` prop, so when the consumer updates
   `post.title`/`post.description`/`post.publishedDate` the schemas
   regenerate without any other edits. Never hardcode schema strings.
4. **Featured image is the LCP element.** `loading="eager"`,
   `fetchpriority="high"`, `decoding="async"`, explicit `width="1600"
   height="900"` (placeholder dimensions — `aspect-ratio` + `object-fit:
   cover` in CSS handle any actual source size). Also preloaded via
   `BaseLayout`'s `heroImage` prop.
5. **Featured image alt text is per-post**, pulled from `post.imageAlt`.
   The Layout never inlines a generic alt — the consumer's `post` object
   is the only source of truth for alt text.
6. **Hero band uses brand-primary background.** Solves a real
   contrast problem — the site Header's white menu/logo is designed to
   overlay a dark hero; without the band, the menu is invisible against
   the light featured image. Do NOT remove the band even if the visual
   case for it feels marginal. The header curtain only slides down on
   scroll past 60px.
7. **Body styles use `:global()` selectors.** Astro scopes the Layout's
   `<style>` block via CID, but the slotted content carries the
   consumer page's CID — so `:global()` is required for the Layout's
   styles to reach the slotted markup. Every selector inside `.post-body`
   uses `:global()`.
8. **Body content order is the Layout's contract.** Each post slot
   should follow this order: `.post-lead` → paragraphs → first `<h2>`
   → paragraphs → `.post-pullquote` → second `<h2>` → paragraphs →
   `.post-figure` → third `<h2>` → `<ol>` → closing paragraphs. Posts
   may omit elements but should not reorder.
9. **Single closing CTA, owned by the Layout.** Every post gets the
   same "Book a Specialist Assessment" card at the end — clinic
   conversion is the single common goal across articles. Do not add
   per-post CTAs in the slot.
10. **`bookingUrl` is imported from `src/data/site.ts`**, never
    hardcoded. The Book button gets `target="_blank"` +
    `rel="noopener noreferrer"` automatically.
11. **`prefers-reduced-motion: reduce` is honoured.** Layout has no
    auto-playing motion, but the drop cap, pull quote, and CTA all
    use static layouts that respect the user's reduced-motion intent.
12. **Title Case applies to the H1 + visible breadcrumb.** Project
    rule (per `convertcase.net`): `is/it/with/for/in/at/to/by/of/on/
    and/or/as` and articles (`the/a/an`) stay lowercase except as the
    first or last word.

---

## File layout

```
src/
├── layouts/
│   └── BlogPostLayout.astro       ← owns ALL the chrome + styles
├── pages/blog/
│   ├── <slug>.astro                ← thin shell — frontmatter + slot
│   └── …                           ← 68 of these in the production tree
└── data/
    └── blogPosts.ts                ← canonical migration source
                                      (slug + lastmod for sitemap + redirects)
```

When migrating a new post:

1. Drop a new `.astro` file in `src/pages/blog/`.
2. Add an entry to `src/data/blogPosts.ts` for the sitemap +
   redirect block.
3. Done. The Layout handles everything else.

---

## `post` prop shape

The Layout exports the `BlogPostMeta` type — TypeScript editors will
catch a missing field. Required shape:

```ts
interface BlogPostMeta {
  title:             string;   // H1 + 3rd breadcrumb item + Article headline
  description:       string;   // <meta name="description"> + Article description
  category:          string;   // visible category eyebrow in the meta bar
  publishedDate:     string;   // YYYY-MM-DD — Article datePublished
  modifiedDate:      string;   // YYYY-MM-DD — Article dateModified
  publishedDisplay:  string;   // human-readable for the meta bar (e.g. "16 October 2025")
  readMinutes:       number;   // visible read-time estimate
  image:             string;   // path to featured image (LCP)
  imageAlt:          string;   // descriptive alt — what's in the photo
}
```

Naming guidance:

- `category` is brand voice, not strict taxonomy (no `/blog/category/`
  routes exist yet). Examples: "Women's Health", "Sports Injury",
  "Rehabilitation", "Lifestyle".
- `description` should be 140–160 chars — Google truncates beyond that.
- `imageAlt` describes what's actually in the photo (e.g. "Senior woman
  in a clinical physiotherapy session"). Never keyword-stuff.
- `publishedDisplay` is the human-readable date — typically `D MMMM
  YYYY` (UK format).

---

## Schema JSON-LD details

### Article schema

```json
{
  "@context": "https://schema.org",
  "@type":    "Article",
  "headline":    "<post.title>",
  "description": "<post.description>",
  "datePublished": "<post.publishedDate>",
  "dateModified":  "<post.modifiedDate>",
  "image":         ["<absolute URL of post.image>"],
  "mainEntityOfPage": { "@type": "WebPage", "@id": "<absolute URL of current page>" },
  "author":    { "@type": "Organization", "name": "The Physio Lounge", "url": "<base>" },
  "publisher": { "@type": "Organization", "name": "The Physio Lounge",
                 "logo": { "@type": "ImageObject", "url": "<base>/logo/physiolounge-black-logo.svg" }}
}
```

### BreadcrumbList schema

```json
{
  "@context": "https://schema.org",
  "@type":    "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home",        "item": "<base>/" },
    { "@type": "ListItem", "position": 2, "name": "Blog",        "item": "<base>/blog/" },
    { "@type": "ListItem", "position": 3, "name": "<post.title>"                       }
  ]
}
```

Both schemas are emitted by the Layout via two separate
`<script type="application/ld+json" is:inline>` blocks. Google reads them
independently. Validate with the
[Rich Results Test](https://search.google.com/test/rich-results) after
swapping content.

---

## Body slot — content order

Each post page's slot should follow this order for visual consistency
across the blog:

```astro
<BlogPostLayout post={post}>

  <!-- 1. Lead paragraph (drop cap on first letter) -->
  <p class="post-lead">…</p>

  <!-- 2. 1–2 body paragraphs -->
  <p>…</p>

  <!-- 3. First H2 subhead -->
  <h2>…</h2>

  <!-- 4. 1–2 body paragraphs -->
  <p>…</p>

  <!-- 5. Pull quote with attribution -->
  <blockquote class="post-pullquote">
    <p>…</p>
    <cite>Author, Role</cite>
  </blockquote>

  <!-- 6. Second H2 subhead -->
  <h2>…</h2>

  <!-- 7. 1 body paragraph -->
  <p>…</p>

  <!-- 8. Inline image figure (per-post alt text) -->
  <figure class="post-figure">
    <img src="…" alt="…" width="1600" height="900" loading="lazy" decoding="async" />
    <figcaption>…</figcaption>
  </figure>

  <!-- 9. Third H2 subhead -->
  <h2>…</h2>

  <!-- 10. Numbered list -->
  <ol>
    <li>…</li>
    <li>…</li>
    <li>…</li>
  </ol>

  <!-- 11. 1–2 closing paragraphs -->
  <p>…</p>

</BlogPostLayout>
```

Posts may omit blocks (e.g. skip the pull quote on short articles) but
should not reorder. Adding extra paragraphs, H2s, lists, or figures
between blocks is fine — the Layout styles all of them.

---

## Asset pipeline

### Featured image (LCP)

Path: `/public/images/blog/<slug>.avif` (or `.webp`) in production.

Spec:
- 1600×900 (16:9) source, generated from a real article photograph
- AVIF preferred (~50–80 KB at quality 55)
- WebP fallback acceptable
- Alt text per-post in the `post` object — descriptive, what's in
  the photo, never keyword-stuffed

Until real images land, point `post.image` at
`/images/placeholder.webp` and `post.imageAlt` at a generic descriptor.

### Inline figure image

Lives in the slot content, so per-post path + alt. Same spec as the
featured image (16:9, AVIF preferred). The Layout's `:global(.post-figure)`
styles handle the rendering.

---

## Customisation knobs — what to change per post

These are the **only** things that should differ per post:

| Knob | Where | Notes |
|---|---|---|
| `post.title` | frontmatter | Becomes H1, 3rd breadcrumb item, Article headline, meta title prefix |
| `post.description` | frontmatter | Becomes meta description + Article schema description |
| `post.category` | frontmatter | Visible eyebrow in the meta bar; brand voice |
| `post.publishedDate` / `modifiedDate` | frontmatter | ISO YYYY-MM-DD; feeds Article schema |
| `post.publishedDisplay` | frontmatter | Visible human-readable date |
| `post.readMinutes` | frontmatter | Visible read-time |
| `post.image` / `imageAlt` | frontmatter | Featured image + alt |
| Slot content | inside `<BlogPostLayout>` | The article body markup |
| Inline figure alt | inside `<figure class="post-figure">` | Per-post alt for the inline image |
| Pull quote text + attribution | inside `<blockquote class="post-pullquote">` | Per-post quote |

**Do NOT change:**

- The Layout's structural class names (`.post-lead`, `.post-pullquote`,
  `.post-figure`, `.post-meta`, `.post-title`, etc.)
- The 3-step breadcrumb structure (Home → Blog → Post Title)
- The closing CTA copy ("Book a Specialist Assessment") — sitewide
  consistency across all blog posts is the conversion goal
- The schema generation logic in the Layout
- Featured image dimensions on the `<img>` tag — keep
  `width="1600" height="900"` even when the source size differs;
  CSS handles the rendering via `aspect-ratio` + `object-fit: cover`

---

## Quick port checklist

When adding a new blog post:

- [ ] Create `src/pages/blog/<slug>.astro`
- [ ] Add the corresponding entry to `src/data/blogPosts.ts` (slug +
      lastmod) so the sitemap + redirect block pick it up
- [ ] Fill the `post` frontmatter object — all 9 fields required
- [ ] Pop the article body markup into the `<BlogPostLayout>` slot
      following the body content order above
- [ ] Per-post inline figure: replace the `alt` and `figcaption` text
      (the image src can stay on `placeholder.webp` until a real
      asset lands)
- [ ] Per-post pull quote: replace the quote text + `<cite>`
      attribution
- [ ] Verify in dev:
  - Page returns 200
  - H1 = post title
  - Visible 3-step breadcrumb in the band
  - Meta bar shows category + display date + read-time
  - Featured image renders 16:9
  - Drop cap on the lead paragraph
  - Pull quote with serif decorative quote-mark
  - Numbered list uses brand-primary 2-digit counters
  - Closing CTA card with `Book an Appointment` button
- [ ] Validate the schemas at https://search.google.com/test/rich-results
      after deploy — both `Article` and `BreadcrumbList` should pass

---

## Reference implementation

Live on `/blog/how-physiotherapy-can-support-you-through-menopause/`.
When in doubt, copy from that file directly — it's the canonical
example of the `post` frontmatter object + the body slot content
following the Layout's contract.

The Layout file
(`src/layouts/BlogPostLayout.astro`) is the only place where chrome,
schema, and styles live. Edits there propagate to every blog post
automatically.
