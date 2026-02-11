import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { ncbServerRead, ncbServerCreate, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { env: cfEnv } = getRequestContext();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();
    const { partnership_id, signer_name, signer_title, signer_email, signature_data } = body as {
      partnership_id: number;
      signer_name: string;
      signer_title: string;
      signer_email: string;
      signature_data: string;
    };

    if (!partnership_id || !signer_name || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get client-signed documents for this partnership
    const docs = await ncbServerRead(env, 'documents', { partnership_id: String(partnership_id) });
    const clientSignedDocs = docs.filter((d: { status: string }) => d.status === 'client_signed');

    if (!clientSignedDocs.length) {
      return NextResponse.json({ error: 'No client-signed documents found' }, { status: 404 });
    }

    const signedAt = new Date().toISOString();

    for (const doc of clientSignedDocs) {
      await ncbServerCreate(env, 'document_signatures', {
        document_id: doc.id,
        partnership_id,
        signer_role: 'admin',
        signer_name,
        signer_title: signer_title || 'Managing Member',
        signer_email: signer_email || 'connect@elev8tion.one',
        signature_data,
        signed_at: signedAt,
        ip_address: 'admin',
        user_agent: 'CRM',
      });

      await ncbServerUpdate(env, 'documents', doc.id, {
        status: 'fully_executed',
        updated_at: signedAt,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/countersign] Error:', err);
    return NextResponse.json({ error: 'Failed to countersign' }, { status: 500 });
  }
}
