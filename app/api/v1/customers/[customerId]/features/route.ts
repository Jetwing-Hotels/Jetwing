import { requireAdmin } from '@/lib/api/auth';
import { route, ok, notFound } from '@/lib/api/http';

type Ctx = { params: Promise<{ customerId: string }> };

/**
 * GET /api/v1/customers/:customerId/features
 * The materialised ML feature vector for a customer. Admin only.
 */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { customerId } = await params;
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from('customer_features')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw notFound('No feature vector found for this customer');

  return ok({ data });
});
