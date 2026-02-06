import { describe, test, expect, vi, beforeEach } from 'vitest';
import { detectLanguage, setLanguage, getLanguageLabel } from '@/lib/i18n/language';

describe('detectLanguage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns stored language from localStorage', () => {
    localStorage.setItem('preferred-language', 'es');
    expect(detectLanguage()).toBe('es');
  });

  test('returns "en" for stored English preference', () => {
    localStorage.setItem('preferred-language', 'en');
    expect(detectLanguage()).toBe('en');
  });

  test('ignores unsupported stored language', () => {
    localStorage.setItem('preferred-language', 'fr');
    // Falls through to browser language detection
    expect(['en', 'es']).toContain(detectLanguage());
  });

  test('falls back to browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-MX');
    expect(detectLanguage()).toBe('es');
    vi.restoreAllMocks();
  });

  test('defaults to "en" for unsupported browser language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    expect(detectLanguage()).toBe('en');
    vi.restoreAllMocks();
  });
});

describe('setLanguage', () => {
  test('saves language to localStorage', () => {
    setLanguage('es');
    expect(localStorage.getItem('preferred-language')).toBe('es');
  });

  test('overwrites existing language', () => {
    setLanguage('es');
    setLanguage('en');
    expect(localStorage.getItem('preferred-language')).toBe('en');
  });
});

describe('getLanguageLabel', () => {
  test('returns "English" for en', () => {
    expect(getLanguageLabel('en')).toBe('English');
  });

  test('returns "Español" for es', () => {
    expect(getLanguageLabel('es')).toBe('Español');
  });
});
