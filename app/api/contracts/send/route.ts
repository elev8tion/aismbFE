import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { sendSigningRequest } from '@/lib/email/sendEmail';

export const runtime = 'edge';

async function ncbQuery(instance: string, dataApiUrl: string, table: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams({ instance });
  Object.entries(filters).forEach(([k, v]) => params.append(k, String(v)));
  const url = `${dataApiUrl}/read/${table}?${params}`;
  const res = await fetch(url, {
    headers: { 'X-Database-instance': instance },
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

async function ncbUpdate(instance: string, dataApiUrl: string, table: string, id: string, data: Record<string, unknown>) {
  const url = `${dataApiUrl}/update/${table}/${id}?instance=${instance}`;
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': instance,
    },
    body: JSON.stringify(data),
  });
}

export async function POST(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;
  const instance = env.NCB_INSTANCE;
  const dataApiUrl = env.NCB_DATA_API_URL;

  try {
    const body = await req.json();
    const { signing_token } = body as { signing_token: string };

    if (!signing_token) {
      return NextResponse.json({ error: 'Missing signing_token' }, { status: 400 });
    }

    // Find documents with this token
    const docs = await ncbQuery(instance, dataApiUrl, 'documents', { signing_token });
    if (!docs.length) {
      return NextResponse.json({ error: 'No documents found for this token' }, { status: 404 });
    }

    const firstDoc = docs[0];

    // Update all docs from draft to pending
    for (const doc of docs) {
      if (doc.status === 'draft') {
        await ncbUpdate(instance, dataApiUrl, 'documents', doc.id, { status: 'pending' });
      }
    }

    // Send the signing request email
    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://app.kre8tion.com';
    const signingUrl = `${baseUrl}/sign/${signing_token}`;

    await sendSigningRequest({
      to: firstDoc.client_email,
      clientName: firstDoc.client_name,
      companyName: firstDoc.company_name,
      signingUrl,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/send] Error:', err);
    return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 });
  }
}
