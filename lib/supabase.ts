import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL_SETTING = 'NEXT_PUBLIC_SUPABASE_URL';
export const SUPABASE_KEY_SETTING = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

export type BoardSettings = {
  url: string;
  key: string;
  missing: string[];
};

export function getSettings(): BoardSettings {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  const missing: string[] = [];

  if (url === '') {
    missing.push(SUPABASE_URL_SETTING);
  }

  if (key === '') {
    missing.push(SUPABASE_KEY_SETTING);
  }

  return { url, key, missing };
}

export function createBoardClient(): SupabaseClient {
  const { url, key, missing } = getSettings();

  if (missing.length > 0) {
    throw new Error('Missing setting: ' + missing.join(', '));
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
