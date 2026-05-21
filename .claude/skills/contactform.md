# Skill: Contact Form — Web3Forms + reCAPTCHA v3 + Cloudflare Pages

The canonical, production-tested pattern for HMDG clinic contact pages.

This skill captures everything we learned shipping the contact page on the
Astro base template (April 2026) — every field name, every separator,
every gotcha that broke the form in production at least once.

This document supersedes `contactform-googlerecaptcha.md`. When the two
disagree, **this one wins** — it has been proven on production traffic.

---

## When to use

- Building a `/contact/` page
- Adding a contact / enquiry / booking form anywhere on the site
- Migrating from Netlify Forms / Formspree / Elementor forms → Web3Forms
- Wiring up reCAPTCHA v3 spam protection
- Cloning the base template to a new client and swapping the form recipient

---

## Architecture at a glance

```
Visitor → JS in /contact → reCAPTCHA v3 → POST JSON → Web3Forms API
                                                         ├──→ primary inbox  (dashboard "Recipient Emails")
                                                         └──→ ccemail list   (semicolon-separated)
                                                              ↓
                                       redirect → /thank-you (noindex, nofollow)
```

| File | Purpose |
|---|---|
| `src/pages/contact.astro` | The contact page itself — inline form using the canonical Web3Forms pattern. |
| `src/components/ContactForm.astro` | Reusable simple-CTA form. Drop-in for homepages and inline CTAs. Same canonical pattern. |
| `src/components/PageHero.astro` | Secondary-page hero (smaller than homepage Hero). Used on /contact, /about, etc. |
| `src/layouts/BaseLayout.astro` | CSP `<meta>` tag — must allow `web3forms.com` + `google.com` + `gstatic.com`. Canonical / OG / Twitter tags. |
| `public/_headers` | CSP HTTP header (mirrors BaseLayout meta). Cloudflare Pages enforces this. |
| `.env.example` | Documents the four `PUBLIC_*` env vars. |
| `src/pages/thank-you.astro` | Redirect target after successful submission. `noindex={true}`. |

### External services

| Service | URL | Purpose | Plan |
|---|---|---|---|
| Web3Forms | https://web3forms.com | Receives form POSTs, emails the inbox | **Pro required** for `ccemail` + reCAPTCHA enforcement |
| Google reCAPTCHA v3 | https://www.google.com/recaptcha/admin | Score-based bot detection | Free |
| Cloudflare Pages | dashboard.cloudflare.com | Static hosting + env vars | Free |

### Spam protection — three layers

1. **Invisible reCAPTCHA v3** (score-based, Google) — primary defence.
2. **Web3Forms server-side spam filter** — included with every plan.
3. **`botcheck` honeypot** — a hidden checkbox bots autofill but humans never see.

---

## The Web3Forms field contract — read this twice

These field names and separators are non-obvious. **Every single bullet on this list represents a production bug we fixed.**

| Field | Required? | Format | Notes |
|---|---|---|---|
| `access_key` | YES | UUID | Bound to the Web3Forms dashboard form. The dashboard's "Recipient Emails" defines the **primary inbox**. |
| `ccemail` | optional | semicolon-separated | **NOT `cc`. NOT `bcc`. NOT comma-separated.** Web3Forms Pro only. |
| `subject` | optional | string | Rewritten by JS at submit time to include the visitor's name. |
| `from_name` | optional | string | The "From" name that appears in the recipient inbox. Rewritten by JS at submit time. |
| `replyto` | optional | string | Visitor's email. Set so "Reply" in the inbox pre-fills correctly. **Strip CRLF (`/[\r\n]/g`)** before assigning to defend against header injection. |
| `recaptcha_response` | required if reCAPTCHA enabled | reCAPTCHA v3 token | **NOT `g-recaptcha-response`** (Google's standard name). Web3Forms uses `recaptcha_response`. |
| `botcheck` | YES | hidden checkbox | Honeypot. `aria-hidden="true"`, `tabindex="-1"`, `autocomplete="off"`, visually positioned off-screen. |
| `name`, `email`, `phone`, `message`, etc. | as needed | any | Free-form fields. Web3Forms passes them all through to the email body. |

**There is no `to` field.** Setting `name="to"` on a hidden input does nothing useful — the primary recipient is configured server-side in the Web3Forms dashboard.

**There is no `bcc` field.** Use `ccemail` for additional recipients. CC is fine for clinic + agency dual-delivery because the email body usually shows both to the visitor as well — recipient privacy is not a concern.

---

## Step-by-step setup (per-client checklist)

### 1. Create the Web3Forms form

1. Sign up / log in at https://web3forms.com.
2. **Upgrade to Pro** (~$8/month). Required for `ccemail` and reCAPTCHA enforcement.
3. **Create New Form**.
4. **Form Name:** the client's name (e.g. `Smith Clinic`).
5. **Recipient Emails:** the client's primary enquiry inbox. **This is the primary "to" address.**
6. **Domain:** add `localhost` for now — update to the production domain after launch.
7. Copy the **Access Key** (UUID like `21e37f44-cc4e-48ff-ae54-399d1477f176`).

### 2. Register Google reCAPTCHA v3

1. Go to https://www.google.com/recaptcha/admin.
2. Click **+** to register a new site.
3. **Label:** the client's name.
4. **reCAPTCHA type:** **reCAPTCHA v3**.
5. **Domains:** add **all** domains the form will run on:
   - `localhost` — for local dev
   - `<project>.pages.dev` — Cloudflare preview
   - `yourclinic.co.uk` — production custom domain
6. Accept terms → Submit.
7. Copy:
   - **Site Key** → goes in `.env` as `PUBLIC_RECAPTCHA_SITE_KEY` (and Cloudflare).
   - **Secret Key** → goes in the Web3Forms dashboard (next step). **NEVER in code.**

### 3. Connect reCAPTCHA to Web3Forms

1. Web3Forms dashboard → your form → **Spam Protection**.
2. Provider: **reCAPTCHA**.
3. Paste the **Secret Key** from Google.
4. Save.

### 4. Set environment variables

#### Local — `.env` at project root (never commit)

```env
PUBLIC_SITE_NAME=Smith Clinic
PUBLIC_WEB3FORMS_KEY=21e37f44-cc4e-48ff-ae54-399d1477f176
PUBLIC_CLIENT_EMAIL=hello@smithclinic.co.uk; agency@hmdg.co.uk
PUBLIC_RECAPTCHA_SITE_KEY=6Lc...your-v3-site-key
```

> The `PUBLIC_CLIENT_EMAIL` separator is `;` (semicolon). The contact page also auto-normalises commas to semicolons so legacy values keep working.

#### Production — Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → your project → Settings → Variables and Secrets**.
2. Add the four variables under the **Build** scope (NOT Runtime — they're baked at build time):
   - `PUBLIC_SITE_NAME`
   - `PUBLIC_WEB3FORMS_KEY`
   - `PUBLIC_CLIENT_EMAIL`
   - `PUBLIC_RECAPTCHA_SITE_KEY`
3. Type: Plaintext (all four are public-by-design).
4. Save.
5. **Cloudflare does NOT auto-rebuild on env-var change.** Go to **Deployments → latest deployment → "Retry deployment"** so the new values are baked in.

### 5. Verify CSP

Both `src/layouts/BaseLayout.astro` (the `<meta http-equiv="Content-Security-Policy">` tag) and `public/_headers` (the HTTP header) must allow:

```
script-src  ... https://www.google.com https://www.gstatic.com
connect-src ... https://api.web3forms.com https://www.google.com
frame-src   ... https://www.google.com
```

The base template ships with these origins already allowed. **Don't remove them.**

### 6. Update `astro.config.mjs` per client

Set the `site` config so canonical URL, sitemap, and Open Graph tags point to the production domain (without this, prerendered pages bake in the build-host like `localhost` or `*.pages.dev`):

```js
export default defineConfig({
  site: 'https://smithclinic.co.uk',  // ← per-client; production domain
  ...
});
```

### 7. Update the per-client clinic data in `src/pages/contact.astro`

```ts
const clinicPhoneDisplay = '+44 (0) 1234 567 890';
const clinicPhoneTel     = '+441234567890';
const clinicEmail        = 'hello@smithclinic.co.uk';
const clinicAddressLine1 = '12 High Street';
const clinicAddressLine2 = 'London, SW1A 1AA';
const clinicMapsUrl      = 'https://maps.google.com/?q=12+High+Street+London+SW1A+1AA';

const clinicHours = {
  mon: { open: '09:00', close: '17:00' },
  tue: { open: '09:00', close: '17:00' },
  wed: { open: '09:00', close: '17:00' },
  thu: { open: '09:00', close: '17:00' },
  fri: { open: '09:00', close: '17:00' },
  sat: null,
  sun: null,
};
```

These values feed:
- The visible contact cards (phone / email / address)
- The "Open Now / Opens Mon 9am" availability badge logic
- The `MedicalClinic` JSON-LD structured data block

### 8. Add the hero image

Drop the contact-page hero image at `public/images/contact-hero.webp`. Recommended size 1920×800, ~50–100 KB.

The image is preloaded via `<link rel="preload">` in `BaseLayout.astro` for LCP, so the path must match exactly.

### 9. Create `og-image.webp`

Drop a 1200×630 social-share image at `public/og-image.webp`. Used for Open Graph + Twitter previews.

---

## How the form actually works

### Submit flow

```
1. User clicks Submit
   ↓
2. Re-entry guard — if `isSubmitting === true` ABORT (prevents double-submit)
   ↓
3. Set isSubmitting = true
   ↓
4. Personalise hidden fields:
     subject  = `${siteName} - New Contact Enquiry From ${fullName}`
     from_name = fullName  (or siteName as fallback)
     replyto  = visitor email (CRLF stripped: /[\r\n]/g)
   ↓
5. Disable submit button + show "Sending…" + swap aria-label → "Sending, please wait"
   ↓
6. Execute reCAPTCHA v3:
     await window.grecaptcha.ready(...)
     token = await grecaptcha.execute(siteKey, { action: 'submit' })
     tokenEl.value = token
   ↓
7. POST JSON to https://api.web3forms.com/submit
   ↓
8. Read response:
     if (json.success) → window.location.href = '/thank-you'
     else              → show inline error, console.error the rejection
   ↓
9. finally block — ALWAYS runs:
     submit.disabled = false
     restore original button label + aria-label
     hide spinner
     isSubmitting = false
```

### Why each non-obvious step exists

| Decision | Why |
|---|---|
| Hidden inputs for `subject` / `from_name` rewritten by JS | Lets the recipient inbox see "Smith Clinic - New Contact Enquiry From Jane Smith" instead of "New entry received" — much easier to triage. |
| `replyto` set from visitor email | "Reply" in the recipient inbox pre-fills the visitor's email. Without this, replying goes to Web3Forms's noreply address. |
| CRLF strip on `replyto` | Defends against email header injection. Pasting `\r\nBcc: attacker@x.com\r\n` into an unprotected field would inject extra headers. |
| `isSubmitting` guard | Prevents the user double-submitting on a slow connection. Without this, a double-click sends two emails. |
| `aria-label` swap during submit | Screen readers hear "Sending, please wait" while the request is in flight. Restored in `finally` so even network failures restore the original label. |
| `finally` always restores | If the user has a network failure, they need the form back to a working state to retry. No path may leave the button stuck disabled. |
| Redirect ONLY on `json.success` | If Web3Forms rejects (bad reCAPTCHA score, missing access key, etc.), we MUST stay on the page and show an inline error. Redirecting on failure would mislead the user. |
| Direct-to-Web3Forms (no API route) | One less hop. No API route to maintain, no Cloudflare Worker quota to worry about, no CORS fuss. Web3Forms handles the email delivery. |
| `botcheck` honeypot positioned off-screen | Bots autofill every input. Humans never see this one. Submissions where `botcheck` is checked are silently dropped by Web3Forms. |

---

## QA checklist (run before declaring done)

- [ ] `npm run build` clean
- [ ] Open the deployed `/contact/` page
- [ ] View source — confirm `<input type="hidden" name="ccemail" value="...">` is present and has the right semicolon-separated value
- [ ] View source — confirm the reCAPTCHA `<script src="https://www.google.com/recaptcha/api.js?render=...">` is present
- [ ] Submit a real test entry
- [ ] Confirm BOTH the primary recipient AND every CC recipient receives the email
- [ ] Confirm the email body shows a "CC: …" line — this is hard proof Web3Forms accepted the `ccemail` field
- [ ] Click "Reply" in the recipient inbox — confirm it pre-fills the visitor's email (proves `replyto` is working)
- [ ] Confirm the email subject is `${siteName} - New Contact Enquiry From <visitor name>`
- [ ] DevTools → Network → throttle to "Offline" → submit → confirm inline error appears, NO redirect
- [ ] Re-enable network → submit → confirm redirect to `/thank-you`
- [ ] Confirm `/thank-you` is `noindex, nofollow` (both `<meta>` AND `X-Robots-Tag` HTTP header)
- [ ] Mobile (320–479px): radio pills are 3-up segmented row, NOT full-width column
- [ ] Mobile: submit button is the only solid-navy element on the page
- [ ] Keyboard: Tab into the radio group, arrow keys cycle, focus ring visible
- [ ] Screen reader: confirm "Sending, please wait" is announced during submit
- [ ] `prefers-reduced-motion`: all entrance animations and the availability-dot pulse are disabled
- [ ] Update the Web3Forms form's **Domain name** from `localhost` to the production domain
- [ ] Confirm Google reCAPTCHA admin lists every domain (localhost + *.pages.dev + production)

---

## Troubleshooting

### `400 Bad Request` — "reCaptcha verification is mandatory"

Cause: `recaptcha_response` field is empty.

- Check `PUBLIC_RECAPTCHA_SITE_KEY` is set in Cloudflare and the build ran AFTER it was added (Retry deployment).
- DevTools → Network → click `submit` → Response — look at the exact rejection message.
- `curl -s https://yoursite.pages.dev/contact/ | grep recaptcha` should show the script tag and site key.

### `400 Bad Request` — any other reCAPTCHA error

- Wrong field name. **Web3Forms expects `recaptcha_response`, NOT Google's standard `g-recaptcha-response`.**
- Check the hidden input name in your form.

### Email arrives but no CC was delivered

- Field name typo. **It's `ccemail`. NOT `cc`. NOT `bcc`. NOT `to`.**
- Separator. **Use `;`. NOT `,`.** The base contact-page code auto-normalises commas to semicolons, but if you wrote a custom form, check directly.
- Web3Forms plan. `ccemail` is **Pro-only**. On free, it's silently ignored.

### Email subject still shows "Website Name" or "Your Clinic"

- `PUBLIC_SITE_NAME` env var missing during the Cloudflare build.
- Add it in Cloudflare → Settings → Variables and Secrets → **Retry deployment**.
- Verify: `curl -s https://yoursite.pages.dev/contact/ | grep data-site-name`.

### Form shows "Something went wrong"

- DevTools → Console → look for `[ContactForm] Web3Forms rejected:` — the object shows the rejection reason.
- Network tab → `submit` request → Response tab — see the JSON error message.

### reCAPTCHA script not loading

- CSP blocking. Check both `BaseLayout.astro` `<meta>` AND `public/_headers` allow `https://www.google.com` and `https://www.gstatic.com` in `script-src`.
- DevTools Console will show: "Refused to load the script ... because it violates the following Content Security Policy directive."

### reCAPTCHA works locally but fails in production

- Production domain not in the reCAPTCHA admin's allowed list.
- https://www.google.com/recaptcha/admin → your site → Settings → add the production domain → Save.

### "Reply" in recipient inbox doesn't pre-fill visitor email

- `replyto` field missing or not populated.
- Check the JS submit handler — it should set `replyto.value = emailVal` before fetch.
- Confirm `<input type="hidden" name="replyto" class="js-replyto" value="">` is in the form.

### Form submits twice

- Re-entry guard missing. Add `let isSubmitting = false;` and the `if (isSubmitting) return;` check at the top of the submit handler. Reset in `finally`.

### User isn't on Web3Forms Pro

- reCAPTCHA verification AND `ccemail` are both Pro-only.
- Alternatives:
  - Disable reCAPTCHA in the Web3Forms dashboard, rely on the honeypot + Web3Forms server-side spam filter (works fine for clinic-scale traffic).
  - Switch to hCaptcha (free on Web3Forms) — change script URL and use `name="h-captcha-response"` field instead of `name="recaptcha_response"`.

### `localhost` triggers reCAPTCHA low-score in dev

Not a code bug. reCAPTCHA v3 can flag localhost as suspicious. Test on the Cloudflare URL instead.

### Build fails with "Unterminated string literal" at random line

If you added new `import.meta.env.X` references to `BaseLayout.astro` or any layout file, Vite's static env replacement can produce malformed output if combined with certain const patterns. Use `Astro.site` and `Astro.url.origin` instead — both are runtime values that don't go through env replacement.

---

## Things that have caused bugs in the past (the war stories)

1. **Wrong field name `g-recaptcha-response`.** Web3Forms uses `recaptcha_response`. Caused 400 errors even with valid tokens for hours.
2. **Field name `to` for primary recipient.** Web3Forms doesn't accept this — the primary inbox is the dashboard config. Cost a deploy because emails went to the dashboard owner only.
3. **Comma separator in `ccemail`.** Web3Forms parses semicolons. Comma-separated values resolve to one literal email address that's invalid → silent CC drop.
4. **`PUBLIC_` env vars assumed to be runtime.** They're build-time. Adding an env var to Cloudflare AFTER a build doesn't take effect — must Retry deployment.
5. **Astro `output: 'hybrid'`.** Removed in Astro 6. Don't add it. Default static is correct.
6. **Honeypot `class="hidden"` + Tailwind v4.** Tailwind's `hidden` is `display: none` — bots can't even see the input to autofill. Use a class that visually hides via `position: absolute; left: -9999px` instead.
7. **External links missing `rel="noopener noreferrer"`.** Every `target="_blank"` must have it. OWASP rule.
8. **Re-entry guard missing.** Slow connections + double-click → duplicate emails. Always use `isSubmitting`.
9. **`finally` block missing aria-label restore.** Network failure leaves the button stuck announcing "Sending, please wait" forever.
10. **JSON-LD with IIFE in frontmatter.** Astro's TS parser sometimes choked on `(() => {})()` patterns. Use plain const declarations and reference the variable.
11. **CRLF in `replyto` from pasted email.** Header injection vector. Always `.replace(/[\r\n]/g, '')` before assigning.
12. **`ContactForm.astro` props named `clientEmail`.** Was misleading — implied the recipient. Renamed to `ccEmail` to match the wire-level field name.

---

## Related files (touch these together when migrating clients)

- `src/layouts/BaseLayout.astro` — CSP `<meta>`, canonical/OG/Twitter tags, `Astro.site` origin
- `public/_headers` — CSP HTTP header (mirrors BaseLayout)
- `astro.config.mjs` — `site:` field anchors canonical/OG/sitemap to production domain
- `.env.example` — documents the four `PUBLIC_*` env vars
- `.env` — the actual values (never committed)
- `src/pages/thank-you.astro` — redirect target, must be `noindex={true}`
- `src/components/ContactForm.astro` — simple-CTA reusable form
- `src/pages/contact.astro` — full contact page with the rich layout
