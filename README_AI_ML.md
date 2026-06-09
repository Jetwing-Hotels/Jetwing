# JetMind — AI & ML Architecture

How the two AI systems in JetMind actually work: the **Gemini LLM** (generative — writes
offers & emails) and the **HuggingFace ML model** (discriminative — ranks guests 0–100). This
document traces the real code paths and payloads, not generalities.

> **One-line contrast:** Gemini *writes* offers/emails from structured business data with a
> validate-and-retry loop that guarantees clean JSON. The HF model *ranks* guests from an
> 18-feature behavioural vector. Both run **server-side only** (Edge Function / API proxy) so
> secrets never touch the browser, and both **degrade gracefully**.

---

## Table of contents
1. [Gemini (LLM) — offers, emails & sustainability insights](#part-1--gemini-the-llm)
2. [The ML model — guest scoring (HuggingFace Space)](#part-2--the-ml-model-guest-scoring)
3. [Why this design](#design-principles)
4. [Configuration / secrets](#configuration--secrets)

---

## Part 1 — Gemini (the LLM)

Gemini is **never called from the browser**. It runs inside **Supabase Edge Functions** (Deno),
and the Next.js API only *invokes* those functions. Three functions share one client
([`supabase/functions/_shared/gemini.ts`](supabase/functions/_shared/gemini.ts)):

| Edge Function | Purpose | Input payload | Output |
|---|---|---|---|
| `generate-offers` | 2–3 seasonal offers per property | `{ month, year, property_id?, business_goal?, additional_instructions? }` | `seasonal_offers` rows (`PENDING_REVIEW`) |
| `generate-email` | Personalised marketing email | `{ audience_id }` or `{ campaign_id, limit }` | `{ subject_line, html_body, plain_text_body }` onto `campaign_audience` |
| `generate-sustainability-insights` | ESG recommendations | `{ metrics, articles }` | `Insight[]` (with rule-based fallback) |

### The chain (offer generation)

```
Browser  (Offer Intelligence → "Generate")
  │  POST /api/v1/offers/generate
  │  { month, year, business_goal, additional_instructions }
  ▼
Next.js route  (app/api/v1/offers/generate/route.ts)
  │  requireAdmin() → Zod validate
  │  admin.functions.invoke('generate-offers', { body, headers:{ x-function-secret } })
  │  returns 202 Accepted immediately
  ▼
Edge Function  (supabase/functions/generate-offers)
  │  for each property:
  │    gather DB context → build prompt → call Gemini → validate JSON → INSERT
  ▼
Supabase Postgres  → seasonal_offers (status = 'PENDING_REVIEW')
                   → offer_generation_runs (tokens + estimated USD cost)
```

The heavy work (one Gemini call **per property**) happens server-side, so the browser never waits.

### Grounding data gathered before the call

[`generate-offers/index.ts`](supabase/functions/generate-offers/index.ts) pulls from Postgres so
the model is grounded in real numbers, not guesses:

- **Property profile** — name, brand tier, type, location, room count, sustainability tier.
- **Seasonal context** for the month — monsoon, national holidays, festivals, wildlife events,
  surf conditions, EU/UK outbound peaks.
- **5 years of historical revenue** for that exact month — occupancy %, ADR, RevPAR, total
  revenue, room-nights, source markets, length-of-stay, repeat-guest %.
- **Active prompt** from `prompt_registry` (optional per-property override).

### The actual payload sent to Gemini

The prompt is split into a **system instruction** (stable, cacheable) and a **user message**
(the data). From [`_shared/offers.ts`](supabase/functions/_shared/offers.ts):

**System instruction** (role + task + strict output contract):

```
You are the revenue-strategy intelligence for Jetwing Symphony PLC…
TASK: identify 2–3 seasonal opportunity windows and propose one offer per window…
OUTPUT FORMAT: Return ONLY a JSON array of 2–3 objects with exactly these keys:
[{ "offer_title": string, "offer_type": "Accommodation"|"Package"|…,
   "discount_type": …|null, "predicted_incremental_lkr": number, … }]
```

**User message** (grounding, serialized as JSON-in-text):

```
STRATEGIC DIRECTIVE (operator priority…)
Business goal: Increase occupancy at Jetwing Yala during August.

TARGET MONTH: August 2025

SEASONAL CONTEXT
{ "season_label": "...", "monsoon_active": false, "major_festivals": [...], ... }

HISTORICAL PERFORMANCE FOR AUGUST (last 5 years)
[ { "year": 2024, "occupancy_pct": 78, "adr_lkr": 42000, "revpar_lkr": 32760, ... }, ... ]

Generate the seasonal offers for Jetwing Yala, August 2025. Return ONLY the JSON array.
```

The exact request object to the SDK (`generateJson` in `gemini.ts`):

```js
client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: userText }] }],
  config: {
    systemInstruction,            // system block(s) joined
    maxOutputTokens: 8000,
    temperature: 0.6,
    thinkingConfig: { thinkingBudget: 0 }  // disable "thinking" on 2.5-flash → faster/cheaper
  }
})
```

### Response handling (the robust part)

Gemini returns text. The client does **not** rely on a provider JSON-mode flag — instead:

1. **`extractJson()`** strips ` ```json ` fences / surrounding prose and isolates the `[…]` / `{…}`
   substring.
2. **`JSON.parse` → `validateOffers()`** coerces and clamps every field (whitelists `offer_type`,
   converts numbers, truncates strings).
3. **One corrective retry** — if parse/validation fails, it sends a follow-up turn ("Your previous
   response was not valid JSON… respond again with ONLY the JSON"). Two attempts max, then it throws.

Valid offers become `seasonal_offers` rows (`PENDING_REVIEW`); the run is logged in
`offer_generation_runs` with **token counts + an estimated USD cost**
(`estimateCostUsd`: ~$0.30/1M input, ~$2.50/1M output).

### The email function — same engine, smaller + privacy-first

[`generate-email/index.ts`](supabase/functions/generate-email/index.ts):

- Input: `{ audience_id }` (one recipient) or `{ campaign_id, limit }` (batch of pending recipients).
- **Only `first_name` + `score_tier` + `preferred_language` are sent to Gemini** — never email,
  spend, or other PII.
- `maxTokens: 4000`, `effort: 'low'`.
- Output JSON `{ subject_line, html_body, plain_text_body }` is written back onto the
  `campaign_audience` row.

### Sustainability insights — AI with a safety net

[`/api/sustainability/insights`](app/api/sustainability/insights/route.ts) sends
`{ metrics, articles }` (dashboard numbers + live NewsAPI headlines) to the
`generate-sustainability-insights` function. **If Gemini fails or returns nothing, a deterministic
rule-based `buildFallbackInsights()` runs instead** — so the panel never breaks.

---

## Part 2 — The ML model (guest scoring)

A completely different system — **not generative**. It is a trained ranking model
(`HiruniAyesha/jetwing-customer-ranker`) deployed as a **Gradio Space** on HuggingFace, exposing a
`/predict` endpoint.

### The chain

```
Browser  (Filtering table auto-scores rows)
  │  buildGuestVector(guest) → 18 numbers per guest   (lib/guestScoring.ts)
  │  POST /api/guests/score   { rows: number[][] }
  ▼
Next.js proxy  (app/api/guests/score/route.ts)
  │  validate each row = 18 numbers
  │  fan out with concurrency = 4 (one guest per Space call)
  │  per row → Gradio queue API (POST → event_id → SSE stream)
  ▼
HuggingFace Space  (Gradio /predict)
  │  log1p + QuantileTransformer → model → percentile
  ▼
{ results: [ { score, segment } | null, ... ] }   (aligned to input rows)
```

### The payload: 18 raw features, in exact order

Feature contract in [`lib/guestScoring.ts`](lib/guestScoring.ts) — `FEATURE_ORDER` (must match the
model byte-for-byte):

```
recency_days, frequency_total, monetary_total, monetary_avg_per_stay,
avg_length_of_stay, avg_lead_time_days, cancellation_ratio, direct_booking_ratio,
is_repeated_guest, prev_completed_bookings, avg_special_requests,
luxury_reserve_visits, premium_hotel_visits, luxury_affinity_ratio,
eco_engagement_flag, avg_adr, high_season_preference, domestic_guest
```

`buildGuestVector()` derives these from a guest row (recency from last booking date, monetary from
total spend, repeat flag from guest type, eco flag from services used, etc.).

> **Critical detail:** the client sends **raw values**. The Space applies its own `log1p` +
> `QuantileTransformer` internally, so the client must **not** pre-normalise.

Example request body to the proxy:

```json
{ "rows": [
  [120, 5, 1183200, 236640, 3, 21, 0, 1, 1, 5, 0, 5, 5, 1, 1, 78880, 0, 0],
  [400, 1,   95000,  95000, 2, 21, 0, 0, 0, 1, 0, 0, 1, 0, 0, 47500, 1, 1]
]}
```

### The Gradio call (two-step queue protocol)

Gradio Spaces don't return synchronously — they queue. `callSpace()` does it in two hops:

1. **POST** `/gradio_api/call/predict` with `{ "data": [<18 features>] }` → returns `{ event_id }`.
2. **GET** `/gradio_api/call/predict/{event_id}` → an **SSE stream**; `parseGradioEvent()` reads the
   `complete` event and parses its data: `[{ score, segment }]`.

### Output → tiers

Each result is `{ score: 0–100 (percentile), segment: "Top 10% Customer" | … }`. `tierFor(score)`
maps it to a badge:

```
≥ 80 Platinum   ·   ≥ 60 Gold   ·   ≥ 40 Silver   ·   else Standard
```

So **"87" means "this guest ranks in the 87th percentile of predicted value."**

### Resilience

- The Space scores **one guest per call**, so the proxy **fans out with `CONCURRENCY = 4`** and a
  60s abort timeout.
- A failed/slow row returns **`null`** instead of failing the whole batch — `results` stays
  index-aligned to the input.
- Guardrails: max 100 rows/request; each row must be exactly 18 numbers.

---

## Design principles

- **Server-side only.** Gemini runs in Edge Functions; the HF model is reached through a Next.js
  proxy. API keys (`GEMINI_API_KEY`, `HF_API_TOKEN`) never reach the browser bundle.
- **Provider-agnostic LLM layer.** The prompt builders and edge functions import a single shared
  client interface (`makeClient` / `generateJson`), so migrating **Claude → Gemini** touched one
  file; the prompt logic didn't move.
- **Grounded generation.** Offers are built from property profile + seasonal context + 5 years of
  real revenue, so predictions are anchored, not aspirational.
- **Graceful degradation everywhere.** JSON-repair retry (offers/emails), per-row `null` isolation
  (scoring), rule-based fallback (sustainability insights).
- **Privacy by minimisation.** The email LLM only ever sees first name + score tier + language.
- **Cost awareness.** Each generation run records tokens used and an estimated USD cost.

---

## Configuration / secrets

| Variable | Where | Used by |
|---|---|---|
| `GEMINI_API_KEY` | Supabase secret | All three Edge Functions |
| `GEMINI_MODEL` | Supabase secret (optional) | Override model (default `gemini-2.5-flash`) |
| `EDGE_FUNCTION_SECRET` | Supabase secret + `.env.local` | Shared secret guarding Edge Function invocation (`x-function-secret`) |
| `HF_SCORING_SPACE_URL` | `.env.local` (optional) | `/api/guests/score` proxy target |
| `HF_API_TOKEN` | `.env.local` (optional) | Only if the HF Space is private |
| `NEWS_API_KEY` | `.env.local` | Sustainability news feed (input to insights) |

Edge Function secrets are set with the Supabase CLI, e.g.:

```bash
supabase secrets set GEMINI_API_KEY=AIza...
```

---

## Key files

| File | Role |
|---|---|
| [`supabase/functions/_shared/gemini.ts`](supabase/functions/_shared/gemini.ts) | Gemini client: `makeClient`, `generateJson` (extract + validate + retry), cost estimate |
| [`supabase/functions/_shared/offers.ts`](supabase/functions/_shared/offers.ts) | Offer prompt builder + `validateOffers` |
| [`supabase/functions/_shared/emails.ts`](supabase/functions/_shared/emails.ts) | Email prompt builder + `validateEmail` |
| [`supabase/functions/generate-offers/index.ts`](supabase/functions/generate-offers/index.ts) | Offer generation orchestration |
| [`supabase/functions/generate-email/index.ts`](supabase/functions/generate-email/index.ts) | Email generation orchestration |
| [`app/api/v1/offers/generate/route.ts`](app/api/v1/offers/generate/route.ts) | Next.js → Edge Function invoke |
| [`app/api/guests/score/route.ts`](app/api/guests/score/route.ts) | Scoring proxy (Gradio queue + SSE, fan-out) |
| [`lib/guestScoring.ts`](lib/guestScoring.ts) | 18-feature contract + `buildGuestVector` + `tierFor` |
