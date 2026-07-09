# MailDraft — Step-by-Step Build Plan

> Each step is either **YOU** (things only a human can do: accounts, credentials, clicks, payments)
> or **ME** (code, config, automation I can build for you).
> Follow in order. Do not skip steps.

---

## PHASE 1 — Connect the backend (get the app running for real)

---

### STEP 1 — ME ✅ Already done
**What I built:**
- Next.js web app with template builder, drag-and-drop blocks, variable system, Google Drive Picker
- Chrome extension that injects into Gmail compose
- All API routes with Zod validation, auth, rate limiting, security headers
- Supabase schema (`supabase-schema.sql`)
- Privacy Policy and Terms of Service pages
- `PLAN.md` and this file

**Status:** Complete. Code is on GitHub branch `cursor/maildraft-dynamic-templates-2a28`.

---

### STEP 2 — YOU: Create your Supabase project

Go to [supabase.com](https://supabase.com) and do these things in order:

**a. Create account and project**
1. Sign up at supabase.com
2. Click **New Project**
3. Choose a region close to your users (EU West for Europe, US East for USA)
4. Give it a strong database password — save it in a password manager
5. Wait ~2 minutes for the project to finish creating

**b. Run the database schema**
1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `maildraft/supabase-schema.sql` from the repo
4. Paste all the contents into the editor
5. Click **Run** (green button)
6. You should see "Success. No rows returned" — that means it worked
7. Go to **Table Editor** — you should see 7 tables listed (teams, team_members, templates, template_blocks, block_options, option_attachments, template_variables)
8. Click each table → verify it shows a **lock icon** (RLS enabled)

**c. Get your API credentials**
1. Go to **Settings** (gear icon) → **API**
2. Copy the **Project URL** → save it as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon/public key** → save it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **DO NOT copy the service_role key** — you don't need it and it's dangerous

**d. Enable Google OAuth**
1. Go to **Authentication** → **Providers**
2. Find **Google** → click to expand it → toggle it **On**
3. You will need to paste a Client ID and Secret here — do this AFTER Step 3

**e. Add redirect URLs**
1. Go to **Authentication** → **URL Configuration**
2. In **Redirect URLs**, add:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/**` (for local testing)
3. You'll add your production URL here later (Step 10)

---

### STEP 3 — YOU: Set up Google Cloud

Go to [console.cloud.google.com](https://console.cloud.google.com) and do this:

**a. Create a project**
1. Click the project selector (top left) → **New Project**
2. Name it "MailDraft" → Create

**b. Enable the APIs you need**
1. Go to **APIs & Services** → **Library**
2. Search "Google Drive API" → click it → **Enable**
3. Search "Google Picker API" → click it → **Enable**

**c. Create OAuth credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. If asked, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: MailDraft
   - User support email: your email
   - Developer contact: your email
   - Scopes: add `email`, `profile`, `https://www.googleapis.com/auth/drive.readonly`
   - Save and continue
4. Back in Credentials → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: MailDraft Web
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: copy the redirect URI from Supabase (Authentication → Providers → Google → it shows you the URI)
5. Click **Create** → you get a **Client ID** and **Client Secret**
6. Copy both

**d. Create an API key for the Drive Picker**
1. **Create Credentials** → **API Key**
2. Copy the key
3. Click **Restrict Key**:
   - Application restrictions: HTTP referrers
   - Add: `localhost:3000/*` and your future domain
   - API restrictions: select **Google Picker API** only
4. Save

**e. Paste credentials into Supabase**
1. Go back to Supabase → Authentication → Providers → Google
2. Paste your **Client ID** and **Client Secret**
3. Save

**When you're done, send me:**
- Your `NEXT_PUBLIC_SUPABASE_URL` (looks like: `https://xxxxxxxxxxxx.supabase.co`)
- Your `NEXT_PUBLIC_SUPABASE_ANON_KEY` (long string starting with `eyJ...`)
- Your `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (looks like: `123456789-xxxx.apps.googleusercontent.com`)
- Your `NEXT_PUBLIC_GOOGLE_API_KEY`

---

### STEP 4 — YOU: Configure your local environment

In the `maildraft/` folder:

1. Copy the example file:
   ```
   cp .env.local.example .env.local
   ```
2. Open `.env.local` in any text editor
3. Replace each placeholder with your real values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
   NEXT_PUBLIC_GOOGLE_API_KEY=AIza...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Save the file

---

### STEP 5 — YOU: Run the app and create your team manually

1. In terminal, inside the `maildraft/` folder, run:
   ```
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Click **Sign in with Google** → complete the login
4. After login, you'll land on the dashboard — it will show "not a team member" error (normal — no team yet)
5. Go to your Supabase dashboard → **Table Editor** → **teams** table
6. Click **Insert** → add a row: `name = "My Team"` → Save
7. Copy the `id` (UUID) of that team row
8. Go to **team_members** table → Insert a row:
   - `team_id` = the UUID you just copied
   - `user_id` = your user's UUID (find it in Authentication → Users)
   - `role` = `admin`
9. Save → go back to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) → refresh

> **Note to self:** This manual step is temporary. In Step 7 I will build automatic team creation so this never needs to be done again.

---

### STEP 6 — YOU: Test the Chrome extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer mode** (toggle top right)
3. Click **Load unpacked**
4. Navigate to the `maildraft/extension/` folder → Select it
5. The MailDraft extension should appear in your Chrome toolbar
6. Click the extension icon → set App URL to `http://localhost:3000` → Save
7. Open [Gmail](https://mail.google.com)
8. Click **Compose** → you should see a blue **MailDraft** button appear in the toolbar
9. Click it → a sidebar should open (it will say "not signed in" until you sign in)

**Tell me if something doesn't work in any of these steps.**

---

## PHASE 2 — Self-service team creation (so you can onboard real users)

---

### STEP 7 — ME: Build team onboarding flow

After you complete Steps 2-6 and confirm the app is working, I will:

- Build `/onboarding` page — auto-creates a team when a new user signs up for the first time
- Build `/settings/team` page — lets the admin invite members by email, see who's on the team, remove members
- Build `POST /api/teams` route — creates a team and assigns the creator as admin
- Build `POST /api/teams/invite` route — sends a Supabase magic link invitation
- Build `DELETE /api/teams/members/[id]` route — removes a member
- Update the auth flow to redirect new users to `/onboarding` instead of `/dashboard`

---

### STEP 8 — YOU: Test team onboarding

After Step 7 is deployed:

1. Create a second Google account (or use a friend)
2. Sign in with that account on the app
3. Verify the onboarding page appears and creates a team automatically
4. From your admin account, go to Settings → Team → invite the second account
5. Verify the invite email arrives and the user can join
6. Verify the second user can see templates but cannot create/edit them (member role)

---

## PHASE 3 — Billing (so you can charge money)

---

### STEP 9 — YOU: Create your Stripe account and products

1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Products** → **Add product**
3. Create two products:

   **Starter — $29/month**
   - Name: MailDraft Starter
   - Pricing: Recurring, $29/month
   - Copy the **Price ID** (starts with `price_...`)

   **Pro — $99/month**
   - Name: MailDraft Pro
   - Pricing: Recurring, $99/month
   - Copy the **Price ID**

4. Go to **Developers** → **API Keys**:
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

5. Go to **Developers** → **Webhooks** → **Add endpoint**:
   - We'll fill in the URL after deployment (Step 12)
   - For now note: you'll need this later

6. Add to your `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_STARTER_PRICE_ID=price_...
   STRIPE_PRO_PRICE_ID=price_...
   ```

---

### STEP 10 — ME: Build billing system

After you send me the Stripe Price IDs, I will:

- Add `stripe_customer_id`, `plan`, `plan_status`, `plan_expires_at` columns to the `teams` table (new SQL migration)
- Build `POST /api/billing/checkout` — creates Stripe checkout session
- Build `POST /api/billing/webhook` — handles `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Build `/settings/billing` page — shows current plan, upgrade/downgrade button, next billing date
- Add plan limits: Starter = 5 members + 20 templates, Pro = unlimited
- Show upgrade prompt when limits are hit

---

### STEP 11 — YOU: Test billing locally

1. Install Stripe CLI: [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Run this in a terminal (while `npm run dev` is running in another terminal):
   ```
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
3. Copy the webhook signing secret it prints → paste into `.env.local` as `STRIPE_WEBHOOK_SECRET`
4. Go to your app → Settings → Billing → click Upgrade
5. Use test card `4242 4242 4242 4242`, any future date, any CVC
6. Verify the plan updates in the dashboard
7. Test hitting template limits (create more than 20 templates on Starter)

---

## PHASE 4 — Deploy to production

---

### STEP 12 — YOU: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up / Log in
2. Click **Add New Project** → Import from GitHub → select this repo
3. Set the **Root Directory** to `maildraft`
4. Add all environment variables (same as your `.env.local` but with production values):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_API_KEY`
   - `STRIPE_SECRET_KEY` (use live key: `sk_live_...`)
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use live: `pk_live_...`)
   - `STRIPE_STARTER_PRICE_ID`
   - `STRIPE_PRO_PRICE_ID`
   - `NEXT_PUBLIC_APP_URL=https://your-domain.com`
5. Click Deploy → wait ~2 minutes
6. Note your Vercel URL (e.g. `https://maildraft-xxxx.vercel.app`)

---

### STEP 13 — YOU: Update credentials for production

**Supabase:**
1. Go to Authentication → URL Configuration
2. Add your Vercel URL to Redirect URLs: `https://your-domain.com/**`
3. Set Site URL to: `https://your-domain.com`

**Google Cloud:**
1. Go to Credentials → your OAuth 2.0 Client ID → Edit
2. Add to Authorized JavaScript origins: `https://your-domain.com`
3. Add to Authorized redirect URIs: the Supabase redirect URI (same one as before but with your real domain)
4. Go to your API Key → Restrict it to your production domain: `your-domain.com/*`

**Stripe:**
1. Go to Webhooks → Add endpoint
2. URL: `https://your-domain.com/api/billing/webhook`
3. Events to listen for: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the signing secret → update `STRIPE_WEBHOOK_SECRET` in Vercel

**Extension:**
1. Click the extension icon → update App URL to `https://your-domain.com`

---

### STEP 14 — YOU: Add a custom domain (optional but recommended)

1. In Vercel → your project → **Settings** → **Domains**
2. Add your domain (e.g. `maildraft.app` or `yourdomain.com`)
3. Follow Vercel's DNS instructions (add a CNAME or A record at your domain registrar)
4. Wait up to 24h for DNS to propagate (usually minutes)

---

## PHASE 5 — Publish the Chrome extension

---

### STEP 15 — ME: Prepare extension for the Chrome Web Store

After production is deployed, I will:

- Update `extension/manifest.json` with your final production URL
- Add proper icons (16x16, 48x48, 128x128) — I'll create placeholder SVGs you can replace
- Write the Chrome Web Store listing description
- Create a `extension-store-assets/` folder with screenshot templates and the store description
- Package the extension into a `.zip` ready for upload

---

### STEP 16 — YOU: Submit to Chrome Web Store

1. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 developer fee (only once ever)
3. Click **New Item** → upload the `.zip` I prepared
4. Fill in the store listing:
   - Screenshots (4-5 showing Gmail sidebar in action)
   - Short description (132 chars max)
   - Detailed description (I'll write this for you)
   - Privacy policy URL: `https://your-domain.com/privacy`
5. In the **Privacy** tab:
   - Justify the `activeTab` permission: "To inject the MailDraft button in Gmail compose windows"
   - Justify the `storage` permission: "To store your authentication token and app URL preference"
   - Justify `https://mail.google.com/*`: "To detect Gmail compose windows and insert email templates"
6. Submit for review → wait 1-7 business days

---

## PHASE 6 — Launch

---

### STEP 17 — YOU: Launch checklist

Before announcing to anyone:

- [ ] Test the complete flow end-to-end with a fresh account (sign up → create team → build template → use in Gmail)
- [ ] Test billing: upgrade to Pro, downgrade to Starter, verify limits
- [ ] Verify the privacy policy URL is live and accessible
- [ ] Verify `/api/health` returns `{"status":"ok"}`
- [ ] Enable 2FA on your Supabase account, Google Cloud account, Stripe account, and Vercel account
- [ ] Set up error monitoring (Vercel has built-in error tracking — check it)

---

### STEP 18 — YOU: Announce

Recommended order:
1. **Your network first** — share with 5-10 people you know who send business emails. Get real feedback.
2. **ProductHunt** — schedule for a Tuesday or Wednesday at 12:01am PST
3. **Chrome Web Store listing** — gets organic discovery
4. **LinkedIn/X** — short demo video showing the Gmail sidebar in action

---

## Quick reference: current status

| Step | Who | Status |
|------|-----|--------|
| 1 — Build the app | ME | ✅ Done |
| 2 — Supabase setup | YOU | ⏳ Waiting |
| 3 — Google Cloud setup | YOU | ⏳ Waiting |
| 4 — Configure .env.local | YOU | ⏳ Waiting |
| 5 — Run app + create team | YOU | ⏳ Waiting |
| 6 — Test Chrome extension | YOU | ⏳ Waiting |
| 7 — Build team onboarding | ME | ⏳ After step 6 |
| 8 — Test onboarding | YOU | ⏳ After step 7 |
| 9 — Stripe account + products | YOU | ⏳ After step 8 |
| 10 — Build billing | ME | ⏳ After step 9 |
| 11 — Test billing locally | YOU | ⏳ After step 10 |
| 12 — Deploy to Vercel | YOU | ⏳ After step 11 |
| 13 — Update credentials for prod | YOU | ⏳ After step 12 |
| 14 — Custom domain | YOU | ⏳ Optional |
| 15 — Package extension | ME | ⏳ After step 13 |
| 16 — Submit to Chrome Web Store | YOU | ⏳ After step 15 |
| 17 — Launch checklist | YOU | ⏳ After step 16 |
| 18 — Announce | YOU | ⏳ Last |

---

## One rule

**Always tell me what step you just finished and if anything looked wrong or different than described.**
I will adapt. The steps above assume things will go mostly right — real setup always has small surprises.
