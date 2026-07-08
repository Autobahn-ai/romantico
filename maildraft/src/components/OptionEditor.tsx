'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, X, FileText } from 'lucide-react';
import GoogleDrivePicker from './GoogleDrivePicker';
import { DraftAttachment, DraftOption, DraftVariable } from '@/types';

interface OptionEditorProps {
  option: DraftOption;
  variables: DraftVariable[];
  onChange: (option: DraftOption) => void;
  onDelete: () => void;
  showDelete: boolean;
}

export default function OptionEditor({
  option,
  variables,
  onChange,
  onDelete,
  showDelete,
}: OptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === '{') {
      // Show variable autocomplete hint
    }
  }

  function insertVariable(varName: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = option.body_text;
    const newText = text.slice(0, start) + `{${varName}}` + text.slice(end);

    onChange({ ...option, body_text: newText });

    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + varName.length + 2;
      textarea.focus();
    }, 0);
  }

  function addAttachments(files: DraftAttachment[]) {
    const existing = option.attachments.map(a => a.google_drive_file_id);
    const newFiles = files.filter(f => !existing.includes(f.google_drive_file_id));
    onChange({ ...option, attachments: [...option.attachments, ...newFiles] });
  }

  function removeAttachment(id: string) {
    onChange({ ...option, attachments: option.attachments.filter(a => a.id !== id) });
  }

  return (
    <div className="border rounded-lg p-4 bg-background space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Option label</Label>
          <Input
            placeholder="e.g. Formal, Premium, Español..."
            value={option.label}
            onChange={e => onChange({ ...option, label: e.target.value })}
            className="h-8 mt-1"
          />
        </div>
        {showDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive mt-4"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Email body text</Label>
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {variables.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => insertVariable(v.variable_name)}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors font-mono"
              >
                {'{' + v.variable_name + '}'}
              </button>
            ))}
          </div>
        )}
        <Textarea
          ref={textareaRef}
          placeholder="Write the email text for this option..."
          value={option.body_text}
          onChange={e => onChange({ ...option, body_text: e.target.value })}
          onKeyDown={handleTextareaKeyDown}
          className="mt-1 min-h-[100px] font-sans text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Attachments (Google Drive)</Label>
          <GoogleDrivePicker onFilesSelected={addAttachments} />
        </div>

        {option.attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No attachments</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {option.attachments.map(att => (
              <div
                key={att.id}
                className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
              >
                <FileText className="h-3 w-3 text-muted-foreground" />
                <a
                  href={att.google_drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline max-w-[150px] truncate"
                >
                  {att.file_name}
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
