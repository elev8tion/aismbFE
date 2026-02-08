import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
  secretKey: process.env.NCB_SECRET_KEY || '',
};

// Tables any authenticated user can access (public booking data + own profile via RLS)
const PUBLIC_TABLES = new Set([
  'bookings',
  'availability_settings',
  'blocked_dates',
  'user_profiles',
  'customer_access',
]);

// Tables customers can READ (not write). Admins have full access.
// Bypasses RLS via secret key so customers can see admin-owned records.
const CUSTOMER_TABLES = new Set([
  'partnerships',
  'delivered_systems',
  'companies',
]);

// Tables without a user_id column — NCB Data Proxy can't filter by user,
// so we must use Bearer auth (secret key) to read them.
const NO_USER_ID_TABLES = new Set([
  'bookings',
  'availability_settings',
  'blocked_dates',
]);

function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return "";

  const cookies = cookieHeader.split(";");
  const authCookies: string[] = [];

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (
      trimmed.startsWith("better-auth.session_token=") ||
      trimmed.startsWith("better-auth.session_data=")
    ) {
      authCookies.push(trimmed);
    }
  }

  return authCookies.join("; ");
}

async function getSessionUser(
  cookieHeader: string
): Promise<{ id: string; email?: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${CONFIG.authApiUrl}/get-session?Instance=${CONFIG.instance}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
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
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": CONFIG.instance,
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

function extractTableName(path: string): string | null {
  // path format: "read/leads", "create/leads", "update/leads/123", "delete/leads/123"
  const parts = path.split('/');
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
}

function extractOperation(path: string): string {
  return path.split('/')[0] || '';
}

function isAuthorized(table: string | null, role: string | null, operation: string): boolean {
  if (!table) return false;
  if (PUBLIC_TABLES.has(table)) return true;
  if (CUSTOMER_TABLES.has(table)) {
    if (role === 'admin') return true;
    if (role === 'customer' && operation === 'read') return true;
    return false;
  }
  return role === 'admin';
}

function customerNeedsFilter(table: string | null, role: string | null, searchParams: URLSearchParams): boolean {
  if (role !== 'customer' || !table || !CUSTOMER_TABLES.has(table)) return false;
  // Customers must provide a filter to prevent listing all records
  return !searchParams.has('id__in') && !searchParams.has('id') &&
    !searchParams.has('partnership_id') && !searchParams.has('partnership_id__in');
}

function forbidden() {
  return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxyToNCB(req: NextRequest, path: string, body?: string, bypassRLS = false) {
  const searchParams = new URLSearchParams();
  searchParams.set("Instance", CONFIG.instance);

  req.nextUrl.searchParams.forEach((val, key) => {
    if (key !== "Instance" && key !== "instance" && key !== "path") searchParams.append(key, val);
  });

  const url = `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Database-Instance": CONFIG.instance,
    Origin: origin,
  };

  if (bypassRLS && CONFIG.secretKey) {
    // Use secret key to bypass RLS for customer reads of shared data
    headers["Authorization"] = `Bearer ${CONFIG.secretKey}`;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    headers["Cookie"] = extractAuthCookies(cookieHeader);
  }

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body || undefined,
  });

  // NCB returns 404 for empty result sets on reads. Normalize to 200 with empty data
  // so the browser doesn't log "Failed to load resource" console errors.
  if (res.status === 404 && path.startsWith("read/")) {
    return new NextResponse(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.text();

  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(cookieHeader),
    getUserRole(cookieHeader),
  ]);

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = extractTableName(pathStr);
  const operation = extractOperation(pathStr);
  if (!isAuthorized(table, role, operation)) {
    return forbidden();
  }

  if (customerNeedsFilter(table, role, req.nextUrl.searchParams)) {
    return forbidden();
  }

  // Bypass RLS for: (1) customer reads on CUSTOMER_TABLES (admin-owned data),
  // (2) tables without user_id column (NCB can't filter, needs Bearer auth)
  const bypassRLS = !!table && (
    (role === 'customer' && CUSTOMER_TABLES.has(table)) ||
    NO_USER_ID_TABLES.has(table)
  );
  return proxyToNCB(req, pathStr, undefined, bypassRLS);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(cookieHeader),
    getUserRole(cookieHeader),
  ]);

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = extractTableName(pathStr);
  const operation = extractOperation(pathStr);
  if (!isAuthorized(table, role, operation)) {
    return forbidden();
  }

  if (pathStr.startsWith("create/") && body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = user.id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(req, pathStr, body);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(cookieHeader),
    getUserRole(cookieHeader),
  ]);

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = extractTableName(pathStr);
  const operation = extractOperation(pathStr);
  if (!isAuthorized(table, role, operation)) {
    return forbidden();
  }

  if (body) {
    try {
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      return proxyToNCB(req, pathStr, JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(req, pathStr, body);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(cookieHeader),
    getUserRole(cookieHeader),
  ]);

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const table = extractTableName(pathStr);
  const operation = extractOperation(pathStr);
  if (!isAuthorized(table, role, operation)) {
    return forbidden();
  }

  return proxyToNCB(req, pathStr);
}
