import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getTierPricing } from '@/lib/stripe/pricing';
import { DocumentType } from '@/lib/contracts/types';

export const runtime = 'edge';

async function ncbCreate(instance: string, dataApiUrl: string, table: string, data: Record<string, unknown>) {
  const url = `${dataApiUrl}/create/${table}?instance=${instance}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': instance,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[NCB] create ${table} failed (${res.status}): ${text}`);
    return null;
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as Record<string, string>;
  const instance = env.NCB_INSTANCE;
  const dataApiUrl = env.NCB_DATA_API_URL;

  try {
    const body = await req.json();
    const { partnership_id, client_name, client_email, company_name, tier } = body as {
      partnership_id: number;
      client_name: string;
      client_email: string;
      company_name: string;
      tier: string;
    };

    if (!partnership_id || !client_name || !client_email || !company_name || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const pricing = getTierPricing(tier);
    if (!pricing) {
      return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 });
    }

    const signingToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const docTypes: DocumentType[] = ['msa', 'sow', 'addendum'];
    const documents = [];

    for (const docType of docTypes) {
      const result = await ncbCreate(instance, dataApiUrl, 'documents', {
        partnership_id,
        document_type: docType,
        status: 'draft',
        signing_token: signingToken,
        token_expires_at: expiresAt,
        client_name,
        client_email,
        company_name,
        tier,
        setup_fee_cents: pricing.setup,
        monthly_fee_cents: pricing.monthly,
        min_months: pricing.minMonths,
      });
      if (result) documents.push(result);
    }

    return NextResponse.json({
      success: true,
      signing_token: signingToken,
      token_expires_at: expiresAt,
      documents_created: documents.length,
    });
  } catch (err) {
    console.error('[contracts/create] Error:', err);
    return NextResponse.json({ error: 'Failed to create documents' }, { status: 500 });
  }
}
