export async function draft_email(
  params: { to: string; subject: string; context: string },
  _cookies: string
) {
  const recipientName = params.to.includes('@')
    ? params.to.split('@')[0].replace(/[._-]/g, ' ')
    : params.to;

  return {
    draft: true,
    type: 'email',
    to: params.to,
    subject: params.subject,
    body: `Hi ${recipientName},\n\n${params.context}\n\nBest regards`,
    note: 'This is a draft. Please review and send manually.',
  };
}

export async function draft_sms(
  params: { to: string; context: string },
  _cookies: string
) {
  return {
    draft: true,
    type: 'sms',
    to: params.to,
    body: params.context,
    note: 'SMS draft. Please review and send manually.',
  };
}
