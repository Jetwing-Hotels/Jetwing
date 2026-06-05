import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Service-role Supabase client — **server only**.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY and therefore BYPASSES Row Level Security.
 * This is the "SYSTEM" identity from the backend plan: use it only for
 * trusted server-side work (ETL, scoring writes, email generation, webhooks).
 *
 * NEVER import this into a Client Component — the `server-only` import above
 * will throw at build time if you do.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
