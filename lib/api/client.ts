// ============================================================================
// Browser API client for the Guest Intelligence Layer (/api/v1).
// Calls are same-origin so the Supabase auth cookie rides along → RLS applies.
// ============================================================================

import type { SeasonalOffer, Campaign, OfferGenerationRun } from '@/lib/supabase/types';
import type { GuestListItem } from '@/lib/guests/types';
import type { ExecutiveDashboard, GuestAnalytics } from '@/lib/dashboard/types';

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

// Fields the in-app editor may change on an existing offer.
export interface OfferEditableFields {
  offer_title: string;
  offer_description: string;
  offer_type: 'Accommodation' | 'Package' | 'Experience' | 'F&B' | 'Wellness';
  discount_type: 'Percentage' | 'Complimentary' | 'Value_Add' | 'Rate_Plan' | null;
  discount_value: number | null;
  predicted_occupancy_uplift_pct: number | null;
  predicted_revenue_uplift_pct: number | null;
  predicted_incremental_lkr: number | null;
  target_guest_segment: string | null;
  sustainability_angle: string | null;
  target_month: number;
  target_year: number;
  valid_from: string | null;
  valid_to: string | null;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
}

// Fields required/allowed when creating an offer manually.
export type OfferCreateFields = Pick<
  OfferEditableFields,
  'offer_title' | 'offer_description' | 'offer_type' | 'target_month' | 'target_year'
> &
  Partial<Omit<OfferEditableFields, 'offer_title' | 'offer_description' | 'offer_type' | 'target_month' | 'target_year' | 'status'>> & {
    property_id: string;
    status?: 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE';
  };

export interface PropertyOption {
  property_id: string;
  property_code: string;
  property_name: string;
  location_city?: string;
}

interface Paginated<T> { data: T[]; pagination: { limit: number; offset: number; total: number } }

export const guestApi = {
  // ── Offers ────────────────────────────────────────────────────────────────
  listOffers: (params: { status?: string; property_id?: string; month?: number; year?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)));
    return api<Paginated<OfferWithProperty>>(`/offers?${qs.toString()}`);
  },
  getOffer: (id: string) => api<{ data: OfferWithProperty }>(`/offers/${id}`),
  // Edit an offer's fields (in-app editor). Only the supplied keys change.
  updateOffer: (id: string, body: Partial<OfferEditableFields>) =>
    api<{ data: OfferWithProperty }>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  // Create a manually authored offer (not AI-generated).
  createOffer: (body: OfferCreateFields) =>
    api<{ data: OfferWithProperty }>(`/offers`, { method: 'POST', body: JSON.stringify(body) }),
  approveOffer: (id: string) => api<{ data: SeasonalOffer }>(`/offers/${id}/approve`, { method: 'PATCH' }),
  rejectOffer: (id: string, reason: string) =>
    api<{ data: SeasonalOffer }>(`/offers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  activateOffer: (id: string, body: { valid_from?: string; valid_to?: string } = {}) =>
    api<{ data: SeasonalOffer }>(`/offers/${id}/activate`, { method: 'PATCH', body: JSON.stringify(body) }),
  generateOffers: (body: {
    month: number;
    year: number;
    property_id?: string;
    business_goal?: string;
    additional_instructions?: string;
  }) => api<{ data: unknown }>(`/offers/generate`, { method: 'POST', body: JSON.stringify(body) }),
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

  // ── Properties (for the manual offer form) ───────────────────────────────────
  listProperties: async (): Promise<{ data: PropertyOption[] }> => {
    const res = await fetch('/api/sustainability/properties');
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiClientError(res.status, body?.error ?? res.statusText);
    return { data: (body?.data ?? []) as PropertyOption[] };
  },

  // ── Customers (guest list) ───────────────────────────────────────────────────
  listCustomers: (params: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && qs.set(k, String(v)));
    return api<Paginated<GuestListItem>>(`/customers?${qs.toString()}`);
  },

  // Send a generated offer to a hand-picked set of guests. Each guest is reached by
  // email if they have one, otherwise by SMS if a phone number is on file (e.g. OTA bookings).
  sendOfferToGuests: (offerId: string, body: { customer_ids: string[]; confirm?: boolean }) =>
    api<{
      data: {
        sent: number;
        email_sent: number;
        sms_sent: number;
        failed: number;
        skipped_no_email: number; // skipped = no email AND no usable phone
        dry_run: boolean;
        campaign_id: string;
        audience_size: number;
      };
      message: string;
    }>(`/offers/${offerId}/send-to-guests`, { method: 'POST', body: JSON.stringify(body) }),

  // ── Dashboards (aggregate analytics) ─────────────────────────────────────────
  executiveDashboard: (params: { from?: string; to?: string; property_id?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    const q = qs.toString();
    return api<{ data: ExecutiveDashboard }>(`/dashboard/executive${q ? `?${q}` : ''}`);
  },
  guestAnalytics: (params: { from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    const q = qs.toString();
    return api<{ data: GuestAnalytics }>(`/guests/analytics${q ? `?${q}` : ''}`);
  },

  // ── Scoring ──────────────────────────────────────────────────────────────────
  scoreDistribution: () =>
    api<{ data: { total: number; by_tier: Record<'Platinum' | 'Gold' | 'Silver' | 'Standard', number> } }>(
      `/customers/scores/distribution`,
    ),
};
