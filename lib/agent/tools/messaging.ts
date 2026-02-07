import { ncbCreate } from '@/lib/agent/ncbClient';

export async function draft_email(
  params: { to: string; subject: string; context: string },
  userId: string,
  cookies: string
) {
  const recipientName = params.to.includes('@')
    ? params.to.split('@')[0].replace(/[._-]/g, ' ')
    : params.to;

  const body = `Hi ${recipientName},\n\n${params.context}\n\nBest regards`;

  await ncbCreate('drafts', {
    type: 'email',
    to_recipient: params.to,
    subject: params.subject,
    body,
    status: 'draft',
  }, userId, cookies);

  return {
    draft: true,
    type: 'email',
    to: params.to,
    subject: params.subject,
    body,
    note: 'Draft saved. Opening your drafts page.',
    client_action: { type: 'navigate', route: '/drafts', target: 'drafts' },
  };
}

export async function draft_sms(
  params: { to: string; context: string },
  userId: string,
  cookies: string
) {
  await ncbCreate('drafts', {
    type: 'sms',
    to_recipient: params.to,
    subject: null,
    body: params.context,
    status: 'draft',
  }, userId, cookies);

  return {
    draft: true,
    type: 'sms',
    to: params.to,
    body: params.context,
    note: 'SMS draft saved. Opening your drafts page.',
    client_action: { type: 'navigate', route: '/drafts', target: 'drafts' },
  };
}
