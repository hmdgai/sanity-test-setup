# Skill: Mega Menu Header (Reusable)

Premium Asana-style header with full-bleed mega panels, a mobile
accordion drawer, scroll-progress bar, four-tier active-state
tracking, and zero-JS hover open. Solid white background, single
64px row, six top-level labels (5 mega + 1 plain link), dark booking
CTA. Pure HTML/CSS for hover; inline TS only for scroll progress,
mobile toggle, accordion, and ARIA state sync.

Production reference: rendered globally on every page via
`src/layouts/BaseLayout.astro`. Component lives at
`src/components/Header.astro` (~721 lines including all markup +
inline `<script>` block). Supporting CSS lives in
`src/styles/global.css` under the `.site-nav-item`, `.mega-*`,
`.mobile-mega-*`, `#site-header-wrapper`, and `.mobile-accordion`
rule blocks.

---

## When to use

- Multi-section service / clinic / agency site with 5+ navigable
  sections that each have their own sub-pages (services, conditions,
  technology, locations, partners, etc.)
- Sites that need a contact card surfaced inside the primary nav
  (phone + email + address inside one mega panel) without sacrificing
  a dedicated /contact/ page
- Replacement for a flat sticky nav where the parent links scroll
  off the screen before showing children — the mega panel gives
  every child link a clear visible home
- Sites where a single primary CTA (Book Now / Get a Quote / Buy
  Tickets) belongs in the header itself, with a matching CTA at the
  bottom of every mega panel for double-exposure conversion

**NOT for:**

- Sites with fewer than ~10 destination pages — a plain horizontal
  nav is simpler, no mega machinery needed
- E-commerce sites with 30+ categories — use a dedicated mega-menu
  framework (the pattern below assumes ~5 mega parents with
  ≤10 children each)
- Sites that need a left-side rail or off-canvas drawer on desktop —
  this is a top-anchored horizontal pattern

---

## The rules (non-negotiable)

1. **`#site-header-wrapper` is `position: fixed; z-index: 50`.**
   PageHero.astro reserves enough `padding-top` (7rem mobile → 11rem
   desktop) to clear a 64px nav with breathing room. Every page that
   uses BaseLayout inherits this — never override `padding-top` on
   `<main>`.
2. **Transform-free ancestor chain.** The mega panel uses
   `position: fixed` to resolve to the viewport (full-bleed width).
   Any CSS `transform`, `filter`, `perspective`, `will-change`, or
   `contain` on an ancestor would create a containing block for the
   fixed positioning and scope the panel to that ancestor's width
   (typically a centered container, breaking the full-bleed effect).
   The 3-column grid container `grid-cols-[auto_1fr_auto]` was chosen
   specifically because it doesn't use `transform`.
3. **Mega panels open on `:hover` + `:focus-within`.** Pure CSS via
   `.group:hover` and `.group:focus-within` modifiers on the parent
   `<div class="group">`. JS only syncs `aria-expanded` for screen
   readers — never controls the visual open state. Keyboard users
   tab into the panel, mouse users hover. Both work without JS.
4. **`xl:` breakpoint (1280px) splits desktop ↔ mobile.** The full
   mega panel system shows at `xl:` and up. Below `xl:` the desktop
   nav is `hidden` and the hamburger trigger + mobile drawer appear.
   The reason for 1280px (not the usual 1024px): five long mega
   triggers + logo + CTA need ≥1280px to lay out without text
   crowding.
5. **Mobile drawer = accordion per mega section.** Each mega's
   panel content (groups, items, contact card) collapses into a
   stacked accordion inside the mobile drawer. The accordion uses
   `aria-expanded` + `hidden` attribute toggling for native
   accessibility — no JS layout measurement (no `scrollHeight`-based
   height animations).
6. **Four-tier active-state system.** Per
   `.claude/rules/frontend.md`:
   - **Tier 1**: top-level plain links use `isActive(href)`
   - **Tier 2**: mega triggers use `isSection(prefix)` so any
     child URL activates the parent (e.g. `/about/team/` highlights
     `About`)
   - **Tier 3**: mid-level flyout triggers (when a mega has a
     sub-grouping that itself acts as a trigger) — NOT used in this
     header but pattern is documented in `frontend.md`
   - **Tier 4**: leaf links in mega panels use `isActive(href)`
   Every mobile equivalent uses the same booleans — desktop and
   mobile never drift.
7. **Section booleans are auditable in one place.** All
   `*Active` constants live at the top of the frontmatter
   (`aboutActive`, `servicesActive`, etc.) — never scattered. Edits
   to active-state rules only touch one block.
8. **`technologyActive` declared BEFORE `servicesActive`.** Because
   Shockwave, Winback, Sports Screening, and Footscan live under
   `/service/` URLs but should highlight the Technology mega (not
   Services). The negative match `isSection('/service') &&
   !technologyActive` keeps both parents from highlighting
   simultaneously.
9. **MegaData type is the contract.** All four mega panels share the
   same TypeScript shape:
   ```ts
   type MegaItem    = { label: string; href: string; icon: any; desc?: string };
   type MegaGroup   = { heading: string; items: MegaItem[]; cols?: 1|2|3|4 };
   type MegaContact = { heading, phoneTel, phoneDisplay, email, addressLine1-3 };
   type MegaData    = { groups: MegaGroup[]; contact?: MegaContact };
   ```
   `desc` optional per-item (About hides desc — Services/Conditions/
   Technology show desc). `contact` optional per-mega (About has
   contact card — Services/Conditions/Technology/Location don't).
10. **Two logos stacked, CSS-only crossfade (legacy support).**
    `logo-white` + `logo-black` SVGs sit at the same grid cell.
    Originally crossfaded based on `is-scrolled` for a
    transparent-over-hero pattern; current Asana-style header keeps
    both logos in the DOM but the wrapper background is solid white
    by default, so only the black logo is visible. Keeping the
    legacy white logo allows the wrapper to be flipped to a
    transparent variant on a per-page basis later without restructure.
11. **64px header height, fixed.** The inner grid
    `grid-cols-[auto_1fr_auto] items-center h-16 gap-4` enforces a
    64px row. Logo on the left (`clamp(180px, 60vw, 250px)` wide),
    nav centred, CTA + hamburger justified end. Never let header
    height vary — the page padding-top depends on a stable header
    size.
12. **`<html>.is-nav-open` class locks body scroll when mobile menu
    is open.** Class-driven body-lock, not `style="overflow: hidden"`.
    The class is set/cleared by `openMenu()` / `closeMenu()` and
    referenced in `global.css` to apply `overflow: hidden` on `<body>`.
    This matches the project's no-inline-style rule.
13. **Mobile hamburger is 44×44 minimum touch target.** WCAG 2.5.5
    compliance. Three bars (`w-5 h-0.5`) inside a `min-w-[44px]
    min-h-[44px]` button. Bars morph into an `×` when
    `#site-header-wrapper.menu-open` is set via CSS keyframe.
14. **Scroll progress indicator** — 3px brand-primary bar at the
    very top of the header, width driven by `--scroll-progress` CSS
    var set by the inline TS controller via
    `requestAnimationFrame`-throttled scroll listener. Purely
    decorative — doesn't affect any layout or content.
15. **`is-scrolled` class adds drop shadow only.** No background
    flip, no logo flip, no colour swap. The current pattern is
    solid-white-from-the-start — `is-scrolled` only adds a subtle
    shadow on scroll past 60px so the header lifts off the page
    visually. Toggle managed by the inline TS scroll listener.
16. **Escape closes the open mega (or mobile menu)** and restores
    focus. The keydown listener checks
    `document.activeElement.closest('.mega-panel')` and blurs the
    focused element, releasing `:focus-within` and closing the panel
    via CSS state.

---

## File layout

```
src/
├── components/
│   ├── Header.astro                  ← the whole header (markup + inline TS)
│   └── Icon.astro                    ← Lucide wrapper used by every mega item
├── data/
│   ├── navigation.ts                 ← (legacy) shared parent menu data — currently unused; Header has its own inline data
│   └── site.ts                       ← `bookingUrl` (the booking CTA target)
├── layouts/
│   └── BaseLayout.astro              ← imports + renders <Header />
└── styles/
    └── global.css                    ← ~700 lines of header / mega / mobile CSS

src/components/icons/                  ← custom SVG icons per service / condition (used in mega items)
├── AcupunctureIcon.astro
├── PhysiotherapyIcon.astro
├── BackPainIcon.astro
├── SciaticaIcon.astro
…etc
```

Render globally: import in `BaseLayout` and drop one `<Header />`
near the top of `<body>`:

```astro
import Header from "../components/Header.astro";

// later in markup, after the skip-link:
<Header />
```

---

## Architecture overview

### DOM tree

```
<div id="site-header-wrapper" class="fixed top-0 left-0 right-0 z-50">
  <div id="scroll-progress" aria-hidden="true"></div>

  <div id="header-nav-inner">
    <div class="container-main grid grid-cols-[auto_1fr_auto] items-center h-16 gap-4">
      <a class="logo-wrap">
        <img class="logo logo-white" />     ← legacy, hidden by default
        <img class="logo logo-black" />     ← visible
      </a>

      <nav class="hidden xl:flex ...">      ← desktop nav (xl+ only)
        {parentMenu.map(item => (
          item.kind === 'mega' ? <MegaTrigger + MegaPanel> : <PlainLink>
        ))}
      </nav>

      <div class="flex items-center gap-2 justify-self-end">
        <a id="header-cta" class="btn btn-white hidden xl:inline-flex">Book Now</a>
        <button id="mobile-menu-toggle" class="xl:hidden ...">  ← hamburger
          <span class="mobile-toggle-bar" />×3
        </button>
      </div>
    </div>
  </div>

  <div id="mobile-nav" class="xl:hidden hidden">  ← drawer
    <nav>
      {parentMenu.map(item => (
        item.kind === 'mega' ? <MobileAccordion> : <PlainMobileLink>
      ))}
      <a class="btn btn-default">Book Now</a>
    </nav>
  </div>
</div>
```

### Behaviour layer (inline TS at the bottom of the component)

- **Scroll progress** — `requestAnimationFrame`-throttled listener
  reading `scrollY / (scrollHeight - innerHeight)`, writing to
  `--scroll-progress` on `<html>`. Width of `#scroll-progress` bar
  reads the variable.
- **`is-scrolled` toggle** — same listener, sets the class on the
  wrapper at `scrollY > 60`. Drives the drop-shadow CSS.
- **Mobile toggle** — `mobileToggle.click` → openMenu / closeMenu
  flips `menu-open` on wrapper, `aria-hidden` on drawer, `is-nav-open`
  on `<html>` (body-scroll lock), `aria-expanded` on the button.
- **Desktop mega ARIA sync** — for each `.mega-trigger`, attaches
  `mouseenter/mouseleave/focusin/focusout` handlers that toggle
  `aria-expanded` to keep screen readers in sync with the CSS hover
  open state. JS doesn't control the visual open — only the ARIA
  attribute.
- **Mobile accordion** — click handler on each accordion `<button>`
  toggles the `hidden` attribute on the panel and the
  `is-rotated` class on the chevron icon. Stops propagation to avoid
  the outside-click handler closing the entire mobile menu.
- **Escape key** — closes mobile menu if open, OR blurs whatever is
  focused inside an open mega panel (releasing `:focus-within` and
  closing the panel via CSS).
- **Outside-click** — closes the mobile drawer when a tap lands
  outside the wrapper.

---

## MegaData shape

```ts
/** A single navigable item in a mega panel. `desc` is optional —
 *  when present the panel renders label + secondary description
 *  (Services / Conditions / Technology style). When absent only
 *  the label renders (About style). */
type MegaItem = {
  label: string;
  href:  string;
  icon:  unknown;  // @lucide/astro icon import OR custom .astro icon component
  desc?: string;
};

/** A group of items inside a mega panel. `cols` controls how the
 *  group's items split internally (1 → single column, 2 → 2 sub-columns,
 *  3 → 3 sub-columns, 4 → 4 sub-columns). Default 1. */
type MegaGroup = {
  heading: string;
  items:   MegaItem[];
  cols?:   1 | 2 | 3 | 4;
};

/** Contact card rendered on the right side of the mega panel.
 *  Only About uses it currently — Services/Conditions/Technology/
 *  Location omit it (the dropdown auto-switches to a no-contact
 *  layout when this field is absent). */
type MegaContact = {
  heading:      string;
  phoneTel:     string;   // digits only — tel: link target
  phoneDisplay: string;   // human-readable phone number
  email:        string;
  addressLine1: string;   // shown as label (e.g. "Head Office")
  addressLine2: string;   // first address line
  addressLine3: string;   // second address line
};

/** The full data object for one mega panel. */
type MegaData = {
  groups:   MegaGroup[];
  contact?: MegaContact;
};

/** A parent menu entry. Top-level can be a plain link or a mega. */
type ParentItem =
  | { kind: 'mega'; label: string; href: string; slug: string; data: MegaData; active: boolean }
  | { kind: 'link'; label: string; href: string;                                active: boolean };
```

### Five canonical mega variants

| Mega | Groups | Per-item `desc` | Contact card | Notes |
|---|---|---|---|---|
| About | Company + Partners | No | Yes (Head Office address) | 2-column groups + right-side contact card = 3-col grid |
| Services | Specialist (cols: 2) + Core | Yes | No | 2-col group grid; Specialist auto-splits 9 items into 2 sub-columns |
| Conditions | What We Treat (cols: 3) | Yes | No | Single group, 3 sub-columns for 9 condition cards |
| Technology | Technology (cols: 4) | Yes | No | Single group, 4 sub-columns (one per item) |
| Location | Locations (cols: 3) | No | No | Single group, 5 clinics auto-balance into 3 columns |

---

## Active-state system (4 tiers)

### Helpers (at the top of Header.astro frontmatter)

```ts
const path = Astro.url.pathname;
const norm = (href: string) => (href.endsWith('/') ? href : href + '/');

/** Exact-match leaf link — '/' is homepage-only, trailing slash normalised. */
const isActive  = (href: string) =>
  href === '/' ? path === '/' : path === norm(href) || path === norm(href).slice(0, -1);

/** Prefix match — child URL activates the parent. */
const isSection = (prefix: string) => path.startsWith(prefix);
```

### Per-section booleans (one block, auditable)

```ts
const aboutActive =
  isSection('/about')   || isSection('/member')   || isSection('/pricing')  ||
  isSection('/packages')|| isSection('/faqs')     || isSection('/blog')     ||
  isSection('/recruitment') || isSection('/careers') || isSection('/partner');

// Technology FIRST — Services excludes Technology paths so both don't highlight.
const technologyActive =
  isActive('/service/shockwave/')              ||
  isActive('/service/winback-tecar-therapy/')  ||
  isActive('/service/sports-screening/')       ||
  isActive('/service/footscan-assessments/');
const servicesActive   = isSection('/service') && !technologyActive;
const conditionsActive = isSection('/condition');
const locationActive   = isSection('/location');
const contactActive    = isActive('/contact/');
```

### Visual treatment

- **`.site-nav-item.is-active`** (desktop trigger + plain link) and
  **`.mobile-nav-item.is-active`** (mobile equivalent) both use the
  hover treatment as the active treatment — identical colour token,
  weight, pill/underline. So an active link looks exactly like a
  hovered link.
- **`.mega-item.is-active`** (leaf inside the mega panel) shows the
  same primary-tint hover treatment.
- **Never invent new colours** — reuse `var(--color-primary)`,
  `--color-headline`, `--color-accent` design tokens.

---

## Responsive behaviour

### Desktop (`xl:` and up, ≥1280px)

- Centre column shows the horizontal nav with 6 parent labels
- 5 of them are mega triggers — hover/focus opens a full-bleed panel
  below the header
- Panel anchored to the top of the viewport (full width), inner
  container constrained to `.container-main` (1340px)
- Each mega panel shows: groups (1-4 sub-columns each) + optional
  right-hand contact card + a bottom utility row (Contact Us + Book
  an Appointment CTA)
- Hover open is pure CSS via `.group:hover .mega-panel` (also
  `:focus-within` for keyboard); JS only syncs `aria-expanded`

### Mobile (below `xl:`, <1280px)

- Centre column hidden via `hidden xl:flex`
- Desktop `Book Now` button hidden via `hidden xl:inline-flex`
- Hamburger button revealed at `xl:hidden`
- Tap hamburger → wrapper gets `menu-open` class + `mobile-nav`
  shows + `<html>` gets `is-nav-open` (body-scroll lock)
- Mobile nav lists 6 parent items as full-width rows
- Mega parents become accordions — tap to expand, showing the same
  groups + items + contact card as the desktop panel but stacked
- Mobile booking CTA at the bottom of the drawer (full-width button)
- Escape or outside-click closes the drawer

### Mobile menu open state

- `<html>.is-nav-open` → `body { overflow: hidden }` via global.css
- `mobile-nav.classList.remove('hidden')` + `aria-hidden="false"`
- Hamburger animates into × via the `mobile-toggle-bar` CSS keyframes
- Wrapper gets `menu-open` which prevents the scroll listener from
  toggling `is-scrolled` (so the header stays clean while the drawer
  is open)

---

## ARIA contract

| Element | Attributes |
|---|---|
| `.mega-trigger` (button) | `aria-haspopup="true"` `aria-expanded` (synced by JS) `aria-controls={panelId}` |
| `.mega-panel` (div) | `id={panelId}` |
| `#mobile-menu-toggle` (button) | `aria-label` (dynamic) `aria-expanded` `aria-controls="mobile-nav"` |
| `#mobile-nav` (div) | `aria-hidden` (dynamic) |
| `.mobile-accordion button` | `aria-expanded` `aria-controls={mobilePanelId}` |
| `.mobile-accordion-panel` | `id={mobilePanelId}` `hidden` attribute (not display:none) |
| Outer wrapper | `role="banner"` is inherited from `<header>` when used; this implementation uses `<div>` so screen readers fall back to landmark detection via the nav inside |

All mega item links are real `<a>` tags (no buttons-as-links) — right-click works, screen readers announce as links, external links carry `rel="noopener noreferrer"` where applicable (the booking CTA).

---

## Customisation knobs

These are the **only** things that should differ per project:

| Knob | Where | Notes |
|---|---|---|
| Logo | `/public/logo/*-white-logo.svg` + `*-black-logo.svg` | Two SVG variants. Aspect ratio inferred from `width="931" height="54"` — adjust per brand. |
| Booking CTA URL | `src/data/site.ts` (`bookingUrl`) | External URL. Used by header CTA + every mega panel's bottom CTA. |
| Brand colours | `--color-primary` + `--color-headline` + `--color-accent` | All header CSS reads from these tokens — no hardcoded colours. |
| Parent menu items | `parentMenu` array in Header frontmatter | Add / remove / reorder. Mix of `kind: 'mega'` and `kind: 'link'`. |
| Mega panel data | `aboutMega` / `servicesMega` / `conditionsMega` / `technologyMega` / `locationMega` constants | Clone the shape, swap labels + hrefs + icons + descriptions. |
| Active-state rules | The `*Active` booleans block | Add new sections (e.g. `blogActive = isSection('/blog')`) and reference in `parentMenu`. |
| Mega contact card | `sharedContact` constant | Reused across megas that opt in. Change phone + email + address per client. |
| Mega item icons | Inline from `@lucide/astro` or custom `.astro` files in `src/components/icons/` | Custom SVG icons are pure SVG wrappers — no library dependency. |
| `xl:` breakpoint | Tailwind config — default 1280px | Adjust to `lg:` (1024px) if your nav fits on fewer pixels. |
| Scroll-progress colour | `#scroll-progress { background: var(--color-primary) }` in global.css | Default primary. Bump opacity or switch token if it's too loud. |

**Do NOT change:**

- The `position: fixed; z-index: 50` on `#site-header-wrapper`
- The 64px row height (`h-16`)
- The `grid-cols-[auto_1fr_auto]` 3-column grid (transform-free
  ancestor chain required for full-bleed mega panels)
- The pure-CSS hover / focus-within open mechanism — JS only syncs
  ARIA
- The 4-tier active-state pattern (consistent across desktop + mobile)
- The `xl:hidden` / `xl:flex` split between desktop nav and mobile
  drawer — pick a different breakpoint by editing the data, never
  by adding parallel components
- The `is-nav-open` class on `<html>` as the body-scroll lock —
  class-driven, never inline style

---

## Asset pipeline

**Two logo SVGs** (`/public/logo/*-white-logo.svg` and `*-black-logo.svg`).
Both `loading="eager"` since the header paints on every page above
the fold.

**Lucide icons** via `@lucide/astro` for generic glyphs (Heart, Users,
MapPin, Phone, Mail, ChevronDown, ArrowRight, etc.) — tree-shaken
imports, no runtime icon-font cost.

**Custom service / condition icons** as `.astro` components in
`src/components/icons/*` — each one is a single SVG with inline
`<path>` data. Used where Lucide doesn't have a clinical-specific
equivalent (e.g. `AcupunctureIcon`, `SciaticaIcon`).

No image files, no icon-font HTTP request, no extra network round-trips.

---

## Port checklist

When adding this header to a new project:

- [ ] Copy `src/components/Header.astro` verbatim
- [ ] Copy `src/components/Icon.astro` (Lucide wrapper)
- [ ] Copy `src/components/icons/*.astro` (custom SVG icons) — or
      adapt to your domain
- [ ] Verify the relevant CSS rules exist in `src/styles/global.css`:
      `.site-nav-item`, `.mega-panel`, `.mega-grid`, `.mega-column`,
      `.mega-item`, `.mobile-mega-*`, `.mobile-accordion`,
      `#site-header-wrapper`, `#scroll-progress`,
      `#mobile-menu-toggle`, `.mobile-toggle-bar`, `.logo`
- [ ] Verify `--color-primary`, `--color-primary-hover`,
      `--color-headline`, `--color-accent`, `--color-border`,
      `--color-body` are all defined
- [ ] Drop two logo SVGs into `/public/logo/`
- [ ] Wire `src/data/site.ts` with the project's `bookingUrl`
- [ ] Re-author the per-section `*Active` booleans block at the top
      of the frontmatter (add / remove sections as the site IA
      requires)
- [ ] Re-author each `*Mega` data constant — keep the typed
      `MegaData` shape, swap labels + hrefs + icons + descriptions
- [ ] Re-author the `parentMenu` array — typically 5–6 entries
- [ ] Import + render `<Header />` near the top of `<body>` in
      `BaseLayout.astro` (after the skip-link, before `<main>`)
- [ ] Verify PageHero's `padding-top` clears 64px (7rem mobile,
      11rem desktop is the standard already)
- [ ] Test on desktop: hover each mega trigger → panel opens
      full-bleed, content laid out per the `cols` value, active
      state highlights the matching nav item on each route
- [ ] Test on mobile: tap hamburger → drawer opens with body lock,
      tap accordion → expands per mega, tap link → navigates and
      drawer closes via route change
- [ ] Test keyboard nav: Tab through parent items, Tab into mega
      → focus-within opens panel, Escape blurs focus → panel closes
- [ ] Test screen reader: NVDA / VoiceOver announces "About,
      collapsed, button, menu pop-up" on the trigger,
      "About menu, expanded" on focus inside
- [ ] Test `prefers-reduced-motion: reduce`: no transitions on the
      panel open / close, instant cuts
- [ ] Test scroll: `is-scrolled` class lands at scrollY > 60,
      `#scroll-progress` width tracks scroll percentage

---

## Reference implementation

Live on every page of the Physio Lounge site via
`src/layouts/BaseLayout.astro`. The canonical files are:

- `src/components/Header.astro` — 721 lines (markup + inline TS
  controller for scroll progress / mobile toggle / accordion / ARIA)
- `src/styles/global.css` — header / mega / mobile CSS rules

The header data (`aboutMega`, `servicesMega`, `conditionsMega`,
`technologyMega`, `locationMega`, `parentMenu`) lives inline in
Header.astro's frontmatter rather than a separate file — single
source of truth, no import indirection. If a future consumer (e.g.
a footer mega) needs the same data, extract to
`src/data/navigation.ts` at that point.

---

## Performance notes

- **Zero framework hydration** — Astro static render + scoped inline
  TS. No React / Vue / Svelte island.
- **CSS-only open mechanism** — `.group:hover .mega-panel` /
  `:focus-within` swap opacity + visibility + transform. No JS
  required to open or close. JS only writes `aria-expanded` for
  screen readers.
- **~3 KB inline TS** (gzipped ~1 KB) for the scroll progress + mobile
  toggle + accordion + ARIA sync — runs once per page on the main
  thread, all listeners passive where applicable.
- **`requestAnimationFrame`-throttled scroll handler** — the
  `is-scrolled` toggle + `--scroll-progress` update never run more
  than 60 fps regardless of scroll speed.
- **`will-change` deliberately omitted** — applying it to mega
  panels would create stacking contexts that break the full-bleed
  fixed positioning (see rule 2). Opacity + visibility + transform
  transitions on the panel are GPU-composited via the browser's
  default optimisations without needing the hint.
- **No layout shift** — header is `position: fixed`, opens the panel
  over the page rather than pushing content. Body padding-top is
  reserved by `<main>` via PageHero's leading padding.
- **No image assets beyond two SVG logos** — total header asset
  payload is ~3-4 KB depending on the logos.
- **Header is shared across every page** — Astro's per-component
  scoped CSS deduplication means the ~700 lines of header / mega
  CSS ship once across the site, not per-page.
