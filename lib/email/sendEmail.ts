/**
 * CRM Email Sender
 *
 * Calls the kre8tion-email-worker (shared with the landing page)
 * via fetch. Same pattern as ai-smb-partners/lib/email/sendEmail.ts.
 */

import { welcomeEmailTemplate, type WelcomeEmailData } from './templates';

interface SendEmailParams {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const workerUrl = process.env.EMAIL_WORKER_URL;
  const workerSecret = process.env.EMAIL_WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    console.warn('[Email] EMAIL_WORKER_URL or EMAIL_WORKER_SECRET not configured, skipping email');
    return;
  }

  try {
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${workerSecret}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[Email] Worker returned ${res.status}: ${err}`);
      return;
    }

    console.log(`[Email] Sent to ${params.to}: ${params.subject}`);
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
  }
}

export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
  tier: string;
  tierName: string;
  company: string;
  monthlyAmount: string;
}): Promise<void> {
  const templateData: WelcomeEmailData = {
    name: data.name,
    company: data.company,
    tier: data.tier,
    tierName: data.tierName,
    monthlyAmount: data.monthlyAmount,
  };

  const html = welcomeEmailTemplate(templateData);

  await sendEmail({
    to: data.to,
    toName: data.name,
    subject: `Welcome to AI KRE8TION Partners — ${data.tierName} Partnership`,
    html,
    text: `Welcome ${data.name}! Your ${data.tierName} partnership for ${data.company} is now active. Monthly billing of ${data.monthlyAmount}/month has been activated. Your consultant will reach out within 24 hours.`,
  });
}
