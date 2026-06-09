import 'server-only';

/**
 * SMS sender (Twilio by default). Server-only — never import into a client
 * component. Used to reach guests who have NO email on file (typically OTA
 * bookings) but do have a phone number.
 *
 * Configure via .env.local:
 *
 *   TWILIO_ACCOUNT_SID=ACxxxxxxxx
 *   TWILIO_AUTH_TOKEN=your-auth-token
 *   TWILIO_FROM=+1234567890        (your Twilio number, E.164)
 *   SMS_DEFAULT_COUNTRY_CODE=+94   (optional; used to normalise local numbers)
 *   SMS_OVERRIDE_TO=+94...         (optional: redirect every SMS to one phone, testing)
 *
 * Twilio's free trial gives you credits at no cost — in trial mode you can only
 * text *verified* numbers. Without these vars, sending falls back to a safe dry
 * run (no external SMS). Implemented with the Twilio REST API over fetch, so
 * there's no SDK dependency and nothing extra for the bundler to externalise.
 */

/** True when Twilio credentials are present, so sending can go live. */
export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM,
  );
}

/**
 * Best-effort E.164 normalisation. Twilio requires +<countrycode><number>.
 * - Already-E.164 (`+...`) is kept as-is.
 * - A leading `0` (local trunk prefix) is swapped for the default country code.
 * - Otherwise the default country code is prepended.
 * Returns null if there aren't enough digits to be a real number.
 */
export function normalisePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const cc = (process.env.SMS_DEFAULT_COUNTRY_CODE || '+94').replace(/[^\d+]/g, '');

  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D/g, '');
    return digits.length >= 7 ? `+${digits}` : null;
  }

  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = digits.slice(1); // drop local trunk 0
  const ccDigits = cc.replace('+', '');
  // Avoid double country code if the number already includes it.
  if (digits.startsWith(ccDigits)) return `+${digits}`;
  const full = `${ccDigits}${digits}`;
  return full.length >= 7 ? `+${full}` : null;
}

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SendSmsResult {
  ok: boolean;
  sid?: string;
  error?: string;
}

/** Send one SMS. Returns ok:false (never throws) so callers can isolate failures. */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  if (!smsConfigured()) return { ok: false, error: 'SMS not configured' };

  const to = normalisePhone(process.env.SMS_OVERRIDE_TO || input.to);
  if (!to) return { ok: false, error: 'Invalid phone number' };

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM!;

  const params = new URLSearchParams({ To: to, From: from, Body: input.body });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || `Twilio ${res.status}` };
    return { ok: true, sid: data.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
