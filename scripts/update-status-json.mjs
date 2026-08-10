/** Check all sites and write public/last-status.json (for local dashboard). */
import { readFileSync, writeFileSync } from 'fs';
import { checkAllSites } from '../src/lib/checkSites.js';

const sites = JSON.parse(readFileSync('./monitor-sites.json', 'utf8'));
const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';
const label = new Date().toLocaleString('en-US', {
  timeZone: tz,
  dateStyle: 'medium',
  timeStyle: 'short',
});

console.log(`Checking ${sites.length} sites...`);
const { results, allOk, failed } = await checkAllSites(sites);

const payload = {
  ok: true,
  allOk,
  checked: sites.length,
  checkedAt: new Date().toISOString(),
  checkedAtLabel: label,
  timezone: tz,
  failed: failed.map(({ name, url, error, status }) => ({ name, url, error, status })),
  results,
  emailed: false,
  whatsapp: { configured: false, sent: false },
};

writeFileSync('./public/last-status.json', `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote public/last-status.json (${sites.length} sites, allOk=${allOk})`);
