import { z } from 'zod';
import { requireRevenueManager } from '@/lib/api/auth';
import { route, ok, notFound, conflict, parseBody } from '@/lib/api/http';

type Ctx = { params: Promise<{ offerId: string }> };

const bodySchema = z.object({
  reason: z.string().min(3, 'A rejection reason is required').max(500),
});

/**
 * PATCH /api/v1/offers/:offerId/reject
 * PENDING_REVIEW → REJECTED with a reason. Revenue Manager (or Admin).
 */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { offerId } = await params;
  const { supabase } = await requireRevenueManager();
  const { reason } = await parseBody(req, bodySchema);

  const { data: offer, error: readErr } = await supabase
    .from('seasonal_offers')
    .select('offer_id, status')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!offer) throw notFound('Offer not found');
  if (offer.status !== 'PENDING_REVIEW') {
    throw conflict(`Cannot reject an offer in status ${offer.status}`);
  }

  const { data, error } = await supabase
    .from('seasonal_offers')
    .update({ status: 'REJECTED', rejection_reason: reason })
    .eq('offer_id', offerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return ok({ data });
});
