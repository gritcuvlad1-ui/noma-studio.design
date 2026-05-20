import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language, Translations } from './types';
import { ro } from './ro';
import { ru } from './ru';
import { en } from './en';

const translations: Record<Language, Translations> = { ro, ru, en };

const SUPPORTED: Language[] = ['ro', 'ru', 'en'];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ((key: string) => string) & Translations;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'noma-lang';

function detectBrowserLanguage(): Language {
  try {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of langs) {
      const code = tag.toLowerCase().split('-')[0];
      if (code === 'ro' || code === 'mo') return 'ro';
      if (code === 'ru' || code === 'uk' || code === 'be') return 'ru';
      if (code === 'en') return 'en';
    }
  } catch {
    // navigator or languages may be missing in old environments
  }
  return 'ro';
}

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored as Language)) return stored as Language;
  } catch {
    // localStorage might be blocked by browser settings
  }
  return detectBrowserLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage might be full or blocked
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /** Resolves nested keys like 'contact.pageTitle' from translation objects */
  const t = useCallback(((key: string): string => {
    const parts = key.split('.');
    let current: unknown = translations[language];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return key; // Fallback to key string if path is invalid
      }
    }

    return typeof current === 'string' ? current : key;
  }) as ((key: string) => string) & Translations, [language]);

  // Merge the object properties into the function
  Object.assign(t, translations[language]);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
