import { requireStaff } from '@/lib/api/auth';
import { route, ok, notFound } from '@/lib/api/http';

type Ctx = { params: Promise<{ offerId: string }> };

/**
 * GET /api/v1/offers/:offerId
 * Full offer detail including LLM rationale and the parent property.
 */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { offerId } = await params;
  const { supabase } = await requireStaff();

  const { data, error } = await supabase
    .from('seasonal_offers')
    .select('*, properties(property_code, property_name, brand_tier, location_city)')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw notFound('Offer not found');

  return ok({ data });
});
