# Skill: Floating Contact Widget (Reusable)

Premium fixed-position floating contact widget — a circular brand FAB
in the bottom-right corner that opens a 280px panel with four contact
actions: WhatsApp, Call, Email, Book Now. Zero framework hydration,
~700 bytes of inlined vanilla JS, all SVG icons inlined (no extra
network requests), no layout shift, full a11y wiring.

Production reference: rendered globally on every page via
`src/layouts/BaseLayout.astro`. Component lives at
`src/components/FloatingContact.astro`.

---

## When to use

- Any clinic / professional-services site that wants a persistent
  low-friction contact escape hatch
- Pages where the booking funnel benefits from a sticky CTA without
  taking hero/section real estate
- Sites with multiple contact channels (WhatsApp + phone + email +
  booking) that need ranked presentation in priority order

**NOT for:**

- Sites where a separate sticky CTA bar is already aggressive — two
  persistent CTAs compete and dilute each other
- Sites without a WhatsApp / Booking flow / phone number — collapses
  to just an email icon, not worth the JS for one action
- Native mobile apps — use platform-native action sheets instead

---

## The rules (non-negotiable)

1. **Item order is fixed:** WhatsApp → Call → Email → Book Now.
   This is response-time-ordered (WhatsApp fastest, booking
   commitment-highest) and matches the conversion funnel. Never
   reorder per project.
2. **Book Now is the primary item.** Brand-filled background, white
   text, sits below a hairline divider that separates it from the
   three contact channels. It's the only action that requires
   commitment, so visual hierarchy emphasises it.
3. **Single source of truth for all 4 destinations.** Imported from
   shared data files — never hardcoded:
   - `bookingUrl` from `src/data/site.ts`
   - `whatsappPhone` from `src/data/site.ts`
   - `phone` + `email` + `phoneDisplay` from `src/data/footer.ts`
     (the `footerContact` export)
4. **Panel rendered BEFORE the FAB in DOM order.** So that on open,
   keyboard `Tab` flows Panel → FAB → next page content (matches
   the visual reading order on screen). The FAB has `aria-controls`
   pointing to the panel id.
5. **Real `<a>` elements, not buttons.** Each item is a semantic
   anchor so right-click works, screen readers announce links not
   buttons, and external destinations open in a new tab via
   `target="_blank" rel="noopener noreferrer"` (WhatsApp + Booking
   are external; Call uses `tel:`; Email uses `mailto:`).
6. **Full ARIA wiring:**
   - Container: `data-floating-contact` + `data-open` state attr
   - Panel: `role="dialog"` `aria-modal="false"` `aria-labelledby`
     `aria-hidden`
   - Trigger button: `aria-expanded` `aria-haspopup="menu"`
     `aria-controls={panelId}` + dynamic `aria-label` ("Open contact
     options" / "Close contact options")
   - List: `role="menu"`, items: `role="menuitem"`, dividers:
     `role="none"`
7. **40×40 FAB to match the cookie consent reopen button.** Both
   persistent floating controls (FloatingContact bottom-right,
   CookieConsent reopen bottom-left) share the same 40px circular
   scale + 18×18 icon size for visual symmetry across the screen
   bottom.
8. **CSS-only pulse ring.** Closed state has an outward pulse
   (2.4s cubic-bezier infinite) that catches the eye without JS.
   Disabled when the panel is open AND under
   `prefers-reduced-motion`. The pulse uses `transform: scale()` +
   `opacity` so it's GPU-composited (zero paint cost).
9. **`prefers-reduced-motion` honoured everywhere:** no scale, no
   translate, no rotate, no pulse. Falls back to opacity-only
   transitions at 120ms.
10. **Closes on outside click + Escape.** Escape restores focus to
    the FAB (a11y requirement for `role="dialog"` close behaviour).
    Outside-click handler uses event delegation on `document` with
    a `root.contains(e.target)` check, not a backdrop element.
11. **Auto-close after item click.** `tel:` and `mailto:` links on
    iOS sometimes leave the panel hovering after the OS handler
    intercepts the navigation. The `items.forEach(item =>
    item.addEventListener('click', () => setOpen(false)))` ensures
    the panel always dismisses on tap.
12. **`env(safe-area-inset-*)` for iOS notch + home-indicator.**
    Bottom-right offset uses `max(1.25rem, env(safe-area-inset-right))`
    so the widget never sits under the iPhone landscape notch or
    the home-indicator strip.
13. **`pointer-events: none` on the container, `auto` on children.**
    The container is a `position: fixed` overlay; pointer-events
    on the container itself would block clicks through to the page.
    Only the FAB + panel itself need to be interactive.
14. **`z-index: 90`.** Sits below the site header (z-50) but above
    every other UI element. Cookie consent + modal dialogs should
    use higher z-indexes (100+) to overlay this if both are open.

---

## File layout

```
src/
├── components/
│   └── FloatingContact.astro       ← the widget itself
├── layouts/
│   └── BaseLayout.astro             ← imports + renders <FloatingContact />
└── data/
    ├── site.ts                      ← bookingUrl + whatsappPhone
    └── footer.ts                    ← footerContact { phoneTel, phoneDisplay, email }
```

To render on every page: import in `BaseLayout` and drop one
`<FloatingContact />` instance near the closing `</body>` (after
`<main>`, before any modal/dialog roots).

```astro
// In BaseLayout.astro
import FloatingContact from "../components/FloatingContact.astro";

// later in markup, after <main>:
<FloatingContact />
```

---

## Props interface

```ts
interface Props {
  /** Override the booking link. Defaults to `bookingUrl` from src/data/site.ts. */
  bookingHref?:    string;
  /** Override the WhatsApp number (international digits, no `+`). */
  whatsappNumber?: string;
  /** Override the phone number for the tel: link (digits only). */
  phoneTel?:       string;
  /** Override the email for the mailto: link. */
  email?:          string;
}
```

Default usage (uses site-wide data — what you want 99% of the time):

```astro
<FloatingContact />
```

Per-page override (rare — e.g. a campaign landing page with a
different booking URL):

```astro
<FloatingContact bookingHref="https://campaign-booking.example.com" />
```

---

## Required data file structure

### `src/data/site.ts`

```ts
export const bookingUrl    = 'https://eubook.nookal.com/bookings/book/...';
export const whatsappPhone = '447XXXXXXXXX';  // international, no `+`
```

### `src/data/footer.ts`

```ts
export const footerContact = {
  phoneTel:     '08003689775',         // digits only — tel: link target
  phoneDisplay: '0800 368 9775',       // human-readable — shown in label
  email:        'hello@physiolounge.co.uk',
};
```

If migrating from another project: rename / restructure these data
exports to match the imports in `FloatingContact.astro`, or update
the imports at the top of the component (lines 29–30).

---

## Visual anatomy

### Closed state (FAB only)

- 40×40 circular brand-primary background
- Inner chat-bubble icon (18×18, stroke 2.2)
- Outward pulse ring at 0.45 opacity → fades + scales to 1.55× at 2.4s loop
- Layered shadow: `0 2px 12px rgba(0,0,0,0.20), 0 6px 18px -4px rgba(123,84,74,0.35)`
- On hover: `translateY(-2px) scale(1.04)` + brighter shadow + `--color-primary-hover` background
- On focus-visible: 2px primary outline at 4px offset

### Open state (FAB + panel above)

- FAB icon swaps to a close (X) icon via opacity + rotation crossfade
- Panel: 320px max-width, 18px border-radius, white background, soft layered shadow, anchored bottom-right of the FAB
- Panel entrance: `opacity 0→1` + `translateY(8px)→0` + `scale(0.96)→1` over 220ms cubic-bezier
- Panel header: brand-primary background, eyebrow + title + caption ("How can we help?" / "We usually reply within an hour.")
- 4-item menu list, each item is 56px min-height with 36×36 icon-circle + label + meta + chevron

### Per-item styling

- WhatsApp: icon background `rgba(37, 211, 102, 0.12)`, icon color `#16a249` (WhatsApp brand green)
- Call / Email: icon background `rgba(123, 84, 74, 0.08)`, icon color `--color-primary`
- Book Now: full brand-primary background, white text + chevron, slight `translateY(-1px)` on hover

---

## Customisation knobs

These are the **only** things that should differ per project:

| Knob | Where | Notes |
|---|---|---|
| Brand primary colour | `var(--color-primary)` + `--color-primary-hover` | Inherits from the project's design tokens. No per-component override needed. |
| Menu item count | Component markup | Currently 4 items hardcoded. To add/remove: edit the `<ul>` in the component directly. |
| Item labels + meta | Component markup | Labels ("WhatsApp" / "Call Us" / "Email Us" / "Book Now") and meta lines ("Chat with our team" / phone number / "We reply within 24 hrs" / "Reserve your appointment") are hardcoded. |
| Header copy | Component markup | "Get in Touch" eyebrow + "How can we help?" title + "We usually reply within an hour." caption. Edit inline. |
| FAB size | `.floating-contact__fab { width / height }` | 40×40 default. Matches the cookie reopen button — change in tandem if you change one. |
| Icon SVGs | Inline in component markup | All 5 icons (chat, close, WhatsApp, phone, mail, calendar, chevron ×4) are inline SVG. Replace by editing the `<svg>` markup directly — never swap to an icon font. |
| z-index | `.floating-contact { z-index: 90 }` | Bump for projects where the cookie consent + nav menu use lower z-indexes. |

**Do NOT change:**

- The 4-item order (WhatsApp → Call → Email → Book Now)
- The Book Now item being the primary (brand-filled) variant
- The ARIA attributes — the screen reader contract depends on them
- The `data-floating-contact-*` data attributes — the JS controller uses them as selectors
- The `bookingUrl` / `whatsappPhone` / `footerContact` imports as the data source

---

## Asset pipeline

**None.** Every icon is inline SVG. No asset files, no extra network
requests, no icon-font dependency.

If you want to swap an icon for a different glyph:

1. Find the matching `<svg>` in the component (each item has its
   own SVG block — see lines 90, 113, 137, 164 for the four contact
   icons; lines 197, 200 for the FAB chat/close icons; the chevron
   appears 4× at lines 98, 121, 145, 175)
2. Replace the `<path>` / `<polyline>` / `<line>` contents
3. Keep the `width`/`height` attributes consistent (18×18 for FAB
   chat/close, 17×17 for call/email/book, 18×18 for WhatsApp,
   14×14 for chevrons)

---

## Customising for a non-clinic site

The pattern works for any service business that wants a persistent
contact widget. To adapt:

- Replace `'Book Now'` label + `bookingHref` with the relevant
  primary CTA (e.g. "Get a Quote", "Book a Demo", "Reserve a Table")
- Replace `'WhatsApp'` with the most-used messaging channel
  (Telegram, Signal, Messenger — keep the same brand-coloured icon
  treatment for the messaging item)
- Replace `footerContact.phoneDisplay` with whatever the site uses
  for its public phone number
- If no WhatsApp / no phone: remove the `<li>` entirely and bump
  the booking item's `margin-top` to compensate for the missing
  divider gap

---

## Port checklist

When adding this widget to a new project:

- [ ] Copy `src/components/FloatingContact.astro` verbatim
- [ ] Ensure `src/data/site.ts` exports `bookingUrl` + `whatsappPhone`
- [ ] Ensure `src/data/footer.ts` exports `footerContact` with
      `phoneTel` + `phoneDisplay` + `email`
- [ ] Import + render `<FloatingContact />` in `BaseLayout.astro`
      (or wherever the global chrome lives)
- [ ] Verify `--color-primary` + `--color-primary-hover` are defined
      in the project's CSS tokens
- [ ] Verify `--color-muted` is defined (header text colour against
      the brand-primary panel header)
- [ ] Verify `--menu-label-color` is defined (defaults to `#3b3f42`
      via CSS var fallback if missing)
- [ ] Verify the cookie consent reopen button is also 40×40 if you
      use the cookie-consent component — visual symmetry across
      the screen bottom
- [ ] Test on iOS Safari: panel doesn't sit under the home-indicator,
      tel: + mailto: links auto-close the panel
- [ ] Test keyboard nav: Tab into FAB → Enter opens → focus lands
      on first item → Tab through items → Escape closes + restores
      focus to FAB
- [ ] Test screen reader: NVDA / VoiceOver announces "Open contact
      options, collapsed, button" on the FAB and "How can we help?,
      dialog" when the panel opens
- [ ] Test `prefers-reduced-motion: reduce`: no pulse, no scale, no
      transform — only opacity transitions

---

## Reference implementation

Live on every page of the Physio Lounge site via
`src/layouts/BaseLayout.astro`. The canonical file is
`src/components/FloatingContact.astro` (523 lines, ~13 KB raw, ~3 KB
gzipped). When in doubt, copy from there directly — it includes the
full markup, all CSS, the JS controller, and the inline SVG icons.

---

## Performance notes

- **Zero framework hydration** — pure HTML/CSS/JS, no React/Vue/Svelte
  client island
- **~700 bytes of inlined vanilla JS** (the IIFE controller)
- **All icons inline SVG** — no icon-font HTTP request, no FOIT
- **CSS-only pulse ring** — GPU-composited transform + opacity, no
  paint cost
- **No layout shift** — `position: fixed` widget with reserved size
- **No third-party scripts** — WhatsApp link is a plain `<a href>`
  to the click-to-chat URL, no WhatsApp Business SDK required
- **No image assets** — nothing to preload, nothing to lazy-load
- **Bundle size impact:** the entire component compiles to ~3 KB
  gzipped HTML + ~600 bytes scoped CSS per page. Negligible LCP /
  TBT impact in Lighthouse mobile.
