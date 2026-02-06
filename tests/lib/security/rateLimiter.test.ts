import { describe, test, expect, beforeEach, vi } from 'vitest';

// Re-import fresh module for each test
let RateLimiterModule: typeof import('@/lib/security/rateLimiter');

beforeEach(async () => {
  vi.resetModules();
  RateLimiterModule = await import('@/lib/security/rateLimiter');
});

describe('rateLimiter', () => {
  test('allows first request', () => {
    const result = RateLimiterModule.rateLimiter.check('user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test('allows multiple requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = RateLimiterModule.rateLimiter.check('user-2');
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks after exceeding minute limit (30 requests)', () => {
    for (let i = 0; i < 30; i++) {
      RateLimiterModule.rateLimiter.check('user-3');
    }
    const result = RateLimiterModule.rateLimiter.check('user-3');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Rate limit exceeded');
  });

  test('tracks different identifiers separately', () => {
    for (let i = 0; i < 30; i++) {
      RateLimiterModule.rateLimiter.check('user-4');
    }
    // user-4 is blocked
    expect(RateLimiterModule.rateLimiter.check('user-4').allowed).toBe(false);
    // user-5 is unaffected
    expect(RateLimiterModule.rateLimiter.check('user-5').allowed).toBe(true);
  });

  test('remaining count decreases', () => {
    const first = RateLimiterModule.rateLimiter.check('user-6');
    const second = RateLimiterModule.rateLimiter.check('user-6');
    expect(second.remaining).toBeLessThan(first.remaining);
  });
});

describe('getClientIP', () => {
  test('extracts IP from x-forwarded-for header', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(RateLimiterModule.getClientIP(request)).toBe('1.2.3.4');
  });

  test('uses x-real-ip as fallback', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(RateLimiterModule.getClientIP(request)).toBe('9.8.7.6');
  });

  test('returns "unknown" when no IP headers', () => {
    const request = new Request('https://example.com');
    expect(RateLimiterModule.getClientIP(request)).toBe('unknown');
  });

  test('prefers x-forwarded-for over x-real-ip', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(RateLimiterModule.getClientIP(request)).toBe('1.1.1.1');
  });
});
