import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

async function ncbQuery(instance: string, openApiUrl: string, secretKey: string, table: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams({ Instance: instance });
  Object.entries(filters).forEach(([k, v]) => params.append(k, String(v)));
  const url = `${openApiUrl}/read/${table}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secretKey}`,
    },
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  return data.data || [];
}

export async function GET(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;
  const instance = env.NCB_INSTANCE;
  const openApiUrl = env.NCB_OPENAPI_URL || 'https://openapi.nocodebackend.com';
  const secretKey = env.NCB_SECRET_KEY || '';

  try {
    const partnershipId = req.nextUrl.searchParams.get('partnership_id');

    if (!partnershipId) {
      return NextResponse.json({ error: 'Missing partnership_id' }, { status: 400 });
    }

    const documents = await ncbQuery(instance, openApiUrl, secretKey, 'documents', { partnership_id: partnershipId });
    const signatures = await ncbQuery(instance, openApiUrl, secretKey, 'document_signatures', { partnership_id: partnershipId });

    return NextResponse.json({ documents, signatures });
  } catch (err) {
    console.error('[contracts/status] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
