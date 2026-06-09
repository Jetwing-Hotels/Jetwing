import { z } from 'zod';
import { requireStaff, requireRevenueManager } from '@/lib/api/auth';
import { route, ok, notFound, badRequest, parseBody } from '@/lib/api/http';
import { createAdminClient } from '@/lib/supabase/admin';

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

// Editable fields. Everything optional — only the supplied keys are updated.
const patchSchema = z
  .object({
    offer_title: z.string().trim().min(1).max(200),
    offer_description: z.string().trim().min(1),
    offer_type: z.enum(['Accommodation', 'Package', 'Experience', 'F&B', 'Wellness']),
    discount_type: z
      .enum(['Percentage', 'Complimentary', 'Value_Add', 'Rate_Plan'])
      .nullable(),
    discount_value: z.number().nullable(),
    predicted_occupancy_uplift_pct: z.number().nullable(),
    predicted_revenue_uplift_pct: z.number().nullable(),
    predicted_incremental_lkr: z.number().int().nullable(),
    target_guest_segment: z.string().trim().max(100).nullable(),
    sustainability_angle: z.string().trim().nullable(),
    target_month: z.number().int().min(1).max(12),
    target_year: z.number().int().min(2000),
    valid_from: z.string().nullable(),
    valid_to: z.string().nullable(),
    status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED']),
  })
  .partial();

/**
 * PATCH /api/v1/offers/:offerId
 * Edit an offer's fields. Revenue Manager (or Admin). Used by the in-app editor.
 */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { offerId } = await params;
  await requireRevenueManager();
  const patch = await parseBody(req, patchSchema);

  if (Object.keys(patch).length === 0) throw badRequest('No fields to update.');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('seasonal_offers')
    .update(patch)
    .eq('offer_id', offerId)
    .select('*, properties(property_code, property_name, brand_tier)')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw notFound('Offer not found');

  return ok({ data });
});
