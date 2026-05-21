# Skill: Hero Video — Self-Hosted MP4 H.264

> **MANDATORY across every HMDG clinic site.** Self-hosted MP4 H.264 only.
> NEVER YouTube embed. NEVER Vimeo embed. NEVER WebM-only.
> No exceptions without explicit sign-off from Fel.
>
> The encode spec, file layout, and HTML pattern in this skill are
> non-negotiable. Cross-referenced as a non-negotiable in `CLAUDE.md`.

Canonical pattern for hero / background videos across HMDG clinic sites.

Production-tested on Northern Medical (April 2026). Replaced a YouTube
iframe hero that was costing ~1500 ms of TBT and ~1 MB of third-party JS
with a 720 KB self-hosted MP4 — PageSpeed mobile went from yellow to
green on the same page.

---

## When to use

- Adding a hero / background video to any page
- Migrating a YouTube iframe hero to self-hosted
- Anywhere the design calls for ambient motion behind text
- Anywhere a PageSpeed audit flags YouTube as the biggest TBT contributor

---

## The rules (non-negotiable)

1. **MP4 H.264 only. Self-hosted.** No YouTube embed. No WebM-only.
2. **WebM is NOT a Safari fallback.** Safari supports MP4 natively (since 2007). WebM only works in Safari 17+ on macOS Sonoma. MP4 is the universal format. WebM is a Chrome/Firefox optimisation, not a Safari requirement.
3. **`pix_fmt yuv420p` is NON-NEGOTIABLE.** Safari refuses to play yuv422 / yuv444 even on the latest releases. If the source video uses a different pixel format, the encode MUST convert it.
4. **Strip audio.** A muted-loop hero video with audio data still incurs decode cost AND can trip autoplay-blocking heuristics in some browsers.
5. **Cap at 10 seconds + 1280×720.** Beyond this is wasted bandwidth — viewers spend a few seconds on the hero before scrolling.
6. **Mobile and reduced-motion users get the poster only — zero video bytes.** Source must be JS-injected so non-eligible viewports don't fetch metadata.

---

## Encode spec (libx264 via ffmpeg)

```
-crf 28              quality target — lower is bigger (28 = good visual / small file)
-preset slow         better compression at one-shot encode time
-pix_fmt yuv420p     NON-NEGOTIABLE for Safari
-movflags +faststart moov atom at start — required for streaming playback
-an                  strip audio
-t 10                trim to 10 seconds
-vf scale='min(1280,iw)':-2   cap width at 1280, keep aspect ratio
```

The `:-2` height calculation forces the output height to the nearest even number — H.264 requires even dimensions and ffmpeg errors out without it.

---

## File layout

```
assets/videos/herovideo.mp4    # SOURCE — outside public/, never ships to production
public/videos/hero-loop.mp4    # ENCODED OUTPUT — committed and deployed
public/images/herofallback.webp  # POSTER — always required
```

Add `assets/` to `.gitignore` if the source file is large (>20 MB). The encoded output should be small enough (~700 KB-1.5 MB) to commit.

---

## Build the video

```bash
npm run optimise-video
```

Defaults:
- in:  `assets/videos/herovideo.mp4`
- out: `public/videos/hero-loop.mp4`
- duration: 10s
- max width: 1280

Override:
```bash
npm run optimise-video -- --in path/to/source.mp4 --out path/to/output.mp4 --duration 8 --width 1920 --crf 26
```

The script bundles `@ffmpeg-installer/ffmpeg` so no system `ffmpeg` install is needed — works on a fresh dev machine, on a Cloudflare build runner, in CI.

---

## HTML pattern — JS-injected source

The `Hero.astro` component already implements this. To use it, just pass `image` (poster) and `video` (encoded MP4):

```astro
<Hero
  image="/images/herofallback.webp"
  video="/videos/hero-loop.mp4"
  imageAlt=""
  eyebrow="WELCOME"
  headline="Premium clinic care"
  body="Trusted by patients across the UK."
  ctaText="Book Now"
  ctaHref="/contact/"
/>
```

The component renders:

```html
<video
  class="hero-video absolute inset-0 ... opacity-0"
  autoplay muted loop playsinline preload="none"
  poster="/images/herofallback.webp"
  data-video-src="/videos/hero-loop.mp4"
  data-video-type="video/mp4"
  aria-hidden="true"
></video>
```

And a sibling script:

```js
const heroVideo = document.querySelector('video.hero-video');
if (heroVideo instanceof HTMLVideoElement) {
  const isDesktop     = window.matchMedia('(min-width: 768px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isDesktop && !reducedMotion) {
    const source = document.createElement('source');
    source.src  = heroVideo.dataset.videoSrc ?? '';
    source.type = heroVideo.dataset.videoType ?? 'video/mp4';
    heroVideo.appendChild(source);
    heroVideo.load();
    heroVideo.addEventListener('canplay', () => {
      heroVideo.classList.remove('opacity-0');
      heroVideo.classList.add('opacity-100');
    }, { once: true });
  } else {
    heroVideo.removeAttribute('autoplay');
  }
}
```

---

## Why JS-injected source instead of `<source media="...">`

Safari has a long-standing bug where `<source media>` inside `<video>` falls through to "no playable source" even on matching viewports — you get a centred play overlay over the poster image instead of playback. The bug is intermittent, version-dependent, and notoriously hard to repro reliably. The fix is to never use `<source media>` for hero video. JS-attached sources have no `media` attribute for Safari to misparse.

Bonus: mobile gets zero video bytes. Even with `preload="none"`, some browsers prefetch metadata when they see a `<source>`. Injecting the source by JS only on eligible viewports means the mobile request flow is image-only — exactly what you want for LCP on mobile.

---

## CSP

Add to `BaseLayout.astro` `<meta http-equiv="Content-Security-Policy">` AND `public/_headers`:

```
media-src 'self';
```

The base template already has this — verify it's present after any CSP edit.

---

## What this REPLACES (when migrating from YouTube)

If a previous Hero used a YouTube iframe, removing it lets you also drop:

- `https://www.youtube.com` from `script-src`
- `https://s.ytimg.com` from `script-src`
- `https://www.youtube-nocookie.com` from `frame-src`
- `https://i.ytimg.com` from `img-src` (only if no YouTube thumbnail is used elsewhere)
- `<link rel="preconnect" href="https://www.youtube-nocookie.com">` (if present)
- `<link rel="preconnect" href="https://i.ytimg.com">` (if present)

CSP gets shorter and tighter, third-party JS drops by ~1 MB.

**Keep YouTube origins in CSP only if** there's a separate click-to-play YouTube popup elsewhere on the site (different use case — sound-on intentional viewing, where YouTube is the right tool).

---

## Common mistakes

1. **Using WebM "for Safari"** — WebM is for Chrome/Firefox. Safari needs MP4. If you only ship one format, ship MP4.
2. **`<source media>`** — works in Chrome and Firefox, fails intermittently in Safari. Use JS-attached `<source>` instead.
3. **Forgetting `pix_fmt yuv420p`** — Safari refuses to play. The video appears as a static frame or a "no playable source" overlay.
4. **Forgetting `-movflags +faststart`** — moov atom ends up at the end of the file, browser has to download the whole video before playback can start. Visible as a long delay before play even on a small file.
5. **`preload="metadata"` or `preload="auto"`** — costs metadata bytes on mobile even when JS hasn't attached a source. Use `preload="none"`.
6. **Forgetting `playsinline`** — iOS Safari opens the video in its native player full-screen instead of inline.
7. **Including audio** — even muted, decoding still costs, and some browsers refuse autoplay if any audio track is present even with `muted`. `-an` (strip audio) prevents the whole class of bug.
8. **Source in `public/`** — ships unnecessarily. Keep source masters in `assets/videos/` (gitignored if large), only encoded output in `public/videos/`.
9. **No poster** — first paint is a black box. Always set `poster={image}` on the `<video>`.

---

## QA checklist

- [ ] `npm run optimise-video` produces `public/videos/hero-loop.mp4` ≤ 1.5 MB
- [ ] `ffprobe` output shows `pix_fmt: yuv420p`, `Stream #0:0 Video:` only (no audio stream)
- [ ] Open the page in Safari (macOS + iOS) — desktop plays, mobile shows poster only
- [ ] Open in Chrome desktop — plays. DevTools Network shows the MP4 fetched after `canplay`.
- [ ] Open in Chrome mobile (or DevTools mobile emulation) — Network shows the MP4 NOT fetched.
- [ ] Toggle "Reduce motion" in OS settings — desktop now shows poster only.
- [ ] DevTools → Lighthouse → mobile audit → confirm LCP < 2.5s, TBT < 200ms.
- [ ] CSP not blocking — DevTools Console shows no `media-src` violation.
