import { NextRequest, NextResponse } from 'next/server';
import { sendSigningRequest } from '@/lib/email/sendEmail';

export const runtime = 'edge';

const NCB_INSTANCE = process.env.NCB_INSTANCE!;
const NCB_DATA_API_URL = process.env.NCB_DATA_API_URL!;

async function ncbQuery(table: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams({ instance: NCB_INSTANCE });
  Object.entries(filters).forEach(([k, v]) => params.append(k, String(v)));
  const url = `${NCB_DATA_API_URL}/read/${table}?${params}`;
  const res = await fetch(url, {
    headers: { 'X-Database-instance': NCB_INSTANCE },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
}

async function ncbUpdate(table: string, id: string, data: Record<string, unknown>) {
  const url = `${NCB_DATA_API_URL}/update/${table}/${id}?instance=${NCB_INSTANCE}`;
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': NCB_INSTANCE,
    },
    body: JSON.stringify(data),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signing_token } = body as { signing_token: string };

    if (!signing_token) {
      return NextResponse.json({ error: 'Missing signing_token' }, { status: 400 });
    }

    // Find documents with this token
    const docs = await ncbQuery('documents', { signing_token });
    if (!docs.length) {
      return NextResponse.json({ error: 'No documents found for this token' }, { status: 404 });
    }

    const firstDoc = docs[0];

    // Update all docs from draft to pending
    for (const doc of docs) {
      if (doc.status === 'draft') {
        await ncbUpdate('documents', doc.id, { status: 'pending' });
      }
    }

    // Send the signing request email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kre8tion.com';
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
