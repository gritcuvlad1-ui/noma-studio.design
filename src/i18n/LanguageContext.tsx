import { createContext, useContext, useCallback, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Language, Translations } from './types';
import { ro } from './ro';
import { ru } from './ru';
import { en } from './en';

const translations: Record<Language, Translations> = { ro, ru, en };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: ((key: string) => string) & Translations;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'noma-lang';

/* Limba e determinată STRICT din URL (/ = ro, /ru/* = ru, /en/* = en) — nu
   mai există detectare din browser/localStorage care schimbă CONȚINUTUL
   randat. Motivul: Google trebuie să vadă mereu ACELAȘI conținut, în
   ACEEAȘI limbă, la aceeași adresă — dacă am lăsa limba să depindă de
   browser, un crawler și un vizitator ar putea vedea două lucruri diferite
   la același URL, iar hreflang-ul (care leagă /, /ru/, /en/ între ele)
   și-ar pierde sensul. localStorage rămâne DOAR ca să reținem ultima
   alegere pt. comoditate (folosit de switcher, nu schimbă randarea). */
export function getLangFromPath(pathname: string): Language {
  if (pathname === '/ru' || pathname.startsWith('/ru/')) return 'ru';
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  return 'ro';
}

/* Scoate prefixul de limbă dintr-un path, ca să obții echivalentul „gol"
   (ex. '/ru/portofoliu' -> '/portofoliu', '/en' -> '/'). Folosit de
   switcher-ul de limbă (Navbar) ca să navigheze la ACEEAȘI pagină, în
   altă limbă, nu mereu înapoi la homepage. */
export function stripLangPrefix(pathname: string): string {
  if (pathname === '/ru' || pathname === '/en') return '/';
  if (pathname.startsWith('/ru/')) return pathname.slice(3) || '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

/* Adaugă prefixul de limbă la un path „gol" (ex. withLang('/portofoliu','ru')
   -> '/ru/portofoliu'). Folosit pt. linkurile interne din Navbar, ca să
   rămână pe aceeași limbă când userul navighează pe site. */
export function withLang(path: string, lang: Language): string {
  if (lang === 'ro') return path;
  const clean = path === '/' ? '' : path;
  return `/${lang}${clean}`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const language = getLangFromPath(location.pathname);

  const setLanguage = useCallback((lang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage might be full or blocked
    }
    const bare = stripLangPrefix(location.pathname);
    navigate(withLang(bare, lang) + location.search, { replace: false });
  }, [location.pathname, location.search, navigate]);

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
