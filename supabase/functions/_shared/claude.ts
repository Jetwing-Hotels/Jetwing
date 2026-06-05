import Anthropic from 'npm:@anthropic-ai/sdk@0.100.1';

/** System content block; mark the stable prefix with cache_control for prompt caching. */
export interface SystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

/** Minimal shape of the Messages API response we read (avoids SDK overload friction). */
interface ClaudeResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason?: string | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

export const CLAUDE_MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-opus-4-8';

export function makeClient(): Anthropic {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

/** Strip ``` fences / surrounding prose and return the JSON substring. */
export function extractJson(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // If there's leading/trailing prose, slice to the outermost bracket pair.
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

/**
 * Call Claude and return validated JSON.
 *
 * - Default model claude-opus-4-8 with adaptive thinking.
 * - `system` blocks carry the prompt-cache breakpoints (place the stable
 *   preamble first with cache_control so it is reused across calls).
 * - On invalid/again-invalid JSON it retries once with a corrective turn,
 *   so transient formatting slips don't fail the pipeline.
 */
export async function generateJson<T>(opts: {
  client: Anthropic;
  system: SystemBlock[];
  userText: string;
  maxTokens: number;
  effort?: 'low' | 'medium' | 'high';
  validate: (parsed: unknown) => T;
}): Promise<JsonResult<T>> {
  const { client, system, userText, maxTokens, effort = 'medium', validate } = opts;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: userText },
  ];

  let tokensIn = 0;
  let tokensOut = 0;
  let lastError = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    // Loosely typed so newer params (output_config.effort) don't trip Deno's
    // type-check against the pinned SDK's declared shape.
    const params = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      output_config: { effort },
      system,
      messages,
    };

    // deno-lint-ignore no-explicit-any
    const res = (await client.messages.create(params as any)) as unknown as ClaudeResponse;

    tokensIn +=
      (res.usage?.input_tokens ?? 0) +
      (res.usage?.cache_read_input_tokens ?? 0) +
      (res.usage?.cache_creation_input_tokens ?? 0);
    tokensOut += res.usage?.output_tokens ?? 0;

    if (res.stop_reason === 'refusal') throw new Error('Claude refused the request');

    const textBlock = res.content.find((b) => b.type === 'text');
    const raw = textBlock?.text ?? '';

    if (res.stop_reason === 'max_tokens') {
      lastError = 'response truncated (max_tokens)';
    } else {
      try {
        return { data: validate(JSON.parse(extractJson(raw))), tokensIn, tokensOut };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    // Corrective retry turn.
    messages.push({ role: 'assistant', content: raw || '(no output)' });
    messages.push({
      role: 'user',
      content:
        `Your previous response was not valid JSON matching the required schema (${lastError}). ` +
        `Respond again with ONLY the JSON — no prose, no markdown code fences.`,
    });
  }

  throw new Error(`Failed to obtain valid JSON after retry: ${lastError}`);
}

/** Rough Opus 4.8 cost estimate (USD) from token counts. */
export function estimateCostUsd(tokensIn: number, tokensOut: number): number {
  return (tokensIn / 1_000_000) * 5 + (tokensOut / 1_000_000) * 25;
}
