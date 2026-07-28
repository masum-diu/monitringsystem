import { getResend } from '@/lib/resendClient';

/**
 * Send Resend's "Hello World" test email (testing: onboarding@resend.dev → your Gmail).
 * Set RESEND_API_KEY in .env.local — replace re_xxxxxxxxx with your real key from Resend.
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
