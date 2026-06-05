import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, pagination, parseBody } from '@/lib/api/http';

/**
 * GET /api/v1/scoring/runs
 * List batch scoring runs. Admin only.
 */
export const GET = route(async (req) => {
  const { supabase } = await requireAdmin();
  const { limit, offset } = pagination(req);

  const { data, count, error } = await supabase
    .from('scoring_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);
  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});

const bodySchema = z.object({
  campaign_id: z.uuid().optional(),
});

/**
 * POST /api/v1/scoring/runs
 * Trigger a new batch scoring run. Admin only.
 * Creates a scoring_runs row (service role) for the worker to process.
 * TODO(phase-3): enqueue the Celery scoring task with run_id.
 */
export const POST = route(async (req) => {
  await requireAdmin();
  const { campaign_id } = await parseBody(req, bodySchema);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('scoring_runs')
    .insert({
      triggered_by: campaign_id ? 'CAMPAIGN' : 'MANUAL',
      campaign_id: campaign_id ?? null,
      model_version: process.env.HF_MODEL_VERSION ?? 'v1',
      status: 'RUNNING',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return ok({ data, message: 'Scoring run queued.' }, 202);
});
