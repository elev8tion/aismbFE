/**
 * External Leads API
 *
 * Accepts lead data from the landing page (kre8tion.com) and upserts it
 * into NCB via the OpenAPI endpoint (Bearer auth, no user session required).
 *
 * Auth: EXTERNAL_API_KEY env var — set the same value in the landing page
 *       as CRM_API_KEY.
 *
 * POST /api/external/leads
 * Body: { email, first_name?, last_name?, phone?, company_name?, industry?,
 *          employee_count?, source?, source_detail?, lead_score?, status? }
 * Response: { success: true, lead_id: number, action: "created" | "updated" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOptionalRequestContext } from '@cloudflare/next-on-pages';
import { ncbOpenApiRead, ncbOpenApiCreate, ncbOpenApiUpdate, type NCBEnv } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ctx = getOptionalRequestContext();
  const env = (ctx?.env || process.env) as any as NCBEnv & { EXTERNAL_API_KEY?: string };

  // Validate API key
  const authHeader = req.headers.get('Authorization') || '';
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!env.EXTERNAL_API_KEY || !apiKey || apiKey !== env.EXTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email } = body;
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const leadPayload: Record<string, unknown> = {
    email: email.toLowerCase(),
  };
  // Only include defined fields to avoid overwriting good data with nulls
  const stringFields = ['first_name', 'last_name', 'phone', 'company_name', 'industry',
    'employee_count', 'source', 'source_detail', 'status'] as const;
  for (const field of stringFields) {
    if (body[field] != null) leadPayload[field] = body[field];
  }
  if (body.lead_score != null) leadPayload.lead_score = Number(body.lead_score);

  try {
    // Check if lead already exists by email
    const existing = await ncbOpenApiRead(env, 'leads', { email: email.toLowerCase() });

    if (existing.length > 0) {
      const leadId = existing[0].id;
      // Remove email from update payload (immutable identifier)
      const { email: _e, status: _s, ...updateFields } = leadPayload;
      await ncbOpenApiUpdate(env, 'leads', leadId, updateFields);
      return NextResponse.json({ success: true, lead_id: leadId, action: 'updated' });
    } else {
      if (!leadPayload.status) leadPayload.status = 'new';
      if (!leadPayload.source) leadPayload.source = 'external';
      if (leadPayload.lead_score == null) leadPayload.lead_score = 50;
      const leadId = await ncbOpenApiCreate(env, 'leads', leadPayload);
      return NextResponse.json({ success: true, lead_id: leadId, action: 'created' });
    }
  } catch (error) {
    console.error('[External Leads] Error:', error);
    return NextResponse.json({ error: 'Failed to sync lead' }, { status: 500 });
  }
}
