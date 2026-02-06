// Rate Limiter - Protect against API abuse (CRM: 30 req/min)

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry>;
  private readonly minuteLimit: number = 30; // 30 requests per minute for CRM
  private readonly hourLimit: number = 300; // 300 requests per hour
  private readonly blockDuration: number = 60 * 60 * 1000; // 1 hour block

  constructor() {
    this.limits = new Map();
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    reason?: string;
  } {
    const now = Date.now();
    const minuteKey = `${identifier}:minute`;
    const hourKey = `${identifier}:hour`;

    const minuteEntry = this.limits.get(minuteKey);
    if (minuteEntry?.blockedUntil && minuteEntry.blockedUntil > now) {
      const resetTime = minuteEntry.blockedUntil;
      const minutesRemaining = Math.ceil((resetTime - now) / 60000);
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        reason: `Rate limit exceeded. Try again in ${minutesRemaining} minutes.`,
      };
    }

    const minuteResult = this.checkLimit(minuteKey, this.minuteLimit, 60 * 1000);
    if (!minuteResult.allowed) {
      const blockedUntil = now + this.blockDuration;
      this.limits.set(minuteKey, { ...minuteResult, blockedUntil });
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        reason: 'Rate limit exceeded. Blocked for 1 hour.',
      };
    }

    const hourResult = this.checkLimit(hourKey, this.hourLimit, 60 * 60 * 1000);
    if (!hourResult.allowed) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: hourResult.resetTime,
        reason: 'Hourly limit exceeded. Try again later.',
      };
    }

    this.increment(minuteKey, 60 * 1000);
    this.increment(hourKey, 60 * 60 * 1000);

    return {
      allowed: true,
      remaining: Math.min(minuteResult.remaining, hourResult.remaining),
      resetTime: Math.min(minuteResult.resetTime, hourResult.resetTime),
    };
  }

  private checkLimit(key: string, limit: number, window: number): RateLimitEntry & { allowed: boolean; remaining: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetTime < now) {
      return { allowed: true, count: 0, resetTime: now + window, remaining: limit };
    }

    const allowed = entry.count < limit;
    const remaining = Math.max(0, limit - entry.count);
    return { allowed, count: entry.count, resetTime: entry.resetTime, remaining };
  }

  private increment(key: string, window: number): void {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || entry.resetTime < now) {
      this.limits.set(key, { count: 1, resetTime: now + window });
    } else {
      entry.count++;
      this.limits.set(key, entry);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime < now && (!entry.blockedUntil || entry.blockedUntil < now)) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}
