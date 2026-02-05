const LANGUAGE_KEY = 'preferred-language';
const SUPPORTED_LANGUAGES = ['en', 'es'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const detectLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as Language)) {
    return stored as Language;
  }

  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return 'en';
};

export const setLanguage = (lang: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lang);
  }
};

export const getLanguageLabel = (lang: Language): string => {
  return {
    en: 'English',
    es: 'Español',
  }[lang];
};
