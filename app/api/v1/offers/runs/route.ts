import { requireAdmin } from '@/lib/api/auth';
import { route, ok, pagination } from '@/lib/api/http';

/**
 * GET /api/v1/offers/runs
 * List offer-generation runs with status and metadata. Admin only.
 */
export const GET = route(async (req) => {
  const { supabase } = await requireAdmin();
  const { limit, offset } = pagination(req);

  const { data, count, error } = await supabase
    .from('offer_generation_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});
