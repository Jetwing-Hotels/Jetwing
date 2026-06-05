import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Service-role Supabase client for Edge Functions (the SYSTEM identity).
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
 * Supabase Edge runtime — no need to set them as secrets. Bypasses RLS.
 */
export function makeAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Optional shared-secret guard. Returns true if the request is authorised. */
export function checkSecret(req: Request): boolean {
  const secret = Deno.env.get('EDGE_FUNCTION_SECRET');
  if (!secret) return true; // not configured → rely on platform JWT verification
  return req.headers.get('x-function-secret') === secret;
}
