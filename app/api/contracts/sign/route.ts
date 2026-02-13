import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { sendContractSignedNotification } from '@/lib/email/sendEmail';
import { ncbServerRead, ncbServerCreate, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';
import { signContractSchema } from '@/lib/validation/contract.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();

    // Validate with Zod
    const result = signContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: formatZodErrors(result.error)
      }, { status: 400 });
    }

    const { token, signer_name, signer_title, signer_email, signature_data } = result.data;

    // Verify token and get documents
    const docs = await ncbServerRead(env, 'documents', { signing_token: token });
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
      await ncbServerCreate(env, 'document_signatures', {
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

      await ncbServerUpdate(env, 'documents', doc.id, {
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
