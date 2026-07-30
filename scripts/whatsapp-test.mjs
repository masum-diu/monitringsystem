import { loadOptionalEnvFiles } from './loadEnv.mjs';
import { buildWhatsAppMessage } from '../src/lib/formatMonitorMessage.js';
import { sendGreenApiMessage } from '../src/lib/greenApi.js';

loadOptionalEnvFiles();

const slotLabel = new Date().toLocaleString('en-US', {
  timeZone: process.env.MONITOR_TIMEZONE || 'Asia/Dhaka',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const text = buildWhatsAppMessage({
  allOk: false,
  results: [
    {
      name: 'Test Site',
      url: 'https://example.com/',
      ok: false,
      status: 503,
      ms: 1200,
      error: 'HTTP 503',
    },
    {
      name: 'Sandhani Life (i-Life)',
      url: 'https://www.sandhanilife.com/',
      ok: true,
      status: 200,
      ms: 366,
      error: null,
    },
  ],
  slotLabel,
});

console.log('Preview:\n');
console.log(text);
console.log('\n---\nSending to WhatsApp group...');
console.log('Group:', process.env.WHATSAPP_GROUP_NAME || process.env.WHATSAPP_CHAT_ID || '(not set)');

try {
  const out = await sendGreenApiMessage(text);
  console.log('Sent:', out);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
