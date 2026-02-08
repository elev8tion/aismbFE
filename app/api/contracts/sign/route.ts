import { NextRequest, NextResponse } from 'next/server';
import { sendContractSignedNotification } from '@/lib/email/sendEmail';

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

async function ncbCreate(table: string, data: Record<string, unknown>) {
  const url = `${NCB_DATA_API_URL}/create/${table}?instance=${NCB_INSTANCE}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': NCB_INSTANCE,
    },
    body: JSON.stringify(data),
  });
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
    const docs = await ncbQuery('documents', { signing_token: token });
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
      await ncbCreate('document_signatures', {
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

      await ncbUpdate('documents', doc.id, {
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
