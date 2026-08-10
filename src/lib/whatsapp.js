import { buildMonitorMessage } from '@/lib/formatMonitorMessage';
import { sendGreenApiMessage } from '@/lib/greenApi';

function provider() {
  const forced = process.env.WHATSAPP_PROVIDER?.trim()?.toLowerCase();
  if (forced === 'callmebot' || forced === 'greenapi') {
    return forced;
  }
  if (
    process.env.GREEN_API_INSTANCE_ID?.trim() &&
    process.env.GREEN_API_TOKEN?.trim() &&
    (process.env.WHATSAPP_CHAT_ID?.trim() || process.env.WHATSAPP_GROUP_NAME?.trim())
  ) {
    return 'greenapi';
  }
  if (process.env.CALLMEBOT_PHONE?.trim() && process.env.CALLMEBOT_APIKEY?.trim()) {
    return 'callmebot';
  }
  return null;
}

export function isWhatsAppConfigured() {
  return provider() != null;
}

/** Default false — WhatsApp on every scheduled check (every 8h). Set WHATSAPP_ALERT_ONLY=true for down-only. */
export function isWhatsAppAlertOnly() {
  const v = process.env.WHATSAPP_ALERT_ONLY?.trim()?.toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes') {
    return true;
  }
  return false;
}

function alertOnly() {
  return isWhatsAppAlertOnly();
}

async function sendViaGreenApi(text) {
  const result = await sendGreenApiMessage(text);
  if (result.id) {
    return { provider: 'greenapi', id: result.id, chatId: result.chatId };
  }
  return { provider: 'greenapi', chatId: result.chatId, response: result.response };
}

async function sendViaCallMeBot(text) {
  const phone = process.env.CALLMEBOT_PHONE?.trim().replace(/\D/g, '');
  const apikey = process.env.CALLMEBOT_APIKEY?.trim();

  if (!phone || !apikey) {
    throw new Error('CallMeBot: set CALLMEBOT_PHONE and CALLMEBOT_APIKEY');
  }

  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', phone);
  url.searchParams.set('text', text.slice(0, 1500));
  url.searchParams.set('apikey', apikey);
  url.searchParams.set('json', '1');

  const res = await fetch(url.toString());
  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { raw: body };
  }

  if (!res.ok || parsed?.status === 'error') {
    throw new Error(`CallMeBot failed: ${body.slice(0, 300)}`);
  }

  return { provider: 'callmebot', response: parsed };
}

/** @param {{ allOk: boolean, results: { name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null }[], slotLabel: string }} opts */
export async function sendMonitorWhatsApp({ allOk, results, slotLabel }) {
  const kind = provider();
  if (!kind) {
    return { skipped: true, reason: 'WhatsApp not configured' };
  }
  if (alertOnly() && allOk) {
    return { skipped: true, reason: 'WHATSAPP_ALERT_ONLY — all sites OK' };
  }

  const text = buildMonitorMessage({ allOk, results, slotLabel });
  if (kind === 'greenapi') {
    return sendViaGreenApi(text);
  }
  return sendViaCallMeBot(text);
}
