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

/** @param {{ allOk: boolean, results: { name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null }[], slotLabel: string }} opts */
export async function sendMonitorEmail({ allOk, results, slotLabel }) {
  const to = process.env.MONITOR_EMAIL_TO;
  const from = process.env.MONITOR_EMAIL_FROM;
  const apiKey = process.env.RESEND_API_KEY;

  if (!to || !from || !apiKey) {
    throw new Error(
      'Missing RESEND_API_KEY, MONITOR_EMAIL_FROM, or MONITOR_EMAIL_TO environment variables'
    );
  }

  const subject = allOk
    ? `[OK] Site monitor — all sites healthy (${slotLabel})`
    : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down (${slotLabel})`;

  const intro = allOk
    ? `All monitored sites responded successfully.\n\nCheck time: ${slotLabel}\n\n`
    : `One or more sites failed the health check.\n\nCheck time: ${slotLabel}\n\n`;

  const text = `${intro}${formatResults(results)}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: to.split(',').map((e) => e.trim()),
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  return res.json();
}
