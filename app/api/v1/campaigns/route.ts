import { z } from 'zod';
import { requireRevenueManager, actorLabel } from '@/lib/api/auth';
import { route, ok, pagination, parseBody, badRequest } from '@/lib/api/http';
import type { Campaign } from '@/lib/supabase/types';

/**
 * GET /api/v1/campaigns
 * List campaigns with status and delivery metrics. Revenue Manager (or Admin).
 */
export const GET = route(async (req) => {
  const { supabase } = await requireRevenueManager();
  const { limit, offset } = pagination(req);
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const status = searchParams.get('status');
  if (status) query = query.eq('status', status as Campaign['status']);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return ok({ data, pagination: { limit, offset, total: count ?? 0 } });
});

const createSchema = z.object({
  campaign_name: z.string().min(3).max(200),
  offer_ids: z.array(z.uuid()).min(1, 'At least one offer is required'),
  target_month: z.number().int().min(1).max(12),
  target_year: z.number().int().min(2024).max(2100),
  min_score_threshold: z.number().min(0).max(100).optional(),
  target_tiers: z.array(z.enum(['Platinum', 'Gold', 'Silver', 'Standard'])).optional(),
  target_property_ids: z.array(z.uuid()).optional(),
  target_nationalities: z.array(z.string()).optional(),
  scheduled_send_date: z.iso.datetime().optional(),
});

/**
 * POST /api/v1/campaigns
 * Create a campaign from approved/active offers. Revenue Manager (or Admin).
 */
export const POST = route(async (req) => {
  const { supabase, user } = await requireRevenueManager();
  const body = await parseBody(req, createSchema);

  // All referenced offers must exist and be APPROVED or ACTIVE.
  const { data: offers, error: offerErr } = await supabase
    .from('seasonal_offers')
    .select('offer_id, status')
    .in('offer_id', body.offer_ids);

  if (offerErr) throw new Error(offerErr.message);

  const found = new Set((offers ?? []).map((o) => o.offer_id));
  const missing = body.offer_ids.filter((id) => !found.has(id));
  if (missing.length) throw badRequest('Some offers do not exist', { missing });

  const notReady = (offers ?? []).filter((o) => !['APPROVED', 'ACTIVE'].includes(o.status));
  if (notReady.length) {
    throw badRequest('Campaigns can only include APPROVED or ACTIVE offers', {
      invalid: notReady.map((o) => ({ offer_id: o.offer_id, status: o.status })),
    });
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      campaign_name: body.campaign_name,
      offer_ids: body.offer_ids,
      target_month: body.target_month,
      target_year: body.target_year,
      min_score_threshold: body.min_score_threshold,
      target_tiers: body.target_tiers,
      target_property_ids: body.target_property_ids,
      target_nationalities: body.target_nationalities,
      scheduled_send_date: body.scheduled_send_date ?? null,
      created_by: actorLabel(user),
      status: 'DRAFT',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return ok({ data }, 201);
});
