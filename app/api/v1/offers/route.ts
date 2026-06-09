import { z } from 'zod';
import { requireStaff, requireRevenueManager, actorLabel } from '@/lib/api/auth';
import { route, ok, pagination, parseBody } from '@/lib/api/http';
import { createAdminClient } from '@/lib/supabase/admin';
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

// Manually authored offer (not AI-generated). Property + the core fields are
// required; the rest are optional.
const createSchema = z.object({
  property_id: z.uuid(),
  offer_title: z.string().trim().min(1).max(200),
  offer_description: z.string().trim().min(1),
  offer_type: z.enum(['Accommodation', 'Package', 'Experience', 'F&B', 'Wellness']),
  target_month: z.number().int().min(1).max(12),
  target_year: z.number().int().min(2000),
  discount_type: z.enum(['Percentage', 'Complimentary', 'Value_Add', 'Rate_Plan']).nullable().optional(),
  discount_value: z.number().nullable().optional(),
  predicted_occupancy_uplift_pct: z.number().nullable().optional(),
  predicted_revenue_uplift_pct: z.number().nullable().optional(),
  predicted_incremental_lkr: z.number().int().nullable().optional(),
  target_guest_segment: z.string().trim().max(100).nullable().optional(),
  sustainability_angle: z.string().trim().nullable().optional(),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
  status: z.enum(['PENDING_REVIEW', 'APPROVED', 'ACTIVE']).optional(),
});

/**
 * POST /api/v1/offers
 * Create an offer manually. Revenue Manager (or Admin). Because every offer must
 * reference a generation run, we record a lightweight MANUAL run for the audit trail.
 * Defaults to APPROVED (it's human-authored, no AI review needed).
 */
export const POST = route(async (req) => {
  const { user } = await requireRevenueManager();
  const body = await parseBody(req, createSchema);
  const admin = createAdminClient();

  const { data: run, error: runErr } = await admin
    .from('offer_generation_runs')
    .insert({
      target_month: body.target_month,
      target_year: body.target_year,
      triggered_by: 'MANUAL',
      triggered_by_user: actorLabel(user),
      status: 'COMPLETED',
      total_offers_generated: 1,
      completed_at: new Date().toISOString(),
    })
    .select('run_id')
    .single();
  if (runErr) throw new Error(runErr.message);

  const { status, ...offerFields } = body;
  const isApproved = (status ?? 'APPROVED') !== 'PENDING_REVIEW';

  const { data, error } = await admin
    .from('seasonal_offers')
    .insert({
      ...offerFields,
      generation_run_id: run.run_id,
      status: status ?? 'APPROVED',
      approved_by: isApproved ? actorLabel(user) : null,
      approved_at: isApproved ? new Date().toISOString() : null,
    })
    .select('*, properties(property_code, property_name, brand_tier)')
    .single();
  if (error) throw new Error(error.message);

  return ok({ data }, 201);
});
