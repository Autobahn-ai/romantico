'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { DraftVariable } from '@/types';

interface VariableInputProps {
  variables: DraftVariable[];
  onChange: (variables: DraftVariable[]) => void;
}

const AUTO_FILL_OPTIONS = [
  { value: 'manual', label: 'Manual (user fills in)' },
  { value: 'recipient_name', label: 'Auto: Recipient name' },
  { value: 'today_date', label: 'Auto: Today\'s date' },
  { value: 'sender_name', label: 'Auto: Sender name' },
  { value: 'custom', label: 'Custom default value' },
];

const AUTO_FILL_BADGE_COLOR: Record<string, string> = {
  manual: 'bg-gray-100 text-gray-700',
  recipient_name: 'bg-blue-100 text-blue-700',
  today_date: 'bg-green-100 text-green-700',
  sender_name: 'bg-purple-100 text-purple-700',
  custom: 'bg-orange-100 text-orange-700',
};

export default function VariableInput({ variables, onChange }: VariableInputProps) {
  const [newVarName, setNewVarName] = useState('');

  function addVariable() {
    const name = newVarName.trim().replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    if (!name) return;
    if (variables.find(v => v.variable_name === name)) return;

    onChange([
      ...variables,
      {
        id: `var_${Date.now()}`,
        variable_name: name,
        auto_fill_type: 'manual',
        default_value: '',
      },
    ]);
    setNewVarName('');
  }

  function updateVariable(id: string, changes: Partial<DraftVariable>) {
    onChange(variables.map(v => (v.id === id ? { ...v, ...changes } : v)));
  }

  function removeVariable(id: string) {
    onChange(variables.filter(v => v.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Variable name (e.g. empresa)"
          value={newVarName}
          onChange={e => setNewVarName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addVariable()}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addVariable}>
          <Plus className="h-4 w-4 mr-1" /> Add variable
        </Button>
      </div>

      {variables.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No variables defined. Variables can be used in block text with {'{variable_name}'} syntax.
        </p>
      )}

      <div className="space-y-2">
        {variables.map(variable => (
          <div key={variable.id} className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30">
            <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
              {'{' + variable.variable_name + '}'}
            </code>

            <div className="flex-1">
              <Select
                value={variable.auto_fill_type}
                onValueChange={val =>
                  updateVariable(variable.id, {
                    auto_fill_type: val as DraftVariable['auto_fill_type'],
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_FILL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(variable.auto_fill_type === 'manual' || variable.auto_fill_type === 'custom') && (
              <Input
                placeholder="Default value"
                value={variable.default_value}
                onChange={e => updateVariable(variable.id, { default_value: e.target.value })}
                className="h-8 text-xs w-32"
              />
            )}

            <Badge className={`text-xs ${AUTO_FILL_BADGE_COLOR[variable.auto_fill_type]}`}>
              {variable.auto_fill_type === 'manual' ? 'manual' : 'auto'}
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVariable(variable.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
