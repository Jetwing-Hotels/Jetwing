import { corsHeaders, json } from '../_shared/cors.ts';
import { checkSecret } from '../_shared/supabaseAdmin.ts';
import { makeClient, generateJson, estimateCostUsd } from '../_shared/gemini.ts';
import { buildInsightPrompt, validateInsights } from '../_shared/insights.ts';

// deno-lint-ignore no-explicit-unknown
type Row = Record<string, unknown>;

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

  const metrics = body.metrics as Record<string, number>;
  const articles = body.articles as Array<{ title: string; source: string; description: string }>;

  if (!metrics || typeof metrics !== 'object') {
    return json({ error: 'metrics must be a non-empty object' }, 400);
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return json({ error: 'articles must be a non-empty array' }, 400);
  }

  try {
    const client = makeClient();

    const { system, userText } = buildInsightPrompt(metrics, articles);

    const { data: insights, tokensIn, tokensOut } = await generateJson({
      client,
      system,
      userText,
      maxTokens: 2000,
      effort: 'low',
      validate: validateInsights,
    });

    const estimatedCost = estimateCostUsd(tokensIn, tokensOut);

    return json({
      data: insights,
      tokensIn,
      tokensOut,
      estimatedCostUsd: Number(estimatedCost.toFixed(4)),
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return json({ error }, 500);
  }
});
