# Skill: Premium Card Carousel

This is a reusable build skill for creating premium Swiper-powered card carousels across any HMDG Astro + Tailwind project. Use this skill for **services**, **team members**, **locations**, **conditions**, or any collection that needs a horizontal card slider.

---

## When to use

Trigger this skill when the user asks for:
- a services carousel or slider
- a team carousel or team cards slider
- a conditions carousel
- a locations carousel
- any horizontal card slider with image cards
- "build a carousel like the services one"
- "use the standard card carousel"

---

## Architecture

The carousel is built from **3 files**:

| File | Purpose |
|---|---|
| `src/components/SliderCard.astro` | Reusable single card — image bg, overlay, title, plus button, fully clickable |
| `src/components/CardCarousel.astro` | Reusable section — Swiper track, arrows, autoplay, loop, heading + slot intro |
| `src/data/<context>Services.ts` | Typed data array — one per use case (e.g. `minorSurgeryServices.ts`, `teamMembers.ts`) |

**Naming convention:** when building for a specific context, name the data file to match (e.g. `teamMembers.ts`, `conditionsList.ts`). The components themselves (`SliderCard` and `CardCarousel`) are generic and reusable across all contexts.

If the project already has `ServiceCard.astro` and `ServicesCarousel.astro` from a previous build, **reuse those directly** instead of creating new files. They follow this same spec.

---

## SliderCard.astro — Full Spec

### Props

```typescript
interface Props {
  title: string;
  image: string;
  href: string;
}
```

### Card structure

```html
<a href={href} aria-label={title}
   class="group relative block w-[320px] h-[450px] overflow-hidden
          rounded-(--radius-card) isolate
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-white">

  <!-- Background image -->
  <img src={image} alt="" width="640" height="900"
       loading="lazy" decoding="async"
       class="absolute inset-0 h-full w-full object-cover" />

  <!-- Overlay — lightens on hover -->
  <div class="absolute inset-0 bg-[#1212124A]
              transition-colors duration-300 ease-out
              group-hover:bg-[#12121226]"></div>

  <!-- Title (top-left) -->
  <h3 class="absolute top-6 left-6 right-6 pr-14 m-0
             text-white text-lg md:text-xl font-normal
             leading-snug tracking-tight">
    {title}
  </h3>

  <!-- Plus button (bottom-right) -->
  <span aria-hidden="true"
        class="absolute bottom-6 right-6
               flex h-12 w-12 items-center justify-center
               rounded-full bg-white/15 text-white backdrop-blur-sm
               ring-1 ring-white/20
               transition-all duration-300 ease-out
               group-hover:bg-white group-hover:text-(--color-primary)
               group-hover:rotate-90 group-hover:ring-white">
    <Plus class="w-6 h-6" stroke-width={2} />
  </span>
</a>
```

### Key rules
- `group` on the `<a>` drives all hover states
- overlay: `#1212124A` rest (29% black) -> `#12121226` hover (15% black)
- plus button: glass default -> solid white + 90deg rotate on hover
- image: `.webp`, explicit `width`/`height`, `decoding="async"`, `loading="lazy"`
- no card scaling, no z-index tricks, no shadow changes on hover
- icon: `Plus` from `@lucide/astro`

---

## CardCarousel.astro — Full Spec

### Props

```typescript
interface Props {
  eyebrow?: string;
  heading: string;
  services: { title: string; image: string; href: string }[];
}
```

### Section wrapper

```html
<section class="relative overflow-hidden bg-(--color-primary) text-white
                py-section-y lg:py-section-y-lg">
```

### Text block (inside single `.container-main`)

```html
<div class="container-main">
  <div class="max-w-3xl mb-[60px]">

    <!-- Optional eyebrow -->
    {eyebrow && (
      <span class="eyebrow text-(--color-secondary) mb-4">{eyebrow}</span>
    )}

    <!-- Heading — last word auto-italicised via h2 > span Lora rule -->
    <h2 class="text-white">
      {leadWords} <span>{lastWord}</span>
    </h2>

    <!-- Intro paragraphs via slot -->
    <div class="mt-5 space-y-4 max-w-2xl
                [&>p]:text-white/85
                [&_strong]:text-white [&_strong]:font-semibold">
      <slot />
    </div>
  </div>

  <!-- Carousel track + arrows -->
  <div class="relative">
    <div class="services-swiper swiper !overflow-visible">
      <div class="swiper-wrapper">
        {services.map((s) => (
          <div class="swiper-slide !w-[320px]">
            <SliderCard title={s.title} image={s.image} href={s.href} />
          </div>
        ))}
      </div>
    </div>

    <!-- Prev arrow -->
    <button type="button" aria-label="Previous"
            class="services-prev absolute left-2 top-1/2 z-10 -translate-y-1/2
                   grid place-items-center h-[54px] w-[54px]
                   rounded-full border border-white/40
                   bg-transparent text-white cursor-pointer
                   transition-colors duration-300 ease-out
                   hover:bg-white hover:text-(--color-primary) hover:border-white
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-white">
      <ArrowLeft class="w-6 h-6" stroke-width={2} />
    </button>

    <!-- Next arrow -->
    <button type="button" aria-label="Next"
            class="services-next absolute right-2 top-1/2 z-10 -translate-y-1/2
                   grid place-items-center h-[54px] w-[54px]
                   rounded-full border border-white/40
                   bg-transparent text-white cursor-pointer
                   transition-colors duration-300 ease-out
                   hover:bg-white hover:text-(--color-primary) hover:border-white
                   focus-visible:outline-2 focus-visible:outline-offset-2
                   focus-visible:outline-white">
      <ArrowRight class="w-6 h-6" stroke-width={2} />
    </button>
  </div>
</div>
</section>
```

### Swiper script

```javascript
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const swiper = new Swiper('.services-swiper', {
  modules: [Autoplay, Navigation],
  slidesPerView: 'auto',
  spaceBetween: 15,
  loop: true,
  loopAdditionalSlides: 2,
  speed: reduceMotion ? 0 : 900,
  grabCursor: true,
  autoplay: reduceMotion ? false : {
    delay: 3500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  navigation: {
    prevEl: '.services-prev',
    nextEl: '.services-next',
  },
});

// Pause autoplay when off-screen
if (!reduceMotion && 'IntersectionObserver' in window) {
  const sectionEl = document.querySelector('.services-swiper');
  if (sectionEl) {
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) swiper.autoplay?.start();
      else swiper.autoplay?.stop();
    }, { threshold: 0.1 });
    io.observe(sectionEl);
  }
}
```

### CSS imports (in component frontmatter)

```javascript
import 'swiper/css';
import 'swiper/css/autoplay';
```

### Type declarations required in `src/env.d.ts`

```typescript
declare module 'swiper/css';
declare module 'swiper/css/*';
```

---

## Data file pattern

Create one typed data file per use case:

```typescript
export interface Service {
  title: string;
  image: string;
  href: string;
}

export const minorSurgeryServices: Service[] = [
  {
    title: 'Moles',
    image: '/images/placeholder.webp',
    href: '/minor-surgery/mole-removal-newcastle/',
  },
  // ... more items
];
```

Use `/images/placeholder.webp` as default image until real images are provided.

---

## Page usage

```astro
---
import CardCarousel from '../components/CardCarousel.astro';
import { minorSurgeryServices } from '../data/minorSurgeryServices';
---

<CardCarousel eyebrow="Services" heading="Minor Surgeries" services={minorSurgeryServices}>
  <p>
    Intro paragraph with <strong class="font-semibold text-white">bold terms</strong>
    and regular text.
  </p>
</CardCarousel>
```

---

## Multi-instance on same page

If two carousels render on the same page (e.g. Services + Team), each needs a **unique Swiper selector** to avoid collision. When building a second instance:

1. Change the Swiper class from `.services-swiper` to a unique name (e.g. `.team-swiper`)
2. Change arrow classes from `.services-prev`/`.services-next` to `.team-prev`/`.team-next`
3. Add a second `new Swiper('.team-swiper', { ... })` block
4. Or refactor to use a `data-swiper-id` attribute and init all carousels in a loop

---

## Adaptation guide

### For team cards
- Change `<h3>` title to show **name** at top-left
- Add a **role/position** line below the name in smaller muted text
- Keep the plus button or swap for an arrow icon
- Data interface becomes `{ name, role, image, href }`

### For condition cards
- Same card structure
- Data interface stays `{ title, image, href }`
- Eyebrow becomes "Conditions" or "What We Treat"

### For location cards
- Same card structure
- Optionally add a location pin icon instead of plus
- Data interface becomes `{ name, image, href }`

---

## Non-negotiable rules

- Astro + Tailwind + TypeScript only
- no inline style attributes
- Swiper loaded from npm via Vite — never CDN
- all images `.webp` with explicit `width`, `height`, `decoding="async"`, `loading="lazy"`
- respect `prefers-reduced-motion` — disable autoplay, speed 0
- pause autoplay off-screen via IntersectionObserver
- semantic HTML, accessible markup
- premium Webflow-level visual quality
- `overflow-hidden` on section, `!overflow-visible` on inner swiper
- 15px gap between cards
- cards fixed 320x450px
