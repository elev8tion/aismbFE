import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/agent/ncbClient';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const user = await getSessionUser(cookieHeader);

  const env = {
    NCB_INSTANCE: !!process.env.NCB_INSTANCE,
    NCB_AUTH_API_URL: !!process.env.NCB_AUTH_API_URL,
    NCB_DATA_API_URL: !!process.env.NCB_DATA_API_URL,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  };

  return NextResponse.json({ ok: true, authenticated: !!user, env });
}

