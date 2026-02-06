// Server-side NCB fetch wrapper for agent tools
// Mirrors the pattern from app/api/data/[...path]/route.ts

const CONFIG = {
  instance: process.env.NCB_INSTANCE!,
  dataApiUrl: process.env.NCB_DATA_API_URL!,
  authApiUrl: process.env.NCB_AUTH_API_URL!,
};

interface NCBResponse<T> {
  data: T;
  total?: number;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  searchParams.set('instance', CONFIG.instance);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
  }
  return `${CONFIG.dataApiUrl}/${path}?${searchParams.toString()}`;
}

async function ncbFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    cookies: string;
  }
): Promise<T> {
  const url = buildUrl(path, options.params);

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': CONFIG.instance,
      Cookie: options.cookies,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NCB ${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function ncbRead<T>(
  table: string,
  cookies: string,
  filters?: Record<string, string>
): Promise<NCBResponse<T[]>> {
  return ncbFetch<NCBResponse<T[]>>(`read/${table}`, { cookies, params: filters });
}

export async function ncbReadOne<T>(
  table: string,
  id: string,
  cookies: string
): Promise<NCBResponse<T>> {
  return ncbFetch<NCBResponse<T>>(`read/${table}/${id}`, { cookies });
}

export async function ncbCreate<T>(
  table: string,
  data: Record<string, unknown>,
  userId: string,
  cookies: string
): Promise<T> {
  return ncbFetch<T>(`create/${table}`, {
    method: 'POST',
    body: { ...data, user_id: userId },
    cookies,
  });
}

export async function ncbUpdate<T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  cookies: string
): Promise<T> {
  const { user_id: _, ...safeData } = data;
  return ncbFetch<T>(`update/${table}/${id}`, {
    method: 'PUT',
    body: safeData,
    cookies,
  });
}

export async function ncbDelete(
  table: string,
  id: string,
  cookies: string
): Promise<void> {
  await ncbFetch(`delete/${table}/${id}`, { method: 'DELETE', cookies });
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
  cookieHeader: string
): Promise<{ id: string; email: string; name: string } | null> {
  const authCookies = extractAuthCookies(cookieHeader);
  if (!authCookies) return null;

  const url = `${CONFIG.authApiUrl}/get-session?instance=${CONFIG.instance}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Database-instance': CONFIG.instance,
      Cookie: authCookies,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return data.user || null;
  }
  return null;
}
