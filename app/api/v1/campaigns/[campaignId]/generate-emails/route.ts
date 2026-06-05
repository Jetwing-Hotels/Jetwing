import { z } from 'zod';
import { requireRevenueManager } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, parseBody } from '@/lib/api/http';

export const maxDuration = 300;

type Ctx = { params: Promise<{ campaignId: string }> };

const bodySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * POST /api/v1/campaigns/:campaignId/generate-emails
 * Generate personalised emails for pending audience members via the
 * `generate-email` Edge Function (Claude). Revenue Manager (or Admin).
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { campaignId } = await params;
  await requireRevenueManager();
  const { limit } = await parseBody(req, bodySchema).catch(() => ({ limit: undefined }));

  const admin = createAdminClient();
  const headers: Record<string, string> = {};
  if (process.env.EDGE_FUNCTION_SECRET) headers['x-function-secret'] = process.env.EDGE_FUNCTION_SECRET;

  const { data, error } = await admin.functions.invoke('generate-email', {
    body: { campaign_id: campaignId, limit },
    headers,
  });

  if (error) throw new Error(error.message ?? 'Edge function invocation failed');
  return ok({ data }, 202);
});
