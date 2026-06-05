import { z } from 'zod';
import { requireAdmin, actorLabel } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, parseBody } from '@/lib/api/http';

// Offer generation can take a while (a Claude call per property) — give it room.
export const maxDuration = 300;

const bodySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
  property_id: z.uuid().optional(),
});

/**
 * POST /api/v1/offers/generate
 * Trigger offer generation for a month/year (optionally one property). Admin only.
 *
 * Invokes the `generate-offers` Supabase Edge Function, which calls Claude and
 * writes PENDING_REVIEW offers. For a full 7-property run prefer invoking the
 * Edge Function from the scheduler; the single-property path is fast enough here.
 */
export const POST = route(async (req) => {
  const { user } = await requireAdmin();
  const body = await parseBody(req, bodySchema);

  const admin = createAdminClient();
  const headers: Record<string, string> = {};
  if (process.env.EDGE_FUNCTION_SECRET) headers['x-function-secret'] = process.env.EDGE_FUNCTION_SECRET;

  const { data, error } = await admin.functions.invoke('generate-offers', {
    body: { ...body, triggered_by_user: actorLabel(user) },
    headers,
  });

  if (error) throw new Error(error.message ?? 'Edge function invocation failed');
  return ok({ data }, 202);
});
