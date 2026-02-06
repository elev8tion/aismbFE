import { describe, test, expect } from 'vitest';
import { navigate } from '@/lib/agent/tools/navigation';

describe('navigate', () => {
  test.each([
    ['dashboard', '/dashboard'],
    ['leads', '/leads'],
    ['contacts', '/contacts'],
    ['companies', '/companies'],
    ['pipeline', '/pipeline'],
    ['bookings', '/bookings'],
    ['bookings_availability', '/bookings/availability'],
    ['partnerships', '/partnerships'],
    ['voice_sessions', '/voice-sessions'],
    ['roi_calculations', '/roi-calculations'],
    ['reports_weekly', '/reports/weekly'],
    ['settings', '/settings'],
  ])('navigates to %s → %s', async (target, expectedRoute) => {
    const result = await navigate({ target: target as any }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.route).toBe(expectedRoute);
    expect(result.client_action).toEqual({
      type: 'navigate',
      route: expectedRoute,
      target,
    });
  });

  test('returns error for invalid target', async () => {
    const result = await navigate({ target: 'nonexistent' as any }, 'cookies');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Invalid navigation target');
  });

  test('handles undefined target', async () => {
    const result = await navigate({ target: undefined as any }, 'cookies');
    expect(result.ok).toBe(false);
  });

  test('is case-insensitive', async () => {
    const result = await navigate({ target: 'DASHBOARD' as any }, 'cookies');
    expect(result.ok).toBe(true);
    expect(result.route).toBe('/dashboard');
  });
});
