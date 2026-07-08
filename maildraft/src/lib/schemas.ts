import { z } from 'zod';

// ── Primitives ───────────────────────────────────────────────────────────────

const uuidSchema = z.string().uuid('Must be a valid UUID');
const nonEmptyString = (max = 500) =>
  z.string().min(1, 'Required').max(max, `Max ${max} characters`);

// ── Option attachment ────────────────────────────────────────────────────────

export const attachmentSchema = z.object({
  file_name: z.string().min(1).max(255),
  google_drive_file_id: z.string().min(1).max(255),
  google_drive_url: z.string().url('Must be a valid URL').max(2048),
  mime_type: z.string().max(127).optional().default(''),
});

// ── Block option ─────────────────────────────────────────────────────────────

export const blockOptionSchema = z.object({
  label: nonEmptyString(200),
  body_text: z.string().min(1, 'Option text is required').max(50_000),
  position: z.number().int().min(0).max(999),
  attachments: z.array(attachmentSchema).max(20, 'Max 20 attachments per option').default([]),
});

// ── Template block ───────────────────────────────────────────────────────────

export const templateBlockSchema = z.object({
  name: nonEmptyString(200),
  description: z.string().max(500).optional().default(''),
  position: z.number().int().min(0).max(999),
  is_required: z.boolean().default(true),
  options: z
    .array(blockOptionSchema)
    .min(1, 'Each block must have at least one option')
    .max(20, 'Max 20 options per block'),
});

// ── Template variable ────────────────────────────────────────────────────────

export const templateVariableSchema = z.object({
  variable_name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Variable names can only contain lowercase letters, numbers, and underscores'),
  auto_fill_type: z.enum(['manual', 'recipient_name', 'today_date', 'sender_name', 'custom']),
  default_value: z.string().max(500).optional().default(''),
});

// ── Create/update template ───────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: nonEmptyString(200),
  description: z.string().max(1000).optional().default(''),
  subject_line: z.string().max(500).optional().default(''),
  variables: z.array(templateVariableSchema).max(30, 'Max 30 variables per template').default([]),
  blocks: z
    .array(templateBlockSchema)
    .min(1, 'Template must have at least one block')
    .max(50, 'Max 50 blocks per template'),
});

export const updateTemplateSchema = createTemplateSchema;

// ── Block CRUD ───────────────────────────────────────────────────────────────

export const createBlockSchema = z.object({
  template_id: uuidSchema,
  name: nonEmptyString(200),
  description: z.string().max(500).optional().default(''),
  position: z.number().int().min(0).max(999),
  is_required: z.boolean().default(true),
});

export const updateBlockSchema = z.object({
  id: uuidSchema,
  name: nonEmptyString(200).optional(),
  description: z.string().max(500).optional(),
  position: z.number().int().min(0).max(999).optional(),
  is_required: z.boolean().optional(),
});

// ── Option CRUD ──────────────────────────────────────────────────────────────

export const createOptionSchema = z.object({
  block_id: uuidSchema,
  label: nonEmptyString(200),
  body_text: z.string().min(1).max(50_000),
  position: z.number().int().min(0).max(999),
});

export const updateOptionSchema = z.object({
  id: uuidSchema,
  label: nonEmptyString(200).optional(),
  body_text: z.string().min(1).max(50_000).optional(),
  position: z.number().int().min(0).max(999).optional(),
});

// ── Attachment CRUD ──────────────────────────────────────────────────────────

export const createAttachmentSchema = z.object({
  option_id: uuidSchema,
  file_name: z.string().min(1).max(255),
  google_drive_file_id: z.string().min(1).max(255),
  google_drive_url: z.string().url().max(2048),
  mime_type: z.string().max(127).optional().default(''),
});
