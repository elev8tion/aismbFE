import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

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
    const { partnership_id, signer_name, signer_title, signer_email, signature_data } = body as {
      partnership_id: number;
      signer_name: string;
      signer_title: string;
      signer_email: string;
      signature_data: string;
    };

    if (!partnership_id || !signer_name || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client-signed documents for this partnership
    const docs = await ncbQuery(instance, dataApiUrl, 'documents', { partnership_id: String(partnership_id) });
    const clientSignedDocs = docs.filter((d: { status: string }) => d.status === 'client_signed');

    if (!clientSignedDocs.length) {
      return NextResponse.json({ error: 'No client-signed documents found' }, { status: 404 });
    }

    const signedAt = new Date().toISOString();

    for (const doc of clientSignedDocs) {
      await ncbCreate(instance, dataApiUrl, 'document_signatures', {
        document_id: doc.id,
        partnership_id,
        signer_role: 'admin',
        signer_name,
        signer_title: signer_title || 'Managing Member',
        signer_email: signer_email || 'connect@elev8tion.one',
        signature_data,
        signed_at: signedAt,
        ip_address: 'admin',
        user_agent: 'CRM',
      });

      await ncbUpdate(instance, dataApiUrl, 'documents', doc.id, {
        status: 'fully_executed',
        updated_at: signedAt,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/countersign] Error:', err);
    return NextResponse.json({ error: 'Failed to countersign' }, { status: 500 });
  }
}
