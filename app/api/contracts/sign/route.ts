import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { sendContractSignedNotification } from '@/lib/email/sendEmail';

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

async function ncbCreate(instance: string, dataApiUrl: string, table: string, data: Record<string, unknown>) {
  const url = `${dataApiUrl}/create/${table}?instance=${instance}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': instance,
    },
    body: JSON.stringify(data),
  });
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
    const { token, signer_name, signer_title, signer_email, signature_data } = body as {
      token: string;
      signer_name: string;
      signer_title: string;
      signer_email: string;
      signature_data: string;
    };

    if (!token || !signer_name || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify token and get documents
    const docs = await ncbQuery(instance, dataApiUrl, 'documents', { signing_token: token });
    if (!docs.length) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const firstDoc = docs[0];

    if (new Date(firstDoc.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }

    if (firstDoc.status === 'client_signed' || firstDoc.status === 'fully_executed') {
      return NextResponse.json({ error: 'Already signed' }, { status: 409 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const signedAt = new Date().toISOString();

    // Create signature records and update doc statuses
    for (const doc of docs) {
      await ncbCreate(instance, dataApiUrl, 'document_signatures', {
        document_id: doc.id,
        partnership_id: doc.partnership_id,
        signer_role: 'client',
        signer_name,
        signer_title: signer_title || '',
        signer_email: signer_email || firstDoc.client_email,
        signature_data,
        signed_at: signedAt,
        ip_address: ip,
        user_agent: userAgent,
      });

      await ncbUpdate(instance, dataApiUrl, 'documents', doc.id, {
        status: 'client_signed',
        updated_at: signedAt,
      });
    }

    // Notify admin
    await sendContractSignedNotification({
      clientName: firstDoc.client_name,
      companyName: firstDoc.company_name,
      tier: firstDoc.tier,
      partnershipId: firstDoc.partnership_id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/sign] Error:', err);
    return NextResponse.json({ error: 'Failed to sign documents' }, { status: 500 });
  }
}
