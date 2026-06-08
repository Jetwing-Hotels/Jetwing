import type { SystemBlock } from './gemini.ts';

export interface Insight {
  type: 'recommendation' | 'carbon' | 'resource' | 'risk' | 'saving';
  title: string;
  body: string;
  impact: string;
}

const INSIGHT_TYPES = ['recommendation', 'carbon', 'resource', 'risk', 'saving'] as const;

const SYSTEM_PREAMBLE = `You are a sustainability advisor for Sri Lankan luxury hotels. Your role is to generate 4-5 actionable insights based on current KPI metrics and recent industry news.

Each insight should:
- Be grounded in the provided data (KPIs and news)
- Offer a specific, measurable recommendation or observation
- Include quantified impact where possible
- Be aligned with sustainability best practices

Insight types:
- 'carbon': Focus on carbon emissions and climate impact
- 'resource': Focus on water, waste, or energy efficiency
- 'saving': Focus on cost savings from sustainability improvements
- 'risk': Focus on emerging risks (climate, regulatory, supply chain)
- 'recommendation': General sustainability recommendation

OUTPUT FORMAT
Return ONLY a JSON array (no prose, no markdown fences) of 4-5 objects with exactly these keys:
[{
  "type": "recommendation"|"carbon"|"resource"|"risk"|"saving",
  "title": string,
  "body": string,
  "impact": string
}]`;

export function buildInsightPrompt(
  metrics: Record<string, number>,
  articles: Array<{ title: string; source: string; description: string }>
): { system: SystemBlock[]; userText: string } {
  const system: SystemBlock[] = [
    {
      type: 'text',
      text: SYSTEM_PREAMBLE,
      cache_control: { type: 'ephemeral' },
    },
  ];

  const metricsText = Object.entries(metrics)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const articlesText = articles
    .map((a) => `- "${a.title}" (${a.source}): ${a.description}`)
    .join('\n');

  const userText = [
    'CURRENT KPI METRICS',
    metricsText,
    '',
    'RECENT SUSTAINABILITY NEWS & TRENDS',
    articlesText,
    '',
    'Generate 4-5 sustainability insights based on the above metrics and news. Return ONLY the JSON array.',
  ].join('\n');

  return { system, userText };
}

const str = (v: unknown): string | null => {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
};

export function validateInsights(parsed: unknown): Insight[] {
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).insights)
      ? (parsed as Record<string, unknown>).insights
      : null;

  if (!arr || arr.length === 0) throw new Error('expected a non-empty JSON array of insights');

  return arr.slice(0, 5).map((insight: unknown, i: number) => {
    if (!insight || typeof insight !== 'object') throw new Error(`insight ${i} is not an object`);

    const ins = insight as Record<string, unknown>;

    if (!ins.title || !ins.body || !ins.impact) {
      throw new Error(`insight ${i} missing title/body/impact`);
    }

    const type = INSIGHT_TYPES.includes(ins.type as string)
      ? (ins.type as Insight['type'])
      : 'recommendation';

    return {
      type,
      title: str(ins.title) || 'Sustainability Insight',
      body: str(ins.body) || '',
      impact: str(ins.impact) || 'TBD',
    };
  });
}
