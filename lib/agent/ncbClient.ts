// Server-side NCB fetch wrapper for agent tools
// Mirrors the pattern from app/api/data/[...path]/route.ts

export interface NCBEnv {
  NCB_INSTANCE: string;
  NCB_DATA_API_URL: string;
  NCB_AUTH_API_URL: string;
  NCB_OPENAPI_URL?: string;
  NCB_SECRET_KEY?: string;
}

function getConfig(env: NCBEnv) {
  return {
    instance: env.NCB_INSTANCE,
    dataApiUrl: env.NCB_DATA_API_URL,
    authApiUrl: env.NCB_AUTH_API_URL,
    openApiUrl: env.NCB_OPENAPI_URL || 'https://openapi.nocodebackend.com',
    secretKey: env.NCB_SECRET_KEY || '',
  };
}

// Tables without a user_id column — Data Proxy can't filter by user,
// so we must use OpenAPI with Bearer auth to read/write them.
const NO_USER_ID_TABLES = new Set([
  'bookings',
  'availability_settings',
  'blocked_dates',
]);

interface NCBResponse<T> {
  data: T;
  total?: number;
}

function buildUrl(config: ReturnType<typeof getConfig>, path: string, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  searchParams.set('instance', config.instance);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
  }
  return `${config.dataApiUrl}/${path}?${searchParams.toString()}`;
}

function buildOpenApiUrl(config: ReturnType<typeof getConfig>, path: string, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  searchParams.set('Instance', config.instance);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
  }
  return `${config.openApiUrl}/${path}?${searchParams.toString()}`;
}

async function ncbFetch<T>(
  env: NCBEnv,
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    cookies: string;
  }
): Promise<T> {
  const config = getConfig(env);

  // Extract table name from path (e.g., "read/bookings" → "bookings")
  const table = path.split('/')[1];
  const useOpenApi = table && NO_USER_ID_TABLES.has(table);

  const url = useOpenApi
    ? buildOpenApiUrl(config, path, options.params)
    : buildUrl(config, path, options.params);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useOpenApi) {
    headers['Authorization'] = `Bearer ${config.secretKey}`;
  } else {
    headers['X-Database-instance'] = config.instance;
    headers['Cookie'] = options.cookies;
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NCB ${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function ncbRead<T>(
  env: NCBEnv,
  table: string,
  cookies: string,
  filters?: Record<string, string>
): Promise<NCBResponse<T[]>> {
  return ncbFetch<NCBResponse<T[]>>(env, `read/${table}`, { cookies, params: filters });
}

export async function ncbReadOne<T>(
  env: NCBEnv,
  table: string,
  id: string,
  cookies: string
): Promise<NCBResponse<T>> {
  return ncbFetch<NCBResponse<T>>(env, `read/${table}/${id}`, { cookies });
}

export async function ncbCreate<T>(
  env: NCBEnv,
  table: string,
  data: Record<string, unknown>,
  userId: string,
  cookies: string
): Promise<T> {
  // Don't inject user_id for tables that don't have the column
  const body = NO_USER_ID_TABLES.has(table)
    ? data
    : { ...data, user_id: userId };
  return ncbFetch<T>(env, `create/${table}`, {
    method: 'POST',
    body,
    cookies,
  });
}

export async function ncbUpdate<T>(
  env: NCBEnv,
  table: string,
  id: string,
  data: Record<string, unknown>,
  cookies: string
): Promise<T> {
  const { user_id: _, ...safeData } = data;
  return ncbFetch<T>(env, `update/${table}/${id}`, {
    method: 'PUT',
    body: safeData,
    cookies,
  });
}

export async function ncbDelete(
  env: NCBEnv,
  table: string,
  id: string,
  cookies: string
): Promise<void> {
  await ncbFetch(env, `delete/${table}/${id}`, { method: 'DELETE', cookies });
}

// Helper to extract auth cookies from request
export function extractAuthCookies(cookieHeader: string): string {
  if (!cookieHeader) return '';
  const cookies = cookieHeader.split(';');
  const authCookies: string[] = [];
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (
      trimmed.startsWith('better-auth.session_token=') ||
      trimmed.startsWith('better-auth.session_data=')
    ) {
      authCookies.push(trimmed);
    }
  }
  return authCookies.join('; ');
}

// Helper to get session user (same pattern as data proxy)
export async function getSessionUser(
  env: NCBEnv,
  cookieHeader: string
): Promise<{ id: string; email: string; name: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const config = getConfig(env);
  const url = `${config.authApiUrl}/get-session?instance=${config.instance}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': config.instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}
