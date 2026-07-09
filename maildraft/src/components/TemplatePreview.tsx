'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { DraftBlock, DraftVariable } from '@/types';

interface TemplatePreviewProps {
  templateName: string;
  subjectLine: string;
  blocks: DraftBlock[];
  variables: DraftVariable[];
}

export default function TemplatePreview({
  templateName,
  subjectLine,
  blocks,
  variables,
}: TemplatePreviewProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  function selectOption(blockId: string, optionId: string) {
    setSelectedOptions(prev => ({ ...prev, [blockId]: optionId }));
  }

  function fillVariables(text: string): string {
    let filled = text;
    const today = new Date().toLocaleDateString('es-ES');

    variables.forEach(v => {
      let value = '';
      switch (v.auto_fill_type) {
        case 'today_date':
          value = today;
          break;
        case 'recipient_name':
          value = '[Recipient Name]';
          break;
        case 'sender_name':
          value = '[Sender Name]';
          break;
        case 'manual':
        case 'custom':
          value = manualValues[v.variable_name] || v.default_value || `{${v.variable_name}}`;
          break;
      }
      filled = filled.replace(new RegExp(`\\{${v.variable_name}\\}`, 'g'), value);
    });

    return filled;
  }

  function buildPreviewContent() {
    const parts: string[] = [];
    const attachments: { name: string; url: string }[] = [];

    blocks.forEach(block => {
      const selectedOptionId = selectedOptions[block.id];
      const option = block.options.find(o => o.id === selectedOptionId) || block.options[0];

      if (option) {
        parts.push(fillVariables(option.body_text));
        option.attachments.forEach(att => {
          attachments.push({ name: att.file_name, url: att.google_drive_url });
        });
      }
    });

    return { body: parts.join('\n\n'), attachments };
  }

  const { body, attachments } = buildPreviewContent();
  const previewSubject = fillVariables(subjectLine);
  const manualVariables = variables.filter(v => v.auto_fill_type === 'manual' || v.auto_fill_type === 'custom');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-7 text-xs gap-1"
            >
              {showPreview ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showPreview ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>

        {showPreview && (
          <CardContent className="space-y-4">
            {/* Option selectors */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Select options:
              </p>
              {blocks.map(block => (
                <div key={block.id}>
                  <Label className="text-xs font-medium">
                    {block.name}
                    {block.is_required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {block.options.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => selectOption(block.id, option.id)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          selectedOptions[block.id] === option.id ||
                          (!selectedOptions[block.id] && block.options[0]?.id === option.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-muted'
                        }`}
                      >
                        {option.label || `Option ${block.options.indexOf(option) + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Manual variable inputs */}
            {manualVariables.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Fill variables:
                </p>
                {manualVariables.map(v => (
                  <div key={v.id} className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-1 rounded w-24 truncate">
                      {'{' + v.variable_name + '}'}
                    </code>
                    <Input
                      placeholder={v.default_value || v.variable_name}
                      value={manualValues[v.variable_name] || ''}
                      onChange={e =>
                        setManualValues(prev => ({
                          ...prev,
                          [v.variable_name]: e.target.value,
                        }))
                      }
                      className="h-7 text-xs flex-1"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Preview output */}
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              {previewSubject && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Subject:</p>
                  <p className="text-sm font-medium">{previewSubject}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-medium">Body:</p>
                <pre className="text-sm whitespace-pre-wrap font-sans mt-1 max-h-[300px] overflow-y-auto">
                  {body || 'Select options above to see preview'}
                </pre>
              </div>

              {attachments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mt-2">Attachments:</p>
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs mt-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {att.name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
