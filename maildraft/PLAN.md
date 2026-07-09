# MailDraft — Product Plan & Milestones

> **For the vibecoder:** This document is your single source of truth.
> Follow phases in order. Do not skip security steps — they protect you legally and technically.

---

## What you are building

**MailDraft** is a B2B SaaS tool that lets teams compose personalized, consistent emails from dynamic templates — directly inside Gmail. Think of it as "Notion for email templates + a Gmail sidebar."

**Revenue model:** Freemium + per-seat pricing.

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | €0 | 3 templates (read-only, fixed — cannot edit) |
| **Solo** | €3 / month | Unlimited templates, 1 user |
| **Team** | €3 first 10 users + €2/user after | Unlimited templates, team features |

Example team prices: 1 user = €3, 10 users = €3, 15 users = €13 (3 + 5×2), 20 users = €23.

---

## Your steps — ordered, clear

### RIGHT NOW (before anything else)

- [ ] Create a Supabase project at [supabase.com](https://supabase.com) (free tier is fine to start)
- [ ] Run `supabase-schema.sql` in the Supabase SQL Editor
- [ ] Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
  - Enable: **Google Drive API** and **Google Picker API**
  - Create OAuth 2.0 credentials → Web application
  - Add authorized origins: `http://localhost:3000` and your future domain
- [ ] Enable Google as OAuth provider in Supabase → Authentication → Providers
- [ ] Copy `.env.local.example` to `.env.local` and fill in all values
- [ ] Run `npm run dev` inside `maildraft/` and verify the app loads
- [ ] Load the Chrome extension (Developer Mode → Load unpacked → `extension/` folder)
- [ ] Sign in with Google and create your first template

---

## Milestones

### Milestone 1 — Working MVP (your current state)
**Status: DONE**

- [x] Next.js web app with template builder
- [x] Drag-and-drop block reordering
- [x] Variable system with auto-fill
- [x] Google Drive Picker for attachments
- [x] Live email preview
- [x] Chrome extension injected in Gmail
- [x] Sidebar with option picker and insert
- [x] Full CRUD API
- [x] Supabase auth + database schema

---

### Milestone 2 — Secure & Production-Ready
**Status: IN PROGRESS**

These are non-negotiable before you show this to paying customers.

#### Security (all implemented in this branch)
- [x] Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy)
- [x] Input validation with Zod on all API routes
- [x] Authentication middleware protecting all routes
- [x] Rate limiting on API endpoints
- [x] Sanitized error responses (no stack traces to clients)
- [x] Environment variable validation at startup
- [x] Secure extension token handling

#### What you must do manually
- [ ] In Supabase: **enable email confirmation** (Auth → Settings → Enable email confirmations)
- [ ] In Supabase: set allowed redirect URLs to your production domain only
- [ ] In Google Cloud: restrict API key to your domain (API restrictions → HTTP referrers)
- [ ] Set up a custom domain (Vercel makes this easy)
- [ ] Enable 2FA on your Supabase account and Google Cloud account
- [ ] Read the RLS policies in `supabase-schema.sql` — understand what each one does

---

### Milestone 3 — Team Management
**Effort: Medium — 3 API routes + 2 pages**

Right now teams must be created manually in the database. Build self-service.

- [ ] `POST /api/teams` — create a team (auto-assign creator as admin)
- [ ] `POST /api/teams/invite` — invite a member by email (send Supabase magic link)
- [ ] `DELETE /api/teams/members/[id]` — remove a member
- [ ] Page: `/settings/team` — manage members, see roles, remove people
- [ ] Page: `/onboarding` — shown after first sign-in, creates team automatically

**Your step:** After deploying Milestone 2, manually insert a row in `teams` and `team_members` in Supabase for yourself to test with.

---

### Milestone 4 — Billing (Stripe)
**Effort: Medium — Stripe integration + 1 webhook + 2 pages**

Do this before you talk to any paying customer.

- [ ] Create Stripe account, add products:
  - **Free** — no Stripe product needed (handled in code)
  - **Solo** — €3/mo (1 user, unlimited templates)
  - **Team base** — €3/mo base (covers first 10 users)
  - **Team per-seat** — €2/user/mo for each user beyond 10 (use Stripe metered billing or manual seat count)
- [ ] `POST /api/billing/checkout` — create Stripe checkout session
- [ ] `POST /api/billing/webhook` — handle `customer.subscription.updated`, `invoice.payment_failed`
- [ ] Add `stripe_customer_id`, `plan`, `plan_expires_at` columns to `teams` table
- [ ] Page: `/settings/billing` — shows current plan, upgrade button, payment history
- [ ] Gate template creation behind plan limits

**Add to `.env.local`:**
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

**Your step:** Test with Stripe test cards before going live. Use `stripe listen --forward-to localhost:3000/api/billing/webhook` during development.

---

### Milestone 5 — Polish & Growth
**Effort: Light**

- [ ] Template duplication button (copy an existing template)
- [ ] Template search/filter on dashboard
- [ ] Usage analytics (how many emails sent per template per week)
- [ ] Onboarding email sequence (set up in Supabase Edge Functions or Resend)
- [ ] In-app changelog / "What's new" panel

---

### Milestone 6 — Chrome Web Store Publish
**Effort: Medium (mostly paperwork)**

- [ ] Create a privacy policy page (`/privacy`) — REQUIRED by Chrome Web Store
- [ ] Create terms of service page (`/terms`)
- [ ] Record a 1-2 minute demo video for the Store listing
- [ ] Package extension: `zip -r maildraft-extension.zip extension/`
- [ ] Submit to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [ ] Pay $5 one-time developer fee
- [ ] Wait for review (usually 1-7 days)

**Important:** The Store will ask why you need `https://mail.google.com/*` permission. Answer: "To inject the MailDraft button in Gmail compose windows so users can insert templates." Be specific.

---

### Milestone 7 — Launch
**Effort: Light**

- [ ] Deploy to Vercel: `npx vercel --prod`
- [ ] Set all env vars in Vercel dashboard
- [ ] Point your domain to Vercel
- [ ] Post on Product Hunt (prep post, schedule for Tuesday/Wednesday 12:01am PST)
- [ ] Submit to Chrome Web Store listing (if not done yet)

---

## Security Checklist (print this and check each item)

### Infrastructure
- [ ] Supabase project is in a region close to your users
- [ ] Supabase project has a strong password (auto-generated, stored in password manager)
- [ ] Supabase `anon` key is public — that is correct and safe. The `service_role` key is NEVER in client code
- [ ] RLS is enabled on ALL tables (check in Supabase → Table Editor → each table has a lock icon)
- [ ] Google API key is restricted by HTTP referrer to your domain
- [ ] Vercel environment variables are set as "Production" only (not exposed to previews)

### Code
- [ ] No `console.log(user)` or similar in production code that leaks PII
- [ ] All API routes validate input with Zod before touching the database
- [ ] Error responses never include stack traces or internal DB errors
- [ ] Auth check is in every API route (not just some)
- [ ] The `service_role` key is never in any file in this repository

### Legal & Compliance
- [ ] Privacy policy explains: what data you collect, how you store it, how users can delete it
- [ ] GDPR: Users in the EU have the right to data deletion. Add a "Delete my account" button.
- [ ] Google's OAuth policy requires a privacy policy URL in your Google Cloud project
- [ ] Chrome Web Store requires a privacy policy to publish
- [ ] Stripe's terms require you to display pricing clearly before charging

### Business Protection
- [ ] Terms of Service: include a clause that prohibits using MailDraft to send spam
- [ ] Terms of Service: include limitation of liability
- [ ] Use a legal template from [plainenglish.io](https://plainenglish.io/) or similar

---

## Architecture diagram

```
User browser
    │
    ▼
Vercel (Next.js)
    ├── Middleware (auth check + rate limit)
    │     └── All /api/* routes protected
    ├── API Routes (Zod validated)
    │     ├── /api/templates
    │     ├── /api/blocks
    │     ├── /api/options
    │     ├── /api/attachments
    │     └── /api/billing (Milestone 4)
    └── App pages

Supabase (PostgreSQL + Auth)
    ├── Row Level Security on all tables
    ├── Google OAuth provider
    └── Supabase Storage (if you add file upload later)

Google APIs
    ├── Google Drive API (read-only — list/pick files)
    └── Google Picker API (UI component)

Chrome Extension (Gmail)
    ├── content.js → injected into mail.google.com
    ├── background.js → stores token in chrome.storage.sync
    └── Calls /api/templates with Bearer token
```

---

## Environment variables reference

| Variable | Where to get it | Exposed to browser? |
|----------|----------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Yes (safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | Yes (safe, RLS protects data) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud → Credentials | Yes (safe) |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Google Cloud → Credentials | Yes (restrict by referrer!) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | **NO — server only** |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhooks | **NO — server only** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Yes (safe) |

---

## Stack summary

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, Vercel native, server components |
| Auth | Supabase Auth + Google OAuth | Free, secure, handles token refresh |
| Database | Supabase PostgreSQL | RLS built-in, real-time capable |
| UI | Tailwind + shadcn/ui | Fast to build, looks professional |
| Validation | Zod | Runtime type safety, auto error messages |
| Payments | Stripe (Milestone 4) | Industry standard, PCI compliant |
| Deploy | Vercel | Zero-config, edge network, env var management |
| Extension | Chrome Manifest V3 | Current standard, required for Store |

---

## Common mistakes to avoid

1. **Never put the Supabase `service_role` key in client code.** The `anon` key is public by design; `service_role` bypasses RLS and has full DB access.
2. **Never trust client-sent `team_id`.** Always derive it from `auth.uid()` server-side.
3. **Don't skip RLS.** If you disable RLS on a table "for testing", one of your users can read everyone else's templates.
4. **Don't store tokens in localStorage.** The extension correctly uses `chrome.storage.sync`. The web app uses Supabase's built-in session management (httpOnly cookies).
5. **Don't send real emails from the API.** MailDraft inserts text into Gmail compose — it does not send emails directly. This is intentional (avoids spam regulations for now).
