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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: template, error } = await supabase
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
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, subject_line, variables, blocks } = body;

  // Update template metadata
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .update({
      name,
      description,
      subject_line,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  // Replace variables
  await supabase.from('template_variables').delete().eq('template_id', id);
  if (variables && variables.length > 0) {
    await supabase.from('template_variables').insert(
      variables.map((v: { variable_name: string; auto_fill_type: string; default_value: string }) => ({
        template_id: id,
        variable_name: v.variable_name,
        auto_fill_type: v.auto_fill_type,
        default_value: v.default_value,
      }))
    );
  }

  // Replace blocks (delete old, insert new)
  const { data: existingBlocks } = await supabase
    .from('template_blocks')
    .select('id')
    .eq('template_id', id);

  if (existingBlocks && existingBlocks.length > 0) {
    const blockIds = existingBlocks.map((b: { id: string }) => b.id);
    const { data: existingOptions } = await supabase
      .from('block_options')
      .select('id')
      .in('block_id', blockIds);

    if (existingOptions && existingOptions.length > 0) {
      await supabase
        .from('option_attachments')
        .delete()
        .in('option_id', existingOptions.map((o: { id: string }) => o.id));
    }

    await supabase.from('block_options').delete().in('block_id', blockIds);
    await supabase.from('template_blocks').delete().eq('template_id', id);
  }

  if (blocks && blocks.length > 0) {
    for (const block of blocks) {
      const { data: insertedBlock, error: blockError } = await supabase
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

      if (blockError) {
        return NextResponse.json({ error: blockError.message }, { status: 500 });
      }

      if (block.options && block.options.length > 0) {
        for (const option of block.options) {
          const { data: insertedOption, error: optionError } = await supabase
            .from('block_options')
            .insert({
              block_id: insertedBlock.id,
              label: option.label,
              body_text: option.body_text,
              position: option.position,
            })
            .select()
            .single();

          if (optionError) {
            return NextResponse.json({ error: optionError.message }, { status: 500 });
          }

          if (option.attachments && option.attachments.length > 0) {
            await supabase.from('option_attachments').insert(
              option.attachments.map((att: { file_name: string; google_drive_file_id: string; google_drive_url: string; mime_type: string }) => ({
                option_id: insertedOption.id,
                file_name: att.file_name,
                google_drive_file_id: att.google_drive_file_id,
                google_drive_url: att.google_drive_url,
                mime_type: att.mime_type,
              }))
            );
          }
        }
      }
    }
  }

  return NextResponse.json(template);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
