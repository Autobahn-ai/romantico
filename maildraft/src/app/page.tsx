import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Layers, Paperclip, Zap, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Mail className="h-6 w-6 text-blue-600" />
            MailDraft
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Dynamic email templates for teams
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Compose perfect emails<br />
          <span className="text-blue-600">with one click</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Build modular email templates with blocks and options. Your team picks the right pieces,
          and MailDraft assembles the perfect email — complete with auto-attached documents.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-base">
              Start for free
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              View demo
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">How it works</h2>
        <p className="text-center text-slate-600 mb-16 max-w-xl mx-auto">
          Create templates once. Your team uses them forever.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">1. Build templates</h3>
            <p className="text-slate-600 text-sm">
              Create templates with modular blocks. Each block has multiple options to choose from.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">2. Choose options</h3>
            <p className="text-slate-600 text-sm">
              Pick the right option for each block. The sidebar in Gmail guides you through the choices.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Paperclip className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">3. Auto-attach documents</h3>
            <p className="text-slate-600 text-sm">
              The right Google Drive files are automatically included based on your selections.
            </p>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Real example</h2>
          <p className="text-center text-slate-600 mb-12">
            Template: &quot;Onboarding new client&quot;
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6 space-y-3">
              <p className="font-semibold text-sm text-slate-500 uppercase tracking-wide">Template blocks</p>
              {[
                { name: 'Greeting', options: ['Formal', 'Informal'] },
                { name: 'Contract type', options: ['Basic', 'Premium', 'Enterprise'], attach: true },
                { name: 'Legal language', options: ['Spanish', 'English', 'German'], attach: true },
                { name: 'Closing', options: ['With meeting', 'Without meeting'] },
              ].map(block => (
                <div key={block.name} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-slate-800">{block.name}</p>
                    <p className="text-xs text-slate-500">{block.options.join(' / ')}</p>
                    {block.attach && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                        <Paperclip className="h-3 w-3" /> PDF attached per option
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border p-6 space-y-3">
              <p className="font-semibold text-sm text-slate-500 uppercase tracking-wide">Result</p>
              <div className="text-sm space-y-2">
                <p className="text-slate-600">User selects: <strong>Formal + Premium + Spanish + With meeting</strong></p>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs text-slate-500 mb-1">Generated email:</p>
                  <p className="text-slate-800 italic text-xs leading-relaxed">
                    &quot;Dear {'{nombre}'}, We are pleased to attach the premium contract...
                    [terms_es.pdf + contrato_premium.pdf attached]&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Ready to streamline your team&apos;s emails?
        </h2>
        <p className="text-slate-600 mb-8">
          Set up your first template in minutes. No credit card required.
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12 px-10 text-base">
            Get started for free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-slate-700">MailDraft</span>
        </div>
        <p>Dynamic email templates for teams &bull; Built with Next.js &amp; Supabase</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
