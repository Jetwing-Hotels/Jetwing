import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/health
 * Verifies the Supabase connection by counting seeded properties.
 * Uses the service-role client so it works before any user signs in.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes('YOUR-PROJECT-REF') || !serviceKey || serviceKey === 'your-service-role-key') {
    return NextResponse.json(
      { ok: false, error: 'Supabase env vars are not set. Fill .env.local and restart the dev server.' },
      { status: 500 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Supabase connected.',
      properties: count,
      hint: count === 7 ? 'Seed data present (7 properties).' : 'Run supabase/seed.sql to load properties.',
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
