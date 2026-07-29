import { getResend } from '@/lib/resendClient';

function formatResults(results) {
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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** @param {{ allOk: boolean, results: { name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null }[], slotLabel: string }} opts */
export async function sendMonitorEmail({ allOk, results, slotLabel }) {
  const to = process.env.MONITOR_EMAIL_TO;
  const from = process.env.MONITOR_EMAIL_FROM;

  if (!to || !from) {
    throw new Error('Missing MONITOR_EMAIL_FROM or MONITOR_EMAIL_TO environment variables');
  }

  const subject = allOk
    ? `[OK] Site monitor — all sites healthy (${slotLabel})`
    : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down (${slotLabel})`;

  const intro = allOk
    ? `All monitored sites responded successfully.\n\nCheck time: ${slotLabel}\n\n`
    : `One or more sites failed the health check.\n\nCheck time: ${slotLabel}\n\n`;

  const text = `${intro}${formatResults(results)}`;
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from,
    to: to.split(',').map((e) => e.trim()),
    subject,
    text,
    html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  });

  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }

  return data;
}
