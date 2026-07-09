import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase URL and anon key must be configured in .env.local');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Convenience export — only use in browser/client components
export const supabase = {
  get auth() { return getSupabase().auth; },
  from: (table: string) => getSupabase().from(table),
};

export function createBrowserClient() {
  return getSupabase();
}
