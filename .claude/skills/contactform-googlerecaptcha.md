# Skill: Contact Form — Web3Forms + Google reCAPTCHA v3 + Cloudflare Pages

Complete reusable build skill for the HMDG contact form pattern: a Web3Forms-powered
Astro component with invisible Google reCAPTCHA v3 spam protection, botcheck honeypot,
dynamic email subject, and redirect-to-`/thank-you` UX. Works out of the box on
Cloudflare Pages.

---

## When to use

Trigger this skill when the user asks for:

- a contact form, enquiry form, or booking form
- "add a contact form to the homepage" / "add a form to the landing page"
- "build the contact form like the base template"
- "wire up Web3Forms" / "set up the contact form for this client"
- migration from Netlify Forms / Formspree / Elementor forms → Web3Forms
- reCAPTCHA v3 integration on a form
- spam protection for an existing form

---

## Architecture

| File | Purpose |
|---|---|
| `src/components/ContactForm.astro` | Reusable form component — fetch-based submit, loading/success/error states |
| `src/layouts/BaseLayout.astro` | CSP meta tag (must allow web3forms + google.com + gstatic.com) |
| `public/_headers` | HTTP-header CSP mirror (Cloudflare Pages) |
| `.env` / `.env.example` | Three env vars drive the whole integration |
| `src/pages/thank-you.astro` | Redirect target after successful submission |

### External services

- **Web3Forms** (Pro account — required for reCAPTCHA) — https://web3forms.com
- **Google reCAPTCHA v3** — https://www.google.com/recaptcha/admin
- **Cloudflare Pages** — hosts the site, stores production env vars

### Spam protection — layered

1. **Invisible reCAPTCHA v3** (score-based, Google) — primary
2. **Web3Forms server-side spam filter** — free tier
3. **Honeypot checkbox** (`botcheck`) — catches dumb bots

---

## Prerequisites

Before building, the following accounts and keys must be ready:

| Item | Where | Notes |
|---|---|---|
| Web3Forms Pro account | https://web3forms.com | ~$8/month — required for reCAPTCHA + `to` field override |
| Web3Forms access key | Web3Forms dashboard | Public, safe in frontend |
| Client email | The clinic/client's enquiry inbox | Goes in `PUBLIC_CLIENT_EMAIL` env var |
| Google reCAPTCHA v3 site | https://www.google.com/recaptcha/admin | Register a v3 site |
| reCAPTCHA Site Key | Google admin → Settings | Public, goes in frontend |
| reCAPTCHA Secret Key | Google admin → Settings | Private, goes to Web3Forms dashboard |
| Cloudflare Pages project | Already connected to GitHub | Where production env vars live |

---

## Step-by-step setup

### Step 1 — Create the Web3Forms form (gets access key)

1. Sign up / log in at https://web3forms.com
2. Upgrade to **Pro** (required for reCAPTCHA verification)
3. Click **Create New Form** (or Create Your First Form)
4. **Form Name:** the client's name (e.g. `Smith Physio Clinic`)
5. **Domain name:** enter `localhost` for now — update after deployment
6. Click **Create Form**
7. Copy the **Form Access Key** (UUID format like `21e37f44-cc4e-48ff-ae54-399d1477f176`)

### Step 2 — Register Google reCAPTCHA v3 site

1. Go to https://www.google.com/recaptcha/admin
2. Click **+** to register a new site
3. **Label:** the client's name (e.g. `Smith Clinic`)
4. **reCAPTCHA type:** **reCAPTCHA v3**
5. **Domains:** add all domains the form will run on:
   - `localhost` (for local dev)
   - `<project>.pages.dev` (Cloudflare preview)
   - `yourclinic.co.uk` (production custom domain)
6. Accept terms → **Submit**
7. Copy both keys:
   - **Site Key** — goes in `.env` as `PUBLIC_RECAPTCHA_SITE_KEY`
   - **Secret Key** — goes in Web3Forms dashboard (next step)

### Step 3 — Connect reCAPTCHA to Web3Forms

1. Web3Forms dashboard → your form → **Spam Protection** settings
2. Select **reCAPTCHA** as the provider
3. Paste the **Secret Key** from Google reCAPTCHA
4. Save

### Step 4 — Set environment variables

**Locally** — add to `.env` at the project root (never commit):

```env
# Site name — auto-populates email subject, from_name, and anywhere
# the site/clinic name appears. Change this once per client.
PUBLIC_SITE_NAME=Your Clinic Name

# Web3Forms access key — public, safe to expose
PUBLIC_WEB3FORMS_KEY=your-web3forms-access-key

# Recipient email for contact form submissions (Web3Forms Pro "to" field).
# Comma-separated for multiple recipients.
PUBLIC_CLIENT_EMAIL=hello@yourclinic.co.uk

# Google reCAPTCHA v3 — Site Key (public, safe to expose)
PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

**On Cloudflare Pages** (production):

1. Cloudflare dashboard → **Workers & Pages → your project → Settings → Variables and Secrets**
2. Add four variables for **Production** (and **Preview** if used):
   - `PUBLIC_SITE_NAME` — e.g. `Smith Clinic`
   - `PUBLIC_WEB3FORMS_KEY` — same as local
   - `PUBLIC_CLIENT_EMAIL` — recipient inbox (comma-separated list for multiple)
   - `PUBLIC_RECAPTCHA_SITE_KEY` — same as local
3. Type: Plaintext (they're all public, safe to expose)
4. Save
5. **Trigger a redeploy** — `PUBLIC_` vars are baked at build time, so Cloudflare needs to rebuild

Also update `.env.example` to document the four vars for future cloners.

### Step 5 — Update Content Security Policy

The CSP must allow connections to `api.web3forms.com` and script loading from Google's reCAPTCHA domains. Update **BOTH** places (meta tag + HTTP header):

**`src/layouts/BaseLayout.astro`** — the `<meta http-equiv="Content-Security-Policy">` tag needs these additions:

```
script-src  ... https://www.google.com https://www.gstatic.com;
connect-src ... https://api.web3forms.com https://www.google.com;
frame-src   ... https://www.google.com;
```

**`public/_headers`** — the `Content-Security-Policy` header must match (one-line format):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://maps.googleapis.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://images.unsplash.com https://maps.gstatic.com https://maps.googleapis.com https://*.googleapis.com; frame-src 'self' https://www.google.com https://*.cliniko.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://api.web3forms.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;
```

### Step 6 — Create the ContactForm component

Create `src/components/ContactForm.astro` with the full code block below (the entire component is self-contained):

```astro
---
/**
 * ContactForm.astro
 * ─────────────────────────────────────────────────────────
 * Reusable Web3Forms-powered contact form.
 *
 * Drop this component on any page where you need a contact form:
 *   <ContactForm />
 *
 * All branding (email subject, from_name) auto-populates from
 * PUBLIC_SITE_NAME — no need to pass props. To override per-page:
 *   <ContactForm subjectPrefix="Smith Clinic Booking" />
 *
 * Requirements:
 *   - PUBLIC_SITE_NAME           — Your site/clinic name
 *   - PUBLIC_WEB3FORMS_KEY       — Web3Forms access key
 *   - PUBLIC_RECAPTCHA_SITE_KEY  — Google reCAPTCHA v3 Site Key
 *     All three set in .env (local) + Cloudflare Pages env vars (production).
 *   - Web3Forms dashboard must have the reCAPTCHA Secret Key configured.
 *   - CSP must allow api.web3forms.com + google.com + gstatic.com.
 *
 * How it works:
 *   1. User fills the form and clicks Submit.
 *   2. JS executes reCAPTCHA v3 invisibly → returns a token.
 *   3. JS POSTs JSON to https://api.web3forms.com/submit including the
 *      token as `recaptcha_response` (Web3Forms-specific field name).
 *   4. Web3Forms verifies the token with Google server-side, then emails
 *      the submission to the inbox linked to the access key.
 *   5. On success → redirect to `/thank-you` (configurable).
 *   6. On failure → inline error message + console.error with details.
 *
 * Spam protection (layered):
 *   - reCAPTCHA v3 — invisible, score-based (Google)
 *   - botcheck honeypot checkbox (hidden — bots tick it, users don't)
 *   - Web3Forms' server-side spam filtering
 */

interface Props {
  /** Override the email subject prefix. Defaults to PUBLIC_SITE_NAME env var. */
  subjectPrefix?: string;
  /** Override the from_name in the email. Defaults to PUBLIC_SITE_NAME env var. */
  brandName?: string;
  /** Show phone field? Default: true */
  showPhone?: boolean;
  /** Submit button label. Default: "Send Enquiry" */
  submitLabel?: string;
  /** Optional unique id suffix so multiple forms can live on one page */
  id?: string;
  /** URL to redirect to after successful submission. Empty string = show inline success. Default: "/thank-you" */
  redirect?: string;
}

// Auto-detect site name from env var. Uses || so empty strings also fall back.
const siteName = import.meta.env.PUBLIC_SITE_NAME || 'Website Name';

const {
  subjectPrefix = siteName,
  brandName     = siteName,
  showPhone     = true,
  submitLabel   = 'Send Enquiry',
  id            = 'default',
  redirect      = '/thank-you',
} = Astro.props;

const web3formsKey     = import.meta.env.PUBLIC_WEB3FORMS_KEY      ?? '';
const recaptchaSiteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY ?? '';

const formId    = `contact-form-${id}`;
const nameId    = `contact-name-${id}`;
const emailId   = `contact-email-${id}`;
const phoneId   = `contact-phone-${id}`;
const messageId = `contact-message-${id}`;
const successId = `form-success-${id}`;
const errorId   = `form-error-${id}`;
---

<form
  id={formId}
  data-subject-prefix={subjectPrefix}
  data-brand-name={brandName}
  data-recaptcha-key={recaptchaSiteKey}
  data-redirect={redirect}
  novalidate
  class="bg-[--color-surface] border border-[--color-border] rounded-[--radius-card] p-6 flex flex-col gap-5"
>
  <input type="hidden" name="access_key" value={web3formsKey} />
  <input type="hidden" name="subject" class="js-subject" value={`${subjectPrefix} - New Entry Received`} />
  <input type="hidden" name="from_name" class="js-from" value={brandName} />

  {/* reCAPTCHA v3 token — field name MUST be "recaptcha_response" per Web3Forms docs */}
  <input type="hidden" name="recaptcha_response" class="js-recaptcha-token" value="" />

  {/* Honeypot */}
  <input type="checkbox" name="botcheck" class="hidden" aria-hidden="true" tabindex="-1" />

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
    <div class="flex flex-col gap-2">
      <label for={nameId} class="text-sm font-semibold text-[--color-headline]">
        Full Name <span class="text-[--color-primary]" aria-hidden="true">*</span>
      </label>
      <input id={nameId} type="text" name="name" class="input" placeholder="Jane Smith" autocomplete="name" required />
    </div>
    <div class="flex flex-col gap-2">
      <label for={emailId} class="text-sm font-semibold text-[--color-headline]">
        Email Address <span class="text-[--color-primary]" aria-hidden="true">*</span>
      </label>
      <input id={emailId} type="email" name="email" class="input" placeholder="jane@example.com" autocomplete="email" required />
    </div>
  </div>

  {showPhone && (
    <div class="flex flex-col gap-2">
      <label for={phoneId} class="text-sm font-semibold text-[--color-headline]">Phone Number</label>
      <input id={phoneId} type="tel" name="phone" class="input" placeholder="+44 7700 000000" autocomplete="tel" />
    </div>
  )}

  <div class="flex flex-col gap-2">
    <label for={messageId} class="text-sm font-semibold text-[--color-headline]">
      Your Message <span class="text-[--color-primary]" aria-hidden="true">*</span>
    </label>
    <textarea id={messageId} name="message" class="input" rows="4" placeholder="Tell us how we can help..." required></textarea>
  </div>

  <div id={successId} class="hidden rounded-[--radius-input] bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800" role="status" aria-live="polite">
    Thank you — your message has been sent. We will be in touch shortly.
  </div>
  <div id={errorId} class="hidden rounded-[--radius-input] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800" role="alert" aria-live="assertive">
    Something went wrong. Please try again or email us directly.
  </div>

  <div>
    <button type="submit" class="btn btn-default js-submit">
      <span class="js-label">{submitLabel}</span>
      <span class="js-spinner hidden" aria-hidden="true">Sending…</span>
    </button>
  </div>

  {recaptchaSiteKey && (
    <p class="recaptcha-terms">
      This site is protected by reCAPTCHA and the Google
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a>
      and
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer"> Terms of Service</a>
      apply.
    </p>
  )}
</form>

{recaptchaSiteKey && (
  <script is:inline src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} async defer></script>
)}

<script>
  declare global {
    interface Window {
      grecaptcha?: {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, opts: { action: string }) => Promise<string>;
      };
    }
  }

  document.querySelectorAll<HTMLFormElement>('form[data-subject-prefix]').forEach((form) => {
    const submit    = form.querySelector<HTMLButtonElement>('.js-submit')!;
    const label     = form.querySelector<HTMLSpanElement>('.js-label')!;
    const spinner   = form.querySelector<HTMLSpanElement>('.js-spinner')!;
    const subjectEl = form.querySelector<HTMLInputElement>('.js-subject')!;
    const fromEl    = form.querySelector<HTMLInputElement>('.js-from')!;
    const tokenEl   = form.querySelector<HTMLInputElement>('.js-recaptcha-token')!;
    const success   = form.parentElement?.querySelector<HTMLDivElement>(`#${form.id.replace('contact-form-', 'form-success-')}`) ?? null;
    const error     = form.parentElement?.querySelector<HTMLDivElement>(`#${form.id.replace('contact-form-', 'form-error-')}`) ?? null;

    const subjectPrefix = form.dataset.subjectPrefix ?? 'Website Name';
    const recaptchaKey  = form.dataset.recaptchaKey  ?? '';
    const redirectUrl   = form.dataset.redirect      ?? '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      success?.classList.add('hidden');
      error?.classList.add('hidden');

      const nameVal = (form.querySelector<HTMLInputElement>('[name="name"]')?.value ?? '').trim();
      if (nameVal) {
        subjectEl.value = `${subjectPrefix} - New Entry Received From ${nameVal}`;
        fromEl.value    = nameVal;
      }

      submit.disabled = true;
      label.classList.add('hidden');
      spinner.classList.remove('hidden');

      try {
        if (recaptchaKey && window.grecaptcha) {
          await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
          const token = await window.grecaptcha.execute(recaptchaKey, { action: 'submit' });
          tokenEl.value = token;
        }

        const data = Object.fromEntries(new FormData(form));
        const res  = await fetch('https://api.web3forms.com/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body:    JSON.stringify(data),
        });
        const json = await res.json();

        if (json.success) {
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
          success?.classList.remove('hidden');
          form.reset();
        } else {
          error?.classList.remove('hidden');
          console.error('[ContactForm] Web3Forms rejected submission:', json);
        }
      } catch (err) {
        error?.classList.remove('hidden');
        console.error('[ContactForm] submit error:', err);
      } finally {
        submit.disabled = false;
        label.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    });
  });
</script>

<style>
  .hidden { display: none; }

  .recaptcha-terms {
    font-size:   0.75rem;
    line-height: 1.5;
    color:       var(--color-caption);
    margin:      0;
  }
  .recaptcha-terms a {
    color:           var(--color-caption);
    text-decoration: underline;
  }
  .recaptcha-terms a:hover {
    color: var(--color-primary);
  }
</style>
```

### Step 7 — Use on pages

**Contact page (zero config):**

```astro
---
import BaseLayout  from '../layouts/BaseLayout.astro';
import ContactForm from '../components/ContactForm.astro';
---

<BaseLayout title="Contact Us — ClinicName" description="Get in touch...">
  <section class="bg-white">
    <div class="container-main">
      <div class="container-inner max-w-2xl mx-auto">
        <ContactForm id="contact-page" />
      </div>
    </div>
  </section>
</BaseLayout>
```

**Override for a specific form (e.g. booking flow):**

```astro
<ContactForm
  subjectPrefix="Smith Clinic - Booking Request"
  submitLabel="Book a Consultation"
  id="booking"
/>
```

**Inline success instead of redirect** (for modals, embedded forms):

```astro
<ContactForm redirect="" id="modal-form" />
```

**Multiple forms on one page** — use distinct `id` props:

```astro
<ContactForm id="hero" />
<!-- ... -->
<ContactForm id="footer-cta" />
```

---

## Email subject format

- **Default (no name entered):** `{PUBLIC_SITE_NAME} - New Entry Received`
- **With name:** `{PUBLIC_SITE_NAME} - New Entry Received From {Name}`

Example: `Smith Clinic - New Entry Received From Jane Smith`

`from_name` field in the email = sender's name (or the site name as fallback).

---

## Required dependencies

None — the component is pure Astro + native fetch. No npm packages to install.

The only external runtime is the Google reCAPTCHA script loaded conditionally
via `<script src="https://www.google.com/recaptcha/api.js?render=...">`.

---

## Testing

### Local (dev server)

```bash
npm run dev -- --host 127.0.0.1
```

1. Open `http://127.0.0.1:4321/contact`
2. reCAPTCHA badge should appear bottom-right
3. "Protected by reCAPTCHA" notice visible at bottom of form
4. Fill in name/email/message → Submit
5. Button should show "Sending…" briefly
6. On success → redirect to `/thank-you`
7. Email lands in inbox linked to Web3Forms access key

> **Note:** reCAPTCHA v3 can flag `localhost` as low-score. If the form
> rejects valid submissions in dev, test on the Cloudflare Pages URL instead.

### Production

1. Deploy to Cloudflare Pages (ensure all three env vars are set BEFORE build)
2. Open `https://<project>.pages.dev/contact`
3. Submit a test enquiry
4. Verify email arrives at the configured inbox
5. Check subject line format matches: `{SITE_NAME} - New Entry Received From {Name}`
6. Update the Web3Forms form's **Domain name** from `localhost` → the production domain

---

## Troubleshooting

### `400 Bad Request` — "reCaptcha verification is mandatory"

- **Cause:** `recaptcha_response` field is empty (token not generated or not sent)
- **Check:** Open DevTools → Network → click `submit` request → Response tab
- **Fix:** Verify `PUBLIC_RECAPTCHA_SITE_KEY` is set in Cloudflare and the build ran AFTER it was added
- **Verify:** `curl -s https://yoursite.pages.dev/contact/ | grep recaptcha` should show the script tag and site key

### `400 Bad Request` — any other hCaptcha/reCAPTCHA error

- **Cause:** Wrong field name
- **Web3Forms expects:** `recaptcha_response` (NOT Google's standard `g-recaptcha-response`)
- **Check:** the hidden input in the component — should read `name="recaptcha_response"`

### Email subject still shows "Website Name"

- **Cause:** `PUBLIC_SITE_NAME` env var missing during the Cloudflare build
- **Fix:** Add it in Cloudflare → **Settings → Variables and Secrets** → Retry deployment
- **Verify:** `curl -s https://yoursite.pages.dev/contact/ | grep data-subject-prefix` — should show the correct name

### Form shows "Something went wrong"

- Open DevTools → Console → look for `[ContactForm] Web3Forms rejected submission:` — the object shows exactly why Web3Forms rejected it
- Also check Network tab → `submit` request → Response tab for the JSON error message

### hCaptcha / reCAPTCHA script not loading

- **Cause:** CSP blocking the script
- **Fix:** Verify both `BaseLayout.astro` meta CSP AND `public/_headers` allow `https://www.google.com` and `https://www.gstatic.com` in `script-src`
- **Check:** DevTools Console shows "Refused to load the script ... because it violates the following Content Security Policy directive"

### reCAPTCHA works locally but fails in production

- **Cause:** Production domain not in the reCAPTCHA admin's allowed domains list
- **Fix:** https://www.google.com/recaptcha/admin → your site → Settings → add the production domain

### User hasn't upgraded to Web3Forms Pro

- reCAPTCHA verification is a Pro-only Web3Forms feature (~$8/month)
- **Alternative path:** disable captcha in Web3Forms dashboard and rely on the honeypot + Web3Forms' built-in spam filter (works fine for clinic traffic)
- **Or:** switch to hCaptcha (free on Web3Forms) — change the script URL and use `data-sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"` (Web3Forms public sitekey)

---

## Gotchas / Things that caused bugs in the original build

1. **Wrong field name.** Web3Forms uses `recaptcha_response`, NOT the standard Google `g-recaptcha-response`. This caused 400 errors even with valid tokens.

2. **hCaptcha `data-captcha="true"` shorthand** didn't work without loading Web3Forms' helper script. Use `data-sitekey="..."` directly if switching back to hCaptcha.

3. **`PUBLIC_` env vars are build-time, not runtime.** Adding an env var to Cloudflare AFTER a build doesn't take effect — you must retry the deployment.

4. **Astro 6 removed `output: 'hybrid'`.** Just use the default (static) — it behaves the same way. Don't add `output: 'hybrid'` or builds will fail.

5. **reCAPTCHA is Web3Forms Pro-only.** If the user isn't on Pro, reCAPTCHA validation silently fails no matter how correctly the client-side code is wired.

6. **localhost can trigger reCAPTCHA low-score.** If valid submissions fail in dev but work in prod, it's not a code bug — test on the Cloudflare URL instead.

7. **External links in the reCAPTCHA terms notice must have `rel="noopener noreferrer"`** per OWASP rules.

8. **Hidden `recaptcha_response` input must default to empty string**, not undefined, or the field is missing entirely from the form submission.

9. **Multiple forms per page** need distinct `id` props to avoid DOM ID collisions.

10. **Empty string env vars** — use `||` not `??` for `PUBLIC_SITE_NAME` fallback so empty strings also fall through to the default.

---

## Post-build checklist

- [ ] Three env vars set locally (`.env`) and on Cloudflare Pages
- [ ] Web3Forms access key points to the correct inbox
- [ ] Web3Forms dashboard has reCAPTCHA Secret Key set
- [ ] Google reCAPTCHA admin lists all production + preview domains
- [ ] `.env.example` updated so future cloners know what's needed
- [ ] CSP updated in BOTH `BaseLayout.astro` meta AND `public/_headers`
- [ ] `/thank-you` page exists and is `noindex`
- [ ] Test submission received at the configured inbox
- [ ] Email subject format matches: `{SITE_NAME} - New Entry Received From {Name}`
- [ ] Google Privacy Policy + Terms notice visible below the form
- [ ] reCAPTCHA badge visible bottom-right of the page
- [ ] Honeypot `botcheck` checkbox has `class="hidden"` and `tabindex="-1"`
- [ ] Web3Forms form's **Domain name** updated from `localhost` to production domain after launch

---

## Related files that may need updating

- `src/layouts/BaseLayout.astro` — CSP meta tag
- `public/_headers` — CSP HTTP header
- `.env.example` — document the three env vars
- `deployment.md` — reference Web3Forms + reCAPTCHA setup for future clones
- `README.md` — tech stack table should list Web3Forms + reCAPTCHA as dependencies
