'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import OptionEditor from './OptionEditor';
import { DraftBlock, DraftOption, DraftVariable } from '@/types';

interface BlockEditorProps {
  block: DraftBlock;
  variables: DraftVariable[];
  onChange: (block: DraftBlock) => void;
  onDelete: () => void;
}

function createEmptyOption(position: number): DraftOption {
  return {
    id: `opt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    label: '',
    body_text: '',
    position,
    attachments: [],
  };
}

export default function BlockEditor({ block, variables, onChange, onDelete }: BlockEditorProps) {
  const [collapsed, setCollapsed] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  function addOption() {
    const newOption = createEmptyOption(block.options.length);
    onChange({ ...block, options: [...block.options, newOption] });
  }

  function updateOption(id: string, updated: DraftOption) {
    onChange({
      ...block,
      options: block.options.map(o => (o.id === id ? updated : o)),
    });
  }

  function deleteOption(id: string) {
    onChange({ ...block, options: block.options.filter(o => o.id !== id) });
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex-1 flex items-center gap-3">
              <Input
                placeholder="Block name (e.g. Saludo, Tipo contrato...)"
                value={block.name}
                onChange={e => onChange({ ...block, name: e.target.value })}
                className="flex-1 h-8 font-medium"
              />

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Required</Label>
                <Switch
                  checked={block.is_required}
                  onCheckedChange={checked => onChange({ ...block, is_required: checked })}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {!collapsed && (
            <Input
              placeholder="Description (optional)"
              value={block.description}
              onChange={e => onChange({ ...block, description: e.target.value })}
              className="h-7 text-xs text-muted-foreground mt-1"
            />
          )}
        </CardHeader>

        {!collapsed && (
          <CardContent className="space-y-3">
            {block.options.map((option, idx) => (
              <div key={option.id}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Option {String.fromCharCode(65 + idx)}
                </p>
                <OptionEditor
                  option={option}
                  variables={variables}
                  onChange={updated => updateOption(option.id, updated)}
                  onDelete={() => deleteOption(option.id)}
                  showDelete={block.options.length > 1}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
              className="w-full border-dashed gap-2"
            >
              <Plus className="h-4 w-4" /> Add option
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
