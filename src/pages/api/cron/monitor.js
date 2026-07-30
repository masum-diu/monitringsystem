import { checkAllSites } from '@/lib/checkSites';
import { sendMonitorEmail } from '@/lib/email';
import { isWhatsAppAlertOnly, isWhatsAppConfigured, sendMonitorWhatsApp } from '@/lib/whatsapp';
import { isMonitorWindow } from '@/lib/schedule';
import { getMonitorSites } from '@/lib/sites';

function slotLabel() {
  const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';
  return new Date().toLocaleString('en-US', {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function authorize(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.authorization;
  return auth === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const force = req.query.force === '1' || req.query.force === 'true';
  if (!force && !isMonitorWindow()) {
    return res.status(200).json({
      ok: true,
      skipped: true,
      reason: 'Outside monitor window (default 10:00 and 18:00 in MONITOR_TIMEZONE)',
    });
  }

  try {
    const missing = ['RESEND_API_KEY', 'MONITOR_EMAIL_FROM', 'MONITOR_EMAIL_TO'].filter(
      (k) => !process.env[k]?.trim()
    );
    if (missing.length) {
      return res.status(500).json({
        ok: false,
        error: `Missing Vercel env: ${missing.join(', ')}`,
      });
    }

    const sites = getMonitorSites();
    const { results, allOk, failed } = await checkAllSites(sites);
    const label = slotLabel();
    const tz = process.env.MONITOR_TIMEZONE || 'Asia/Dhaka';

    await sendMonitorEmail({
      allOk,
      results,
      slotLabel: label,
    });

    let whatsapp = {
      configured: isWhatsAppConfigured(),
      alertOnly: isWhatsAppAlertOnly(),
      sent: false,
    };
    if (whatsapp.configured) {
      try {
        const wa = await sendMonitorWhatsApp({
          allOk,
          results,
          slotLabel: label,
        });
        whatsapp = { ...whatsapp, ...wa, sent: !wa.skipped };
      } catch (waErr) {
        console.error('WhatsApp notify failed:', waErr);
        whatsapp = { ...whatsapp, sent: false, error: waErr.message || 'WhatsApp failed' };
      }
    }

    return res.status(200).json({
      ok: true,
      allOk,
      checked: sites.length,
      checkedAt: new Date().toISOString(),
      checkedAtLabel: label,
      timezone: tz,
      failed: failed.map(({ name, url, error, status }) => ({ name, url, error, status })),
      results,
      emailed: true,
      whatsapp,
    });
  } catch (err) {
    console.error('Monitor cron failed:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Monitor failed',
    });
  }
}
