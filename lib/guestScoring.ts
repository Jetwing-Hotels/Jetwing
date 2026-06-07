// ============================================================================
// Guest scoring — client helpers for the deployed model
//   HiruniAyesha/jetwing-customer-ranker  (Gradio Space, api_name "/predict")
//
// FEATURE CONTRACT — must match the model's feature order EXACTLY. The Space
// sends RAW values and applies its own log1p + QuantileTransformer internally,
// so we send raw numbers (do NOT pre-transform here). 18 features, in order.
// This mirrors worker/scoring_model.py FEATURE_ORDER / build_vector.
// ============================================================================

export const FEATURE_ORDER = [
  'recency_days',
  'frequency_total',
  'monetary_total',
  'monetary_avg_per_stay',
  'avg_length_of_stay',
  'avg_lead_time_days',
  'cancellation_ratio',
  'direct_booking_ratio',
  'is_repeated_guest',
  'prev_completed_bookings',
  'avg_special_requests',
  'luxury_reserve_visits',
  'premium_hotel_visits',
  'luxury_affinity_ratio',
  'eco_engagement_flag',
  'avg_adr',
  'high_season_preference',
  'domestic_guest',
] as const;

export interface ScoreResult {
  score: number; // 0–100 percentile
  segment: string; // "Top 10% Customer" | "Standard Customer"
}

export type GuestScore = ScoreResult & { tier: string };

// Display tier from the model's 0–100 percentile (top 10% ≥ 90).
export function tierFor(score: number): string {
  if (score >= 80) return 'Platinum';
  if (score >= 60) return 'Gold';
  if (score >= 40) return 'Silver';
  return 'Standard';
}

// ── Feature derivation from a mock PASSENGERS row ────────────────────────────
// The guest table runs on mock data that doesn't carry the full feature set, so
// we derive a best-effort 18-vector from the fields we do have. When real
// customer_features land, swap this for the server-side build_vector values.

const LKR_PER_USD = 300; // the UI renders totalSpend * 300 as LKR; keep it consistent

interface PassengerLike {
  country?: string;
  hotel?: string;
  checkIn?: string;
  checkOut?: string;
  bookingSource?: string;
  guestType?: string;
  roomCategory?: string;
  servicesUsed?: string[];
  totalSpend?: number;
  hotelHistory?: { hotel: string; date: string }[];
  bookingHistory?: { ref: string; date: string; amount: number }[];
}

const ECO_SERVICES = new Set(['Wellness', 'Whale Watching', 'Safari', 'Excursions']);
const LUXURY_ROOMS = new Set(['Suite', 'Luxury Villa']);
const HIGH_SEASON_MONTHS = new Set([7, 8, 12]); // Jul, Aug, Dec

function daysSince(dateStr: string | undefined, now: Date): number {
  if (!dateStr) return 365;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 365;
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / 86_400_000));
}

function nights(checkIn?: string, checkOut?: string): number {
  if (!checkIn || !checkOut) return 1;
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

/** Build the 18 raw features in the model's exact order from a guest row. */
export function buildGuestVector(p: PassengerLike, now: Date = new Date()): number[] {
  const history = p.bookingHistory ?? [];
  const freq = Math.max(1, history.length);

  // Most-recent booking date drives recency.
  const lastDate = history
    .map((b) => b.date)
    .filter(Boolean)
    .sort()
    .at(-1);
  const recencyDays = daysSince(lastDate, now);

  const monetaryTotal = (p.totalSpend ?? 0) * LKR_PER_USD;
  const monetaryAvgPerStay = monetaryTotal / freq;
  const los = nights(p.checkIn, p.checkOut);

  const premiumVisits = p.hotelHistory?.length ?? freq;
  const luxuryVisits = LUXURY_ROOMS.has(p.roomCategory ?? '') ? premiumVisits : 0;
  const luxuryAffinity =
    luxuryVisits + premiumVisits > 0 ? luxuryVisits / (luxuryVisits + premiumVisits) : 0;

  const isRepeat = (p.guestType ?? '') !== 'New Guest' ? 1 : 0;
  const directBooking = (p.bookingSource ?? '').toLowerCase().startsWith('direct') ? 1 : 0;
  const eco = (p.servicesUsed ?? []).some((s) => ECO_SERVICES.has(s)) ? 1 : 0;
  const avgAdr = los >= 1 ? monetaryAvgPerStay / los : monetaryAvgPerStay;
  const checkInMonth = p.checkIn ? new Date(p.checkIn).getMonth() + 1 : 0;
  const highSeason = HIGH_SEASON_MONTHS.has(checkInMonth) ? 1 : 0;
  const domestic = (p.country ?? '') === 'Sri Lanka' ? 1 : 0;

  return [
    recencyDays, // 0  recency_days
    freq, // 1  frequency_total
    monetaryTotal, // 2  monetary_total
    monetaryAvgPerStay, // 3  monetary_avg_per_stay
    los, // 4  avg_length_of_stay
    21, // 5  avg_lead_time_days (not tracked → typical default)
    0, // 6  cancellation_ratio (not tracked)
    directBooking, // 7  direct_booking_ratio
    isRepeat, // 8  is_repeated_guest
    freq, // 9  prev_completed_bookings
    0, // 10 avg_special_requests (not tracked)
    luxuryVisits, // 11 luxury_reserve_visits
    premiumVisits, // 12 premium_hotel_visits
    luxuryAffinity, // 13 luxury_affinity_ratio
    eco, // 14 eco_engagement_flag
    avgAdr, // 15 avg_adr
    highSeason, // 16 high_season_preference
    domestic, // 17 domestic_guest
  ];
}

// ── Browser client ───────────────────────────────────────────────────────────
/** Score a batch of guest feature vectors via /api/guests/score. */
export async function scoreGuests(rows: number[][]): Promise<(GuestScore | null)[]> {
  const res = await fetch('/api/guests/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Scoring failed (${res.status})`);
  }
  const body = (await res.json()) as { results: (ScoreResult | null)[] };
  return body.results.map((r) => (r ? { ...r, tier: tierFor(r.score) } : null));
}
