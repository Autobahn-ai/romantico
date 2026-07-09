import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — MailDraft',
};

export default function TermsPage() {
  const lastUpdated = 'July 2026';
  const contactEmail = 'legal@yourdomain.com'; // TODO: replace with your email

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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-500 mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance</h2>
            <p>
              By signing up for or using MailDraft, you agree to these Terms of Service.
              If you are accepting on behalf of a company, you represent that you have the authority to bind that company.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. The service</h2>
            <p>
              MailDraft provides a web application and Chrome extension for creating and using dynamic email templates inside Gmail.
              We reserve the right to modify or discontinue features with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Your account</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>You are responsible for keeping your account credentials secure</li>
              <li>You must be 18 years or older to use MailDraft</li>
              <li>You are responsible for all activity that occurs under your account</li>
              <li>Notify us immediately at {contactEmail} if you suspect unauthorized access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Acceptable use</h2>
            <p>You agree NOT to use MailDraft to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Send spam, unsolicited emails, or bulk communications without recipient consent</li>
              <li>Violate any applicable law or regulation (including anti-spam laws like CAN-SPAM and GDPR)</li>
              <li>Harass, threaten, or deceive individuals</li>
              <li>Attempt to access data that does not belong to your team</li>
              <li>Reverse-engineer, scrape, or resell the service without written permission</li>
              <li>Upload malicious content or attachments designed to harm recipients</li>
            </ul>
            <p className="mt-3">
              Violation of these terms may result in immediate account termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Subscriptions & billing</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li><strong>Free plan:</strong> Includes 3 read-only templates. No payment required.</li>
              <li><strong>Solo plan:</strong> €3/month per user. Unlimited templates.</li>
              <li>
                <strong>Team plan:</strong> €3/month covering up to 10 users. Additional users beyond
                10 are charged at €2/user/month. The monthly charge is calculated based on your active seat count.
              </li>
              <li>Paid plans are billed monthly. Annual billing may be offered in future.</li>
              <li>Payments are processed by Stripe, a PCI-DSS compliant payment processor</li>
              <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
              <li>We do not store your payment card details</li>
              <li>Refunds: we offer a 14-day refund for new subscriptions. Contact us at {contactEmail}.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your content</h2>
            <p>
              You own the templates and content you create in MailDraft.
              By using the service, you grant us a limited license to store and process your content solely to provide the service.
              We will never use your email templates for marketing, training AI models, or any purpose beyond operating the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Limitation of liability</h2>
            <p>
              MailDraft is provided &quot;as is.&quot; To the maximum extent permitted by law:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability to you for any claim is limited to the fees you paid us in the 12 months preceding the claim</li>
              <li>We are not responsible for emails you send using templates created in MailDraft</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Termination</h2>
            <p>
              You may cancel your account at any time. We may suspend or terminate accounts that violate these terms.
              Upon termination, your data will be retained for 30 days (for recovery) then permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Changes</h2>
            <p>
              We may update these terms. For material changes, we will notify you at least 14 days in advance.
              Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Contact</h2>
            <p>
              Questions? Email us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600">{contactEmail}</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t mt-16 py-8 text-center text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-700">← Back to MailDraft</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
      </footer>
    </div>
  );
}
