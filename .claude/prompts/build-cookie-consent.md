---
name: Build the HMDG Cookie Consent Mode v2 System
description: Self-contained Claude Code prompt to build the full HMDG Cookie Consent Mode v2 system in any Astro + Tailwind v4 + Cloudflare Pages project. Mirrors the WordPress HMDG Cookie Consent plugin field-for-field. Env-driven tracking IDs (GTM / gtag / Ads), dynamic PUBLIC_SITE_NAME binding in banner copy, server-side conversion fallback via GA4 Measurement Protocol, and a Universal Booking Tracker that auto-fires book_now_click + booking_completed events across 9 booking platforms. Built 2026-05-04.
---

# Build Prompt: HMDG Cookie Consent Mode v2

Paste the block below into a fresh Claude Code session inside any Astro + Tailwind v4 + Cloudflare Pages project (or HMDG base template) to build the full cookie consent system end-to-end. The prompt is fully self-contained — Claude can execute without seeing any other file.

---

````
Build a complete HMDG Cookie Consent Mode v2 system for an Astro + Tailwind v4 + Cloudflare Pages base template. Goal: match the WordPress HMDG Cookie Consent plugin field-for-field, with all tracking IDs driven by environment variables, dynamic site-name binding in the banner copy, server-side conversion fallback via GA4 Measurement Protocol, and a Universal Booking Tracker that auto-fires book_now_click + booking_completed events across 9 booking platforms.

PIPELINE: information-architecture-reviewer → ux-architect → ui-designer → frontend-builder → a11y-reviewer → performance-reviewer → performance-optimisation → seo-reviewer → marketing-reviewer → security-reviewer → conversion-reviewer.

═══════════════════════════════════════════════════════════════════
PART 1 — ENV TEMPLATE (.env)
═══════════════════════════════════════════════════════════════════

Add the following block to .env (or merge if .env already exists). Use these labels in comments so future maintainers know which fields are required:

  [REQUIRED]    Must be set for the section to work
  [REQUIRED*]   Either this OR an alternative is required
  [OPTIONAL]    Only set if the feature is in use
  [DEFAULT OK]  Sensible default — only override if needed

Variables to add:

# CLIENT-SIDE TAGS (PUBLIC_ prefix — baked into HTML at build time)
[REQUIRED*] PUBLIC_GTM_ID=                  # Format: GTM-XXXXXXX (or use PUBLIC_GTAG_ID alone)
[REQUIRED*] PUBLIC_GTAG_ID=                 # Format: G-XXXXXXXXXX (only if NOT using GTM)
[OPTIONAL]  PUBLIC_ADS_CONVERSION_ID=       # Format: AW-XXXXXXXXX (Google Ads only)

# SERVER-SIDE TRACKING (GA4 Measurement Protocol)
[DEFAULT OK]                  PUBLIC_SERVER_SIDE_TRACKING=true   # 'false' disables on staging
[REQUIRED if SERVER_SIDE]     GA4_MEASUREMENT_ID=                # Format: G-XXXXXXXXXX
[REQUIRED if SERVER_SIDE]     GA4_API_SECRET=                    # Server-side only — NEVER PUBLIC_
[REQUIRED]                    SITE_ORIGIN=https://yourclinic.co.uk

# UNIVERSAL BOOKING TRACKER
[OPTIONAL] PUBLIC_BOOKING_DISABLE=                                    # CSV of platform keys to disable
[OPTIONAL] PUBLIC_BOOKING_ADDITIONAL_DOMAINS=                         # CSV of extra domains to track

# SITE NAME (drives dynamic banner copy)
[REQUIRED] PUBLIC_SITE_NAME=Your Clinic Name

Mode selection:
  • PUBLIC_GTM_ID set        → GTM container loads (preferred)
  • PUBLIC_GTAG_ID set alone → gtag.js loads directly (no GTM)
  • Both set                 → GTM wins; gtag.js direct mode skipped
                               (configure GA4 inside the GTM container)

═══════════════════════════════════════════════════════════════════
PART 2 — CONFIG FILE (src/config/cookie-consent.config.ts)
═══════════════════════════════════════════════════════════════════

Create src/config/cookie-consent.config.ts. Top of file: read environment variables and derive the platform catalog. The `bannerText` MUST use a template literal with PUBLIC_SITE_NAME so the banner adapts automatically when the template is cloned to any client project.

Required exports:

const ENV_GTM_ID            = import.meta.env.PUBLIC_GTM_ID            || '';
const ENV_GTAG_ID           = import.meta.env.PUBLIC_GTAG_ID           || '';
const ENV_ADS_CONVERSION_ID = import.meta.env.PUBLIC_ADS_CONVERSION_ID || '';
const ENV_SERVER_SIDE       = (import.meta.env.PUBLIC_SERVER_SIDE_TRACKING || 'true').toLowerCase() !== 'false';
const ENV_SITE_NAME         = import.meta.env.PUBLIC_SITE_NAME || 'this clinic';

// Universal Booking Tracker — 9 platforms (matches WP plugin checkbox panel)
const PLATFORM_CATALOG = {
  cliniko:    { domain: 'cliniko.com',          label: 'Cliniko' },
  calendly:   { domain: 'calendly.com',         label: 'Calendly' },
  acuity:     { domain: 'acuityscheduling.com', label: 'Acuity Scheduling' },
  pracsuite:  { domain: 'pracsuite.com',        label: 'PracSuite' },
  phorest:    { domain: 'phorest.com',          label: 'Phorest' },
  youcanbook: { domain: 'youcanbook.me',        label: 'YouCanBook.me' },
  jane:       { domain: 'jane.app',             label: 'Jane App' },
  timely:     { domain: 'timely.com',           label: 'Timely' },
  simplybook: { domain: 'simplybook.me',        label: 'SimplyBook.me' },
} as const;

const _csv = (v) => (v || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const _disabledKeys = _csv(import.meta.env.PUBLIC_BOOKING_DISABLE);
const _extraDomains = _csv(import.meta.env.PUBLIC_BOOKING_ADDITIONAL_DOMAINS);

const bookingPlatforms = Object.fromEntries(
  Object.entries(PLATFORM_CATALOG).map(([key, def]) => [
    key,
    { ...def, enabled: !_disabledKeys.includes(key) },
  ])
);

const bookingDomains = [
  ...Object.values(bookingPlatforms).filter(p => p.enabled).map(p => p.domain),
  ..._extraDomains,
];

export const cookieConsentConfig = {
  // Tracking IDs from env
  gtmId:              ENV_GTM_ID,
  gtagId:             ENV_GTAG_ID,
  adsConversionId:    ENV_ADS_CONVERSION_ID,
  serverSideTracking: ENV_SERVER_SIDE,

  // Cookie meta
  policyVersion:    '1.0',          // Bump to force re-consent on policy change
  cookieName:       'hmdg_cookie_consent',
  cookieExpiryDays: 180,
  debug:            false,           // MUST be false in production

  // Banner copy — DYNAMIC site name
  bannerTitle: 'We use cookies',
  bannerText:  `At ${ENV_SITE_NAME}, we use cookies to improve your experience, personalise content, and understand how visitors use our site. You can choose which cookies you accept.`,
  acceptAllLabel:       'Accept All',
  rejectAllLabel:       'Reject All',
  customiseLabel:       'Customise',
  savePreferencesLabel: 'Save Preferences',

  // Legal links
  privacyPolicyUrl: '/privacy-policy',
  termsUrl:         '/terms-conditions',
  cookiePolicyUrl:  '/cookie-policy',

  // Cookie categories shown in the preferences modal
  categories: {
    necessary:   { enabled: true, label: 'Necessary',   description: 'Required for the website to work correctly. These cannot be disabled.' },
    functional:  { enabled: true, label: 'Functional',  description: 'Remember your preferences and personalisation settings across visits.' },
    analytics:   { enabled: true, label: 'Analytics',   description: 'Help us understand how visitors use the site so we can improve it (Google Analytics).' },
    performance: { enabled: true, label: 'Performance', description: 'Monitor site speed and stability to ensure a fast experience.' },
    marketing:   { enabled: true, label: 'Marketing',   description: 'Used for personalised advertising and remarketing (Google Ads).' },
  },

  // Universal Booking Tracker
  bookingPlatforms: bookingPlatforms,
  bookingDomains:   bookingDomains,

  // postMessage matchers per platform (each is a JS expression evaluated against `e`)
  bookingCompletionMatchers: {
    calendly:   `e.data && e.data.event === 'calendly.event_scheduled'`,
    acuity:     `e.data === 'booked'`,
    youcanbook: `typeof e.data === 'string' && e.data.includes('ycbm:booking:complete')`,
    jane:       `e.data && e.data.type === 'jane:appointment:booked'`,
    simplybook: `e.data && e.data.action === 'booking_complete'`,
    phorest:    `e.data && e.data.type === 'phorest:booking:confirmed'`,
    timely:     `e.data && e.data.event === 'timely:booking:confirmed'`,
  },

  // Cliniko: URL-redirect detection (no postMessage)
  clinikoThankYouUrlPatterns: [
    '/appointments/confirmation',
    '/booking/confirmed',
    '/thank-you',
  ],

  redirectParam: 'booking_confirmed',

} as const;

export type CookieConsentConfig = typeof cookieConsentConfig;

═══════════════════════════════════════════════════════════════════
PART 3 — BaseLayout.astro INTEGRATION
═══════════════════════════════════════════════════════════════════

In src/layouts/BaseLayout.astro, in the <head> block (BEFORE any third-party script), add this exact pattern:

A) Consent Mode v2 defaults — MUST run before GTM/gtag.
   Use is:inline + define:vars to inject cfg.policyVersion + cfg.cookieName so the bootstrap can restore prior consent.

  <script is:inline define:vars={{ _ccmPolicyVersion: cfg.policyVersion, _ccmCookieName: cfg.cookieName }}>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}

    // 1. Default ALL consent to denied before any tag fires
    gtag('consent', 'default', {
      analytics_storage:       'denied',
      ad_storage:              'denied',
      ad_user_data:            'denied',
      ad_personalization:      'denied',
      functionality_storage:   'denied',
      personalization_storage: 'denied',
      security_storage:        'granted',
      wait_for_update:         500,
    });

    // 2. Restore consent if visitor consented on this policy version
    (function () {
      try {
        var raw = document.cookie.split(';').find(function (c) {
          return c.trim().startsWith(_ccmCookieName + '=');
        });
        if (raw) {
          var stored = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')));
          if (stored && stored.policyVersion === _ccmPolicyVersion) {
            gtag('consent', 'update', {
              analytics_storage:       stored.analytics   ? 'granted' : 'denied',
              ad_storage:              stored.marketing   ? 'granted' : 'denied',
              ad_user_data:            stored.marketing   ? 'granted' : 'denied',
              ad_personalization:      stored.marketing   ? 'granted' : 'denied',
              functionality_storage:   stored.functional  ? 'granted' : 'denied',
              personalization_storage: stored.functional  ? 'granted' : 'denied',
            });
          }
        }
      } catch (e) {}
    })();
  </script>

B) Google Tag Manager (preferred) — gated by cfg.gtmId

  {cfg.gtmId && (
    <script is:inline define:vars={{ _gtmId: cfg.gtmId }}>
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',_gtmId);
    </script>
  )}

C) gtag.js direct mode — only when GTM is NOT in use

  {!cfg.gtmId && cfg.gtagId && (
    <>
      <script is:inline async src={`https://www.googletagmanager.com/gtag/js?id=${cfg.gtagId}`}></script>
      <script is:inline define:vars={{ _gtagId: cfg.gtagId, _adsId: cfg.adsConversionId }}>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', _gtagId);
        if (_adsId) {
          gtag('config', _adsId);
        }
      </script>
    </>
  )}

D) Google Ads Conversion ID exposed to GTM container — for GTM mode

  {cfg.gtmId && cfg.adsConversionId && (
    <script is:inline define:vars={{ _adsId: cfg.adsConversionId }}>
      window.HMDG_ADS_CONVERSION_ID = _adsId;
    </script>
  )}

E) GTM noscript fallback — at the START of <body>

  {cfg.gtmId && (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${cfg.gtmId}`}
        height="0"
        width="0"
        style="display:none;visibility:hidden"
      />
    </noscript>
  )}

F) Render the cookie banner component
  Import and render <CookieConsent /> in BaseLayout — typically just before </body>.

CSP note: ensure the existing CSP allows these origins:
  https://www.googletagmanager.com
  https://www.google-analytics.com
  https://*.google-analytics.com
  https://region1.google-analytics.com

═══════════════════════════════════════════════════════════════════
PART 4 — SERVER-SIDE API ROUTES (GA4 Measurement Protocol)
═══════════════════════════════════════════════════════════════════

Create two Cloudflare Pages Functions that forward booking events to GA4 server-side. This bypasses ad blockers + bypasses consent banners (still gated client-side by the consent banner, but the API uses server-controlled credentials that aren't exposed to the browser).

src/pages/api/book-now.ts        — fires event name "book_now_click"
src/pages/api/booking-complete.ts — fires event name "booking_completed"

Both routes must:
  1. export const prerender = false;
  2. Master toggle: if PUBLIC_SERVER_SIDE_TRACKING === 'false', short-circuit with 200 + info message
  3. Validate origin against SITE_ORIGIN (reject with 403 if mismatch)
  4. Validate Content-Type is application/json (reject with 400 if not)
  5. Cap payload size at 8KB (reject with 413 if larger)
  6. Parse JSON safely (reject with 400 if invalid)
  7. Require client_id field (reject with 400 if missing)
  8. Require GA4_API_SECRET + GA4_MEASUREMENT_ID env vars (warn + return 200 if absent)
  9. Forward to https://www.google-analytics.com/mp/collect?measurement_id=…&api_secret=…
 10. Build event params: page_location, page_title, page_referrer, booking_platform, booking_url, engagement_time_msec, plus optional session_id, gclid, event_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content
 11. Always return 200 to client (client never retries failed events)
 12. Log errors with prefix "[HMDG CCM]"

The PAYLOAD shape both routes accept:

interface BookingEventPayload {
  client_id:    string;        // Required
  session_id?:  string;
  booking_url?: string;
  page_url?:    string;
  page_title?:  string;
  page_referrer?: string;
  gclid?:       string;
  platform?:    string;
  event_id?:    string;
  utm_source?:  string;
  utm_medium?:  string;
  utm_campaign?: string;
  utm_term?:    string;
  utm_content?: string;
}

The only difference between the two routes is the GA4 event name: book_now_click vs booking_completed.

═══════════════════════════════════════════════════════════════════
PART 5 — CookieConsent.astro COMPONENT
═══════════════════════════════════════════════════════════════════

Create src/components/CookieConsent.astro. Render the banner + preferences modal using the cookieConsentConfig object. The component must:

A) Read from cfg via:
   import { cookieConsentConfig } from '../config/cookie-consent.config';
   const cfg = cookieConsentConfig;

B) Pass these to a runtime CCM object via define:vars (or window assignment):
   - cookieName, policyVersion, debug
   - bookingDomains, bookingCompletionMatchers
   - clinikoThankYouUrlPatterns, redirectParam

C) Show the cookie banner if:
   - No cookie set, OR
   - Cookie's policyVersion doesn't match cfg.policyVersion

D) Banner has 3 buttons:
   - Accept All  → all categories granted
   - Reject All  → only necessary granted
   - Customise   → opens preferences modal with toggles per category

E) Save consent to cfg.cookieName cookie. Cookie value is JSON:
   {
     policyVersion: '1.0',
     consentedAt:   '2026-05-04T...',
     necessary:     true,
     functional:    boolean,
     analytics:     boolean,
     performance:   boolean,
     marketing:     boolean
   }

F) On consent change, fire gtag('consent', 'update', {...}) mapping:
   - analytics → analytics_storage
   - marketing → ad_storage, ad_user_data, ad_personalization
   - functional → functionality_storage, personalization_storage

G) Universal Booking Tracker (runs once on page load):
   - Click handler on document for any <a> link whose href hostname matches a domain in cfg.bookingDomains. Fire fireMPEvent('/api/book-now', 'book_now_click', platform, bookingUrl).
   - postMessage handler on window. For each event, evaluate cfg.bookingCompletionMatchers per platform. On match, fire fireMPEvent('/api/booking-complete', 'booking_completed', platform, bookingUrl).
   - URL redirect detection: on page load, check if location.pathname matches any cfg.clinikoThankYouUrlPatterns. If yes AND referrer matches a booking domain, fire booking_completed.

H) fireMPEvent function:
   - Builds payload (client_id, session_id, page_url, page_title, page_referrer, gclid, platform, booking_url, event_id, all UTM params from URL)
   - POST as JSON to the given endpoint with keepalive: true
   - Use navigator.sendBeacon as fallback for booking_completed (link clicks may unmount the page)

I) Expose window.HMDG_CCM with API methods:
   - resetConsent()  — clear cookie + reload
   - openModal()     — open preferences modal manually (for "manage cookies" footer link)
   - getConsent()    — read current consent state
   - debug()         — log internal state if cfg.debug === true

J) Accessibility:
   - Banner: role="dialog", aria-modal="true" (only when modal open), aria-labelledby + aria-describedby
   - Focus trap when modal open
   - ESC key dismisses modal
   - Buttons keyboard-focusable, 44×44px minimum touch
   - Strong colour contrast (≥4.5:1 body)

K) Performance:
   - All scripts inline (no external dependency)
   - <2KB JS for the banner logic
   - No layout shift (banner appears as overlay, not push-down)

═══════════════════════════════════════════════════════════════════
PART 6 — CSP HEADERS
═══════════════════════════════════════════════════════════════════

In BaseLayout.astro <head> (or public/_headers for HTTP-level), include CSP that whitelists tracking origins:

<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.googleapis.com;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com;
  connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
" />

═══════════════════════════════════════════════════════════════════
PART 7 — VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════

After build, verify these pass:

[ ] HTML view-source contains gtag('consent', 'default', {...}) with all 7 storage types denied + wait_for_update: 500
[ ] HTML view-source contains the gtag('consent', 'update', {...}) cookie-restore block
[ ] Banner copy reads "At {PUBLIC_SITE_NAME}, we use cookies..." (NOT the literal placeholder)
[ ] Setting PUBLIC_GTM_ID renders the GTM bootstrap script
[ ] Setting PUBLIC_GTAG_ID alone renders the gtag.js direct loader
[ ] Setting PUBLIC_ADS_CONVERSION_ID renders the AW-… config or the window.HMDG_ADS_CONVERSION_ID global (depending on mode)
[ ] curl -X POST -H "Content-Type: application/json" -d '{"client_id":"test"}' /api/book-now returns 200
[ ] curl -X POST -H "Content-Type: application/json" -d '{"client_id":"test"}' /api/booking-complete returns 200
[ ] PUBLIC_SERVER_SIDE_TRACKING=false short-circuits both API routes
[ ] Banner renders on first visit and "Accept All" sets the hmdg_cookie_consent cookie
[ ] After accepting, gtag('consent', 'update', {...}) is called with granted values
[ ] Click a Cliniko/Calendly/etc. external link → POST /api/book-now is sent
[ ] Cookie expires after 180 days
[ ] Bumping policyVersion forces all visitors to re-consent
[ ] debug: false in production
[ ] No console errors

═══════════════════════════════════════════════════════════════════
PART 8 — REPLACING THE WP PLUGIN — FEATURE PARITY MAP
═══════════════════════════════════════════════════════════════════

| WordPress Plugin Field | Astro Equivalent |
|---|---|
| GTM ID input | PUBLIC_GTM_ID env var |
| Google tag ID input | PUBLIC_GTAG_ID env var |
| Ads Conversion ID input | PUBLIC_ADS_CONVERSION_ID env var |
| Enable Server-Side Tracking toggle | PUBLIC_SERVER_SIDE_TRACKING env var |
| GA4 Measurement ID (server-side) | GA4_MEASUREMENT_ID env var |
| MP API Secret | GA4_API_SECRET env var |
| Universal Booking Tracker checkboxes (9 platforms) | bookingPlatforms object + PUBLIC_BOOKING_DISABLE env |
| Additional Domains text field | PUBLIC_BOOKING_ADDITIONAL_DOMAINS env var |
| Banner heading + body | bannerTitle + bannerText (dynamic site name) |
| Cookie categories (5) | categories object with enabled flag per category |

DO NOT change the existing UI design of the cookie banner. The UI remains the same — only the configuration source becomes env-driven.

DELIVERABLES:
1. .env (or .env.example) updated with all the new env vars + [REQUIRED]/[OPTIONAL]/[DEFAULT OK] labels
2. src/config/cookie-consent.config.ts — the env-driven config
3. src/layouts/BaseLayout.astro — Consent Mode v2 defaults + GTM + gtag direct + Ads Conversion blocks
4. src/pages/api/book-now.ts — server-side relay
5. src/pages/api/booking-complete.ts — server-side relay
6. src/components/CookieConsent.astro — banner UI + booking tracker (UI unchanged from existing)
7. CSP header updated to allow Google tracking origins

The banner copy MUST use a template literal that interpolates ENV_SITE_NAME (read from import.meta.env.PUBLIC_SITE_NAME) so the clinic name appears dynamically on every clone of the base template.

Build it.
````
