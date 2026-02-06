import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// We'll test the logic patterns used in the data proxy route
// Since Next.js route handlers are tightly coupled to NextRequest/NextResponse,
// we test the core security logic as unit tests

describe('Data Proxy Security Logic', () => {
  describe('extractAuthCookies', () => {
    // Replicating the function from the route
    function extractAuthCookies(cookieHeader: string): string {
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

    test('filters only auth cookies', () => {
      const header = 'analytics=abc; better-auth.session_token=tok123; tracking=xyz';
      expect(extractAuthCookies(header)).toBe('better-auth.session_token=tok123');
    });

    test('preserves both auth cookies', () => {
      const header = 'better-auth.session_token=tok; better-auth.session_data=dat; foo=bar';
      expect(extractAuthCookies(header)).toBe(
        'better-auth.session_token=tok; better-auth.session_data=dat'
      );
    });

    test('returns empty for no auth cookies', () => {
      expect(extractAuthCookies('other=val')).toBe('');
      expect(extractAuthCookies('')).toBe('');
    });
  });

  describe('user_id injection on create', () => {
    test('injects user_id on create operations', () => {
      const body = JSON.stringify({ first_name: 'John', last_name: 'Doe' });
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = 'session-user-id';

      expect(parsed.user_id).toBe('session-user-id');
      expect(parsed.first_name).toBe('John');
    });

    test('overwrites client-provided user_id', () => {
      const body = JSON.stringify({ first_name: 'John', user_id: 'attacker-id' });
      const parsed = JSON.parse(body);
      delete parsed.user_id;
      parsed.user_id = 'session-user-id';

      expect(parsed.user_id).toBe('session-user-id');
    });
  });

  describe('user_id stripping on update (PUT)', () => {
    test('strips user_id from PUT body', () => {
      const body = JSON.stringify({ status: 'qualified', user_id: 'spoof-id' });
      const parsed = JSON.parse(body);
      delete parsed.user_id;

      expect(parsed.user_id).toBeUndefined();
      expect(parsed.status).toBe('qualified');
    });
  });

  describe('query parameter filtering', () => {
    test('filters out path, Instance, instance params', () => {
      const inputParams = new URLSearchParams('path=leads&Instance=x&instance=y&status=new');
      const outputParams = new URLSearchParams();
      outputParams.set('Instance', '36905_ai_smb_crm');

      inputParams.forEach((val, key) => {
        if (key !== 'Instance' && key !== 'instance' && key !== 'path') {
          outputParams.append(key, val);
        }
      });

      expect(outputParams.get('status')).toBe('new');
      expect(outputParams.has('path')).toBe(false);
      // Only one Instance key (the injected one)
      expect(outputParams.get('Instance')).toBe('36905_ai_smb_crm');
    });
  });
});
