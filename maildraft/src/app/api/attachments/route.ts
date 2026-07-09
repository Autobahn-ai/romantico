import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getUserTeam } from '@/lib/auth';
import { createAttachmentSchema } from '@/lib/schemas';
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
    if (team.role !== 'admin') return forbiddenResponse('Only admins can add attachments');

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

    const parsed = createAttachmentSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { data, error } = await db()
      .from('option_attachments')
      .insert(parsed.data)
      .select()
      .single();

    if (error) return internalErrorResponse(error, 'POST /api/attachments');
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return internalErrorResponse(err, 'POST /api/attachments');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return unauthorizedResponse();

    const team = await getUserTeam(auth.userId);
    if (!team) return forbiddenResponse('Not a team member');
    if (team.role !== 'admin') return forbiddenResponse('Only admins can remove attachments');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Valid attachment ID required' }, { status: 400 });
    }

    const { error } = await db().from('option_attachments').delete().eq('id', id);
    if (error) return internalErrorResponse(error, 'DELETE /api/attachments');

    return NextResponse.json({ success: true });
  } catch (err) {
    return internalErrorResponse(err, 'DELETE /api/attachments');
  }
}
