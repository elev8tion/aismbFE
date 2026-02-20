import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestContext } from "@cloudflare/next-on-pages";
import { checkRateLimit, getClientIP } from '@/lib/security/rateLimiter.kv';
import { extractAuthCookies, getSessionUser, type NCBEnv } from "@/lib/agent/ncbClient";

export const runtime = 'edge';

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

interface DataProxyConfig {
  instance: string;
  dataApiUrl: string;
  openApiUrl: string;
  authApiUrl: string;
  secretKey: string;
}

function buildConfig(env: NCBEnv): DataProxyConfig {
  return {
    instance: env.NCB_INSTANCE,
    dataApiUrl: env.NCB_DATA_API_URL,
    openApiUrl: env.NCB_OPENAPI_URL || 'https://openapi.nocodebackend.com',
    authApiUrl: env.NCB_AUTH_API_URL,
    secretKey: env.NCB_SECRET_KEY || '',
  };
}

async function getUserRole(config: DataProxyConfig, cookieHeader: string): Promise<string | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${config.dataApiUrl}/read/user_profiles?Instance=${config.instance}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Database-Instance": config.instance,
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

async function rateLimit(req: NextRequest, env: Record<string, unknown>): Promise<NextResponse | null> {
  const kv = env.RATE_LIMIT_KV as KVNamespace | undefined;
  if (!kv) return null;
  const ip = getClientIP(req);
  const result = await checkRateLimit(kv, `data:${ip}`);
  if (!result.allowed) {
    return new NextResponse(JSON.stringify({ error: result.reason || 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
      },
    });
  }
  return null;
}

async function proxyToNCB(config: DataProxyConfig, req: NextRequest, path: string, body?: string, bypassRLS = false) {
  const searchParams = new URLSearchParams();
  searchParams.set("Instance", config.instance);

  req.nextUrl.searchParams.forEach((val, key) => {
    if (key !== "Instance" && key !== "instance" && key !== "path") searchParams.append(key, val);
  });

  // bypassRLS: use OpenAPI endpoint (Bearer token, no RLS) so guest records are visible.
  // Data Proxy endpoint only understands cookie auth — Bearer token there does nothing.
  const baseUrl = bypassRLS ? config.openApiUrl : config.dataApiUrl;
  const url = `${baseUrl}/${path}?${searchParams.toString()}`;
  const origin = req.headers.get("origin") || req.nextUrl.origin;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Database-Instance": config.instance,
    Origin: origin,
  };

  if (bypassRLS && config.secretKey) {
    headers["Authorization"] = `Bearer ${config.secretKey}`;
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

  const isRead = path.startsWith("read/");
  return new NextResponse(data, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      ...(isRead && { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" }),
      ...(!isRead && { "Cache-Control": "no-store" }),
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ctx = getOptionalRequestContext();
  const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv;
  const config = buildConfig(env);

  const limited = await rateLimit(req, cfEnv as unknown as Record<string, unknown>);
  if (limited) return limited;

  const { path } = await params;
  const pathStr = path.join("/");
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(env, cookieHeader),
    getUserRole(config, cookieHeader),
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

  // Bypass RLS for: (1) admins — use Bearer token so all records are visible regardless
  // of which user_id wrote them (landing page writes with NCB_DEFAULT_USER_ID, CRM
  // admin reads need to see everything), (2) customer reads on CUSTOMER_TABLES (admin-owned
  // data), (3) tables without user_id column (NCB can't filter by user, needs Bearer auth)
  const bypassRLS = !!table && (
    role === 'admin' ||
    (role === 'customer' && CUSTOMER_TABLES.has(table)) ||
    NO_USER_ID_TABLES.has(table)
  );
  return proxyToNCB(config, req, pathStr, undefined, bypassRLS);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ctx = getOptionalRequestContext();
  const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv;
  const config = buildConfig(env);

  const limited = await rateLimit(req, cfEnv as unknown as Record<string, unknown>);
  if (limited) return limited;

  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(env, cookieHeader),
    getUserRole(config, cookieHeader),
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
      return proxyToNCB(config, req, pathStr, JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(config, req, pathStr, body);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ctx = getOptionalRequestContext();
  const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv;
  const config = buildConfig(env);

  const limited = await rateLimit(req, cfEnv as unknown as Record<string, unknown>);
  if (limited) return limited;

  const { path } = await params;
  const pathStr = path.join("/");
  const body = await req.text();
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(env, cookieHeader),
    getUserRole(config, cookieHeader),
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
      return proxyToNCB(config, req, pathStr, JSON.stringify(parsed));
    } catch {
      // Continue without modification
    }
  }

  return proxyToNCB(config, req, pathStr, body);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const ctx = getOptionalRequestContext();
  const cfEnv = (ctx?.env || process.env) as any;
  const env = cfEnv as unknown as NCBEnv;
  const config = buildConfig(env);

  const limited = await rateLimit(req, cfEnv as unknown as Record<string, unknown>);
  if (limited) return limited;

  const { path } = await params;
  const pathStr = path.join("/");
  const cookieHeader = req.headers.get("cookie") || "";

  const [user, role] = await Promise.all([
    getSessionUser(env, cookieHeader),
    getUserRole(config, cookieHeader),
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

  return proxyToNCB(config, req, pathStr);
}
