import { Resend } from 'resend';

/** @returns {Resend} */
export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY — set it in Vercel Environment Variables');
  }
  return new Resend(apiKey);
}
