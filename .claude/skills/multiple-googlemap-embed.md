# Skill: Multiple Google Map Embed — Tabbed Locations Section (Reusable)

Premium pre-footer locations section. A full-width 500px map area with a
floating frosted-glass tab list at the top (desktop) / dropdown trigger
(mobile), a single "Discover" CTA at the bottom whose href tracks the
active tab, and **lazy iframe injection** — only the map the user actually
views gets loaded. Designed for clinics, salons, gyms, or any business
with 2–8 locations.

Production reference: rendered globally on every page via
`src/layouts/BaseLayout.astro`. Component lives at
`src/components/LocationsTabs.astro` (~472 lines). Data lives at
`src/data/locations.ts`.

---

## When to use

- Multi-location service business (clinic, salon, gym, studio, restaurant
  group) that needs every branch surfaced without a 5×iframe payload tax
- Pre-footer location anchor — gives the brand a physical presence right
  before the footer without taking section real estate up the page
- Replacement for a static list of addresses with separate embedded maps
  (which is what the Elementor / WordPress template usually produces —
  slow, no interactivity, no a11y)
- Sites where a postcode-filtered directory page is overkill (<10 locations)

**NOT for:**

- Single-location businesses — use a single iframe in the footer instead,
  no need for the tab machinery
- Sites with 15+ locations — pagination + search becomes more valuable
  than tabs at that scale; build a dedicated `/locations/` index instead
- Sites that need turn-by-turn directions inline — Google's q-format
  embed is read-only; use the full Maps API + directions service for
  that case

---

## The rules (non-negotiable)

1. **CLS-safe reserved height.** The `.locations-stage` is fixed at
   `h-[500px]` (or your chosen value). Both the placeholder div AND the
   later-injected iframe respect that height, so the swap is zero-CLS.
   Never let the iframe drive its own height — Google ships variable
   default dimensions.
2. **Only the first tab's map renders server-side.** Inactive tabs ship
   as `<div data-map-placeholder data-map-src="…">` — tiny markup, no
   network cost. The JS controller's `ensureIframe(panel)` promotes the
   placeholder to a real `<iframe>` the first time that tab is activated.
   This is the entire performance story.
3. **IO-deferred init.** The JS controller doesn't bind handlers until
   the `.locations-section` enters (or approaches) the viewport, via
   `IntersectionObserver` with `rootMargin: '0px 0px 200px 0px'`. Users
   who never scroll to the pre-footer pay zero JS cost beyond the
   2 KB-ish bundle parse.
4. **Use the legacy `?q=…&output=embed` Maps URL format.** Not the
   modern `?pb=…` format. The pb URLs carry a `4v…` timestamp that
   expires after some months → "Invalid 'pb' parameter" errors that
   are hard to debug. The q-format is a plain text search query and
   has been stable for 15+ years. No API key required, no CSP changes.
5. **WAI-ARIA Tabs pattern, faithful implementation.** Container is
   `role="tablist"`, each button is `role="tab"` with
   `aria-selected` + `aria-controls={panelId}` + `id={tabId}`, each
   panel is `role="tabpanel"` with `aria-labelledby={tabId}`. The
   first tab starts `aria-selected="true"` with `tabindex="0"`; others
   are `tabindex="-1"` (roving tabindex).
6. **Keyboard navigation:** `ArrowRight` / `ArrowLeft` wrap through
   tabs, `Home` jumps to first, `End` jumps to last. Each arrow press
   moves focus AND activates the new tab (single-action selection
   model — appropriate when activation has no side-effects beyond
   showing the map).
7. **Mobile uses a dropdown, not horizontal scroll.** Below `sm:`
   (640px), the tab capsule is replaced with a dropdown trigger
   showing the active location name + chevron, opening a listbox of
   all locations. Five location names can't fit on a 375px row without
   horizontal scroll, which feels janky as an entry-point UX.
8. **Single "Discover" CTA, link tracks active tab.** Bottom-centre
   button styled as `.btn .btn-default`. The JS controller updates its
   `href` attribute when the active tab changes. The Discover label
   stays the same — only the destination changes.
9. **Subtle bottom-edge gradient for button contrast.** A `h-32`
   gradient from `black/25 → transparent` sits at the bottom of the
   map area so the Discover button always has minimum contrast,
   regardless of the active map's colour palette (some maps are
   bright, others dark).
10. **Grayscale iframe styling.** The injected iframe carries the
    `grayscale` Tailwind class — desaturates the Google Maps UI so it
    feels like part of the brand rather than a foreign embed. Easy to
    drop if you want full-colour maps.
11. **Iframe a11y attributes.** Every injected iframe gets:
    `title={"Map showing " + loc.name}` (per-iframe descriptive
    title), `loading="lazy"`, `referrerpolicy="no-referrer-when-
    downgrade"`, `allowfullscreen`. The section itself has an `<h2
    class="sr-only">` labelling it for screen readers without
    visible chrome.
12. **44×44 touch targets on mobile.** Tab buttons enforce
    `min-h-[44px]` per WCAG 2.5.5 — required for finger-friendly tap.

---

## File layout

```
src/
├── components/
│   └── LocationsTabs.astro           ← the component
├── layouts/
│   └── BaseLayout.astro              ← imports + renders <LocationsTabs />
└── data/
    └── locations.ts                  ← canonical location data
```

To render on every page: import in `BaseLayout` between the reviews
carousel and the footer (or wherever the pre-footer chain lives):

```astro
import LocationsTabs from "../components/LocationsTabs.astro";

// later in markup, before <Footer />:
<LocationsTabs />
```

---

## Data shape

### `src/data/locations.ts`

```ts
export interface Location {
  /** URL-safe slug. Used for DOM ids, data-attributes, route paths. */
  id:      string;
  /** Display name shown on the tab. Free-form (en-dashes OK). */
  name:    string;
  /** Route to the location detail page. Must end with trailing slash. */
  href:    string;
  /** Google Maps embed URL — the `src` of a `<iframe>` Maps embed. */
  mapSrc:  string;
  /** Optional pre-launch note rendered as a TODO comment in the component. */
  todo?:   string;
}

export const locations: Location[] = [
  {
    id:     'manchester-trafford',
    name:   'Trafford',
    href:   '/location/physiotherapy-trafford-stretford/',
    mapSrc: 'https://maps.google.com/maps?q=The+Physio+Lounge+-+Trafford&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  {
    id:     'warrington-lingley-mere',
    name:   'Lingley Mere',
    href:   '/location/united-utilities/',
    mapSrc: 'https://maps.google.com/maps?q=The+Physio+Lounge+-+United+Utilities,+Warrington&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
  // …
];
```

### How to build a `mapSrc` URL

1. Open Google Maps, search for the location
2. Copy the official place name (or use the postal address)
3. Build the URL:
   ```
   https://maps.google.com/maps?q=<URL-encoded-search>&t=&z=15&ie=UTF8&iwloc=&output=embed
   ```
4. `z=15` is a sensible default zoom level for a "city block" view —
   bump to `z=17` for a tight street view, drop to `z=13` for a wider
   neighbourhood view

You can also paste a modern `?pb=…` embed URL into this field — the
component renders both formats interchangeably. The q-format is
preferred because it never expires.

---

## Visual anatomy

### Desktop (sm: and up — ≥640px)

- 500px-tall full-width map area (`bg-(--color-muted)` placeholder
  background while iframe loads)
- Floating frosted-glass tab capsule centred horizontally at the top,
  ~24px from the top edge
- Tab list: 5 tabs side-by-side, each 7.4rem minimum width, with
  hairline dividers between inactive tabs
- Active tab: brand-primary background + white text, hairline dividers
  on adjacent tabs fade to transparent
- Inactive tab: dark headline-colour text, primary on hover
- Discover button: bottom-centre, `min-w-[150px]`, 32px above the
  bottom edge

### Mobile (below sm: — <640px)

- Same 500px map area
- Tab capsule replaced with a single dropdown trigger:
  - Pill button, full-width minus 30px gutters
  - "LOCATION" eyebrow (uppercase, primary colour) + active location
    name + chevron icon
  - Frosted-glass background with brand-primary border tint
- Tap opens a listbox below with one option per location:
  - Active option shown with primary background + white text +
    checkmark icon
  - Other options on hover/focus get a subtle primary-tint background
- Close on outside click or Escape
- Discover button stretches full-width with 30px gutters

### Map iframe

- Injected on first activation of each tab
- 100% width × 100% height of the parent panel
- `grayscale` filter so the embed feels desaturated and brand-aligned
- All panels stack at the same grid cell via `absolute inset-0`
- Cross-fade between active panels at 500ms `cubic-bezier(0.4, 0, 0.2, 1)`

---

## JS controller — what it does

The inline IIFE in the component does six things:

1. **Defers init via IntersectionObserver** with a 200px rootMargin —
   so the binding work happens just before the section is visible,
   not on initial paint
2. **`ensureIframe(panel)`** — promotes a placeholder div to a real
   iframe, transferring `data-map-src` + `data-map-title` to the
   iframe's `src` + `title`. Idempotent — re-running on an already-
   promoted panel is a no-op.
3. **`activate(tab)`** — flips ARIA state on all tabs (roving
   tabindex), cross-fades panels via opacity classes, and updates the
   Discover CTA's `href`
4. **Keyboard handlers** — ArrowLeft / ArrowRight / Home / End on
   each tab, with focus + activate in one keystroke
5. **Mobile dropdown** — toggle aria-expanded, close on outside click,
   close on Escape (restores focus to the trigger)
6. **Initial iframe injection** — calls `ensureIframe` on the
   currently-active panel (first one by default) so the visible map
   loads on init

---

## Customisation knobs

These are the **only** things that should differ per project:

| Knob | Where | Notes |
|---|---|---|
| Location list | `src/data/locations.ts` | The whole array. Add / remove / reorder freely. |
| Map height | `.locations-stage { h-[500px] }` in the component | Default 500px. Use 400px for compact sites, 600px+ for hero-feel. CLS-safe — change in one place. |
| Active tab default | `i === 0 ? 'true' : 'false'` in markup + script | First location by default. Could be made data-driven via a `defaultActive: true` field on the locations data. |
| Tab capsule centring | `.locations-tabs-shell` classes | `top-4` (16px) by default. Bump to `top-6` for more breathing room. |
| Discover CTA label | Inline "Discover" text in the `<a>` | Could be "Find Us", "Visit", "Get Directions" — whatever suits the brand voice. |
| Iframe grayscale | `iframe.className = '… grayscale'` in `ensureIframe()` | Drop the class for full-colour maps. |
| Mobile breakpoint | `sm:hidden` / `sm:flex` Tailwind utilities | Default 640px. Adjust if your data has very short or very long location names. |
| Brand primary colour | `var(--color-primary)` + `--color-primary-hover` | Inherits from the design tokens — no per-component override needed. |
| Section background | `bg-(--color-muted)` on the `<section>` | Matches the pre-footer rhythm. Use `bg-white` if your footer is also muted (avoid two muted bands stacked). |

**Do NOT change:**

- The CLS-safe height reservation (`h-[500px]` on `.locations-stage`)
- The placeholder-to-iframe lazy swap pattern — it's the entire
  performance story
- The WAI-ARIA Tabs pattern wiring (role attributes, ids,
  aria-selected, roving tabindex)
- The `IntersectionObserver` deferred init
- The legacy `?q=…&output=embed` Maps URL format
- The 44px min-height on tab buttons

---

## Adding a new location

Three steps, all in one file:

```ts
// src/data/locations.ts
export const locations: Location[] = [
  // … existing entries
  {
    id:     'leeds-headingley',
    name:   'Leeds',
    href:   '/location/leeds-headingley/',
    mapSrc: 'https://maps.google.com/maps?q=The+Physio+Lounge+-+Leeds&t=&z=15&ie=UTF8&iwloc=&output=embed',
  },
];
```

That's it. The component reads from this array on build:
- A new `<button role="tab">` is generated
- A new placeholder `<div>` is generated
- The IntersectionObserver controller binds the new tab's keyboard +
  click handlers
- The mobile listbox gets a new option

No CSS changes, no component edits, no JS edits. The component scales
linearly with the array length — tested in production with 5
locations, comfortable up to ~10.

---

## Asset pipeline

**None.** All icons (chevron, checkmark) are inline SVG in the
component markup. No image assets to preload. The Google Maps tile
imagery is fetched on iframe injection — never before the user
interacts with that tab.

---

## Port checklist

When adding this widget to a new project:

- [ ] Copy `src/components/LocationsTabs.astro` verbatim
- [ ] Create `src/data/locations.ts` with the `Location` interface +
      `locations` array — populate at least one entry to start
- [ ] Import + render `<LocationsTabs />` in `BaseLayout.astro`
      between the reviews carousel and the footer
- [ ] Verify `--color-primary` + `--color-primary-hover` + `--color-muted`
      + `--color-headline` + `--color-body` + `--color-white` are all
      defined in the project's CSS tokens
- [ ] Verify the `.btn .btn-default` utility class exists (used by the
      Discover CTA)
- [ ] Verify the `.pl-no-scrollbar` utility exists (used to hide the
      scrollbar on the desktop tab capsule when overflow happens)
- [ ] Build the q-format `mapSrc` URLs for every location (test each
      one in a browser before populating the data file — Google
      sometimes mis-resolves ambiguous search terms)
- [ ] Test desktop: tab clicks → smooth cross-fade, Discover link
      updates, keyboard arrows move focus + activate
- [ ] Test mobile: dropdown opens / closes, option selection switches
      map, outside click + Escape close the dropdown
- [ ] Test screen reader: NVDA / VoiceOver announces "Trafford, tab,
      selected, 1 of 5" on focus, "Map showing Trafford" on the
      iframe
- [ ] Test reduced-motion: transitions disabled (the component honours
      `motion-reduce:transition-none` on the panel opacity transition)
- [ ] Performance check: only one iframe in the DOM on initial load
      (verify in DevTools → Elements → search for `<iframe`)

---

## Reference implementation

Live on every page of the Physio Lounge site via
`src/layouts/BaseLayout.astro`. The canonical files are:

- `src/components/LocationsTabs.astro` — 472 lines, includes all
  markup + CSS + JS controller
- `src/data/locations.ts` — 79 lines, current production data for 5
  Physio Lounge clinics

When in doubt, copy from those files directly.

---

## Performance notes

- **Zero framework hydration** — pure HTML / CSS / vanilla JS, no
  React / Vue / Svelte island
- **One iframe in the DOM until interaction** — the other 4 (or N-1)
  ship as ~120-byte placeholder divs
- **IntersectionObserver deferred init** — JS controller binds only
  when section approaches the viewport. Users who never scroll past
  the reviews carousel pay zero controller cost beyond the inline
  script's parse time (~2 KB raw, ~600 B gzipped)
- **No API key required** — uses the legacy `?q=…&output=embed`
  format which has been stable since 2008
- **No CSP changes** — Google Maps' embed loads from
  `maps.google.com` / `maps.gstatic.com`, both already permitted by
  default CSPs that allow third-party iframes
- **No image assets** — nothing to preload, nothing to lazy-load
- **Bundle size impact** — the entire component compiles to ~6 KB
  gzipped HTML + ~1.5 KB scoped CSS per page. Inactive iframes are
  ~120 bytes each in the initial response
- **CLS = 0** — `.locations-stage` height is reserved upfront; the
  iframe injection happens INTO that reserved height, never expanding it
