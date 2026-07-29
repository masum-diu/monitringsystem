import { getResend } from '@/lib/resendClient';

/**
 * Send Resend's "Hello World" test email (testing: onboarding@resend.dev → your Gmail).
 * Env: RESEND_API_KEY on Vercel (or export for local test).
 */
export async function sendHelloWorldEmail() {
  const resend = getResend();
  const to = process.env.RESEND_TEST_TO || 'mmhmasum98@gmail.com';

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  });

  if (error) {
    throw new Error(error.message || JSON.stringify(error));
  }

  return data;
}
