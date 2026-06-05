import { requireRevenueManager } from '@/lib/api/auth';
import { route, ok, notFound } from '@/lib/api/http';

type Ctx = { params: Promise<{ customerId: string }> };

/**
 * GET /api/v1/customers/:customerId/score
 * Latest composite score + tier for a customer. Revenue Manager (or Admin).
 */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { customerId } = await params;
  const { supabase } = await requireRevenueManager();

  const { data, error } = await supabase
    .from('latest_customer_scores')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw notFound('No score found for this customer');

  return ok({ data });
});
