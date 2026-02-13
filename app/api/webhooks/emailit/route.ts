/**
 * EmailIt Webhook Handler — CRM
 *
 * Receives tracking and delivery events from EmailIt for CRM-sent emails.
 * Handles bounces, complaints, opens, clicks, and delivery confirmations.
 *
 * Tags used by CRM emails: ['kre8tion', 'crm', 'welcome'], ['kre8tion', 'crm', 'payment-failed']
 * Landing page uses: ['kre8tion'] — different tags prevent cross-handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { sendViaEmailIt } from '@/lib/email/sendEmail';

export const runtime = 'edge';

const ADMIN_EMAIL = 'connect@elev8tion.one';

interface EmailItEvent {
  event: string;
  email?: string;
  subject?: string;
  url?: string;
  reason?: string;
  timestamp?: string;
  from?: string;
  to?: string;
  text?: string;
  html?: string;
  tags?: string[];
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as Record<string, string>;

  try {
    const payload: EmailItEvent = await req.json();
    const eventType = payload.event;

    console.log(`[EmailIt CRM Webhook] ${eventType}`, {
      email: payload.email,
      subject: payload.subject,
      tags: payload.tags,
    });

    switch (eventType) {
      case 'email.delivered':
        console.log(`[EmailIt CRM] Delivered to ${payload.email}: "${payload.subject}"`);
        break;

      case 'email.opened':
        console.log(`[EmailIt CRM] Opened by ${payload.email}: "${payload.subject}"`);
        break;

      case 'email.clicked':
        console.log(`[EmailIt CRM] Link clicked by ${payload.email}: ${payload.url}`);
        break;

      case 'email.bounced': {
        console.warn(`[EmailIt CRM] Bounce for ${payload.email}: ${payload.reason}`);

        // Alert admin about CRM email bounces (important — partnership emails failing)
        const apiKey = env.EMAILIT_API_KEY;
        if (apiKey) {
          try {
            await sendViaEmailIt({
              apiKey,
              to: ADMIN_EMAIL,
              subject: `CRM Email Bounce: ${payload.email}`,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
<h2 style="color:#EF4444;">CRM Email Bounced</h2>
<p><strong>Recipient:</strong> ${payload.email}</p>
<p><strong>Subject:</strong> ${payload.subject || 'N/A'}</p>
<p><strong>Reason:</strong> ${payload.reason || 'Unknown'}</p>
<p><strong>Time:</strong> ${payload.timestamp || new Date().toISOString()}</p>
<p style="color:#6a6a8a;font-size:13px;">This was a CRM email (partnership/billing). Check if the partner's email is valid.</p>
<hr><p style="font-size:12px;color:#aaa;">AI KRE8TION Partners CRM</p></div>`,
              text: `CRM email bounced: ${payload.email}. Reason: ${payload.reason || 'Unknown'}. Subject: ${payload.subject || 'N/A'}`,
              tags: ['kre8tion', 'crm', 'bounce-alert'],
            });
          } catch (err) {
            console.error('[EmailIt CRM] Failed to send bounce alert:', err);
          }
        }
        break;
      }

      case 'email.complained':
        console.warn(`[EmailIt CRM] Spam complaint from ${payload.email}: "${payload.subject}"`);
        break;

      default:
        console.log(`[EmailIt CRM] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[EmailIt CRM Webhook] Handler error:', error);
    // Always 200 to prevent EmailIt retries
    return NextResponse.json({ received: true });
  }
}
