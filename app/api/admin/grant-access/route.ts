import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
};

function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return '';
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(
      (c) =>
        c.startsWith('better-auth.session_token=') ||
        c.startsWith('better-auth.session_data=')
    )
    .join('; ');
}

async function getSessionUser(cookieHeader: string): Promise<{ id: string; email?: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${CONFIG.authApiUrl}/get-session?Instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}

async function getUserRole(cookieHeader: string): Promise<string | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${CONFIG.dataApiUrl}/read/user_profiles?Instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].role;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';

  const [user, role] = await Promise.all([
    getSessionUser(cookieHeader),
    getUserRole(cookieHeader),
  ]);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { customer_user_id, partnership_id, access_level } = body;

  if (!customer_user_id || !partnership_id) {
    return NextResponse.json(
      { error: 'customer_user_id and partnership_id are required' },
      { status: 400 }
    );
  }

  // Create customer_access record directly via NCB with customer's user_id
  const createUrl = `${CONFIG.dataApiUrl}/create/customer_access?Instance=${CONFIG.instance}`;

  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-Instance': CONFIG.instance,
    },
    body: JSON.stringify({
      user_id: customer_user_id,
      partnership_id,
      access_level: access_level || 'view',
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
