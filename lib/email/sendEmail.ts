/**
 * CRM Email Sender — EmailIt API
 *
 * Sends emails via the EmailIt REST API (https://api.emailit.com).
 * Mirrors the landing page pattern (ai-smb-partners/lib/email/sendEmail.ts).
 *
 * Replaces the previous Cloudflare kre8tion-email-worker approach.
 */

import { welcomeEmailTemplate, type WelcomeEmailData } from './templates';

const EMAILIT_API_URL = 'https://api.emailit.com/v1/emails';

// Verified sender address in EmailIt (domain kre8tion.com verified with SPF/DKIM/DMARC)
const FROM_ADDRESS = 'AI KRE8TION Partners <bookings@kre8tion.com>';

/**
 * Low-level helper: send an email via EmailIt API.
 * Throws on failure so callers can handle/log.
 */
export async function sendViaEmailIt(params: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  tags?: string[];
}): Promise<void> {
  const res = await fetch(EMAILIT_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from || FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      track_opens: true,
      track_clicks: true,
      tags: params.tags || ['kre8tion', 'crm'],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`EmailIt API returned ${res.status}: ${err}`);
  }
}

// ─── Welcome Email (sent when setup invoice is paid) ─────────────────────

export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
  tier: string;
  tierName: string;
  company: string;
  monthlyAmount: string;
  emailitApiKey?: string;
}): Promise<void> {
  const apiKey = data.emailitApiKey || process.env.EMAILIT_API_KEY;

  if (!apiKey) {
    console.warn('[Email] EMAILIT_API_KEY not configured, skipping welcome email');
    return;
  }

  try {
    const templateData: WelcomeEmailData = {
      name: data.name,
      company: data.company,
      tier: data.tier,
      tierName: data.tierName,
      monthlyAmount: data.monthlyAmount,
    };

    const html = welcomeEmailTemplate(templateData);
    const subject = `Welcome to AI KRE8TION Partners \u2014 ${data.tierName} Partnership`;
    const plainText = `Welcome ${data.name}! Your ${data.tierName} partnership for ${data.company} is now active. Monthly billing of ${data.monthlyAmount}/month has been activated. Your consultant will reach out within 24 hours.`;

    await sendViaEmailIt({
      apiKey,
      to: data.to,
      subject,
      html,
      text: plainText,
      tags: ['kre8tion', 'crm', 'welcome'],
    });

    console.log(`[Email] Welcome email sent to ${data.to}`);
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
  }
}

// ─── Payment Failed Alert (sent to admin) ────────────────────────────────

export async function sendPaymentFailedAlert(data: {
  adminEmail: string;
  customerEmail: string;
  customerName: string;
  tier: string;
  amount: number;
  attemptCount: number;
  partnershipId?: string;
  emailitApiKey?: string;
}): Promise<void> {
  const apiKey = data.emailitApiKey || process.env.EMAILIT_API_KEY;

  if (!apiKey) {
    console.warn('[Email] EMAILIT_API_KEY not configured, skipping payment failed alert');
    return;
  }

  try {
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><style>
body { font-family: sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
.card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid #e8eaf0; }
.badge { display: inline-block; padding: 4px 16px; border-radius: 20px; background: #EF4444; color: white; font-size: 13px; font-weight: bold; }
.stat { background: #f8f9fc; padding: 12px; border-radius: 8px; border: 1px solid #e8eaf0; margin-bottom: 8px; }
.label { font-size: 11px; color: #8a8aaa; text-transform: uppercase; font-weight: bold; }
.value { font-size: 16px; font-weight: bold; color: #1a1a2e; }
</style></head><body>
<div class="card">
  <div style="border-bottom: 2px solid #f0f2f5; padding-bottom: 16px; margin-bottom: 20px;">
    <span class="badge">Payment Failed</span>
    <h1 style="margin: 8px 0 0; font-size: 20px;">Invoice payment failed</h1>
  </div>
  <div class="stat"><div class="label">Customer</div><div class="value">${data.customerName} (${data.customerEmail})</div></div>
  <div class="stat"><div class="label">Tier</div><div class="value">${data.tier}</div></div>
  <div class="stat"><div class="label">Amount</div><div class="value" style="color:#EF4444;">$${(data.amount / 100).toFixed(2)}</div></div>
  <div class="stat"><div class="label">Attempt</div><div class="value">#${data.attemptCount}</div></div>
  ${data.partnershipId ? `<div class="stat"><div class="label">Partnership ID</div><div class="value">${data.partnershipId}</div></div>` : ''}
  <p style="margin-top: 20px; font-size: 14px; color: #6a6a8a;">Partnership has been flagged as <strong style="color:#EF4444;">past_due</strong>. Customer may need follow-up.</p>
  <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa;">AI KRE8TION Partners CRM</div>
</div>
</body></html>`;

    await sendViaEmailIt({
      apiKey,
      to: data.adminEmail,
      subject: `Payment Failed: ${data.customerName} \u2014 $${(data.amount / 100).toFixed(2)} (Attempt #${data.attemptCount})`,
      html,
      text: `Payment failed for ${data.customerName} (${data.customerEmail}). Amount: $${(data.amount / 100).toFixed(2)}, Attempt #${data.attemptCount}. Partnership flagged as past_due.`,
      tags: ['kre8tion', 'crm', 'payment-failed'],
    });

    console.log(`[Email] Payment failed alert sent to ${data.adminEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment failed alert:', error);
  }
}
