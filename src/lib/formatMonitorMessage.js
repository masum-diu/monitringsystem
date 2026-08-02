/** @param {{ name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null }[]} results */
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

function dashboardUrl() {
  return (
    process.env.MONITOR_PUBLIC_URL?.trim() ||
    process.env.MONITOR_URL?.trim() ||
    'https://monitringsystem-inks.vercel.app'
  ).replace(/\/$/, '');
}

/** @param {{ allOk: boolean, results: Parameters<typeof formatMonitorResults>[0], slotLabel: string }} opts */
export function buildMonitorMessage({ allOk, results, slotLabel }) {
  const headline = allOk
    ? `[OK] Site monitor — all sites healthy`
    : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down`;

  const intro = allOk
    ? `All monitored sites responded successfully.\n\nCheck time: ${slotLabel}\n\n`
    : `One or more sites failed the health check.\n\nCheck time: ${slotLabel}\n\n`;

  const footer = `\n\nDashboard:\n${dashboardUrl()}/`;

  return `${headline}\n\n${intro}${formatMonitorResults(results)}${footer}`;
}
