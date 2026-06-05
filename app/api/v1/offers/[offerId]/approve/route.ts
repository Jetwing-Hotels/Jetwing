import { requireRevenueManager, actorLabel } from '@/lib/api/auth';
import { route, ok, notFound, conflict } from '@/lib/api/http';

type Ctx = { params: Promise<{ offerId: string }> };

/**
 * PATCH /api/v1/offers/:offerId/approve
 * PENDING_REVIEW → APPROVED. Revenue Manager (or Admin).
 */
export const PATCH = route<Ctx>(async (_req, { params }) => {
  const { offerId } = await params;
  const { supabase, user } = await requireRevenueManager();

  const { data: offer, error: readErr } = await supabase
    .from('seasonal_offers')
    .select('offer_id, status')
    .eq('offer_id', offerId)
    .maybeSingle();

  if (readErr) throw new Error(readErr.message);
  if (!offer) throw notFound('Offer not found');
  if (offer.status !== 'PENDING_REVIEW') {
    throw conflict(`Cannot approve an offer in status ${offer.status}`);
  }

  const { data, error } = await supabase
    .from('seasonal_offers')
    .update({ status: 'APPROVED', approved_by: actorLabel(user), approved_at: new Date().toISOString() })
    .eq('offer_id', offerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return ok({ data });
});
