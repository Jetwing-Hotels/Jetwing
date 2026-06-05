// ============================================================================
// Edge Function: generate-offers
// Generates seasonal offers for one or all properties for a target month/year,
// calling Claude (claude-opus-4-8) with structured prompts + prompt caching,
// then writes PENDING_REVIEW offers and updates the offer_generation_runs row.
//
// Invoke:
//   POST { "month": 7, "year": 2025 }                 → all active properties
//   POST { "month": 7, "year": 2025, "property_id": "…" }  → one property
//   Optional: "run_id" (attach to an existing run), "triggered_by_user"
// ============================================================================

import { corsHeaders, json } from '../_shared/cors.ts';
import { makeAdmin, checkSecret } from '../_shared/supabaseAdmin.ts';
import { makeClient, generateJson, estimateCostUsd } from '../_shared/claude.ts';
import { buildOfferPrompt, validateOffers } from '../_shared/offers.ts';

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!checkSecret(req)) return json({ error: 'Unauthorized' }, 401);

  let body: Row;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const month = Number(body.month);
  const year = Number(body.year);
  if (!(month >= 1 && month <= 12) || !(year >= 2024)) {
    return json({ error: 'Provide a valid month (1-12) and year (>=2024)' }, 400);
  }

  const admin = makeAdmin();
  const client = makeClient();

  // Resolve target properties.
  let propsQuery = admin.from('properties').select('*').eq('active', true);
  if (body.property_id) propsQuery = propsQuery.eq('property_id', body.property_id);
  const { data: properties, error: propErr } = await propsQuery;
  if (propErr) return json({ error: propErr.message }, 500);
  if (!properties || properties.length === 0) return json({ error: 'No matching properties' }, 404);

  // Create or attach the generation run.
  let runId: string = body.run_id;
  if (!runId) {
    const { data: run, error: runErr } = await admin
      .from('offer_generation_runs')
      .insert({
        target_month: month,
        target_year: year,
        triggered_by: 'API',
        triggered_by_user: body.triggered_by_user ?? null,
        status: 'RUNNING',
      })
      .select('run_id')
      .single();
    if (runErr) return json({ error: runErr.message }, 500);
    runId = run.run_id;
  }

  // Seasonal context for the month (shared across properties).
  const { data: seasonal } = await admin
    .from('seasonal_context')
    .select('*')
    .eq('month', month)
    .maybeSingle();

  const processed: string[] = [];
  const failed: { property_id: string; error: string }[] = [];
  let totalOffers = 0;
  let tokIn = 0;
  let tokOut = 0;

  for (const property of properties as Row[]) {
    try {
      // Active offer-generation prompt for this property (fallbacks: global, then built-in).
      const { data: prompt } = await admin
        .from('prompt_registry')
        .select('*')
        .eq('module', 'offer_generation')
        .eq('is_active', true)
        .or(`property_id.eq.${property.property_id},property_id.is.null`)
        .order('property_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      // Last 5 years of history for the target month.
      const { data: history } = await admin
        .from('historical_revenue')
        .select('*')
        .eq('property_id', property.property_id)
        .eq('month', month)
        .order('year', { ascending: true })
        .limit(5);

      const { system, userText } = buildOfferPrompt({
        property,
        prompt: prompt ?? null,
        seasonal: seasonal ?? null,
        history: history ?? [],
        month,
        year,
      });

      const { data: offers, tokensIn, tokensOut } = await generateJson({
        client,
        system,
        userText,
        maxTokens: 8000,
        effort: 'medium',
        validate: validateOffers,
      });
      tokIn += tokensIn;
      tokOut += tokensOut;

      const rows = offers.map((o) => ({
        generation_run_id: runId,
        property_id: property.property_id,
        target_month: month,
        target_year: year,
        offer_title: o.offer_title,
        offer_description: o.offer_description,
        offer_type: o.offer_type,
        discount_type: o.discount_type,
        discount_value: o.discount_value,
        predicted_occupancy_uplift_pct: o.predicted_occupancy_uplift_pct,
        predicted_revenue_uplift_pct: o.predicted_revenue_uplift_pct,
        predicted_incremental_lkr: o.predicted_incremental_lkr,
        llm_rationale: o.llm_rationale,
        target_guest_segment: o.target_guest_segment,
        sustainability_angle: o.sustainability_angle,
        status: 'PENDING_REVIEW',
      }));

      const { error: insErr } = await admin.from('seasonal_offers').insert(rows);
      if (insErr) throw new Error(insErr.message);

      processed.push(property.property_id);
      totalOffers += rows.length;
    } catch (e) {
      failed.push({
        property_id: property.property_id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const status = failed.length === 0 ? 'COMPLETED' : processed.length === 0 ? 'FAILED' : 'PARTIAL';

  await admin
    .from('offer_generation_runs')
    .update({
      status,
      properties_processed: processed,
      properties_failed: failed.map((f) => f.property_id),
      total_offers_generated: totalOffers,
      total_tokens_used: tokIn + tokOut,
      estimated_api_cost_usd: Number(estimateCostUsd(tokIn, tokOut).toFixed(4)),
      completed_at: new Date().toISOString(),
      error_log: failed.length ? JSON.stringify(failed) : null,
    })
    .eq('run_id', runId);

  return json({
    run_id: runId,
    status,
    total_offers: totalOffers,
    processed,
    failed,
    estimated_cost_usd: Number(estimateCostUsd(tokIn, tokOut).toFixed(4)),
  });
});
