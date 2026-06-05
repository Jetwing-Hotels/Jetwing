import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { route, ok, notFound, conflict, parseBody } from '@/lib/api/http';

type Ctx = { params: Promise<{ offerId: string }> };

const bodySchema = z.object({
  valid_from: z.iso.date().optional(),
  valid_to: z.iso.date().optional(),
});

/**
 * PATCH /api/v1/offers/:offerId/activate
 * APPROVED → ACTIVE, optionally setting validity dates. Admin only.
 */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { offerId } = await params;
  const { supabase } = await requireAdmin();
  const body = await parseBody(req, bodySchema);

  if (body.valid_from && body.valid_to && body.valid_from > body.valid_to) {
    throw conflict('valid_from must be on or before valid_to');
  }

  const { data: offer, error: readErr } = await supabase
    .from('seasonal_offers')
    .select('offer_id, status')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!offer) throw notFound('Offer not found');
  if (offer.status !== 'APPROVED') {
    throw conflict(`Only APPROVED offers can be activated (current: ${offer.status})`);
  }

  const { data, error } = await supabase
    .from('seasonal_offers')
    .update({
      status: 'ACTIVE',
      ...(body.valid_from ? { valid_from: body.valid_from } : {}),
      ...(body.valid_to ? { valid_to: body.valid_to } : {}),
    })
    .eq('offer_id', offerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return ok({ data });
});
