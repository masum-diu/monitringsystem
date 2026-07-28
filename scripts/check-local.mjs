import { readFileSync } from 'fs';
import { checkAllSites } from '../src/lib/checkSites.js';

const sites = JSON.parse(readFileSync('./monitor-sites.json', 'utf8'));
const { results, allOk } = await checkAllSites(sites);
console.log(allOk ? 'All OK' : 'Some failures');
for (const r of results) {
  console.log(
    `${r.ok ? 'OK' : 'FAIL'}  ${r.name}  ${r.status ?? '-'}  ${r.error ?? ''}  (${r.ms}ms)`
  );
}
