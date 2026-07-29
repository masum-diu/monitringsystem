import { readFileSync } from 'fs';
import { loadOptionalEnvFiles } from './loadEnv.mjs';
import { Resend } from 'resend';
import { checkAllSites } from '../src/lib/checkSites.js';

loadOptionalEnvFiles();

function formatResults(results) {
  return results
    .map((r) => {
      if (r.ok) {
        return `✓ ${r.name}\n  ${r.url}\n  Status: ${r.status} (${r.ms}ms)`;
      }
      const statusPart = r.status != null ? `Status: ${r.status}` : 'No response';
      return `✗ ${r.name}\n  ${r.url}\n  ${statusPart} — ${r.error} (${r.ms}ms)`;
    })
    .join('\n\n');
}

const apiKey = process.env.RESEND_API_KEY;
const to = process.env.MONITOR_EMAIL_TO;
const from = process.env.MONITOR_EMAIL_FROM;

if (!apiKey || apiKey === 're_xxxxxxxxx' || !to || !from) {
  console.error(
    'Set RESEND_API_KEY, MONITOR_EMAIL_FROM, MONITOR_EMAIL_TO (Vercel env or export in shell).'
  );
  process.exit(1);
}

const sites = JSON.parse(
  readFileSync(new URL('../monitor-sites.json', import.meta.url), 'utf8')
);
const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';
const label = new Date().toLocaleString('en-US', {
  timeZone: tz,
  dateStyle: 'medium',
  timeStyle: 'short',
});

console.log('Checking', sites.length, 'sites...');
const { results, allOk } = await checkAllSites(sites);
console.log(allOk ? 'All OK — sending email...' : 'Issues found — sending alert email...');

const subject = allOk
  ? `[OK] Site monitor — all sites healthy (${label})`
  : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down (${label})`;

const intro = allOk
  ? `All monitored sites responded successfully.\n\nCheck time: ${label}\n\n`
  : `One or more sites failed the health check.\n\nCheck time: ${label}\n\n`;

const text = `${intro}${formatResults(results)}`;
const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from,
  to: to.split(',').map((e) => e.trim()),
  subject,
  text,
});

if (error) {
  console.error('Email failed:', error);
  process.exit(1);
}

console.log('Email sent:', data?.id);
