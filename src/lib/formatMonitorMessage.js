/** @typedef {{ name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null, protected?: boolean }} MonitorResult */

function shortUrl(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function latencyBadge(ms) {
  if (ms < 500) return '⚡';
  if (ms < 1500) return '🟡';
  return '🐢';
}

function statusIcon(r) {
  if (!r.ok) return '🔴';
  if (r.error) return '🟠';
  return '🟢';
}

/** @param {MonitorResult} r */
function formatWhatsAppSiteLine(r) {
  const host = shortUrl(r.url);
  const ms = `${r.ms}ms`;
  const code = r.status != null ? r.status : 'ERR';

  if (!r.ok) {
    return `${statusIcon(r)} *${r.name}*\n   ${host}\n   ↳ ${code} · ${r.error} · ${ms}`;
  }
  if (r.error) {
    return `${statusIcon(r)} *${r.name}* _(protected)_\n   ${host}\n   ↳ ${code} · ${ms} · ${r.error}`;
  }
  return `${statusIcon(r)} *${r.name}*\n   ${host}\n   ↳ ${code} · ${latencyBadge(r.ms)} ${ms}`;
}

/** @param {MonitorResult[]} results */
export function formatMonitorResults(results) {
  return results
    .map((r) => {
      if (r.ok && !r.error) {
        return `✓ ${r.name}\n  ${r.url}\n  Status: ${r.status} (${r.ms}ms)`;
      }
      if (r.ok && r.error) {
        return `✓ ${r.name} (protected)\n  ${r.url}\n  Status: ${r.status} (${r.ms}ms)\n  Note: ${r.error}`;
      }
      const statusPart = r.status != null ? `Status: ${r.status}` : 'No response';
      return `✗ ${r.name}\n  ${r.url}\n  ${statusPart} — ${r.error} (${r.ms}ms)`;
    })
    .join('\n\n');
}

/** @param {{ allOk: boolean, results: MonitorResult[], slotLabel: string }} opts */
export function buildMonitorMessage({ allOk, results, slotLabel }) {
  const headline = allOk
    ? `[OK] Site monitor — all sites healthy`
    : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down`;

  const intro = allOk
    ? `All monitored sites responded successfully.\n\nCheck time: ${slotLabel}\n\n`
    : `One or more sites failed the health check.\n\nCheck time: ${slotLabel}\n\n`;

  return `${headline}\n\n${intro}${formatMonitorResults(results)}`;
}

/** @param {{ allOk: boolean, results: MonitorResult[], slotLabel: string }} opts */
export function buildWhatsAppMessage({ allOk, results, slotLabel }) {
  const total = results.length;
  const okCount = results.filter((r) => r.ok).length;
  const downCount = total - okCount;
  const healthPct = total ? Math.round((okCount / total) * 100) : 0;
  const failed = results.filter((r) => !r.ok);
  const healthy = results.filter((r) => r.ok);

  const barFilled = Math.round(healthPct / 10);
  const healthBar = `${'█'.repeat(barFilled)}${'░'.repeat(10 - barFilled)}`;

  const statusBanner = allOk
    ? '🟢 *ALL SYSTEMS GO*'
    : `🔴 *ATTENTION · ${downCount} DOWN*`;

  const fleetLine = allOk
    ? `⚡ Fleet *${okCount}/${total}* · *${healthPct}%* healthy`
    : `⚡ Fleet *${okCount}/${total}* · *${healthPct}%* · ${downCount} need fix`;

  const sections = [];

  sections.push(
    '┏━━━━━━━━━━━━━━━━━━━━━┓',
    '┃  🛡️ *ETHER TECH*',
    '┃  _Site Monitor Pulse_',
    '┗━━━━━━━━━━━━━━━━━━━━━┛',
    '',
    statusBanner,
    `📅 ${slotLabel}`,
    fleetLine,
    `[${healthBar}] ${healthPct}%`,
    '',
    '━━━━━━━━━━━━━━━━━━━━'
  );

  if (failed.length) {
    sections.push('🚨 *Needs attention*', '');
    sections.push(failed.map(formatWhatsAppSiteLine).join('\n\n'));
    sections.push('', '━━━━━━━━━━━━━━━━━━━━');
  }

  if (healthy.length) {
    sections.push(allOk ? '🌐 *Live endpoints*' : '✅ *Still online*', '');
    sections.push(healthy.map(formatWhatsAppSiteLine).join('\n\n'));
    sections.push('', '━━━━━━━━━━━━━━━━━━━━');
  }

  sections.push(
    allOk ? '✨ All endpoints responding normally.' : '⚠️ Please check failed sites ASAP.',
    '🔁 Next pulse ~3 hours',
    '🔗 monitringsystem-inks.vercel.app'
  );

  return sections.join('\n');
}
