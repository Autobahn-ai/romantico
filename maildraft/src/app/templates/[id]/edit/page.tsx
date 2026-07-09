import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import TemplateBuilder from '@/components/TemplateBuilder';
import { createClient } from '@supabase/supabase-js';
import { DraftTemplate, Template } from '@/types';
import { notFound } from 'next/navigation';

async function getTemplate(id: string): Promise<Template | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      template_blocks (
        *,
        block_options (
          *,
          option_attachments (*)
        )
      ),
      template_variables (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Template;
}

function templateToDraft(template: Template): DraftTemplate {
  return {
    name: template.name,
    description: template.description || '',
    subject_line: template.subject_line || '',
    variables: (template.template_variables || []).map(v => ({
      id: v.id,
      variable_name: v.variable_name,
      auto_fill_type: v.auto_fill_type,
      default_value: v.default_value || '',
    })),
    blocks: (template.template_blocks || [])
      .sort((a, b) => a.position - b.position)
      .map(block => ({
        id: block.id,
        name: block.name,
        description: block.description || '',
        position: block.position,
        is_required: block.is_required,
        options: (block.block_options || [])
          .sort((a, b) => a.position - b.position)
          .map(opt => ({
            id: opt.id,
            label: opt.label,
            body_text: opt.body_text,
            position: opt.position,
            attachments: (opt.option_attachments || []).map(att => ({
              id: att.id,
              file_name: att.file_name,
              google_drive_file_id: att.google_drive_file_id,
              google_drive_url: att.google_drive_url,
              mime_type: att.mime_type || '',
            })),
          })),
      })),
  };
}

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  const initialData = templateToDraft(template);

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
          <span className="text-muted-foreground text-sm">/ Edit template</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Edit: {template.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Modify this template&apos;s blocks, options, and attachments
          </p>
        </div>
        <TemplateBuilder initialData={initialData} templateId={id} />
      </div>
    </div>
  );
}
