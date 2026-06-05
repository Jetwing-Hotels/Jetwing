import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/supabase/types';

/**
 * POST /api/v1/webhooks/sendgrid
 * Ingest SendGrid Event Webhook payloads. No user auth (SYSTEM path).
 *
 * Security: if SENDGRID_WEBHOOK_SECRET is set we require a matching `?token=`.
 * TODO(hardening): replace with SendGrid's ECDSA signed-event verification
 * (X-Twilio-Email-Event-Webhook-Signature / -Timestamp headers).
 *
 * Events are written to email_events; the AFTER INSERT trigger
 * (handle_email_event) syncs campaign_audience and revokes marketing_opt_in
 * on unsubscribe.
 */

const EVENT_MAP: Record<string, string> = {
  delivered: 'delivered',
  open: 'open',
  click: 'click',
  bounce: 'bounce',
  spamreport: 'spam_report',
  unsubscribe: 'unsubscribe',
  group_unsubscribe: 'unsubscribe',
};

interface SendGridEvent {
  email?: string;
  timestamp?: number;
  event?: string;
  sg_message_id?: string;
  useragent?: string;
  ip?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  const secret = process.env.SENDGRID_WEBHOOK_SECRET;
  if (secret) {
    const token = new URL(req.url).searchParams.get('token');
    if (token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let events: SendGridEvent[];
  try {
    const body = await req.json();
    events = Array.isArray(body) ? body : [body];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminClient();
  let processed = 0;
  let skipped = 0;

  for (const ev of events) {
    const mapped = ev.event ? EVENT_MAP[ev.event] : undefined;
    if (!mapped || !ev.sg_message_id) {
      skipped++;
      continue;
    }

    // SendGrid event sg_message_id is "<messageId>.<recv-info>"; we store the prefix.
    const messageId = ev.sg_message_id.split('.')[0];

    const { data: audience } = await admin
      .from('campaign_audience')
      .select('audience_id')
      .eq('sendgrid_message_id', messageId)
      .maybeSingle();

    if (!audience) {
      skipped++;
      continue;
    }

    const { error } = await admin.from('email_events').insert({
      audience_id: audience.audience_id,
      sendgrid_message_id: messageId,
      event_type: mapped as 'delivered' | 'open' | 'click' | 'bounce' | 'spam_report' | 'unsubscribe',
      event_timestamp: new Date((ev.timestamp ?? Date.now() / 1000) * 1000).toISOString(),
      url_clicked: ev.url ?? null,
      user_agent: ev.useragent ?? null,
      ip_address: ev.ip ?? null,
      raw_payload: ev as unknown as Json,
    });

    if (error) skipped++;
    else processed++;
  }

  // Always 2xx so SendGrid does not retry indefinitely.
  return NextResponse.json({ ok: true, processed, skipped });
}
