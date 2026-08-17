import type { Language } from '../i18n/types';

export const SITE_URL = 'https://noma.md';

/* Adresa canonică a unei pagini, pt. o limbă dată. `bareLangPath` e calea
   FĂRĂ prefix de limbă (ex. '/portofoliu', sau '/' pt. homepage) — aceeași
   valoare indiferent de limbă, ca să nu fie nevoie de 3 constante separate
   pe fiecare pagină. */
export function canonicalUrl(bareLangPath: string, language: Language): string {
  const clean = bareLangPath === '/' ? '' : bareLangPath;
  const prefix = language === 'ro' ? '' : `/${language}`;
  return `${SITE_URL}${prefix}${clean}`;
}

/* Cele 4 tag-uri <link rel="alternate" hreflang="..."> care leagă cele 3
   variante de limbă ale ACELEIAȘI pagini — obligatorii pe fiecare pagină
   indexabilă care are variante /ru și /en, altfel Google le poate trata ca
   pagini DUPLICATE (conținut similar, adrese diferite), nu ca traduceri.
   `x-default` = varianta arătată cui caută într-o limbă nesusținută (ro,
   fiindcă e piața principală). Returnează un array de elemente — se
   folosește direct ca `{hreflangLinks('/portofoliu')}` în interiorul unui
   <Helmet>, react-helmet-async citește orice copil, nu doar JSX scris literal. */
export function hreflangLinks(bareLangPath: string) {
  return [
    <link key="hl-ro" rel="alternate" hrefLang="ro" href={canonicalUrl(bareLangPath, 'ro')} />,
    <link key="hl-ru" rel="alternate" hrefLang="ru" href={canonicalUrl(bareLangPath, 'ru')} />,
    <link key="hl-en" rel="alternate" hrefLang="en" href={canonicalUrl(bareLangPath, 'en')} />,
    <link key="hl-x" rel="alternate" hrefLang="x-default" href={canonicalUrl(bareLangPath, 'ro')} />,
  ];
}
