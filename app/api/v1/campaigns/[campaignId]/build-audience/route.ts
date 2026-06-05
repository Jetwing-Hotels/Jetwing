import { requireRevenueManager } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, notFound } from '@/lib/api/http';

type Ctx = { params: Promise<{ campaignId: string }> };

/**
 * POST /api/v1/campaigns/:campaignId/build-audience
 * Select opted-in, score-qualified customers into the campaign audience.
 * Revenue Manager (or Admin). Runs the build_campaign_audience() SQL function.
 */
export const POST = route<Ctx>(async (_req, { params }) => {
  const { campaignId } = await params;
  await requireRevenueManager();

  const admin = createAdminClient();

  // Ensure the campaign exists (clearer error than a function exception).
  const { data: campaign } = await admin
    .from('campaigns')
    .select('campaign_id')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  if (!campaign) throw notFound('Campaign not found');

  const { data: added, error } = await admin.rpc('build_campaign_audience', { _campaign_id: campaignId });
  if (error) throw new Error(error.message);

  const { count } = await admin
    .from('campaign_audience')
    .select('audience_id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  return ok({ data: { added: added ?? 0, audience_size: count ?? 0 } });
});
