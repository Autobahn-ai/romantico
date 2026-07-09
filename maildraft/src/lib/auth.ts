import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface AuthResult {
  userId: string;
  email: string | undefined;
}

/**
 * Validates the incoming request's auth token.
 * Accepts either a Bearer token in Authorization header (Chrome extension)
 * or the Supabase cookie session (web app).
 *
 * Returns null if the request is not authenticated.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthResult | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Try Bearer token (Chrome extension)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      return { userId: user.id, email: user.email };
    }
  }

  // 2. Try cookie session (web app)
  try {
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get('sb-access-token')?.value ||
      // Supabase v2 stores in a JSON cookie named sb-<projectRef>-auth-token
      findSupabaseCookieToken(cookieStore);

    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (!error && user) {
        return { userId: user.id, email: user.email };
      }
    }
  } catch {
    // cookies() throws outside request context — ignore
  }

  return null;
}

function findSupabaseCookieToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): string | null {
  // Supabase stores the session in a cookie like: sb-<ref>-auth-token
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        return parsed.access_token ?? null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Get the team_id and role for an authenticated user. Returns null if not in any team. */
export async function getUserTeam(
  userId: string
): Promise<{ teamId: string; role: 'admin' | 'member' } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return { teamId: data.team_id, role: data.role as 'admin' | 'member' };
}
