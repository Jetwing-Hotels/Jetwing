"use client"

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Supabase client for use in Client Components (browser).
 * Uses the public anon key and respects Row Level Security.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
