# MailDraft — Dynamic Email Templates

A system for building modular email templates with blocks and options. Teams pick the right pieces in Gmail and MailDraft assembles the perfect email, complete with auto-attached Google Drive documents.

## Architecture

- **Web App**: Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui
- **Chrome Extension**: Manifest V3 content script injected into Gmail
- **Database**: Supabase (PostgreSQL + Auth + Row Level Security)

## How it works

1. **Admins** build templates in the web app dashboard
2. Templates have **blocks** (e.g. "Greeting", "Contract type")
3. Each block has **options** (e.g. "Formal" / "Informal") with text and optional Drive attachments
4. **Team members** use the Chrome extension in Gmail to pick options per block
5. MailDraft assembles the email body + auto-includes the right document links

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in the SQL Editor
3. Enable Google OAuth in Authentication > Providers
4. Add your domain to the redirect URLs

### 2. Google Cloud Console

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable: **Google Drive API** and **Google Picker API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized origins and redirect URIs

### 3. Web App

```bash
cd maildraft
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and Google Client ID
npm install
npm run dev
```

Environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4. Chrome Extension

1. Open Chrome → Extensions → Enable Developer Mode
2. Click "Load unpacked" → select the `extension/` folder
3. Click the MailDraft icon in your toolbar
4. Set your app URL (e.g. `https://your-app.vercel.app`)
5. Sign in → open Gmail → start a compose → click the MailDraft button

## Database Schema

```
teams
  └── team_members (admin/member roles)
  └── templates
        └── template_variables ({nombre}, {fecha}, etc.)
        └── template_blocks (position-ordered)
              └── block_options (position-ordered)
                    └── option_attachments (Google Drive files)
```

## File Structure

```
maildraft/
├── src/
│   ├── app/
│   │   ├── page.tsx                    (landing page)
│   │   ├── login/page.tsx              (Google OAuth login)
│   │   ├── dashboard/page.tsx          (template list)
│   │   ├── templates/
│   │   │   ├── new/page.tsx            (create template)
│   │   │   └── [id]/edit/page.tsx      (edit template)
│   │   └── api/
│   │       ├── templates/route.ts      (GET list, POST create)
│   │       ├── templates/[id]/route.ts (GET, PUT, DELETE)
│   │       ├── blocks/route.ts         (POST, PUT, DELETE)
│   │       ├── options/route.ts        (POST, PUT, DELETE)
│   │       └── attachments/route.ts    (POST, DELETE)
│   ├── components/
│   │   ├── TemplateBuilder.tsx         (main editor with DnD)
│   │   ├── BlockEditor.tsx             (sortable block editor)
│   │   ├── OptionEditor.tsx            (option text + Drive picker)
│   │   ├── GoogleDrivePicker.tsx       (Google Drive file picker)
│   │   ├── TemplatePreview.tsx         (live email preview)
│   │   └── VariableInput.tsx           (variable manager)
│   ├── lib/
│   │   ├── supabase.ts                 (browser Supabase client)
│   │   ├── supabase-server.ts          (server Supabase client)
│   │   └── google-drive.ts             (Drive Picker API helpers)
│   └── types/index.ts                  (TypeScript types)
├── extension/
│   ├── manifest.json                   (Manifest V3)
│   ├── background.js                   (service worker)
│   ├── content.js                      (Gmail injection)
│   ├── content.css                     (sidebar styles)
│   ├── popup.html                      (extension popup)
│   ├── popup.js
│   └── sidebar/                        (sidebar reference files)
└── supabase-schema.sql                 (run in Supabase SQL Editor)
```

## Deploy

```bash
# Deploy to Vercel
npx vercel --prod
```

Add environment variables in Vercel dashboard.

## Notes

- **Attachments**: MVP inserts Google Drive links in the email body. Future: use Gmail API to attach actual files.
- **Gmail DOM**: Uses `role` and `aria-label` selectors for stability across Gmail updates.
- **Auth flow**: Users sign in once via the extension popup → token stored in `chrome.storage.sync` → used for all API calls.
