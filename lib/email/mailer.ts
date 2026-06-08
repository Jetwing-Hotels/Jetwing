import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP email sender (Gmail by default). Server-only — never import into a client
 * component. Configure via .env.local:
 *
 *   SMTP_USER=youraddress@gmail.com
 *   SMTP_PASS=your-16-char-gmail-app-password   (NOT your normal password)
 *   EMAIL_FROM="Jetwing Symphony <youraddress@gmail.com>"   (optional)
 *   SMTP_HOST=smtp.gmail.com    (optional override)
 *   SMTP_PORT=465               (optional override)
 *   EMAIL_OVERRIDE_TO=...       (optional: redirect every email to one inbox)
 *
 * Gmail note: the account needs 2-Step Verification enabled, then create an
 * "App password" (Google Account → Security → App passwords) and use that as
 * SMTP_PASS. Sending works from a Node runtime (not edge).
 */

let transporter: Transporter | null = null;

/** True when SMTP credentials are present, so sending can go live. */
export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/** Send one email. Returns ok:false (never throws) so callers can isolate failures. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!emailConfigured()) return { ok: false, error: 'SMTP not configured' };

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER!;
  // For demo/testing: redirect every message to one inbox and note the real recipient.
  const override = process.env.EMAIL_OVERRIDE_TO;
  const to = override || input.to;
  const subject = override ? `[to: ${input.to}] ${input.subject}` : input.subject;

  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
