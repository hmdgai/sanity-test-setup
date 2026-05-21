---
name: CSS variables rule — complete token reference
description: Always use global CSS custom properties (var(--...)) for every colour, font, weight, size, spacing, radius, and shadow value — never hardcode anything that has a matching token
type: feedback
---

Always use global CSS variables from `src/styles/global.css` instead of hardcoded values. Never write raw hex colours, pixel sizes, weight numbers, or spacing values when a variable exists.

**Why:** Hardcoded values break the single-source-of-truth design system. When the client changes brand colour, type scale, or spacing, variables update everywhere automatically — hardcoded values do not.

**How to apply:**
1. Before writing any CSS, read `src/styles/global.css` to see the current live token list — the file is the source of truth, not this memory (which can go stale).
2. If a variable exists for what you need, use it.
3. If no variable matches, add a new one to `global.css @theme` first, then use it.
4. After adding any new variable to `global.css`, immediately update this memory file so future conversations know it exists.

**This memory file is a reference only — always verify against the live `global.css`.**

---

## Colours

### Brand
| Variable | Value | Use for |
|---|---|---|
| `var(--color-primary)` | `#DB003E` | Buttons, links, accents, active states |
| `var(--color-primary-hover)` | `#dd0d48` | Hover state on primary elements |
| `var(--color-accent)` | `#FDF2F5` | Light brand tint — section backgrounds, badges |

### Content text
| Variable | Value | Use for |
|---|---|---|
| `var(--color-headline)` | `#040303` | All headings h1–h6 |
| `var(--color-body)` | `#151515` | Paragraphs and body text |
| `var(--color-caption)` | `#94a3b8` | Captions, labels, meta text, secondary copy |

### Surfaces and layout
| Variable | Value | Use for |
|---|---|---|
| `var(--color-muted)` | `#F2F2F2` | Alternating section backgrounds |
| `var(--color-surface)` | `#f8fafc` | Cards, form backgrounds, off-white panels |
| `var(--color-border)` | `#e2e8f0` | Borders, dividers, input outlines |
| `var(--color-white)` | `#ffffff` | Pure white — card backgrounds, nav, text on dark |
| `var(--color-black)` | `#000000` | Pure black — use sparingly |
| `var(--color-hero-dark)` | `#0a0f1a` | Deep navy-black — hero section backgrounds (legal pages) |

---

## Font families

| Variable | Use for |
|---|---|
| `var(--font-heading)` | All headings (Inter Tight) |
| `var(--font-body)` | All body text (Inter) |
| `var(--font-sans)` | Utility alias for Inter |

---

## Font sizes

### Heading scale (fluid with clamp)
| Variable | Size range | Use for |
|---|---|---|
| `var(--text-h1)` | 40px → 72px | Hero headlines, page titles |
| `var(--text-h2)` | 32px → 56px | Section headings |
| `var(--text-h3)` | 24px → 40px | Sub-section titles, card headings |
| `var(--text-h4)` | 20px → 28px | Card titles, feature names |
| `var(--text-h5)` | 18px → 22px | Eyebrow labels, small section titles |
| `var(--text-h6)` | 16px → 18px | Small labels, footnote headings |

Each heading size has companions:
- `var(--text-h1--line-height)`, `var(--text-h1--letter-spacing)` (and h2–h6)

### Body scale
| Variable | Value | Use for |
|---|---|---|
| `var(--text-xl)` | 1.25rem / 20px | Large body, callouts |
| `var(--text-lg)` | 1.125rem / 18px | Lead paragraphs, intro text |
| `var(--text-base)` | 1rem / 16px | Default body text |
| `var(--text-sm)` | 0.9375rem / 15px | Captions, labels, secondary text |
| `var(--text-xs)` | 0.875rem / 14px | Fine print, badges, table text |

Each body size has a companion: `var(--text-base--line-height)` etc.

---

## Font weights

| Variable | Value | Use for |
|---|---|---|
| `var(--font-weight-normal)` | 400 | Body text |
| `var(--font-weight-medium)` | 500 | Labels, nav items, subtle emphasis |
| `var(--font-weight-semibold)` | 600 | Buttons, card titles, sub-headings |
| `var(--font-weight-bold)` | 700 | h3–h6, section labels |
| `var(--font-weight-extrabold)` | 800 | h1–h2, hero headlines |

---

## Spacing

| Variable | Value | Use for |
|---|---|---|
| `var(--spacing-section-y)` | 4.375rem / 70px | Vertical section padding (mobile) |
| `var(--spacing-section-y-lg)` | 5.625rem / 90px | Vertical section padding (desktop ≥1200px) |
| `var(--spacing-section-x)` | 1.875rem / 30px | Horizontal section padding (all screens) |
| `var(--spacing-container-max)` | 83.75rem / 1340px | Container max-width |
| `var(--spacing-card-p)` | 1.75rem / 28px | Inner padding for cards |
| `var(--spacing-gap)` | 0.9375rem / 15px | Default flex-layout gap |
| `var(--spacing-gap-md)` | 1.5rem / 24px | Medium gap (card grids) |
| `var(--spacing-gap-lg)` | 2rem / 32px | Large gap (section columns) |

---

## Border radius

| Variable | Value | Use for |
|---|---|---|
| `var(--radius-card)` | 0.75rem / 12px | Cards, image wrappers, panels |
| `var(--radius-btn)` | 0.625rem / 10px | All buttons |
| `var(--radius-input)` | 0.625rem / 10px | Form inputs (matches buttons) |
| `var(--radius-badge)` | 9999px | Pills, labels, tags, badges |

---

## Shadows

| Variable | Use for |
|---|---|
| `var(--shadow-card)` | Default card elevation |
| `var(--shadow-raised)` | Hover state or elevated panels |
| `var(--shadow-nav)` | Navigation bar shadow |

---

## Acceptable exceptions (no variable needed)

- `rgba()` opacity values — no variable system covers every opacity level
- Micro UI sizes with no matching token: `0.75rem`, `0.6875rem`, `0.8125rem`
- Semantic status colours specific to a UI state (`#15803d` green for "required" badges)
- JavaScript strings inside `console.log` style arguments — those are not CSS
- `border-radius` values specific to one-off UI elements that don't match the card/btn/input/badge scale
