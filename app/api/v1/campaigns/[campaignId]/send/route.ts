import { z } from 'zod';
import { requireAdmin } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, notFound, badRequest, parseBody } from '@/lib/api/http';
import { sendEmail, emailConfigured } from '@/lib/email/mailer';

export const runtime = 'nodejs'; // Nodemailer needs the Node runtime
export const maxDuration = 300;

type Ctx = { params: Promise<{ campaignId: string }> };

const bodySchema = z.object({
  confirm: z.boolean().optional(), // require true to actually send email
  limit: z.number().int().min(1).max(1000).optional(),
});

/**
 * POST /api/v1/campaigns/:campaignId/send
 * Dispatch generated emails via SMTP (Gmail). Admin only.
 *
 * Safe by default: runs as a DRY RUN (marks recipients SENT, no external email)
 * unless SMTP is configured (SMTP_USER/SMTP_PASS) AND the body has { confirm: true }.
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

  const live = emailConfigured() && confirm === true;

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    // PostgREST embeds a to-one relation as an object (or array depending on FK inference).
    const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    const toEmail = (cust as { email?: string } | null)?.email;
    let messageId = `dryrun-${crypto.randomUUID()}`;
    let okSend = true;

    if (live && toEmail) {
      const res = await sendEmail({
        to: toEmail,
        subject: r.email_subject ?? 'A seasonal offer from Jetwing',
        html: r.email_html_body ?? '',
      });
      okSend = res.ok;
      if (res.messageId) messageId = res.messageId;
    } else if (live && !toEmail) {
      okSend = false; // live send but no address on file
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
    message: live
      ? `Emails dispatched via SMTP (${sent} sent, ${failed} failed).`
      : emailConfigured()
        ? 'Dry run — pass confirm:true to send for real.'
        : 'Dry run — SMTP not configured (set SMTP_USER / SMTP_PASS).',
  });
});
