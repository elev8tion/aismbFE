import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const NCB_INSTANCE = process.env.NCB_INSTANCE!;
const NCB_OPENAPI_URL = process.env.NCB_OPENAPI_URL || 'https://openapi.nocodebackend.com';
const NCB_SECRET_KEY = process.env.NCB_SECRET_KEY || '';

async function ncbQuery(table: string, filters: Record<string, unknown>) {
  const params = new URLSearchParams({ Instance: NCB_INSTANCE });
  Object.entries(filters).forEach(([k, v]) => params.append(k, String(v)));
  const url = `${NCB_OPENAPI_URL}/read/${table}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NCB_SECRET_KEY}`,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function GET(req: NextRequest) {
  try {
    const partnershipId = req.nextUrl.searchParams.get('partnership_id');

    if (!partnershipId) {
      return NextResponse.json({ error: 'Missing partnership_id' }, { status: 400 });
    }

    const documents = await ncbQuery('documents', { partnership_id: partnershipId });
    const signatures = await ncbQuery('document_signatures', { partnership_id: partnershipId });

    return NextResponse.json({ documents, signatures });
  } catch (err) {
    console.error('[contracts/status] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
