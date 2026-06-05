import { requireRevenueManager } from '@/lib/api/auth';
import { route, ok, pagination } from '@/lib/api/http';

type Ctx = { params: Promise<{ campaignId: string }> };

/**
 * GET /api/v1/campaigns/:campaignId/audience
 * Preview the campaign audience (with guest name + send state). Revenue Manager (or Admin).
 */
export const GET = route<Ctx>(async (req, { params }) => {
  const { campaignId } = await params;
  const { supabase } = await requireRevenueManager();
  const { limit, offset } = pagination(req);

  const { data, count, error } = await supabase
    .from('campaign_audience')
    .select(
      'audience_id, customer_id, composite_score_snapshot, score_tier_snapshot, send_status, email_subject, sent_at, opened_at, customers(first_name, last_name, email)',
      { count: 'exact' },
    )
    .eq('campaign_id', campaignId)
    .order('composite_score_snapshot', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});
