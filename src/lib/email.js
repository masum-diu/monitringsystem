import { getResend } from '@/lib/resendClient';

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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** @param {string} from */
function normalizeFrom(from) {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return match ? match[1].trim() : trimmed;
}

/** @param {{ allOk: boolean, results: { name: string, url: string, ok: boolean, status: number|null, ms: number, error: string|null }[], slotLabel: string }} opts */
export async function sendMonitorEmail({ allOk, results, slotLabel }) {
  const toRaw = process.env.MONITOR_EMAIL_TO;
  const from = process.env.MONITOR_EMAIL_FROM;

  if (!toRaw || !from) {
    throw new Error('Missing MONITOR_EMAIL_FROM or MONITOR_EMAIL_TO environment variables');
  }

  const recipients = toRaw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error('MONITOR_EMAIL_TO has no valid addresses');
  }

  const fromAddress = normalizeFrom(from);

  const subject = allOk
    ? `[OK] Site monitor — all sites healthy (${slotLabel})`
    : `[ALERT] Site monitor — ${results.filter((r) => !r.ok).length} site(s) down (${slotLabel})`;

  const intro = allOk
    ? `All monitored sites responded successfully.\n\nCheck time: ${slotLabel}\n\n`
    : `One or more sites failed the health check.\n\nCheck time: ${slotLabel}\n\n`;

  const text = `${intro}${formatResults(results)}`;
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`;
  const resend = getResend();

  const sentTo = [];
  const failedTo = [];

  for (const email of recipients) {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      text,
      html,
    });

    if (error) {
      failedTo.push({ email, error: error.message || JSON.stringify(error) });
    } else {
      sentTo.push({ email, id: data?.id });
    }
  }

  if (sentTo.length === 0) {
    const detail = failedTo.map((f) => `${f.email}: ${f.error}`).join('; ');
    throw new Error(
      `Resend failed for all recipients. ${detail}. With onboarding@resend.dev only your Resend account email works — verify a domain on resend.com/domains for all addresses.`
    );
  }

  return { sentTo, failedTo };
}
