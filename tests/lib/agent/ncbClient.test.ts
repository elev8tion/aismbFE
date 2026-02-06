import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  ncbRead,
  ncbReadOne,
  ncbCreate,
  ncbUpdate,
  ncbDelete,
  extractAuthCookies,
  getSessionUser,
} from '@/lib/agent/ncbClient';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('extractAuthCookies', () => {
  test('extracts session_token cookie', () => {
    const header = 'better-auth.session_token=abc123; other_cookie=xyz';
    expect(extractAuthCookies(header)).toBe('better-auth.session_token=abc123');
  });

  test('extracts session_data cookie', () => {
    const header = 'other=1; better-auth.session_data=data123';
    expect(extractAuthCookies(header)).toBe('better-auth.session_data=data123');
  });

  test('extracts both auth cookies', () => {
    const header = 'better-auth.session_token=abc; x=1; better-auth.session_data=def';
    expect(extractAuthCookies(header)).toBe(
      'better-auth.session_token=abc; better-auth.session_data=def'
    );
  });

  test('returns empty string for no auth cookies', () => {
    expect(extractAuthCookies('other_cookie=xyz')).toBe('');
  });

  test('returns empty string for empty input', () => {
    expect(extractAuthCookies('')).toBe('');
  });
});

describe('getSessionUser', () => {
  test('returns null when no auth cookies', async () => {
    const result = await getSessionUser('');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('returns user on successful session check', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user }),
    });

    const result = await getSessionUser('better-auth.session_token=abc');
    expect(result).toEqual(user);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('get-session'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: 'better-auth.session_token=abc',
        }),
      })
    );
  });

  test('returns null on failed session check', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const result = await getSessionUser('better-auth.session_token=abc');
    expect(result).toBeNull();
  });

  test('returns null when response has no user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    const result = await getSessionUser('better-auth.session_token=abc');
    expect(result).toBeNull();
  });
});

describe('ncbRead', () => {
  test('fetches from correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [{ id: 1 }] }),
    });

    const result = await ncbRead('leads', 'cookies');
    expect(result.data).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('read/leads'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  test('includes instance in URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await ncbRead('leads', 'cookies');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('instance=36905_ai_smb_crm');
  });

  test('passes filters as query params', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    await ncbRead('leads', 'cookies', { status: 'new' });
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=new');
  });

  test('throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Error'),
    });

    await expect(ncbRead('leads', 'cookies')).rejects.toThrow('NCB GET read/leads failed (500)');
  });
});

describe('ncbReadOne', () => {
  test('fetches single record', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1, name: 'Test' } }),
    });

    const result = await ncbReadOne('leads', '1', 'cookies');
    expect(result.data).toEqual({ id: 1, name: 'Test' });
  });
});

describe('ncbCreate', () => {
  test('sends POST with user_id injected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    await ncbCreate('leads', { first_name: 'John' }, 'user-1', 'cookies');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.user_id).toBe('user-1');
    expect(body.first_name).toBe('John');
  });
});

describe('ncbUpdate', () => {
  test('sends PUT and strips user_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    await ncbUpdate('leads', '1', { status: 'qualified', user_id: 'attacker' }, 'cookies');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.status).toBe('qualified');
    expect(body.user_id).toBeUndefined();
  });
});

describe('ncbDelete', () => {
  test('sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await ncbDelete('leads', '1', 'cookies');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});
