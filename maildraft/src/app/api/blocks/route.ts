import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const supabase = createServerSupabase();

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    return { user, supabase };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (accessToken) {
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    return { user, supabase };
  }

  return { user: null, supabase };
}

export async function POST(request: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { template_id, name, description, position, is_required } = body;

  const { data: block, error } = await supabase
    .from('template_blocks')
    .insert({ template_id, name, description, position, is_required })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(block, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, description, position, is_required } = body;

  const { data: block, error } = await supabase
    .from('template_blocks')
    .update({ name, description, position, is_required })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(block);
}

export async function DELETE(request: NextRequest) {
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('template_blocks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
