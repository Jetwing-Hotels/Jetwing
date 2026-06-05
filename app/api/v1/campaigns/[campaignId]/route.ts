import { requireRevenueManager } from '@/lib/api/auth';
import { route, ok, notFound } from '@/lib/api/http';

type Ctx = { params: Promise<{ campaignId: string }> };

/**
 * GET /api/v1/campaigns/:campaignId
 * Campaign detail including current audience size. Revenue Manager (or Admin).
 */
export const GET = route<Ctx>(async (_req, { params }) => {
  const { campaignId } = await params;
  const { supabase } = await requireRevenueManager();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw notFound('Campaign not found');

  const { count } = await supabase
    .from('campaign_audience')
    .select('audience_id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  return ok({ data: { ...data, audience_count: count ?? 0 } });
});
