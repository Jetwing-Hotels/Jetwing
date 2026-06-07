import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/guests/score
 * Proxy to the deployed customer-ranker model
 *   HiruniAyesha/jetwing-customer-ranker  (Gradio Space, api_name "/predict")
 *
 * Body:  { rows: number[][] }   — each row is 18 raw features (see lib/guestScoring.ts)
 * Reply: { results: ({ score: number, segment: string } | null)[] }  — aligned to rows
 *
 * The Space scores one observation per call (Gradio queue API), so we fan out
 * with bounded concurrency and return a per-row result. A failed row is `null`
 * rather than failing the whole batch.
 */

const SPACE_URL =
  process.env.HF_SCORING_SPACE_URL ?? 'https://hiruniayesha-jetwing-customer-ranker.hf.space';
const HF_TOKEN = process.env.HF_API_TOKEN; // only needed if the Space is private
const FEATURE_COUNT = 18;
const MAX_ROWS = 100; // guardrail on a single request
const CONCURRENCY = 4;

interface ScoreResult {
  score: number;
  segment: string;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (HF_TOKEN) h.Authorization = `Bearer ${HF_TOKEN}`;
  return h;
}

/** Parse a Gradio SSE response, returning the payload of the `complete` event. */
function parseGradioEvent(text: string): unknown {
  let currentEvent = '';
  let completeData: string | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const data = line.slice(5).trim();
      if (currentEvent === 'complete') completeData = data;
    }
  }
  if (completeData == null) throw new Error('no complete event in Gradio stream');
  return JSON.parse(completeData);
}

/** Call the Space once for a single 18-feature vector. */
async function callSpace(features: number[], signal: AbortSignal): Promise<ScoreResult> {
  const post = await fetch(`${SPACE_URL}/gradio_api/call/predict`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data: features }),
    signal,
  });
  if (!post.ok) throw new Error(`Space POST failed (${post.status})`);
  const { event_id: eventId } = (await post.json()) as { event_id?: string };
  if (!eventId) throw new Error('Space did not return an event_id');

  const stream = await fetch(`${SPACE_URL}/gradio_api/call/predict/${eventId}`, {
    headers: authHeaders(),
    signal,
  });
  if (!stream.ok) throw new Error(`Space stream failed (${stream.status})`);

  const payload = parseGradioEvent(await stream.text());
  // Output component is the first (and only) return value: [{ score, segment }]
  const out = Array.isArray(payload) ? payload[0] : payload;
  if (!out || typeof out.score !== 'number') {
    throw new Error('unexpected Space output shape');
  }
  return { score: out.score, segment: String(out.segment ?? '') };
}

export async function POST(request: NextRequest) {
  let rows: unknown;
  try {
    ({ rows } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Body must be { rows: number[][] }' }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS})` }, { status: 400 });
  }
  for (const r of rows) {
    if (!Array.isArray(r) || r.length !== FEATURE_COUNT || r.some((v) => typeof v !== 'number')) {
      return NextResponse.json(
        { error: `Each row must be ${FEATURE_COUNT} numbers` },
        { status: 400 },
      );
    }
  }

  const vectors = rows as number[][];
  const results: (ScoreResult | null)[] = new Array(vectors.length).fill(null);

  // Bounded-concurrency fan-out over a shared cursor.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  let cursor = 0;

  async function worker() {
    while (cursor < vectors.length) {
      const i = cursor++;
      try {
        results[i] = await callSpace(vectors[i], controller.signal);
      } catch {
        results[i] = null; // isolate the bad/slow row, keep the batch
      }
    }
  }

  try {
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, vectors.length) }, () => worker()),
    );
  } finally {
    clearTimeout(timeout);
  }

  return NextResponse.json({ results });
}
