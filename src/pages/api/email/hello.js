import { sendHelloWorldEmail } from '@/lib/sendHelloWorld';

function authorize(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  return req.headers.authorization === `Bearer ${secret}`;
}

/** GET /api/email/hello — Resend "Hello World" test (requires CRON_SECRET in production). */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!authorize(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = await sendHelloWorldEmail();
    return res.status(200).json({ ok: true, id: data?.id });
  } catch (err) {
    console.error('Resend hello failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
