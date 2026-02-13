import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { getTierPricing } from '@/lib/stripe/pricing';
import { DocumentType } from '@/lib/contracts/types';
import { ncbServerCreate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

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
      const res = await ncbServerCreate(env, 'documents', {
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
      if (res.ok) documents.push(await res.json());
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
