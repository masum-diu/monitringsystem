/**
 * Resend Hello World (optional local test).
 * Env: RESEND_API_KEY on Vercel, or export / optional .env.local for local only.
 */
import { loadOptionalEnvFiles } from './loadEnv.mjs';
import { Resend } from 'resend';

loadOptionalEnvFiles();

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey || apiKey === 're_xxxxxxxxx') {
  console.error('Set RESEND_API_KEY (Vercel dashboard or export RESEND_API_KEY=...).');
  process.exit(1);
}

const resend = new Resend(apiKey);
const to = process.env.RESEND_TEST_TO || process.env.MONITOR_EMAIL_TO || 'tanzirtushar@gmail.com';

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
