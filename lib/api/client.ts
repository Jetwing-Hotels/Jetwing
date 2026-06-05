// ============================================================================
// Browser API client for the Guest Intelligence Layer (/api/v1).
// Calls are same-origin so the Supabase auth cookie rides along → RLS applies.
// ============================================================================

import type { SeasonalOffer, Campaign, OfferGenerationRun } from '@/lib/supabase/types';

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(res.status, body?.error ?? res.statusText, body?.details);
  }
  return body as T;
}

// Offers may come back with the embedded property (PostgREST FK expansion).
export type OfferWithProperty = SeasonalOffer & {
  properties?: { property_code: string; property_name: string; brand_tier: string; location_city?: string } | null;
};

interface Paginated<T> { data: T[]; pagination: { limit: number; offset: number; total: number } }

export const guestApi = {
  // ── Offers ────────────────────────────────────────────────────────────────
  listOffers: (params: { status?: string; property_id?: string; month?: number; year?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)));
    return api<Paginated<OfferWithProperty>>(`/offers?${qs.toString()}`);
  },
  getOffer: (id: string) => api<{ data: OfferWithProperty }>(`/offers/${id}`),
  approveOffer: (id: string) => api<{ data: SeasonalOffer }>(`/offers/${id}/approve`, { method: 'PATCH' }),
  rejectOffer: (id: string, reason: string) =>
    api<{ data: SeasonalOffer }>(`/offers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  activateOffer: (id: string, body: { valid_from?: string; valid_to?: string } = {}) =>
    api<{ data: SeasonalOffer }>(`/offers/${id}/activate`, { method: 'PATCH', body: JSON.stringify(body) }),
  generateOffers: (body: { month: number; year: number; property_id?: string }) =>
    api<{ data: unknown }>(`/offers/generate`, { method: 'POST', body: JSON.stringify(body) }),
  listRuns: () => api<Paginated<OfferGenerationRun>>(`/offers/runs`),

  // ── Campaigns ───────────────────────────────────────────────────────────────
  listCampaigns: (params: { status?: string; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)));
    return api<Paginated<Campaign>>(`/campaigns?${qs.toString()}`);
  },
  getCampaign: (id: string) => api<{ data: Campaign & { audience_count: number } }>(`/campaigns/${id}`),
  buildAudience: (id: string) =>
    api<{ data: { added: number; audience_size: number } }>(`/campaigns/${id}/build-audience`, { method: 'POST' }),
  getAudience: (id: string) => api<{ data: unknown[]; pagination: unknown }>(`/campaigns/${id}/audience`),
  sendCampaign: (id: string, confirm = false) =>
    api<{ data: { sent: number; failed: number; dry_run: boolean }; message: string }>(`/campaigns/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ confirm }),
    }),
  createCampaign: (body: {
    campaign_name: string;
    offer_ids: string[];
    target_month: number;
    target_year: number;
    min_score_threshold?: number;
    target_tiers?: string[];
  }) => api<{ data: Campaign }>(`/campaigns`, { method: 'POST', body: JSON.stringify(body) }),
  generateEmails: (campaignId: string, limit?: number) =>
    api<{ data: unknown }>(`/campaigns/${campaignId}/generate-emails`, {
      method: 'POST',
      body: JSON.stringify(limit ? { limit } : {}),
    }),

  // ── Scoring ──────────────────────────────────────────────────────────────────
  scoreDistribution: () =>
    api<{ data: { total: number; by_tier: Record<'Platinum' | 'Gold' | 'Silver' | 'Standard', number> } }>(
      `/customers/scores/distribution`,
    ),
};
