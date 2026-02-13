import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { sendSigningRequest } from '@/lib/email/sendEmail';
import { ncbServerRead, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';
import { sendContractSchema } from '@/lib/validation/contract.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();

    // Validate with Zod
    const result = sendContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: formatZodErrors(result.error as any)
      }, { status: 400 });
    }

    const { signing_token } = result.data;

    // Find documents with this token
    const docs = await ncbServerRead(env, 'documents', { signing_token });
    if (!docs.length) {
      return NextResponse.json({ error: 'No documents found for this token' }, { status: 404 });
    }

    const firstDoc = docs[0];

    // Update all docs from draft to pending
    for (const doc of docs) {
      if (doc.status === 'draft') {
        await ncbServerUpdate(env, 'documents', doc.id, { status: 'pending' });
      }
    }

    // Send the signing request email
    const baseUrl = env.NEXT_PUBLIC_APP_URL || 'https://app.kre8tion.com';
    const signingUrl = `${baseUrl}/sign/${signing_token}`;

    await sendSigningRequest({
      to: firstDoc.client_email,
      clientName: firstDoc.client_name,
      companyName: firstDoc.company_name,
      signingUrl,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/send] Error:', err);
    return NextResponse.json({ error: 'Failed to send contract' }, { status: 500 });
  }
}
