import { z } from 'zod';
import { requireRevenueManager, actorLabel } from '@/lib/api/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { route, ok, notFound, badRequest, parseBody } from '@/lib/api/http';
import { sendEmail, emailConfigured } from '@/lib/email/mailer';
import { sendSms, smsConfigured, normalisePhone } from '@/lib/sms/sms';

export const runtime = 'nodejs'; // Nodemailer needs the Node runtime
export const maxDuration = 300;

type Ctx = { params: Promise<{ offerId: string }> };

const bodySchema = z.object({
  customer_ids: z.array(z.uuid()).min(1, 'Select at least one guest').max(500),
  confirm: z.boolean().optional(), // require true to actually email/text
});

/**
 * POST /api/v1/offers/:offerId/send-to-guests
 * Send a generated offer to a hand-picked set of guests (selected in the
 * Filtering & Intelligence table). Revenue Manager (or Admin).
 *
 * Channel per guest:
 *   - has a usable email  -> personalised HTML email (Gmail SMTP).
 *   - no email but a phone -> SMS with the offer + website link (Twilio). Guests
 *     with no email typically booked via an OTA, so SMS is the fallback reach.
 *
 * Creates a tracked campaign, writes one personalised message per guest into
 * campaign_audience, and dispatches. Safe by default: a DRY RUN (marks recipients
 * SENT, no external send) unless the relevant provider is configured AND the body
 * has confirm:true.
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const JETWING_URL = 'https://www.jetwinghotels.com/';

/** Short SMS for guests with no email (e.g. OTA bookings) — points them to the site. */
function buildSms(
  offer: { offer_title: string; discount_type: string | null; discount_value: number | null },
  property: string,
  firstName: string,
) {
  const discount =
    offer.discount_type && offer.discount_value
      ? offer.discount_type === 'Percentage'
        ? ` (${offer.discount_value}% off)`
        : ` (LKR ${offer.discount_value.toLocaleString()} value)`
      : '';
  return `Hi ${firstName || 'there'}, Jetwing has a special offer for you at ${property}: ${offer.offer_title}${discount}. Explore & book at ${JETWING_URL} — The Jetwing Symphony Team`;
}

function buildEmail(
  offer: {
    offer_title: string;
    offer_description: string;
    offer_type: string;
    discount_type: string | null;
    discount_value: number | null;
    target_year: number;
  },
  property: string,
  firstName: string,
) {
  const subject = `${offer.offer_title} — a Jetwing offer just for you`;
  const discount =
    offer.discount_type && offer.discount_value
      ? offer.discount_type === 'Percentage'
        ? `${offer.discount_value}% off`
        : `LKR ${offer.discount_value.toLocaleString()} value`
      : null;

  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f4;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">
    <div style="background:#8B9E23;padding:24px 32px"><span style="color:#fff;font-size:20px;font-weight:bold;letter-spacing:.5px">Jetwing</span></div>
    <div style="padding:32px">
      <p style="font-size:15px">Dear ${esc(firstName || 'Guest')},</p>
      <h1 style="font-size:22px;margin:16px 0 8px">${esc(offer.offer_title)}</h1>
      <p style="font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px">${esc(property)} · ${esc(offer.offer_type)}</p>
      <p style="font-size:15px;line-height:1.6;color:#333">${esc(offer.offer_description)}</p>
      ${discount ? `<p style="display:inline-block;background:#f0f5e6;color:#5f6e18;font-weight:bold;padding:10px 18px;border-radius:8px;font-size:15px;margin:8px 0">${esc(discount)}</p>` : ''}
      <p style="font-size:15px;margin-top:24px">We would be delighted to welcome you in ${offer.target_year}. Reply to this email or contact your Jetwing reservations team to book.</p>
      <div style="margin:28px 0 8px">
        <a href="https://www.jetwinghotels.com/" target="_blank" style="display:inline-block;background:#8B9E23;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:8px">Explore Jetwing Hotels →</a>
      </div>
      <p style="font-size:13px;color:#888;margin:6px 0 0">Or visit <a href="https://www.jetwinghotels.com/" target="_blank" style="color:#5f6e18">www.jetwinghotels.com</a> for more details.</p>
      <p style="font-size:14px;color:#888;margin-top:32px">Warm regards,<br/>The Jetwing Symphony Team</p>
    </div>
    <div style="background:#1a1a1a;padding:16px 32px"><span style="color:#9a9a9a;font-size:11px">Jetwing Symphony PLC · Sustainable luxury hospitality, Sri Lanka · <a href="https://www.jetwinghotels.com/" target="_blank" style="color:#b9c46b">jetwinghotels.com</a></span></div>
  </div></body></html>`;

  const text = `Dear ${firstName || 'Guest'},\n\n${offer.offer_title}\n${property} · ${offer.offer_type}\n\n${offer.offer_description}\n${discount ? `\n${discount}\n` : ''}\nWe would be delighted to welcome you in ${offer.target_year}. Reply to this email or contact your Jetwing reservations team to book.\n\nExplore Jetwing Hotels and find more details: https://www.jetwinghotels.com/\n\nWarm regards,\nThe Jetwing Symphony Team`;

  return { subject, html, text };
}

export const POST = route<Ctx>(async (req, { params }) => {
  const { offerId } = await params;
  const { user } = await requireRevenueManager();
  const { customer_ids, confirm } = await parseBody(req, bodySchema);

  const admin = createAdminClient();

  // 1. Offer (with property name).
  const { data: offer, error: offerErr } = await admin
    .from('seasonal_offers')
    .select('offer_id, offer_title, offer_description, offer_type, discount_type, discount_value, target_month, target_year, properties(property_name)')
    .eq('offer_id', offerId)
    .maybeSingle();
  if (offerErr) throw new Error(offerErr.message);
  if (!offer) throw notFound('Offer not found');
  const propertyName =
    (Array.isArray(offer.properties) ? offer.properties[0] : offer.properties)?.property_name ?? 'Jetwing';

  // 2. Selected guests + their contact details. Resolve a channel per guest:
  //    usable email -> 'email';  no email but a phone -> 'sms';  else uncontactable.
  const { data: customers, error: custErr } = await admin
    .from('customers')
    .select('customer_id, first_name, email, phone, acquisition_channel')
    .in('customer_id', customer_ids)
    .is('deleted_at', null);
  if (custErr) throw new Error(custErr.message);

  const hasUsableEmail = (e: string | null | undefined) => !!e && e.trim().includes('@');

  type Recipient = {
    customer_id: string;
    first_name: string;
    channel: 'email' | 'sms';
    email: string | null;
    phone: string | null; // normalised E.164
  };
  const recipients: Recipient[] = [];
  for (const c of customers ?? []) {
    if (hasUsableEmail(c.email)) {
      recipients.push({ customer_id: c.customer_id, first_name: c.first_name, channel: 'email', email: c.email, phone: null });
    } else {
      const phone = normalisePhone(c.phone);
      if (phone) {
        recipients.push({ customer_id: c.customer_id, first_name: c.first_name, channel: 'sms', email: null, phone });
      }
      // else: no email and no usable phone -> uncontactable, skipped.
    }
  }
  if (recipients.length === 0) {
    throw badRequest('None of the selected guests have an email address or a phone number on file.');
  }

  // Latest score snapshot per customer (best-effort; audience rows require it).
  const scoreByCustomer = new Map<string, { score: number; tier: string }>();
  const { data: scores } = await admin
    .from('latest_customer_scores')
    .select('customer_id, composite_score, score_tier')
    .in('customer_id', recipients.map((c) => c.customer_id));
  for (const s of (scores ?? []) as { customer_id: string; composite_score: number | null; score_tier: string | null }[]) {
    scoreByCustomer.set(s.customer_id, { score: Number(s.composite_score ?? 0), tier: s.score_tier ?? 'Standard' });
  }

  // 3. Tracked campaign for this direct send.
  const { data: campaign, error: campErr } = await admin
    .from('campaigns')
    .insert({
      campaign_name: `${offer.offer_title} — direct send`,
      offer_ids: [offer.offer_id],
      target_month: offer.target_month,
      target_year: offer.target_year,
      created_by: actorLabel(user),
      status: 'SENDING',
      total_audience_size: recipients.length,
    })
    .select('campaign_id')
    .single();
  if (campErr) throw new Error(campErr.message);
  const campaignId = campaign.campaign_id;

  // 4. Audience rows — one personalised message per guest (email or SMS).
  //    SMS bodies are stored in email_plain_body (prefixed [SMS]) for the audit trail.
  const contactByCustomer = new Map(recipients.map((c) => [c.customer_id, c]));
  const audienceRows = recipients.map((c) => {
    const snap = scoreByCustomer.get(c.customer_id) ?? { score: 0, tier: 'Standard' };
    if (c.channel === 'email') {
      const email = buildEmail(offer, propertyName, c.first_name);
      return {
        campaign_id: campaignId,
        customer_id: c.customer_id,
        composite_score_snapshot: snap.score,
        score_tier_snapshot: snap.tier,
        email_subject: email.subject,
        email_html_body: email.html,
        email_plain_body: email.text,
        send_status: 'PENDING' as const,
      };
    }
    const sms = buildSms(offer, propertyName, c.first_name);
    return {
      campaign_id: campaignId,
      customer_id: c.customer_id,
      composite_score_snapshot: snap.score,
      score_tier_snapshot: snap.tier,
      email_subject: `${offer.offer_title} (SMS)`,
      email_html_body: null,
      email_plain_body: `[SMS] ${sms}`,
      send_status: 'PENDING' as const,
    };
  });
  const { data: inserted, error: audErr } = await admin
    .from('campaign_audience')
    .insert(audienceRows)
    .select('audience_id, customer_id, email_subject, email_html_body, email_plain_body');
  if (audErr) throw new Error(audErr.message);

  // 5. Dispatch. Dry run unless the relevant provider is configured AND confirm:true.
  const liveEmail = emailConfigured() && confirm === true;
  const liveSms = smsConfigured() && confirm === true;

  let emailSent = 0;
  let smsSent = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (const r of inserted ?? []) {
    const contact = contactByCustomer.get(r.customer_id);
    let messageId = `dryrun-${crypto.randomUUID()}`;
    let okSend = true;

    if (contact?.channel === 'sms' && contact.phone) {
      if (liveSms) {
        const res = await sendSms({ to: contact.phone, body: (r.email_plain_body ?? '').replace(/^\[SMS\]\s*/, '') });
        okSend = res.ok;
        if (res.sid) messageId = res.sid;
        if (!res.ok && !firstError) {
          firstError = res.error;
          console.error(`[send-to-guests] SMS to ${contact.phone} failed:`, res.error);
        }
      }
      if (okSend) smsSent++;
    } else if (contact?.channel === 'email' && contact.email) {
      if (liveEmail) {
        const res = await sendEmail({
          to: contact.email,
          subject: r.email_subject ?? 'A seasonal offer from Jetwing',
          html: r.email_html_body ?? '',
        });
        okSend = res.ok;
        if (res.messageId) messageId = res.messageId;
        if (!res.ok && !firstError) {
          firstError = res.error;
          console.error(`[send-to-guests] email to ${contact.email} failed:`, res.error);
        }
      }
      if (okSend) emailSent++;
    }

    if (!okSend) failed++;

    await admin
      .from('campaign_audience')
      .update(
        okSend
          ? { send_status: 'SENT', sent_at: new Date().toISOString(), sendgrid_message_id: messageId }
          : { send_status: 'BOUNCED', bounced_at: new Date().toISOString() },
      )
      .eq('audience_id', r.audience_id);
  }

  const sent = emailSent + smsSent;
  await admin
    .from('campaigns')
    .update({ emails_sent: emailSent, status: 'SENT', sent_at: new Date().toISOString() })
    .eq('campaign_id', campaignId);

  const skipped = customer_ids.length - recipients.length;
  const live = liveEmail || liveSms;
  const parts: string[] = [];
  if (emailSent) parts.push(`${emailSent} emailed`);
  if (smsSent) parts.push(`${smsSent} texted (SMS)`);
  const summary = parts.length ? parts.join(', ') : `${sent} contacted`;

  return ok({
    data: {
      sent,
      email_sent: emailSent,
      sms_sent: smsSent,
      failed,
      skipped_no_email: skipped, // skipped = no email AND no usable phone
      dry_run: !live,
      campaign_id: campaignId,
      audience_size: recipients.length,
    },
    message: live
      ? `Offer sent — ${summary}${failed ? `, ${failed} failed${firstError ? `: ${firstError}` : ''}` : ''}.`
      : `Dry run — ${summary} marked sent. ${
          emailConfigured() || smsConfigured()
            ? 'Confirm to send for real.'
            : 'Configure SMTP (email) and/or Twilio (SMS) to send for real.'
        }`,
  });
});
