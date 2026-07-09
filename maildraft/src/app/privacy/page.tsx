import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — MailDraft',
};

export default function PrivacyPage() {
  const lastUpdated = 'July 2026';
  const contactEmail = 'privacy@yourdomain.com'; // TODO: replace with your email

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Mail className="h-5 w-5 text-blue-600" />
            MailDraft
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Who we are</h2>
            <p>
              MailDraft is a B2B SaaS tool that helps teams compose personalized emails from dynamic templates.
              We are the data controller for the personal data we collect.
              Contact us at <a href={`mailto:${contactEmail}`} className="text-blue-600">{contactEmail}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Data we collect</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Account data:</strong> Your name and email address, obtained via Google OAuth when you sign in.
              </li>
              <li>
                <strong>Template data:</strong> The email templates you create (block names, option text, subject lines, variable names).
                This is content you explicitly create and control.
              </li>
              <li>
                <strong>Google Drive file metadata:</strong> File names, IDs, and URLs for files you attach to template options.
                We do not access or store the file contents.
              </li>
              <li>
                <strong>Usage data:</strong> Basic server logs (request timestamps, endpoints accessed, error rates).
                We do not use analytics cookies or behavioral tracking.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. What we do NOT collect</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>We do NOT read your email content or Gmail inbox</li>
              <li>We do NOT read or store the contents of your Google Drive files (only metadata)</li>
              <li>We do NOT sell your data to third parties</li>
              <li>We do NOT use advertising cookies or cross-site tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. How we use your data</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>To provide the MailDraft service (storing your templates, authenticating you)</li>
              <li>To associate your account with your team's workspace</li>
              <li>To contact you about service changes or security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Google OAuth & Drive access</h2>
            <p>
              We request the following Google OAuth scopes:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><code>email</code> and <code>profile</code> — to identify you</li>
              <li><code>https://www.googleapis.com/auth/drive.readonly</code> — to let you pick files from your Drive to attach to email templates</li>
            </ul>
            <p className="mt-3">
              The Drive scope is used only when you explicitly click &quot;Attach from Drive&quot; in the template builder.
              We store only the file name, Google file ID, and shareable URL — not the file contents.
            </p>
            <p className="mt-3">
              MailDraft&apos;s use and transfer of information received from Google APIs adheres to the{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600" target="_blank" rel="noopener noreferrer">
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Data storage & security</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Data is stored in Supabase (PostgreSQL), hosted in the EU or US depending on your region</li>
              <li>All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)</li>
              <li>Row Level Security ensures team data is isolated — no team can access another team&apos;s data</li>
              <li>The Chrome extension stores authentication tokens in <code>chrome.storage.sync</code>, which is encrypted by Chrome and synced only to your own Google account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Data retention</h2>
            <p>
              We retain your data for as long as your account is active.
              If you delete your account, all associated templates, blocks, options, and personal data are permanently deleted within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Your rights (GDPR)</h2>
            <p>If you are in the EU/EEA, you have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong>Access</strong> — request a copy of your personal data</li>
              <li><strong>Rectification</strong> — correct inaccurate data</li>
              <li><strong>Erasure</strong> — delete your account and all associated data</li>
              <li><strong>Portability</strong> — receive your data in a machine-readable format</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600">{contactEmail}</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Chrome Extension</h2>
            <p>
              The MailDraft Chrome extension operates on <code>mail.google.com</code> to inject a button into the Gmail compose window.
              It does not read your emails, contacts, or inbox.
              It only communicates with the MailDraft API to fetch your team&apos;s email templates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Changes to this policy</h2>
            <p>
              We may update this policy. We will notify you by email or via an in-app notice at least 14 days before material changes take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Contact</h2>
            <p>
              Questions or concerns? Contact us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600">{contactEmail}</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t mt-16 py-8 text-center text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">← Back to MailDraft</Link>
        {' · '}
        <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
      </footer>
    </div>
  );
}
