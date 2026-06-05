import type { SystemBlock } from './claude.ts';

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

const OFFER_TYPES = ['Accommodation', 'Package', 'Experience', 'F&B', 'Wellness'] as const;
const DISCOUNT_TYPES = ['Percentage', 'Complimentary', 'Value_Add', 'Rate_Plan'] as const;

export interface OfferDraft {
  offer_title: string;
  offer_description: string;
  offer_type: (typeof OFFER_TYPES)[number];
  discount_type: (typeof DISCOUNT_TYPES)[number] | null;
  discount_value: number | null;
  predicted_occupancy_uplift_pct: number | null;
  predicted_revenue_uplift_pct: number | null;
  predicted_incremental_lkr: number | null;
  llm_rationale: string | null;
  target_guest_segment: string | null;
  sustainability_angle: string | null;
}

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ── Stable global preamble — identical bytes for every property + month, so it
//    becomes a shared cache prefix across the whole monthly run and future runs.
const GLOBAL_OFFER_PREAMBLE = `You are the revenue-strategy intelligence for Jetwing Symphony PLC, a Sri Lankan luxury hospitality group. You generate data-grounded seasonal offers for individual properties.

Jetwing's brand voice is warm, culturally grounded, premium but approachable, and sustainability-conscious. Every offer must be credible and anchored to the property's historical performance — never aspirational fluff.

Jetwing operates a six-pillar Sustainability Strategy: energy, water, waste, biodiversity, community, and culture. Each offer must carry a genuine sustainability angle tied to one of these pillars.

TASK
Using the property profile, the Sri Lanka seasonal context for the target month, and five years of historical monthly performance, identify 2–3 distinct seasonal opportunity windows and propose one offer per window. For each offer:
- Give it a compelling marketing title and a full description (2–4 sentences).
- Choose an offer_type: Accommodation | Package | Experience | F&B | Wellness.
- Choose a discount mechanism (discount_type: Percentage | Complimentary | Value_Add | Rate_Plan) and a discount_value where numeric (percentage points or LKR), or null for pure value-add.
- Predict occupancy uplift (%), revenue uplift (%), and incremental revenue (LKR) — grounded in the historical ADR and occupancy, not optimistic guesses.
- Explain the rationale referencing the data and season.
- Name the target guest segment.
- State the sustainability angle (which pillar, and how).

OUTPUT FORMAT
Return ONLY a JSON array (no prose, no markdown fences) of 2–3 objects with exactly these keys:
[{
  "offer_title": string,
  "offer_description": string,
  "offer_type": "Accommodation"|"Package"|"Experience"|"F&B"|"Wellness",
  "discount_type": "Percentage"|"Complimentary"|"Value_Add"|"Rate_Plan"|null,
  "discount_value": number|null,
  "predicted_occupancy_uplift_pct": number,
  "predicted_revenue_uplift_pct": number,
  "predicted_incremental_lkr": number,
  "llm_rationale": string,
  "target_guest_segment": string,
  "sustainability_angle": string
}]`;

function propertyProfileText(property: Row, prompt: Row | null): string {
  if (prompt?.property_profile) {
    return `PROPERTY PROFILE\n${JSON.stringify(prompt.property_profile, null, 2)}`;
  }
  // Fallback profile derived from the properties row when no prompt is registered.
  return [
    'PROPERTY PROFILE',
    `Name: ${property.property_name} (${property.property_code})`,
    `Brand tier: ${property.brand_tier}`,
    `Type: ${property.property_type}`,
    `Location: ${property.location_city}, ${property.location_region}`,
    `Rooms: ${property.room_count}`,
    `Sustainability tier: ${property.sustainability_tier}`,
  ].join('\n');
}

export function buildOfferPrompt(args: {
  property: Row;
  prompt: Row | null;
  seasonal: Row | null;
  history: Row[];
  month: number;
  year: number;
}): { system: SystemBlock[]; userText: string } {
  const { property, prompt, seasonal, history, month, year } = args;

  const system: SystemBlock[] = [
    // Stable prefix — cache breakpoint here (shared across all properties/months).
    {
      type: 'text',
      text: prompt?.system_context
        ? `${GLOBAL_OFFER_PREAMBLE}\n\nADDITIONAL SYSTEM CONTEXT\n${prompt.system_context}`
        : GLOBAL_OFFER_PREAMBLE,
      cache_control: { type: 'ephemeral' },
    },
    // Per-property profile (stable per property, varies between properties).
    { type: 'text', text: propertyProfileText(property, prompt) },
  ];

  const seasonalText = seasonal
    ? JSON.stringify(
        {
          season_label: seasonal.season_label,
          monsoon_active: seasonal.monsoon_active,
          monsoon_type: seasonal.monsoon_type,
          national_holidays: seasonal.national_holidays,
          major_festivals: seasonal.major_festivals,
          wildlife_events: seasonal.wildlife_events,
          surfing_conditions: seasonal.surfing_conditions,
          school_holiday_lk: seasonal.school_holiday_lk,
          eu_uk_peak_outbound: seasonal.eu_uk_peak_outbound,
          notes: seasonal.notes,
        },
        null,
        2,
      )
    : '(no seasonal context on record for this month)';

  const historyText = history.length
    ? JSON.stringify(
        history.map((h) => ({
          year: h.year,
          occupancy_pct: h.occupancy_pct,
          adr_lkr: h.adr_lkr,
          revpar_lkr: h.revpar_lkr,
          total_revenue_lkr: h.total_revenue_lkr,
          room_nights_sold: h.total_room_nights_sold,
          domestic_guest_pct: h.domestic_guest_pct,
          international_guest_pct: h.international_guest_pct,
          top_source_markets: h.top_source_markets,
          avg_length_of_stay: h.avg_length_of_stay,
          repeat_guest_pct: h.repeat_guest_pct,
        })),
        null,
        2,
      )
    : '(no historical records on file — base predictions on the property profile and season, and keep them conservative)';

  const userText = [
    `TARGET MONTH: ${MONTHS[month]} ${year}`,
    '',
    'SEASONAL CONTEXT',
    seasonalText,
    '',
    `HISTORICAL PERFORMANCE FOR ${MONTHS[month].toUpperCase()} (last ${history.length || 0} years)`,
    historyText,
    '',
    `Generate the seasonal offers for ${property.property_name}, ${MONTHS[month]} ${year}. Return ONLY the JSON array.`,
  ].join('\n');

  return { system, userText };
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

export function validateOffers(parsed: unknown): OfferDraft[] {
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Row).offers)
      ? (parsed as Row).offers
      : null;
  if (!arr || arr.length === 0) throw new Error('expected a non-empty JSON array of offers');

  return arr.slice(0, 3).map((o: Row, i: number) => {
    if (!o || typeof o !== 'object') throw new Error(`offer ${i} is not an object`);
    if (!o.offer_title || !o.offer_description) {
      throw new Error(`offer ${i} missing offer_title/offer_description`);
    }
    const offerType = OFFER_TYPES.includes(o.offer_type) ? o.offer_type : 'Package';
    const discountType = DISCOUNT_TYPES.includes(o.discount_type) ? o.discount_type : null;
    return {
      offer_title: String(o.offer_title).slice(0, 200),
      offer_description: String(o.offer_description),
      offer_type: offerType,
      discount_type: discountType,
      discount_value: num(o.discount_value),
      predicted_occupancy_uplift_pct: num(o.predicted_occupancy_uplift_pct),
      predicted_revenue_uplift_pct: num(o.predicted_revenue_uplift_pct),
      predicted_incremental_lkr: num(o.predicted_incremental_lkr),
      llm_rationale: o.llm_rationale ? String(o.llm_rationale) : null,
      target_guest_segment: o.target_guest_segment ? String(o.target_guest_segment).slice(0, 100) : null,
      sustainability_angle: o.sustainability_angle ? String(o.sustainability_angle) : null,
    };
  });
}
