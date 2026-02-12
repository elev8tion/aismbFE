import { NextRequest, NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { ncbOpenApiRead, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const ctx = getOptionalRequestContext(); const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const partnershipId = req.nextUrl.searchParams.get('partnership_id');

    if (!partnershipId) {
      return NextResponse.json({ error: 'Missing partnership_id' }, { status: 400 });
    }

    const documents = await ncbOpenApiRead(env, 'documents', { partnership_id: partnershipId });
    const signatures = await ncbOpenApiRead(env, 'document_signatures', { partnership_id: partnershipId });

    return NextResponse.json({ documents, signatures });
  } catch (err) {
    console.error('[contracts/status] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
