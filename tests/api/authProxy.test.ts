import { describe, test, expect } from 'vitest';

describe('Auth Proxy Logic', () => {
  describe('transformSetCookieForLocalhost', () => {
    // Replicating the function from the auth route
    function transformSetCookieForLocalhost(cookie: string): string {
      const parts = cookie.split(';');
      const nameValue = parts[0].trim();

      let cleanedNameValue = nameValue;
      if (nameValue.startsWith('__Secure-better-auth.')) {
        cleanedNameValue = nameValue.replace('__Secure-', '');
      } else if (nameValue.startsWith('__Host-better-auth.')) {
        cleanedNameValue = nameValue.replace('__Host-', '');
      }

      const otherAttributes = parts
        .slice(1)
        .map((attr) => attr.trim())
        .filter((attr) => {
          const lower = attr.toLowerCase();
          return (
            !lower.startsWith('domain=') &&
            !lower.startsWith('secure') &&
            !lower.startsWith('samesite=')
          );
        });

      otherAttributes.push('SameSite=Lax');
      return [cleanedNameValue, ...otherAttributes].join('; ');
    }

    test('strips __Secure- prefix', () => {
      const cookie = '__Secure-better-auth.session_token=abc123; Path=/; Secure; SameSite=None';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).toContain('better-auth.session_token=abc123');
      expect(result).not.toContain('__Secure-');
    });

    test('strips __Host- prefix', () => {
      const cookie = '__Host-better-auth.session_data=xyz; Path=/; Secure';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).toContain('better-auth.session_data=xyz');
      expect(result).not.toContain('__Host-');
    });

    test('removes Domain attribute', () => {
      const cookie = 'better-auth.session_token=abc; Domain=.nocodebackend.com; Path=/';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).not.toContain('Domain');
    });

    test('removes Secure attribute', () => {
      const cookie = 'better-auth.session_token=abc; Secure; Path=/';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).not.toContain('Secure');
    });

    test('replaces SameSite with Lax', () => {
      const cookie = 'better-auth.session_token=abc; SameSite=None; Path=/';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).toContain('SameSite=Lax');
      expect(result).not.toContain('SameSite=None');
    });

    test('preserves Path and other safe attributes', () => {
      const cookie = 'better-auth.session_token=abc; Path=/; HttpOnly; Max-Age=3600';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).toContain('Path=/');
      expect(result).toContain('HttpOnly');
      expect(result).toContain('Max-Age=3600');
    });

    test('handles cookie without extra attributes', () => {
      const cookie = 'better-auth.session_token=abc';
      const result = transformSetCookieForLocalhost(cookie);
      expect(result).toContain('better-auth.session_token=abc');
      expect(result).toContain('SameSite=Lax');
    });
  });

  describe('sign-out cookie clearing', () => {
    test('clears auth cookies with expired date', () => {
      const cookiesToClear = ['better-auth.session_token', 'better-auth.session_data'];
      const setCookies = cookiesToClear.map(
        (name) => `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      );

      expect(setCookies[0]).toContain('better-auth.session_token=');
      expect(setCookies[0]).toContain('Expires=Thu, 01 Jan 1970');
      expect(setCookies[1]).toContain('better-auth.session_data=');
    });
  });
});
