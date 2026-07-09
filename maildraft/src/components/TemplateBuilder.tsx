'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import BlockEditor from './BlockEditor';
import VariableInput from './VariableInput';
import TemplatePreview from './TemplatePreview';
import { DraftTemplate, DraftBlock, DraftVariable } from '@/types';

interface TemplateBuilderProps {
  initialData?: DraftTemplate;
  templateId?: string;
}

function createEmptyBlock(position: number): DraftBlock {
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: '',
    description: '',
    position,
    is_required: true,
    options: [
      {
        id: `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        label: '',
        body_text: '',
        position: 0,
        attachments: [],
      },
    ],
  };
}

const emptyTemplate: DraftTemplate = {
  name: '',
  description: '',
  subject_line: '',
  variables: [],
  blocks: [],
};

export default function TemplateBuilder({ initialData, templateId }: TemplateBuilderProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<DraftTemplate>(initialData || emptyTemplate);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = template.blocks.findIndex(b => b.id === active.id);
    const newIndex = template.blocks.findIndex(b => b.id === over.id);

    const reordered = arrayMove(template.blocks, oldIndex, newIndex).map((b, i) => ({
      ...b,
      position: i,
    }));

    setTemplate(prev => ({ ...prev, blocks: reordered }));
  }

  function addBlock() {
    const newBlock = createEmptyBlock(template.blocks.length);
    setTemplate(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  }

  function updateBlock(id: string, updated: DraftBlock) {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? updated : b)),
    }));
  }

  function deleteBlock(id: string) {
    setTemplate(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, position: i })),
    }));
  }

  function updateVariables(variables: DraftVariable[]) {
    setTemplate(prev => ({ ...prev, variables }));
  }

  async function handleSave() {
    if (!template.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (template.blocks.length === 0) {
      toast.error('Add at least one block');
      return;
    }

    setSaving(true);
    try {
      const url = templateId ? `/api/templates/${templateId}` : '/api/templates';
      const method = templateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          subject_line: template.subject_line,
          variables: template.variables,
          blocks: template.blocks.map((block, bi) => ({
            name: block.name,
            description: block.description,
            position: bi,
            is_required: block.is_required,
            options: block.options.map((opt, oi) => ({
              label: opt.label,
              body_text: opt.body_text,
              position: oi,
              attachments: opt.attachments.map(att => ({
                file_name: att.file_name,
                google_drive_file_id: att.google_drive_file_id,
                google_drive_url: att.google_drive_url,
                mime_type: att.mime_type,
              })),
            })),
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Save failed');
      }

      toast.success(templateId ? 'Template updated!' : 'Template created!');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Template metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Template Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template name *</Label>
              <Input
                id="template-name"
                placeholder="e.g. Onboarding nuevo cliente"
                value={template.name}
                onChange={e => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="template-desc">Description</Label>
              <Textarea
                id="template-desc"
                placeholder="What is this template for?"
                value={template.description}
                onChange={e => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label htmlFor="subject-line">
                Email subject line{' '}
                <span className="text-muted-foreground font-normal">(supports variables)</span>
              </Label>
              <Input
                id="subject-line"
                placeholder="e.g. Bienvenido a {empresa}, {nombre}"
                value={template.subject_line}
                onChange={e => setTemplate(prev => ({ ...prev, subject_line: e.target.value }))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variables</CardTitle>
            <p className="text-xs text-muted-foreground">
              Define placeholders like {'{nombre}'}, {'{empresa}'} to use in block texts
            </p>
          </CardHeader>
          <CardContent>
            <VariableInput
              variables={template.variables}
              onChange={updateVariables}
            />
          </CardContent>
        </Card>

        {/* Blocks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Blocks ({template.blocks.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Drag to reorder. Each block has options the user picks from when composing an email.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={template.blocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {template.blocks.map(block => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    variables={template.variables}
                    onChange={updated => updateBlock(block.id, updated)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {template.blocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No blocks yet. Add your first block below.</p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addBlock}
              className="w-full border-dashed gap-2"
            >
              <Plus className="h-4 w-4" /> Add block
            </Button>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save template'}
          </Button>
        </div>
      </div>

      {/* Preview panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <TemplatePreview
            templateName={template.name}
            subjectLine={template.subject_line}
            blocks={template.blocks}
            variables={template.variables}
          />
        </div>
      </div>
    </div>
  );
}
