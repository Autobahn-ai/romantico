import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedUser, getUserTeam } from '@/lib/auth';
import { updateTemplateSchema } from '@/lib/schemas';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
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

type Params = { params: Promise<{ id: string }> };

/** Verify the template belongs to the user's team before any operation */
async function getTemplateForTeam(templateId: string, teamId: string) {
  const { data } = await db()
    .from('templates')
    .select('id, team_id')
    .eq('id', templateId)
    .eq('team_id', teamId) // crucial: scoped to team
    .single();
  return data;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');

    const { data: template, error } = await db()
      .from('templates')
      .select(`
        *,
        template_blocks (
          *,
          block_options (*, option_attachments (*))
        ),
        template_variables (*)
      `)
      .eq('id', id)
      .eq('team_id', team.teamId) // scoped to team — prevents data leakage across teams
      .single();

    if (error || !template) return notFoundResponse('Template');
    return NextResponse.json(template);
  } catch (err) {
    return internalErrorResponse(err, 'GET /api/templates/[id]');
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can edit templates');

    // Verify ownership before update
    const existing = await getTemplateForTeam(id, team.teamId);
    if (!existing) return notFoundResponse('Template');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { name, description, subject_line, variables, blocks } = parsed.data;
    const supabase = db();

    const { data: template, error: templateErr } = await supabase
      .from('templates')
      .update({ name, description, subject_line, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('team_id', team.teamId) // double-check team scope
      .select()
      .single();

    if (templateErr) return internalErrorResponse(templateErr, 'PUT /api/templates/[id] update');

    // Replace variables
    await supabase.from('template_variables').delete().eq('template_id', id);
    if (variables.length > 0) {
      await supabase.from('template_variables').insert(
        variables.map(v => ({ ...v, template_id: id }))
      );
    }

    // Replace blocks — delete cascade removes options and attachments
    const { data: oldBlocks } = await supabase
      .from('template_blocks')
      .select('id')
      .eq('template_id', id);

    if (oldBlocks && oldBlocks.length > 0) {
      const blockIds = oldBlocks.map((b: { id: string }) => b.id);
      const { data: oldOptions } = await supabase
        .from('block_options')
        .select('id')
        .in('block_id', blockIds);

      if (oldOptions && oldOptions.length > 0) {
        await supabase
          .from('option_attachments')
          .delete()
          .in('option_id', oldOptions.map((o: { id: string }) => o.id));
      }
      await supabase.from('block_options').delete().in('block_id', blockIds);
      await supabase.from('template_blocks').delete().eq('template_id', id);
    }

    for (const block of blocks) {
      const { data: insertedBlock, error: blockErr } = await supabase
        .from('template_blocks')
        .insert({
          template_id: id,
          name: block.name,
          description: block.description,
          position: block.position,
          is_required: block.is_required,
        })
        .select()
        .single();

      if (blockErr) return internalErrorResponse(blockErr, 'PUT /api/templates/[id] block');

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

        if (optErr) return internalErrorResponse(optErr, 'PUT /api/templates/[id] option');

        if (option.attachments.length > 0) {
          await supabase.from('option_attachments').insert(
            option.attachments.map(att => ({ ...att, option_id: insertedOption.id }))
          );
        }
      }
    }

    return NextResponse.json(template);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return internalErrorResponse(err, 'PUT /api/templates/[id]');
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can delete templates');

    // Scoped delete — can only delete templates that belong to the user's team
    const { error } = await db()
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('team_id', team.teamId);

    if (error) return internalErrorResponse(error, 'DELETE /api/templates/[id]');

    return NextResponse.json({ success: true });
  } catch (err) {
    return internalErrorResponse(err, 'DELETE /api/templates/[id]');
  }
}
