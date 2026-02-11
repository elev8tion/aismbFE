// KV-backed Rate Limiter for Cloudflare Pages edge runtime
// Uses RATE_LIMIT_KV binding from wrangler.toml

interface RateLimitState {
  count: number;
  resetAt: number; // epoch ms
}

const MINUTE_LIMIT = 30;
const HOUR_LIMIT = 300;
const MINUTE_WINDOW = 60; // seconds (KV TTL)
const HOUR_WINDOW = 3600; // seconds (KV TTL)

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // seconds until reset
  reason?: string;
}

export function getClientIP(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

async function checkWindow(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const raw = await kv.get(key);
  let state: RateLimitState;

  if (raw) {
    try {
      state = JSON.parse(raw);
      if (state.resetAt < now) {
        // Window expired — start fresh
        state = { count: 0, resetAt: now + windowSeconds * 1000 };
      }
    } catch {
      state = { count: 0, resetAt: now + windowSeconds * 1000 };
    }
  } else {
    state = { count: 0, resetAt: now + windowSeconds * 1000 };
  }

  if (state.count >= limit) {
    const retryAfter = Math.ceil((state.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(retryAfter, 1),
      reason: `Rate limit exceeded (${limit}/${windowSeconds}s). Try again in ${retryAfter}s.`,
    };
  }

  state.count++;
  const remaining = limit - state.count;
  const ttl = Math.ceil((state.resetAt - now) / 1000);

  await kv.put(key, JSON.stringify(state), { expirationTtl: Math.max(ttl, 1) });

  return { allowed: true, remaining, retryAfter: 0 };
}

export async function checkRateLimit(
  kv: KVNamespace,
  identifier: string
): Promise<RateLimitResult> {
  // Check minute window first (stricter)
  const minuteResult = await checkWindow(kv, `rl:min:${identifier}`, MINUTE_LIMIT, MINUTE_WINDOW);
  if (!minuteResult.allowed) return minuteResult;

  // Check hour window
  const hourResult = await checkWindow(kv, `rl:hr:${identifier}`, HOUR_LIMIT, HOUR_WINDOW);
  if (!hourResult.allowed) return hourResult;

  return {
    allowed: true,
    remaining: Math.min(minuteResult.remaining, hourResult.remaining),
    retryAfter: 0,
  };
}
