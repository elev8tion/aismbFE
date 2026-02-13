import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare/env';
import { extractAuthCookies, getSessionUser, type NCBEnv } from '@/lib/agent/ncbClient';
import { grantAccessSchema } from '@/lib/validation/admin.schemas';
import { formatZodErrors } from '@kre8tion/shared-types';

export const runtime = 'edge';

async function getUserRole(instance: string, dataApiUrl: string, cookieHeader: string): Promise<string | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${dataApiUrl}/read/user_profiles?Instance=${instance}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data: any = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].role;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const cfEnv = getEnv();
  const env = cfEnv as unknown as Record<string, string>;
  const instance = env.NCB_INSTANCE;
  const dataApiUrl = env.NCB_DATA_API_URL;

  const ncbEnv: NCBEnv = {
    NCB_INSTANCE: instance,
    NCB_DATA_API_URL: dataApiUrl,
    NCB_AUTH_API_URL: env.NCB_AUTH_API_URL,
  };

  const cookieHeader = req.headers.get('cookie') || '';

  const [user, role] = await Promise.all([
    getSessionUser(ncbEnv, cookieHeader),
    getUserRole(instance, dataApiUrl, cookieHeader),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate with Zod
  const result = grantAccessSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: formatZodErrors(result.error)
    }, { status: 400 });
  }

  const { customer_user_id, partnership_id, access_level } = result.data;

  // Create customer_access record directly via NCB with customer's user_id
  const createUrl = `${dataApiUrl}/create/customer_access?Instance=${instance}`;

  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': instance,
    },
    body: JSON.stringify({
      user_id: customer_user_id,
      partnership_id,
      access_level, // Zod provides default value 'read'
      granted_by: user.id,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[grant-access] NCB error:', text);
    return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, data });
}
