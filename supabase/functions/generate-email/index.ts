// ============================================================================
// Edge Function: generate-email
// Generates a personalised marketing email for campaign audience member(s) with
// Claude (claude-opus-4-8), using prompt caching so the shared offer/property
// prefix is reused across the whole audience. Only first name + score tier are
// sent to the LLM (no email / financial PII).
//
// Invoke:
//   POST { "audience_id": "…" }                       → one recipient
//   POST { "campaign_id": "…", "limit": 25 }          → up to N pending recipients
// ============================================================================

import { corsHeaders, json } from '../_shared/cors.ts';
import { makeAdmin, checkSecret } from '../_shared/supabaseAdmin.ts';
import { makeClient, generateJson } from '../_shared/claude.ts';
import { buildEmailPrompt, validateEmail } from '../_shared/emails.ts';

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

  const admin = makeAdmin();
  const client = makeClient();

  // Build the audience worklist.
  let audience: Row[] = [];
  if (body.audience_id) {
    const { data, error } = await admin
      .from('campaign_audience')
      .select('*')
      .eq('audience_id', body.audience_id)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: 'Audience member not found' }, 404);
    audience = [data];
  } else if (body.campaign_id) {
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);
    const { data, error } = await admin
      .from('campaign_audience')
      .select('*')
      .eq('campaign_id', body.campaign_id)
      .eq('send_status', 'PENDING')
      .is('email_html_body', null)
      .limit(limit);
    if (error) return json({ error: error.message }, 500);
    audience = data ?? [];
  } else {
    return json({ error: 'Provide audience_id or campaign_id' }, 400);
  }

  if (audience.length === 0) return json({ generated: 0, message: 'Nothing to generate' });

  // Per-campaign context caches (campaign → offers → property → email prompt).
  const campaignCache = new Map<string, Row>();
  const offersCache = new Map<string, Row[]>();
  const propertyCache = new Map<string, Row>();
  const promptCache = new Map<string, Row | null>();

  async function contextFor(campaignId: string) {
    let campaign = campaignCache.get(campaignId);
    if (!campaign) {
      const { data } = await admin.from('campaigns').select('*').eq('campaign_id', campaignId).single();
      campaign = data!;
      campaignCache.set(campaignId, campaign);
    }
    const offerIds: string[] = Array.isArray(campaign.offer_ids) ? campaign.offer_ids : [];
    let offers = offersCache.get(campaignId);
    if (!offers) {
      const { data } = await admin
        .from('seasonal_offers')
        .select('offer_id, property_id, offer_title, offer_description, sustainability_angle, valid_from, valid_to')
        .in('offer_id', offerIds.length ? offerIds : ['00000000-0000-0000-0000-000000000000']);
      offers = data ?? [];
      offersCache.set(campaignId, offers);
    }
    const propertyId = offers[0]?.property_id;
    let property = propertyId ? propertyCache.get(propertyId) : undefined;
    if (propertyId && !property) {
      const { data } = await admin.from('properties').select('*').eq('property_id', propertyId).single();
      property = data!;
      propertyCache.set(propertyId, property);
    }
    let prompt = propertyId ? promptCache.get(propertyId) : null;
    if (propertyId && prompt === undefined) {
      const { data } = await admin
        .from('prompt_registry')
        .select('*')
        .eq('module', 'email_personalisation')
        .eq('is_active', true)
        .or(`property_id.eq.${propertyId},property_id.is.null`)
        .order('property_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      prompt = data ?? null;
      promptCache.set(propertyId, prompt);
    }
    return { campaign, offers, property, prompt: prompt ?? null };
  }

  let generated = 0;
  const failed: { audience_id: string; error: string }[] = [];

  for (const member of audience) {
    try {
      const ctx = await contextFor(member.campaign_id);
      if (!ctx.property || ctx.offers.length === 0) {
        throw new Error('campaign has no resolvable property/offers');
      }

      // Minimal-PII guest fields.
      const { data: customer } = await admin
        .from('customers')
        .select('first_name, preferred_language')
        .eq('customer_id', member.customer_id)
        .maybeSingle();

      const { system, userText } = buildEmailPrompt({
        property: ctx.property,
        offers: ctx.offers,
        prompt: ctx.prompt,
        firstName: customer?.first_name ?? 'Guest',
        scoreTier: member.score_tier_snapshot ?? 'Standard',
        language: customer?.preferred_language ?? 'en',
      });

      const { data: email, tokensIn, tokensOut } = await generateJson({
        client,
        system,
        userText,
        maxTokens: 4000,
        effort: 'low',
        validate: validateEmail,
      });

      const { error: updErr } = await admin
        .from('campaign_audience')
        .update({
          email_subject: email.subject_line,
          email_html_body: email.html_body,
          email_plain_body: email.plain_text_body,
          generation_tokens_used: tokensIn + tokensOut,
        })
        .eq('audience_id', member.audience_id);
      if (updErr) throw new Error(updErr.message);

      generated++;
    } catch (e) {
      failed.push({
        audience_id: member.audience_id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return json({ generated, failed, requested: audience.length });
});
