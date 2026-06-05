import { requireStaff } from '@/lib/api/auth';
import { route, ok, pagination } from '@/lib/api/http';
import type { SeasonalOffer } from '@/lib/supabase/types';

/**
 * GET /api/v1/offers
 * List offers with optional filters. Staff (ADMIN | REVENUE_MANAGER).
 * Query: property_id, status, month, year, limit, offset
 */
export const GET = route(async (req) => {
  const { supabase } = await requireStaff();
  const { limit, offset } = pagination(req);
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('seasonal_offers')
    .select('*, properties(property_code, property_name, brand_tier)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const propertyId = searchParams.get('property_id');
  const status = searchParams.get('status');
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  if (propertyId) query = query.eq('property_id', propertyId);
  if (status) query = query.eq('status', status as SeasonalOffer['status']);
  if (month) query = query.eq('target_month', Number(month));
  if (year) query = query.eq('target_year', Number(year));

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});
