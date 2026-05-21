# Deployment Guide — HMDG Astro Base Template (Cloudflare + Web3Forms)

Complete step-by-step guide to deploy a new client site from this template.
Covers GitHub, Web3Forms, Cloudflare Pages, environment variables, custom domains, and post-launch checks.

---

## Prerequisites

Before you start, make sure you have:

- [ ] Node.js 22 or higher installed locally
- [ ] A GitHub account (github.com)
- [ ] A Cloudflare account (cloudflare.com)
- [ ] A Web3Forms account (web3forms.com — free)
- [ ] The client's domain name (if connecting a custom domain)
- [ ] GA4 Measurement ID and API Secret (optional — only needed if using GA4 tracking)
- [ ] Google Tag Manager container ID (optional — only needed if using GTM)

---

## Part 1 — GitHub Setup

### Step 1: Clone the base template

Clone this repository to create the new client project:

```bash
git clone https://github.com/felmerald-hmdg/astro-base-template-cloudflare.git client-project-name
cd client-project-name
```

### Step 2: Remove the old remote and create a new repo

```bash
git remote remove origin
```

Create a new private repository on GitHub for the client:

```bash
gh repo create felmerald-hmdg/client-project-name --private --source=. --push
```

Or manually:

1. Go to **github.com → New repository**.
2. Set the name (e.g. `client-clinic-name`).
3. Set to **Private**.
4. Do NOT initialise with README (the template already has one).
5. Click **Create repository**.
6. Then push locally:

```bash
git remote add origin https://github.com/felmerald-hmdg/client-project-name.git
git branch -M main
git push -u origin main
```

### Step 3: Install dependencies and test locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:4321` in your browser. Confirm the site loads, pages render, and the contact form appears.

---

## Part 2 — Web3Forms Setup (Contact Form)

### Step 4: Create a Web3Forms account

1. Go to [web3forms.com](https://web3forms.com).
2. Click **Get Started Free** and sign up with the HMDG email (or the client's email).

### Step 5: Create a new form and get the access key

1. After logging in, click **Create New Form** (or **Create Your First Form**).
2. **Form Name**: enter the client name (e.g. `Smith Physio Clinic`).
3. **Domain name**: enter `localhost` for now (you can update it after deployment).
4. Click **Create Form**.

### Step 6: Copy the access key

Web3Forms will show you a page that says **"Your Form is Ready!"**.

You will see:

```
Form Access Key
21e37f44-cc4e-48ff-ae54-399d1477f176    (example — yours will be different)
```

**Copy this key.** You need it in two places:

1. **Locally** — paste it into your `.env` file:

```env
PUBLIC_WEB3FORMS_KEY=21e37f44-cc4e-48ff-ae54-399d1477f176
```

2. **Cloudflare Pages** — you will add it as an environment variable in the next section.

> The access key is public by design — it only controls which inbox receives submissions. It is safe to expose in client-side code.

### Step 7: Test the form locally

1. Start the dev server: `npm run dev`
2. Open `http://localhost:4321/contact`
3. Fill in the form and click **Send Enquiry**.
4. You should see a green success message: *"Thank you — your message has been sent."*
5. Check the inbox linked to the Web3Forms key — the submission should arrive.

If it works locally, it will work in production. Move on to Cloudflare.

---

## Part 3 — Cloudflare Pages Deployment

### Step 8: Log into Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. In the left sidebar, click **Workers & Pages**.

### Step 9: Create a new Pages project

1. Click **Create** (blue button at top).
2. Select **Pages**.
3. Click **Connect to Git**.
4. Select **GitHub** and authorise Cloudflare to access your repositories.
5. Find and select the client repository you created in Step 2.
6. Click **Begin setup**.

### Step 10: Configure build settings

You will see the **"Set up your application"** screen. Fill in:

| Field | Value |
|---|---|
| **Project name** | `client-project-name` (auto-filled from repo name — keep it) |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` (auto-filled — keep it) |

Leave **"Builds for non-production branches"** checked.

### Step 11: Open Advanced Settings and add environment variables

Click **Advanced settings** to expand the section. You will see a **Variable name** and **Variable value** form.

Add the following variables:

**Variable 1 (required):**

| Field | Value |
|---|---|
| Variable name | `NODE_VERSION` |
| Variable value | `22` |

**Variable 2 (required):**

| Field | Value |
|---|---|
| Variable name | `PUBLIC_WEB3FORMS_KEY` |
| Variable value | *(paste your Web3Forms access key from Step 6)* |

**Variable 3 (required — recipient email for contact form):**

| Field | Value |
|---|---|
| Variable name | `PUBLIC_CLIENT_EMAIL` |
| Variable value | `hello@yourclinic.co.uk` *(comma-separated list for multiple)* |

Click **+ Add variable** to add more if needed.

**Variable 3 (optional — add later when GA4 is ready):**

| Field | Value |
|---|---|
| Variable name | `GA4_API_SECRET` |
| Variable value | *(from GA4 dashboard)* |
| Encrypt | **Yes** — click the Encrypt button |

**Variable 4 (optional):**

| Field | Value |
|---|---|
| Variable name | `GA4_MEASUREMENT_ID` |
| Variable value | `G-XXXXXXXXXX` |

**Variable 5 (optional):**

| Field | Value |
|---|---|
| Variable name | `SITE_ORIGIN` |
| Variable value | `https://yourclinic.co.uk` *(the client's live domain)* |

> You can skip Variables 3–5 for now and add them later under **Settings → Environment variables** in the Cloudflare Pages dashboard.

### Step 12: Deploy

1. Click **Deploy** (blue button at the bottom).
2. Cloudflare will build the project. This takes 1–3 minutes.
3. When complete, you will see a green success message and a live URL:

```
https://client-project-name.pages.dev
```

4. Click the URL to verify the site is live.
5. Test the contact form on the live site — submit a test enquiry and check your inbox.

---

## Part 4 — Move Domain DNS to Cloudflare

Before connecting a custom domain to your Pages project, the domain must be on Cloudflare DNS. This gives you full control over DNS records, automatic SSL, DDoS protection, and caching — all from one dashboard.

> **Already on Cloudflare?** If the client's domain is already managed by Cloudflare DNS, skip to Part 5 (Step 17).

### Step 13: Add the domain to Cloudflare

1. Log into [dash.cloudflare.com](https://dash.cloudflare.com).
2. Click **Add a domain** (or **Add a site** on the home page).
3. Enter the client's domain: `yourclinic.co.uk` (the root domain, not a subdomain).
4. Click **Continue**.

### Step 14: Choose a plan

1. Select the **Free** plan (scroll down — it is at the bottom).
2. Click **Continue**.

### Step 15: Review and copy DNS records

Cloudflare scans the domain's existing DNS records and imports them automatically.

1. **Review the list carefully.** Make sure all existing records are present:
   - `A` records (pointing to the old host — you will change these later)
   - `MX` records (email — **critical**, do not lose these)
   - `TXT` records (SPF, DKIM, domain verification — **critical**)
   - `CNAME` records (subdomains like `www`)

2. If any records are missing, add them manually now. Check the current registrar's DNS panel to compare.

3. **Do not change anything yet** — just confirm everything is present.

4. Click **Continue**.

> **Warning:** If MX or TXT records are missing, email will break after the nameserver switch. Always double-check email records before proceeding.

### Step 16: Change nameservers at the domain registrar

Cloudflare will show you **two nameservers** to set at the domain registrar. They look like:

```
ada.ns.cloudflare.com
bob.ns.cloudflare.com
```

*(Your actual nameservers will be different — use the ones Cloudflare shows you.)*

Now go to the **domain registrar** (where the domain was purchased — e.g. GoDaddy, Namecheap, 123 Reg, Fasthosts, IONOS, Google Domains, etc.):

1. Log into the registrar's dashboard.
2. Find the domain → **DNS settings** or **Nameservers**.
3. Switch from the registrar's default nameservers to **Custom nameservers**.
4. Replace the existing nameservers with the two Cloudflare nameservers.
5. Save.

**Common registrar locations:**

| Registrar | Where to find nameserver settings |
|---|---|
| GoDaddy | My Products → Domain → DNS → Nameservers → Change |
| Namecheap | Domain List → Manage → Nameservers → Custom DNS |
| 123 Reg | Control Panel → Domain → Manage → Nameservers |
| Fasthosts | Control Panel → Domains → DNS/Nameservers |
| IONOS | Domains & SSL → DNS → Nameservers |
| Google Domains | My Domains → DNS → Custom name servers |

### Step 16b: Wait for propagation

1. Go back to Cloudflare and click **Done, check nameservers**.
2. Cloudflare will check periodically. This usually takes **5 minutes to 2 hours**, but can take up to 24 hours in rare cases.
3. You will receive an email from Cloudflare when the domain is active:

```
Subject: "yourclinic.co.uk" has been added to your Cloudflare account
```

4. In the Cloudflare dashboard, the domain status will change from **"Pending"** to **"Active"**.

> **While waiting:** The existing site continues to work normally. Nothing breaks until you change the DNS records themselves (which you do in Part 5).

### Step 16c: Verify email still works

After the nameservers propagate and the domain shows **Active** in Cloudflare:

1. Send a test email to the client's domain email (e.g. `hello@yourclinic.co.uk`).
2. Confirm it arrives.
3. If email breaks, check the **MX** and **TXT** records in Cloudflare DNS — compare them with the old registrar records and fix any missing ones.

---

## Part 5 — Connect Custom Domain to Pages

### Step 17: Add the custom domain to the Pages project

1. Go to **Workers & Pages** → click on your Pages project.
2. Click **Custom domains** tab.
3. Click **Set up a custom domain**.
4. Enter the client's domain: `yourclinic.co.uk`.
5. Click **Continue**.

Since the domain is now on Cloudflare DNS, Cloudflare adds the required CNAME record **automatically**. You should see:

```
CNAME   yourclinic.co.uk → client-project-name.pages.dev
```

6. Click **Activate domain**.

### Step 17b: Add www subdomain (recommended)

Repeat the same process for the `www` version:

1. Click **Set up a custom domain** again.
2. Enter: `www.yourclinic.co.uk`.
3. Cloudflare adds the CNAME automatically.
4. Click **Activate domain**.

Now both `yourclinic.co.uk` and `www.yourclinic.co.uk` point to your Pages project.

> **Redirect www → root (or vice versa):** In Cloudflare, go to **Rules → Redirect Rules** and create a rule:
> - If hostname equals `www.yourclinic.co.uk`
> - Then redirect to `https://yourclinic.co.uk` (301 permanent)

### Step 18: SSL certificate

Cloudflare provisions a free SSL certificate automatically after the domain is activated. This usually happens within minutes.

Verify:
1. Open `https://yourclinic.co.uk` in a browser.
2. Check the padlock icon — it should show a valid Cloudflare certificate.
3. Try `http://yourclinic.co.uk` — it should redirect to `https://` automatically.

If SSL is not ready yet, wait 15 minutes and try again. Edge certificates can take up to 24 hours in rare cases.

### Step 19: Update Web3Forms domain

Now that you have a live domain:

1. Go to [web3forms.com](https://web3forms.com) dashboard.
2. Find the form you created in Step 5.
3. Update the **Domain name** from `localhost` to `yourclinic.co.uk`.

### Step 20: Update SITE_ORIGIN

In Cloudflare Pages:

1. Go to **Settings → Environment variables**.
2. Add or update `SITE_ORIGIN` to `https://yourclinic.co.uk`.
3. Trigger a redeploy: **Deployments → latest deployment → Retry deployment**.

---

## Part 6 — Post-Launch Checklist

After the site is live on the custom domain, verify everything:

### Site basics
- [ ] Site loads on `https://yourclinic.co.uk`
- [ ] HTTPS is active (padlock in browser address bar)
- [ ] No console errors in browser dev tools (F12)
- [ ] Mobile layout is correct across devices

### Contact form
- [ ] Go to `/contact` and submit a test enquiry
- [ ] Green success message appears inline (no page reload)
- [ ] Email arrives in the inbox linked to the Web3Forms key
- [ ] Honeypot is working — bots are filtered (no spam emails)

### Legal pages
- [ ] `/privacy-policy` loads correctly
- [ ] `/terms-conditions` loads correctly
- [ ] `/cookie-policy` loads correctly
- [ ] Footer links point to these pages

### Cookie consent
- [ ] Cookie banner appears on first visit
- [ ] Accept All button works
- [ ] Reject All button works
- [ ] Customise preferences modal opens
- [ ] GTM fires only after consent is given (verify in GTM Preview mode)
- [ ] GA4 receives events (check GA4 Realtime report)

### Thank-you pages
- [ ] `/thank-you` has `<meta name="robots" content="noindex, nofollow">`
- [ ] `/thank-you-booking` has `<meta name="robots" content="noindex, nofollow">`

### Performance
- [ ] PageSpeed Insights mobile score >= 90
- [ ] No render-blocking resources in the waterfall
- [ ] Images are `.webp` format with explicit dimensions

### API routes (if GA4 is configured)
- [ ] `/api/book-now` returns 200 when POST'd with valid JSON
- [ ] `/api/booking-complete` returns 200 when POST'd with valid JSON

---

## Part 7 — Ongoing Workflow

### Making changes

```bash
# 1. Pull latest
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/update-hero-section

# 3. Make changes, test locally
npm run dev

# 4. Commit and push
git add .
git commit -m "Update hero section copy and CTA"
git push origin feature/update-hero-section
```

5. Open a **Pull Request** on GitHub.
6. Cloudflare automatically builds a **deploy preview** and posts the URL on the PR.
7. Review the preview.
8. Merge into `main` → Cloudflare auto-deploys to production.

### Rollback

If something breaks after a deploy:

1. Go to Cloudflare Pages → **Deployments**.
2. Find the last working deployment.
3. Click **Rollback to this deployment**.
4. The site reverts instantly — no rebuild needed.

---

## Quick Reference — Environment Variables

| Variable | Where to set | Required | Public | Description |
|---|---|---|---|---|
| `NODE_VERSION` | Cloudflare Pages | Yes | N/A | Must be `22` |
| `PUBLIC_WEB3FORMS_KEY` | Cloudflare Pages + `.env` | Yes | Yes | Web3Forms access key |
| `PUBLIC_CLIENT_EMAIL` | Cloudflare Pages + `.env` | Yes | Yes | Recipient inbox for contact form (comma-separated for multiple) |
| `PUBLIC_SITE_NAME` | Cloudflare Pages + `.env` | Yes | Yes | Used in email subject + from_name |
| `PUBLIC_RECAPTCHA_SITE_KEY` | Cloudflare Pages + `.env` | If using reCAPTCHA | Yes | Google reCAPTCHA v3 site key |
| `GA4_API_SECRET` | Cloudflare Pages + `.env` | For GA4 | No | GA4 Measurement Protocol secret (encrypt) |
| `GA4_MEASUREMENT_ID` | Cloudflare Pages + `.env` | For GA4 | No | GA4 Measurement ID (`G-XXXXXXXXXX`) |
| `SITE_ORIGIN` | Cloudflare Pages + `.env` | For GA4 | No | Full production URL |

**Local development:** values go in `.env` (never committed — already in `.gitignore`).
**Production:** values go in the Cloudflare Pages dashboard → **Settings → Environment variables**.

---

## Troubleshooting

### Build fails on Cloudflare

- Check that `NODE_VERSION` is set to `22` in environment variables.
- Check the build log for the specific error — usually a missing dependency or env var.
- Run `npm run build` locally first to reproduce the issue.

### Contact form shows error

- Verify `PUBLIC_WEB3FORMS_KEY` is set in Cloudflare Pages environment variables.
- Verify the key matches the one in the Web3Forms dashboard.
- Check browser console (F12) for CSP or network errors.
- Test with `curl`:
  ```bash
  curl -X POST https://api.web3forms.com/submit \
    -H "Content-Type: application/json" \
    -d '{"access_key":"YOUR-KEY","name":"Test","email":"test@test.com","message":"Hello"}'
  ```

### Site loads but looks broken

- Check that Tailwind CSS is building correctly — run `npm run build` locally.
- Check that `global.css` is imported in `BaseLayout.astro`.
- Check the browser console for 404 errors on CSS/JS files.

### Custom domain not working

- Verify the CNAME record is set correctly at the registrar.
- DNS propagation can take up to 24 hours (usually minutes).
- Check Cloudflare Pages → Custom domains → status should show "Active".

---

Designed & Developed by [HMDG](https://hmdg.co.uk).
