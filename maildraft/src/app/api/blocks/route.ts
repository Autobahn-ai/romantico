import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserTeam } from '@/lib/auth';
import { createBlockSchema, updateBlockSchema } from '@/lib/schemas';
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

/** Verify the template_id belongs to the requesting user's team */
async function verifyTemplateOwnership(templateId: string, teamId: string): Promise<boolean> {
  const { data } = await db()
    .from('templates')
    .select('id')
    .eq('id', templateId)
    .eq('team_id', teamId)
    .single();
  return !!data;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can add blocks');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = createBlockSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const owns = await verifyTemplateOwnership(parsed.data.template_id, team.teamId);
    if (!owns) return forbiddenResponse('Template not found in your team');

    const { data, error } = await db()
      .from('template_blocks')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return internalErrorResponse(error, 'POST /api/blocks');
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return internalErrorResponse(err, 'POST /api/blocks');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can edit blocks');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = updateBlockSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { id, ...updates } = parsed.data;

    const { data, error } = await db()
      .from('template_blocks')
      .update(updates)
      .eq('id', id)
      .select('*, template_id')
      .single();

    if (error) return internalErrorResponse(error, 'PUT /api/blocks');

    // Post-update ownership check (RLS also enforces this)
    if (data.template_id) {
      const owns = await verifyTemplateOwnership(data.template_id, team.teamId);
      if (!owns) return forbiddenResponse('Not authorized');
    }

    return NextResponse.json(data);
  } catch (err) {
    return internalErrorResponse(err, 'PUT /api/blocks');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can delete blocks');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid block ID required' }, { status: 400 });
    }

    const { error } = await db().from('template_blocks').delete().eq('id', id);
    if (error) return internalErrorResponse(error, 'DELETE /api/blocks');

    return NextResponse.json({ success: true });
  } catch (err) {
    return internalErrorResponse(err, 'DELETE /api/blocks');
  }
}
