import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { getTierPricing } from '@/lib/stripe/pricing';
import { DocumentType } from '@/lib/contracts/types';
import { ncbServerCreate, type NCBEnv } from '@/lib/agent/ncbClient';
import { createContractSchema } from '@/lib/validation/contract.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();

    // Validate with Zod
    const result = createContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: formatZodErrors(result.error)
      }, { status: 400 });
    }

    const { partnership_id, client_name, client_email, company_name, tier } = result.data;

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
