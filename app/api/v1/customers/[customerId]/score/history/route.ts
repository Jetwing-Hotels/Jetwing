import { requireAdmin } from '@/lib/api/auth';
import { route, ok, pagination } from '@/lib/api/http';

type Ctx = { params: Promise<{ customerId: string }> };

/**
 * GET /api/v1/customers/:customerId/score/history
 * Full score history (newest first) for a customer. Admin only.
 */
export const GET = route<Ctx>(async (req, { params }) => {
  const { customerId } = await params;
  const { supabase } = await requireAdmin();
  const { limit, offset } = pagination(req);

  const { data, count, error } = await supabase
    .from('customer_scores')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('scored_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});
