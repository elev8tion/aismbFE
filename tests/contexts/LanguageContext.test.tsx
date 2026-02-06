import { describe, test, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, useTranslations } from '@/contexts/LanguageContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageContext', () => {
  test('useTranslations throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useTranslations());
    }).toThrow('useTranslations must be used within a LanguageProvider');
  });

  test('defaults to English translations', async () => {
    const { result } = renderHook(() => useTranslations(), { wrapper });

    await waitFor(() => {
      expect(result.current.language).toBe('en');
    });

    expect(result.current.t.nav.dashboard).toBeDefined();
    expect(typeof result.current.t.nav.dashboard).toBe('string');
  });

  test('changes language to Spanish', async () => {
    const { result } = renderHook(() => useTranslations(), { wrapper });

    await waitFor(() => {
      expect(result.current.language).toBe('en');
    });

    act(() => {
      result.current.setLanguage('es');
    });

    await waitFor(() => {
      expect(result.current.language).toBe('es');
    });

    // Spanish translations should be loaded
    expect(result.current.t.nav.dashboard).toBeDefined();
  });

  test('persists language preference', async () => {
    const { result } = renderHook(() => useTranslations(), { wrapper });

    await waitFor(() => {
      expect(result.current.language).toBe('en');
    });

    act(() => {
      result.current.setLanguage('es');
    });

    expect(localStorage.getItem('preferred-language')).toBe('es');
  });

  test('reads persisted language on mount', async () => {
    localStorage.setItem('preferred-language', 'es');

    const { result } = renderHook(() => useTranslations(), { wrapper });

    await waitFor(() => {
      expect(result.current.language).toBe('es');
    });
  });
});
