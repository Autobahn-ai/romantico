import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserTeam } from '@/lib/auth';
import { createOptionSchema, updateOptionSchema } from '@/lib/schemas';
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

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can add options');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = createOptionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { data, error } = await db()
      .from('block_options')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return internalErrorResponse(error, 'POST /api/options');
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return internalErrorResponse(err, 'POST /api/options');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can edit options');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = updateOptionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { id, ...updates } = parsed.data;

    const { data, error } = await db()
      .from('block_options')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return internalErrorResponse(error, 'PUT /api/options');
    return NextResponse.json(data);
  } catch (err) {
    return internalErrorResponse(err, 'PUT /api/options');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can delete options');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid option ID required' }, { status: 400 });
    }

    const { error } = await db().from('block_options').delete().eq('id', id);
    if (error) return internalErrorResponse(error, 'DELETE /api/options');

    return NextResponse.json({ success: true });
  } catch (err) {
    return internalErrorResponse(err, 'DELETE /api/options');
  }
}
