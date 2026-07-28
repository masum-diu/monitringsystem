import { checkAllSites } from '@/lib/checkSites';
import { sendMonitorEmail } from '@/lib/email';
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
    const sites = getMonitorSites();
    const { results, allOk, failed } = await checkAllSites(sites);
    const label = slotLabel();

    await sendMonitorEmail({
      allOk,
      results,
      slotLabel: label,
    });

    return res.status(200).json({
      ok: true,
      allOk,
      checked: sites.length,
      failed: failed.map(({ name, url, error, status }) => ({ name, url, error, status })),
      emailed: true,
    });
  } catch (err) {
    console.error('Monitor cron failed:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Monitor failed',
    });
  }
}
