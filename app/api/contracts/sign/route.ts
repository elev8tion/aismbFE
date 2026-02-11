import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { sendContractSignedNotification } from '@/lib/email/sendEmail';
import { ncbServerRead, ncbServerCreate, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();

    // Sanitize inputs
    function sanitize(val: unknown): string {
      if (typeof val !== 'string') return '';
      return val.trim().replace(/<[^>]*>/g, '').slice(0, 500);
    }

    const raw = body as Record<string, unknown>;
    const token = sanitize(raw.token);
    const signer_name = sanitize(raw.signer_name);
    const signer_title = sanitize(raw.signer_title);
    const signer_email = sanitize(raw.signer_email);
    const signature_data = typeof raw.signature_data === 'string' ? raw.signature_data.slice(0, 50000) : '';

    if (!token || !signer_name || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (signer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signer_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

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
