# Prompt: Site-Wide Mandatory Image Alt Text (Audit + Enforcement)

Reusable, self-contained prompt for **any HMDG Astro clinic site** (base template + clones). Two modes:

1. **Bulk rollout** — apply to an existing site whose images are still mostly `alt=""` + `role="presentation"`
2. **New-page build** — auto-included in every new page so alt text is never missed

This prompt is the source of truth alongside [.claude/rules/quality.md](../rules/quality.md) (Accessibility section) and `feedback_image_alt_text.md` in memory. Both reference each other.

---

## When to use

Trigger this prompt in any of these situations:

- **Initial site audit / clone** — first time setting up a new client site from the base template, or first time enforcing this rule on an existing site
- **Every new-page build (Tier 2+)** — incorporated automatically via the pipeline (see "Pipeline Integration" below)
- **Compliance request** — user says "audit alt text", "fix accessibility", "all images need alt", "WCAG 1.1.1 compliance", "improve SEO image alt", "Lighthouse a11y check"
- **PageSpeed / Lighthouse failure** on `image-alt` audit
- **Accessibility audit ahead of go-live** for a new clinic site

---

## The non-negotiable rule

Every `<img>` on every page must have descriptive `alt` text. **Never ship `alt=""` + `role="presentation"` unless the image is genuinely ornamental** (gradients, abstract shapes, decorative grain, background scenery in already-labelled containers).

**Why mandatory:**
- WCAG 1.1.1 (Non-text Content) — Level A, baseline accessibility
- On-page SEO — Google uses alt text as image-search indexing signal + main-content keyword reinforcement
- LCP heroes also gain image-search visibility from descriptive alt
- UK clinic context — patients with assistive tech / older mobile devices rely on alt text

**Default assumption when adding any new image: "this image conveys information → it needs alt text".** When unsure, ask before defaulting to empty alt.

---

## Per-image-purpose formula (locked)

| Purpose | Formula | Example |
|---|---|---|
| **Hero (`PageHero` `<img>` / homepage hero)** | Descriptive variant of page topic — NOT a literal copy of the H1 (avoids screen-reader redundancy with the on-page heading). ~6–10 words including service + clinic location. | H1 `Mole Removal Newcastle` → `alt="Private mole removal clinic at Northern Medical, Newcastle"` |
| **Featured / section image** (right-column section-1 image, booking-section image, parallax CTA banner) | Content-specific description of what the section covers | `alt="Achilles tendon assessment at Northern Medical"` |
| **Logo** | Clinic / client name only | `alt="Northern Medical"` |
| **Team photos** | `Practitioner Name, Role at Clinic` (or `Name — Role` for cards) | `alt="Dr Andy Sewart, Lead Doctor at Northern Medical"` |
| **Service feature image** (in card grids, cross-sells) | Service name + location | `alt="Joint injection clinic at Northern Medical, Blaydon"` |
| **Truly decorative** (gradients, abstract textures, ornamental shapes, background scenery in already-labelled containers) | `alt=""` + `role="presentation"` (the only acceptable empty-alt case) | — |

**Tone calibration:** keep alt strings clinical, grounded, and specific. Avoid marketing flourish ("amazing", "incredible"). Keep under ~12 words. Include the city/clinic name where it adds SEO value, but don't pad.

---

## Mode A — Bulk Rollout (existing site)

### Step 1 — Audit current state

Use Grep + glob to count current alt-text states. Categorise:
- `<img>` with descriptive `alt=` (real text)
- `<img>` with `alt=""` + `role="presentation"` (decorative pattern — verify each is genuinely decorative)
- `<img>` with `alt=""` WITHOUT `role="presentation"` (a11y bug)
- `<img>` with NO alt attribute at all (worse a11y bug)

```bash
# Example audit commands
grep -rn '<img' src/pages src/components | wc -l                                # total
grep -rn 'alt=""' src/pages src/components                                       # empty alts
grep -rn 'alt="" role="presentation"' src/pages src/components                   # decorative pattern
```

Top-of-list offenders are usually:
- Hero components (`Hero.astro`, `PageHero.astro` invocations)
- Service/condition page templates that all share a placeholder structure
- Reusable card components (`ServiceCard`, `TeamCard`) where the image was historically `alt=""`

### Step 2 — Run `seo-reviewer` agent for the strategy

```
Pipeline: seo-reviewer (audit + per-page hit list) → frontend-builder (implement)
```

Brief the seo-reviewer with the formula table above. Ask for:
1. Total counts per alt-text category
2. Top 5 offending files (most fixes needed)
3. Per-page hit list grouped by repetitive patterns (e.g. "all 15 condition pages: replace `alt=""` on the firstsection right-column `<img>` with `alt='<condition> assessment at Northern Medical'`")
4. Confirmation of the per-purpose formula (or refinements)

### Step 3 — Bulk-apply via PowerShell (preferred for repetitive patterns)

For sites with many template-derived pages (e.g. 15+ condition pages all sharing the same template), use PowerShell with regex substitution. Example pattern:

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$conditions = @(
  @{ slug = "achilles-tendinosis-treatment-newcastle"; name = "Achilles Tendinosis" }
  # ... etc
)

foreach ($c in $conditions) {
  $slug = $c.slug
  $name = $c.name
  $heroAlt   = "$name assessment and treatment at Northern Medical, Newcastle"
  $firstAlt  = "$name assessment image at Northern Medical"
  $sixthAlt  = "Rehabilitation and progressive loading for $name"
  $path = "src/pages/conditions/$slug.astro"

  $content = Get-Content $path -Raw -Encoding UTF8

  # Add imageAlt to PageHero
  $content = $content -replace `
    '<PageHero title=\{pageTitle\} image=\{heroImage\} />', `
    "<PageHero title={pageTitle} image={heroImage} imageAlt=`"$heroAlt`" />"

  # Replace firstsection alt="" role="presentation" with descriptive alt
  $content = $content -replace `
    "(src=`"/images/conditions/content/$slug-featured\.(?:avif|jpg)`") alt=`"`" role=`"presentation`"", `
    "`$1 alt=`"$firstAlt`""

  # ... etc for other section images

  [System.IO.File]::WriteAllText((Resolve-Path $path).Path, $content, $utf8NoBom)
  Write-Output "✓ $slug applied"
}
```

**Key PowerShell rules:**
- Use `[System.IO.File]::WriteAllText` with `UTF8Encoding $false` — keeps files UTF-8 no BOM
- Use `[\s\S]+?` (non-greedy any) when matching across lines
- Pattern-match unique anchors (slug-matched filename, specific src path) so you don't accidentally hit the wrong image

### Step 4 — Update reusable card components

If `ServiceCard.astro` / `TeamCard.astro` (or equivalent) have hardcoded `alt=""`, add an `imageAlt?: string` prop with a sensible default fallback so every consumer auto-inherits descriptive alt without needing to pass an extra prop:

```astro
---
interface Props {
  title: string;
  image: string;
  href: string;
  /** Defaults to title for SEO + a11y. Override per use if needed. */
  imageAlt?: string;
}
const { title, image, href, imageAlt } = Astro.props;
const finalAlt = imageAlt ?? title;
---
<a href={href} aria-label={title}>
  <img src={image} alt={finalAlt} ... />
</a>
```

Same pattern for TeamCard with `imageAlt ?? \`${name} — ${role}\``.

### Step 5 — Verify zero `alt=""` left

```bash
grep -rn 'alt=""' src/                                  # should only return 1-2 truly-decorative cases
grep -rn 'alt="" role="presentation"' src/              # only background scenery, gradients
```

Genuine decorative cases (KEEP):
- `FooterTestimonials.astro` — crossfade background scenery
- `PromoBannerSection.astro` — section background image
- Any inline grain / noise / SVG ornamental shapes (`.contact-halo`, etc.)

If the grep returns anything else, fix it.

### Step 6 — Production build + deploy

```bash
npm run build      # must pass
git add -A && git commit && git push origin master
```

Cloudflare Pages auto-rebuilds. Verify on the live URL with a Lighthouse mobile audit — `image-alt` audit should pass 100%.

---

## Mode B — Auto-Enforcement on New-Page Builds

Site-wide rule already lives in:
- `.claude/rules/quality.md` (auto-loaded into every conversation)
- Memory: `feedback_image_alt_text.md` (persists across sessions)
- Memory index: `MEMORY.md` (one-line reminder visible at every conversation start)

For every new page (Tier 2+ build), the following is enforced:

### Pipeline addition

In `.claude/rules/agent-workflow.md`, the `seo-reviewer` step (step 7) explicitly checks alt text. Excerpt:

> **7. seo-reviewer**
>    - Check H1, metadata, heading hierarchy, internal linking, noindex rules
>    - **Verify every `<img>` has descriptive `alt` text per the formula in `quality.md`** — never `alt=""` + `role="presentation"` except for truly decorative images
>    - Apply the formula directly: hero = page-topic variant; featured/section = content-specific; logo = clinic name; team = `Name, Role at Clinic`; decorative = `alt=""` + `role="presentation"`

### Frontend-builder default

When `frontend-builder` writes any `<img>` element, it must:

1. Default to a meaningful alt based on the page/section context
2. Never emit `<img alt=""` unless explicitly marked as decorative
3. For reusable card components, ensure the `imageAlt` prop has a sensible fallback (e.g. `imageAlt ?? title`) so consumers don't need to think about it

### Pre-declaration QA

Before declaring any Tier 2+ build done, the agent must:

```
- [ ] Every <img> on this page has descriptive alt text
- [ ] No alt="" except on documented decorative cases (gradients, scenery)
- [ ] Hero alt is NOT a literal copy of the H1 (descriptive variant only)
- [ ] PageHero invoked with imageAlt prop where applicable
- [ ] Component imageAlt prop fallbacks audited
```

If any check fails, fix before declaring done.

---

## One-shot brief — paste this into a new conversation

If you want to roll this out on a new client clone in one go, paste the following into a fresh chat:

````markdown
Apply the site-wide mandatory image alt text rule to this codebase per `.claude/rules/quality.md` (Accessibility section) + `.claude/prompts/image-alt-text-mandatory.md`. This is a Tier 4 task.

Pipeline: `seo-reviewer` (audit + per-page hit list) → frontend-builder (implement) → final verify.

## Steps

1. **Audit** — grep `src/pages` and `src/components` for `<img` and categorise: descriptive alt / `alt=""` with `role="presentation"` / `alt=""` without role / no alt attribute. Report counts + top 5 offenders.

2. **Apply formulas** per `.claude/rules/quality.md`:
   - Hero: descriptive variant of page topic (NOT literal H1) — 6–10 words including service + clinic location
   - Featured / section: content-specific description
   - Logo: clinic name only
   - Team: `Name, Role at Clinic`
   - Service feature: service name + location
   - Truly decorative (gradients, scenery): `alt=""` + `role="presentation"` (only acceptable empty-alt)

3. **Bulk-apply** via PowerShell where pages share a template (e.g. condition pages, minor-surgery pages, service pages). Use the pattern in `.claude/prompts/image-alt-text-mandatory.md` Step 3.

4. **Update reusable card components** (ServiceCard, TeamCard, etc.) — add `imageAlt?: string` prop with sensible default fallback so existing consumers auto-inherit descriptive alt.

5. **Verify** — `grep -rn 'alt=""' src/` should only return documented decorative cases (FooterTestimonials, PromoBannerSection, ornamental SVG shapes).

6. **Production build + manual sanity check** — `npm run build` must pass.

7. **Commit + push** — Cloudflare Pages auto-redeploys.

## Constraints

- Do not modify global CSS or token system
- Do not change image src paths; only the `alt` attribute
- Do not remove `role="presentation"` from genuinely decorative images
- All `<img>` files written as UTF-8 no BOM (use `[System.IO.File]::WriteAllText` with `UTF8Encoding $false` if scripting via PowerShell)
- Respect Title Case in any alt text containing the page H1 keywords
- Keep alt under ~12 words; clinical tone, no marketing flourish

## Deliverables

- Updated source files with descriptive alt text on every non-decorative `<img>`
- Updated `ServiceCard.astro` / `TeamCard.astro` (or equivalent) with `imageAlt` prop fallback
- Verified `grep` returns only documented decorative empty alts
- Clean production build
- Live deployment with passing Lighthouse `image-alt` audit
````

---

## Example outputs (real values from Northern Medical, April 2026)

### Heroes (page-topic descriptive variant)
- `/conditions/achilles-tendinosis-treatment-newcastle/` → `alt="Achilles Tendinosis assessment and treatment at Northern Medical, Newcastle"`
- `/joint-injections/` → `alt="Joint injections clinic at Northern Medical, Newcastle"`
- `/blood-tests/` → `alt="Private blood tests at Northern Medical, Newcastle"`
- `/shockwave-therapy-newcastle/` → `alt="Focused shockwave therapy clinic at Northern Medical, Newcastle"`

### Featured / section images
- Condition page firstsection (slug-matched featured image): `alt="<Condition Name> assessment image at Northern Medical"`
- Condition page section 3 (booking image): `alt="Booking your treatment at Northern Medical"`
- Condition page section 6 (parallax CTA): `alt="Rehabilitation and progressive loading for <Condition Name>"`

### Components with prop fallback
- `<ServiceCard>` — alt defaults to `title` (e.g. "Mole Removal")
- `<TeamCard>` — alt defaults to `${name} — ${role}` (e.g. "Sophie Thornton — Physiotherapist")

### Decorative cases (KEEP `alt=""` + `role="presentation"`)
- `FooterTestimonials.astro` — crossfade background images (caption text below carries semantic content)
- `PromoBannerSection.astro` — section background scenery (heading provides context)

---

## Verification snapshot

After full rollout, the site should show:

```
$ grep -rn 'alt=""' src/                              # 1–3 results (all documented decorative)
$ grep -rn 'alt="" role="presentation"' src/          # 1–3 results (background scenery only)
$ grep -rn '<img' src/pages | wc -l                    # ≈ 50–100 depending on site size
$ npm run build                                        # passes clean
```

Lighthouse mobile audit `image-alt` audit: **100%** pass.

---

## Non-negotiable rules

1. Every `<img>` on every page has descriptive alt text
2. Hero alt ≠ literal H1 (avoid screen-reader redundancy)
3. Reusable card components have `imageAlt?: string` prop with sensible default fallback
4. Decorative images keep `alt=""` + `role="presentation"` — these are the ONLY acceptable empty-alt cases
5. seo-reviewer formally checks alt text on every Tier 2+ build before declaring done
6. New page builds auto-comply via the rule in `quality.md` + the pipeline addition in `agent-workflow.md`
7. Cloned client sites inherit this rule automatically

---

## Reference files in the project tree

- [.claude/rules/quality.md](../rules/quality.md) — Accessibility section, per-purpose formula table
- [.claude/rules/agent-workflow.md](../rules/agent-workflow.md) — pipeline step 7 (seo-reviewer) includes alt verification
- `feedback_image_alt_text.md` (memory) — durable-across-sessions reminder
- `MEMORY.md` (index) — one-line pointer

---

## Production-tested

Northern Medical (April 2026): rolled out across 30+ pages including 15 condition pages, 7 minor-surgery pages, 5 service pages, 5 utility pages, homepage hero, ServiceCard component, TeamCard component. Final audit: 0 broken empty alts, all decoratives correctly marked, build clean.
