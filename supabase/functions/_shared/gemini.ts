// ============================================================================
// Gemini client for Edge Functions — drop-in replacement for claude.ts.
// Exposes the same surface (SystemBlock, makeClient, generateJson,
// estimateCostUsd) so the prompt builders and edge functions are unchanged.
//
// Uses the Google Gen AI SDK (@google/genai). JSON is requested via the prompt
// (the builders already say "Return ONLY the JSON …") and parsed with a single
// corrective retry — the same robust approach the Claude version used, with no
// dependency on a provider-specific JSON-mode flag.
// ============================================================================

import './deno-globals.ts';
import { GoogleGenAI } from 'npm:@google/genai@1.21.0';

/**
 * System content block. `cache_control` is ignored by Gemini (no prompt
 * caching here) but kept so the existing prompt builders compile unchanged.
 */
export interface SystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

// If the primary model is overloaded (503), fall back to these in order. Override
// with GEMINI_FALLBACK_MODELS (comma-separated). gemini-2.0-flash is GA and usually
// has spare capacity when 2.5-flash is spiking.
const FALLBACK_MODELS = (Deno.env.get('GEMINI_FALLBACK_MODELS') ?? 'gemini-2.0-flash,gemini-flash-latest')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Primary model first, then de-duplicated fallbacks. */
export function modelChain(): string[] {
  return [GEMINI_MODEL, ...FALLBACK_MODELS].filter((m, i, a) => a.indexOf(m) === i);
}

export function makeClient(): GoogleGenAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
}

/** Strip ``` fences / surrounding prose and return the JSON substring. */
export function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const firstObj = t.indexOf('{');
  const firstArr = t.indexOf('[');
  const start = firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstObj, firstArr);
  if (start > 0) {
    const lastObj = t.lastIndexOf('}');
    const lastArr = t.lastIndexOf(']');
    const end = Math.max(lastObj, lastArr);
    if (end > start) t = t.slice(start, end + 1);
  }
  return t;
}

export interface JsonResult<T> {
  data: T;
  tokensIn: number;
  tokensOut: number;
}

/** Transient Gemini errors (overloaded / rate-limited / brief 5xx) worth retrying. */
function isTransient(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('rate limit') ||
    msg.includes('500') ||
    msg.includes('internal error')
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Call Gemini once, retrying on transient overload/rate-limit errors with
 * exponential backoff (0.6s → 1.8s → 5.4s). Non-transient errors throw immediately.
 */
// deno-lint-ignore no-explicit-any
async function generateWithBackoff(client: GoogleGenAI, params: any, maxAttempts = 4) {
  let delay = 600;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (e) {
      lastErr = e;
      if (!isTransient(e) || attempt === maxAttempts) throw e;
      await sleep(delay);
      delay *= 3;
    }
  }
  throw lastErr;
}

// deno-lint-ignore no-explicit-unknown
type GeminiContent = { role: 'user' | 'model'; parts: { text: string }[] };

/**
 * Call Gemini and return validated JSON.
 *
 * - `system` blocks are concatenated into a single systemInstruction.
 * - On invalid JSON it retries once with a corrective turn, so transient
 *   formatting slips don't fail the pipeline (mirrors the Claude version).
 * - `effort` is accepted for signature parity; on gemini-2.5-flash it maps to
 *   disabling "thinking" (faster/cheaper, free-tier friendly).
 */
export async function generateJson<T>(opts: {
  client: GoogleGenAI;
  system: SystemBlock[];
  userText: string;
  maxTokens: number;
  effort?: 'low' | 'medium' | 'high';
  validate: (parsed: unknown) => T;
}): Promise<JsonResult<T>> {
  const { client, system, userText, maxTokens, validate } = opts;

  const systemInstruction = system.map((b) => b.text).join('\n\n');

  let tokensIn = 0;
  let tokensOut = 0;
  let lastError = '';

  // Try each model in the chain. If one is overloaded (transient 503/429) even
  // after backoff, fall through to the next model instead of failing the call.
  for (const model of modelChain()) {
    const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: userText }] }];

    // deno-lint-ignore no-explicit-unknown
    const config: Record<string, unknown> = {
      systemInstruction,
      maxOutputTokens: maxTokens,
      temperature: 0.6,
    };
    // Disabling thinking is only valid on 2.5 Flash; leave other models at default.
    if (model.startsWith('gemini-2.5-flash')) {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      let res;
      try {
        res = await generateWithBackoff(client, { model, contents, config });
      } catch (e) {
        lastError = `${model}: ${e instanceof Error ? e.message : String(e)}`;
        break; // exhausted backoff for this model → try the next model in the chain
      }

      const usage = res.usageMetadata ?? {};
      tokensIn += usage.promptTokenCount ?? 0;
      tokensOut += (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);

      const raw = res.text ?? '';
      if (raw) {
        try {
          return { data: validate(JSON.parse(extractJson(raw))), tokensIn, tokensOut };
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      } else {
        lastError = 'empty response (possibly blocked or truncated)';
      }

      // Corrective retry turn (same model).
      contents.push({ role: 'model', parts: [{ text: raw || '(no output)' }] });
      contents.push({
        role: 'user',
        parts: [{
          text:
            `Your previous response was not valid JSON matching the required schema (${lastError}). ` +
            `Respond again with ONLY the JSON — no prose, no markdown code fences.`,
        }],
      });
    }
  }

  throw new Error(`Failed to obtain valid JSON (all models): ${lastError}`);
}

/**
 * Rough cost estimate (USD) for Gemini 2.5 Flash (~$0.30 / 1M input,
 * ~$2.50 / 1M output). Approximate — adjust if you switch GEMINI_MODEL.
 */
export function estimateCostUsd(tokensIn: number, tokensOut: number): number {
  return (tokensIn / 1_000_000) * 0.3 + (tokensOut / 1_000_000) * 2.5;
}
