import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { ncbServerRead, ncbServerCreate, ncbServerUpdate, type NCBEnv } from '@/lib/agent/ncbClient';
import { countersignContractSchema } from '@/lib/validation/contract.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as NCBEnv & Record<string, string>;

  try {
    const body = await req.json();

    // Validate with Zod
    const result = countersignContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: formatZodErrors(result.error as any)
      }, { status: 400 });
    }

    const { partnership_id, signer_name, signer_title, signer_email, signature_data } = result.data;

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

      const updateRes = await ncbServerUpdate(env, 'documents', doc.id, {
        status: 'fully_executed',
        updated_at: signedAt,
      });

      if (!updateRes.ok) {
        const text = await updateRes.text();
        console.error('[contracts/countersign] NCB update failed:', {
          document_id: doc.id,
          status: updateRes.status,
          error: text,
        });
        return NextResponse.json({
          error: 'Failed to update document status',
          details: 'Document was countersigned but status update failed. Please contact support.',
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[contracts/countersign] Error:', err);
    return NextResponse.json({ error: 'Failed to countersign' }, { status: 500 });
  }
}
