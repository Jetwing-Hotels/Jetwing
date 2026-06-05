import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, notFound, badRequest, parseBody } from '@/lib/api/http';

export const maxDuration = 300;

type Ctx = { params: Promise<{ campaignId: string }> };

const bodySchema = z.object({
  confirm: z.boolean().optional(), // require true to actually hit SendGrid
  limit: z.number().int().min(1).max(1000).optional(),
});

/**
 * POST /api/v1/campaigns/:campaignId/send
 * Dispatch generated emails. Admin only.
 *
 * Safe by default: runs as a DRY RUN (marks recipients SENT, no external email)
 * unless SENDGRID_API_KEY is configured AND the request body has { confirm: true }.
 * This prevents accidentally emailing real/demo addresses from a half-built system.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { campaignId } = await params;
  await requireAdmin();
  const { confirm, limit } = await parseBody(req, bodySchema).catch(() => ({ confirm: false, limit: undefined }));

  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from('campaigns')
    .select('campaign_id, status')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  if (!campaign) throw notFound('Campaign not found');

  // Recipients with a generated email that haven't been sent yet.
  const { data: recipients, error: recErr } = await admin
    .from('campaign_audience')
    .select('audience_id, email_subject, email_html_body, customers(email)')
    .eq('campaign_id', campaignId)
    .eq('send_status', 'PENDING')
    .not('email_html_body', 'is', null)
    .limit(limit ?? 500);
  if (recErr) throw new Error(recErr.message);
  if (!recipients || recipients.length === 0) {
    throw badRequest('No generated emails ready to send. Build the audience and generate emails first.');
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'offers@jetwingsymphony.com';
  const live = Boolean(sendgridKey) && confirm === true;

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    // PostgREST embeds a to-one relation as an object (or array depending on FK inference).
    const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    const toEmail = (cust as { email?: string } | null)?.email;
    let messageId = `dryrun-${crypto.randomUUID()}`;
    let okSend = true;

    if (live && toEmail) {
      try {
        const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: fromEmail },
            subject: r.email_subject ?? 'A seasonal offer from Jetwing',
            content: [{ type: 'text/html', value: r.email_html_body }],
          }),
        });
        okSend = resp.ok;
        messageId = resp.headers.get('x-message-id') ?? messageId;
      } catch {
        okSend = false;
      }
    }

    const { error: updErr } = await admin
      .from('campaign_audience')
      .update(
        okSend
          ? { send_status: 'SENT', sent_at: new Date().toISOString(), sendgrid_message_id: messageId }
          : { send_status: 'BOUNCED', bounced_at: new Date().toISOString() },
      )
      .eq('audience_id', r.audience_id);

    if (updErr || !okSend) failed++;
    else sent++;
  }

  // Recompute campaign counters + status.
  const { count: sentTotal } = await admin
    .from('campaign_audience')
    .select('audience_id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .not('sent_at', 'is', null);
  const { count: pendingLeft } = await admin
    .from('campaign_audience')
    .select('audience_id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('send_status', 'PENDING');

  await admin
    .from('campaigns')
    .update({
      emails_sent: sentTotal ?? 0,
      status: (pendingLeft ?? 0) === 0 ? 'SENT' : 'SENDING',
      sent_at: new Date().toISOString(),
    })
    .eq('campaign_id', campaignId);

  return ok({
    data: { sent, failed, dry_run: !live },
    message: live ? 'Emails dispatched via SendGrid.' : 'Dry run — recipients marked SENT, no external email sent.',
  });
});
