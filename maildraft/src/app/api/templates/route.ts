import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedUser, getUserTeam } from '@/lib/auth';
import { createTemplateSchema } from '@/lib/schemas';
import {
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api-response';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('You are not a member of any team');

    const { data: templates, error } = await db()
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
      .eq('team_id', team.teamId)
      .order('created_at', { ascending: false });

    if (error) return internalErrorResponse(error, 'GET /api/templates');

    return NextResponse.json(templates);
  } catch (err) {
    return internalErrorResponse(err, 'GET /api/templates');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('You are not a member of any team');
    if (team.role !== 'admin') return forbiddenResponse('Only team admins can create templates');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { name, description, subject_line, variables, blocks } = parsed.data;

    const supabase = db();

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({ team_id: team.teamId, name, description, subject_line, created_by: auth.userId })
      .select()
      .single();

    if (templateError) return internalErrorResponse(templateError, 'POST /api/templates insert');

    if (variables.length > 0) {
      const { error } = await supabase.from('template_variables').insert(
        variables.map(v => ({ ...v, template_id: template.id }))
      );
      if (error) return internalErrorResponse(error, 'POST /api/templates variables');
    }

    for (const block of blocks) {
      const { data: insertedBlock, error: blockErr } = await supabase
        .from('template_blocks')
        .insert({
          template_id: template.id,
          name: block.name,
          description: block.description,
          position: block.position,
          is_required: block.is_required,
        })
        .select()
        .single();

      if (blockErr) return internalErrorResponse(blockErr, 'POST /api/templates block');

      for (const option of block.options) {
        const { data: insertedOption, error: optErr } = await supabase
          .from('block_options')
          .insert({
            block_id: insertedBlock.id,
            label: option.label,
            body_text: option.body_text,
            position: option.position,
          })
          .select()
          .single();

        if (optErr) return internalErrorResponse(optErr, 'POST /api/templates option');

        if (option.attachments.length > 0) {
          const { error: attErr } = await supabase.from('option_attachments').insert(
            option.attachments.map(att => ({ ...att, option_id: insertedOption.id }))
          );
          if (attErr) return internalErrorResponse(attErr, 'POST /api/templates attachment');
        }
      }
    }

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return internalErrorResponse(err, 'POST /api/templates');
  }
}
