import type { SystemBlock } from './claude.ts';

// deno-lint-ignore no-explicit-unknown
type Row = Record<string, unknown>;

export interface EmailDraft {
  subject_line: string;
  html_body: string;
  plain_text_body: string;
}

// ── Stable global preamble — shared cache prefix across every recipient.
const GLOBAL_EMAIL_PREAMBLE = `You are Jetwing Symphony PLC's personalised email copywriter. You write warm, culturally grounded, premium-but-approachable marketing emails for a Sri Lankan luxury hospitality group, always with a light sustainability note.

GUIDELINES
- Open with a personalised greeting using the guest's first name.
- Weave the offer into a short narrative that reflects the property's story and the season.
- Calibrate exclusivity by score tier: Platinum = most exclusive, intimate language; Gold = high-value and warm; Silver = inviting re-engagement; Standard = friendly and welcoming.
- Include ONE clear call-to-action linking to the direct booking page (use the placeholder URL {{BOOKING_URL}}).
- Close with a brief sustainability note tied to Jetwing's six-pillar strategy (energy, water, waste, biodiversity, community, culture).
- Keep the HTML simple and email-client safe (inline-friendly tags: <p>, <h2>, <a>, <strong>, <ul>/<li>). No <script>, no external CSS.
- Write in the guest's preferred language when given.

OUTPUT FORMAT
Return ONLY a JSON object (no prose, no markdown fences) with exactly these keys:
{
  "subject_line": string,
  "html_body": string,
  "plain_text_body": string
}`;

function offerBlockText(property: Row, offers: Row[]): string {
  const lines = [
    'PROPERTY',
    `Name: ${property.property_name}`,
    `Tier: ${property.brand_tier}`,
    `Location: ${property.location_city}, ${property.location_region}`,
    `Type: ${property.property_type}`,
    '',
    'OFFERS IN THIS CAMPAIGN',
  ];
  offers.forEach((o, i) => {
    lines.push(
      `${i + 1}. ${o.offer_title}`,
      `   ${o.offer_description}`,
      o.sustainability_angle ? `   Sustainability: ${o.sustainability_angle}` : '',
      o.valid_from || o.valid_to ? `   Valid: ${o.valid_from ?? '—'} to ${o.valid_to ?? '—'}` : '',
    );
  });
  return lines.filter(Boolean).join('\n');
}

export function buildEmailPrompt(args: {
  property: Row;
  offers: Row[];
  prompt: Row | null;
  firstName: string;
  scoreTier: string;
  language: string;
}): { system: SystemBlock[]; userText: string } {
  const { property, offers, prompt, firstName, scoreTier, language } = args;

  const system: SystemBlock[] = [
    // Stable prefix — cache breakpoint (shared across the whole audience).
    {
      type: 'text',
      text: prompt?.system_context
        ? `${GLOBAL_EMAIL_PREAMBLE}\n\nADDITIONAL SYSTEM CONTEXT\n${prompt.system_context}`
        : GLOBAL_EMAIL_PREAMBLE,
      cache_control: { type: 'ephemeral' },
    },
    // Property + offer block — same for every recipient of this campaign, so a
    // second cache breakpoint keeps it warm across the batch.
    {
      type: 'text',
      text: offerBlockText(property, offers),
      cache_control: { type: 'ephemeral' },
    },
  ];

  // Only volatile, minimal-PII fields go in the user turn (first name + tier).
  const userText = [
    `Write the email for this guest:`,
    `First name: ${firstName}`,
    `Score tier: ${scoreTier}`,
    `Preferred language: ${language || 'en'}`,
    '',
    'Return ONLY the JSON object.',
  ].join('\n');

  return { system, userText };
}

export function validateEmail(parsed: unknown): EmailDraft {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('expected a JSON object');
  }
  const o = parsed as Row;
  if (!o.subject_line || !o.html_body) {
    throw new Error('missing subject_line/html_body');
  }
  return {
    subject_line: String(o.subject_line).slice(0, 250),
    html_body: String(o.html_body),
    plain_text_body: o.plain_text_body ? String(o.plain_text_body) : String(o.html_body).replace(/<[^>]+>/g, ''),
  };
}
