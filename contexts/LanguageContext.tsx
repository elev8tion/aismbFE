'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type Translations } from '@/lib/i18n/translations';
import { detectLanguage, setLanguage as saveLanguage, type Language } from '@/lib/i18n/language';

interface LanguageContextType {
  t: Translations;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [t, setT] = useState<Translations>(translations.en);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const detectedLang = detectLanguage();
    setLanguageState(detectedLang);
    setT(translations[detectedLang]);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setT(translations[language]);
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    saveLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a LanguageProvider');
  }
  return context;
}
