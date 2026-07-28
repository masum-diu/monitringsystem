/**
 * CLI equivalent of Resend's Hello World snippet.
 * Set RESEND_API_KEY in .env.local (replace re_xxxxxxxxx with your real key).
 */
import { readFileSync } from 'fs';
import { Resend } from 'resend';

const envPath = new URL('../.env.local', import.meta.url);
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    process.env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
} catch {
  console.warn('No .env.local — set RESEND_API_KEY in the environment.');
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey || apiKey === 're_xxxxxxxxx') {
  console.error('Set RESEND_API_KEY in .env.local (replace re_xxxxxxxxx with your real Resend API key).');
  process.exit(1);
}

const resend = new Resend(apiKey);
const to = process.env.RESEND_TEST_TO || 'mmhmasum98@gmail.com';

const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to,
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log('Sent:', data);
