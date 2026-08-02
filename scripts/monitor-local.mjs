/**
 * Full local run: check sites + WhatsApp (email disabled).
 * 1. Copy .env.example → .env.local and fill Green API values
 * 2. npm run monitor:local
 */
import { readFileSync } from 'fs';
import { loadOptionalEnvFiles } from './loadEnv.mjs';
import { checkAllSites } from '../src/lib/checkSites.js';
import { buildMonitorMessage } from '../src/lib/formatMonitorMessage.js';
import { sendGreenApiMessage } from '../src/lib/greenApi.js';
// import { Resend } from 'resend'; // email disabled

loadOptionalEnvFiles();

const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';
const slotLabel = new Date().toLocaleString('en-US', {
  timeZone: tz,
  dateStyle: 'medium',
  timeStyle: 'short',
});

function whatsappAlertOnly() {
  const v = process.env.WHATSAPP_ALERT_ONLY?.trim()?.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function whatsappConfigured() {
  return (
    (process.env.GREEN_API_INSTANCE_ID?.trim() &&
      process.env.GREEN_API_TOKEN?.trim() &&
      (process.env.WHATSAPP_CHAT_ID?.trim() || process.env.WHATSAPP_GROUP_NAME?.trim())) ||
    (process.env.CALLMEBOT_PHONE?.trim() && process.env.CALLMEBOT_APIKEY?.trim())
  );
}

const sites = JSON.parse(readFileSync('./monitor-sites.json', 'utf8'));
console.log(`Checking ${sites.length} sites...\n`);

const { results, allOk } = await checkAllSites(sites);
for (const r of results) {
  console.log(`${r.ok ? 'OK' : 'FAIL'}  ${r.name}  ${r.status ?? '-'}  ${r.error ?? ''}  (${r.ms}ms)`);
}
console.log(allOk ? '\nAll OK' : '\nSome failures');

const messageText = buildMonitorMessage({ allOk, results, slotLabel });

// Email disabled — WhatsApp only
// const apiKey = process.env.RESEND_API_KEY;
// ...

if (whatsappConfigured()) {
  if (whatsappAlertOnly() && allOk) {
    console.log('\nWhatsApp skipped (WHATSAPP_ALERT_ONLY=true and all sites OK)');
  } else {
    console.log('\nSending WhatsApp...');
    try {
      const out = await sendGreenApiMessage(messageText);
      console.log('WhatsApp sent:', out);
    } catch (err) {
      console.error('WhatsApp failed:', err.message);
      process.exitCode = 1;
    }
  }
} else {
  console.log('\nWhatsApp skipped (set GREEN_API_* + WHATSAPP_GROUP_NAME in .env.local)');
}

console.log('\nDone.');
