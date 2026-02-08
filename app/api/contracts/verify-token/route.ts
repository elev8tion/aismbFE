import { NextRequest, NextResponse } from 'next/server';
import { getTierPricing } from '@/lib/stripe/pricing';
import { ContractData } from '@/lib/contracts/types';
import { getContractBundle } from '@/lib/contracts/templates';

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

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const docs = await ncbQuery('documents', { signing_token: token });
    if (!docs.length) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const firstDoc = docs[0];

    // Check expiry
    if (new Date(firstDoc.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired', expired: true }, { status: 410 });
    }

    // Check if already client-signed or fully executed
    if (firstDoc.status === 'client_signed' || firstDoc.status === 'fully_executed') {
      return NextResponse.json({ error: 'Already signed', already_signed: true }, { status: 409 });
    }

    const pricing = getTierPricing(firstDoc.tier);
    const contractData: ContractData = {
      company_name: firstDoc.company_name,
      client_name: firstDoc.client_name,
      client_email: firstDoc.client_email,
      client_title: '',
      tier: firstDoc.tier,
      tierName: pricing?.name || firstDoc.tier,
      fees: {
        setup_cents: firstDoc.setup_fee_cents,
        monthly_cents: firstDoc.monthly_fee_cents,
      },
      min_months: firstDoc.min_months,
      effective_date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    const bundle = getContractBundle(contractData);

    return NextResponse.json({
      documents: docs,
      html: bundle,
      client_name: firstDoc.client_name,
      client_email: firstDoc.client_email,
      company_name: firstDoc.company_name,
      tier: firstDoc.tier,
      tierName: pricing?.name || firstDoc.tier,
    });
  } catch (err) {
    console.error('[contracts/verify-token] Error:', err);
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
  }
}
