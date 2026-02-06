import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('AuthContext', () => {
  test('useAuth throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  test('starts in loading state and refreshes session on mount', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test User' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(user);
  });

  test('sets user to null when session refresh fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  test('signIn calls auth API and refreshes session', async () => {
    // Initial refresh - no user
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // signIn call
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    // refreshSession after signIn
    const user = { id: '1', email: 'test@test.com', name: 'Test' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user }) });

    await act(async () => {
      await result.current.signIn('test@test.com', 'password');
    });

    expect(result.current.user).toEqual(user);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/sign-in/email', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'password' }),
    }));
  });

  test('signIn throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false }); // initial refresh

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    });

    await expect(
      act(async () => {
        await result.current.signIn('bad@test.com', 'wrong');
      })
    ).rejects.toThrow('Invalid credentials');
  });

  test('signUp calls auth API and refreshes session', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false }); // initial refresh

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // signUp call
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    // refreshSession after signUp
    const user = { id: '2', email: 'new@test.com', name: 'New User' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user }) });

    await act(async () => {
      await result.current.signUp('new@test.com', 'password123', 'New User');
    });

    expect(result.current.user).toEqual(user);
  });

  test('signOut clears user', async () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user }) });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));

    mockFetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });
});
