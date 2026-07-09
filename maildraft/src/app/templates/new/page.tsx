import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import TemplateBuilder from '@/components/TemplateBuilder';

export default function NewTemplatePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <Mail className="h-5 w-5 text-blue-600" />
            MailDraft
          </div>
          <span className="text-muted-foreground text-sm">/ New template</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create new template</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build a template with blocks and options for your team to use in Gmail
          </p>
        </div>
        <TemplateBuilder />
      </div>
    </div>
  );
}
