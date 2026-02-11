import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
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
    const partnership_id = typeof raw.partnership_id === 'number' ? raw.partnership_id : 0;
    const signer_name = sanitize(raw.signer_name);
    const signer_title = sanitize(raw.signer_title);
    const signer_email = sanitize(raw.signer_email);
    const signature_data = typeof raw.signature_data === 'string' ? raw.signature_data.slice(0, 50000) : '';

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
