# Edge Functions — Claude offer & email generation

Two Deno Edge Functions call the Claude API (`claude-opus-4-8`) — the LLM layer
of the Guest Intelligence Layer. They run with the **service-role** key (the
`SYSTEM` identity) and bypass RLS.

| Function | Purpose | Invoke body |
| --- | --- | --- |
| `generate-offers` | Seasonal offer generation → `seasonal_offers` (PENDING_REVIEW) + updates `offer_generation_runs` | `{ month, year, property_id? , run_id? }` |
| `generate-email` | Personalised marketing emails → `campaign_audience` | `{ audience_id }` or `{ campaign_id, limit? }` |

Shared code lives in `_shared/`:
- `claude.ts` — SDK client, **prompt-cached** system blocks, adaptive thinking, robust JSON parse + one corrective retry, cost estimate.
- `offers.ts` / `emails.ts` — prompt builders (stable preamble first for cache reuse) + validators.
- `supabaseAdmin.ts` — service-role client + optional `x-function-secret` guard.

## Claude integration notes
- **Model:** `claude-opus-4-8` (override with the `CLAUDE_MODEL` secret).
- **Thinking:** adaptive (`thinking: {type:"adaptive"}`) with `output_config.effort` — `medium` for offers (analytical), `low` for emails (creative, high volume).
- **Prompt caching:** the large brand/instruction preamble is identical bytes for every property and recipient, with a `cache_control` breakpoint, so it's reused across the whole run/audience (and future runs). Emails add a second breakpoint after the shared offer/property block so only the per-guest first-name + tier vary. Caching needs a ≥4096-token prefix on Opus to kick in — verify with `usage.cache_read_input_tokens`.
- **PII:** only first name + score tier are sent to Claude for emails — never email, phone, or financial data.
- **Robustness:** responses are parsed and schema-validated; on failure the helper retries once with a corrective turn before erroring.

## Set secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# optional:
supabase secrets set CLAUDE_MODEL=claude-opus-4-8
supabase secrets set EDGE_FUNCTION_SECRET=$(openssl rand -hex 16)
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set them.

## Deploy

```bash
supabase functions deploy generate-offers
supabase functions deploy generate-email
```

## Invoke directly (testing)

```bash
supabase functions invoke generate-offers \
  --body '{"month":7,"year":2025,"property_id":"<uuid>"}'

supabase functions invoke generate-email \
  --body '{"campaign_id":"<uuid>","limit":10}'
```

From the app, the Next.js routes invoke them for you:
- `POST /api/v1/offers/generate` → `generate-offers`
- `POST /api/v1/campaigns/:id/generate-emails` → `generate-email`

If `EDGE_FUNCTION_SECRET` is set, also put it in the Next.js env (`.env.local`)
so the routes forward it as `x-function-secret`.

## Prerequisites for good output
- Run `supabase/seed.sql` (properties + seasonal context).
- Load `historical_revenue` (the 5-year ADR/occupancy history the offer prompt is grounded in). Without it, offers still generate but predictions are conservative.
- Optionally seed `prompt_registry` with property-specific `system_context` / `property_profile`; otherwise a built-in default profile (derived from the `properties` row) is used.
