import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, parseBody } from '@/lib/api/http';

const JOBS = {
  expire_offers: 'expire_stale_offers',
  refresh_features: 'refresh_customer_features',
  reconcile_metrics: 'reconcile_campaign_metrics',
} as const;

const bodySchema = z.object({
  job: z.enum(['expire_offers', 'refresh_features', 'reconcile_metrics']),
});

/**
 * POST /api/v1/admin/jobs   { "job": "refresh_features" }
 * Run a maintenance job on demand (same functions pg_cron schedules). Admin only.
 * Handy for ops / testing without waiting for the cron tick.
 */
export const POST = route(async (req) => {
  await requireAdmin();
  const { job } = await parseBody(req, bodySchema);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc(JOBS[job]);
  if (error) throw new Error(error.message);

  return ok({ data: { job, affected: data ?? 0 } });
});
