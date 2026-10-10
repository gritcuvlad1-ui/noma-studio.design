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

/* ═══════════════════════════════════════════════════════════════
   GRAF DE ENTITATE — Organization + Person, UN SINGUR loc de adevăr.

   Înainte: `index.html` avea un bloc JSON-LD static (ProfessionalService,
   cu `aggregateRating` FABRICAT — 5 stele/50 recenzii care nu există) pe
   TOATE rutele, iar Home.tsx avea propriul `Organization` (`@id: #organization`)
   ȘI Contact.tsx avea un `LocalBusiness` SEPARAT (`@id: #business`) — două
   entități diferite, neconectate, pentru ACEEAȘI firmă. Pentru Google/AI
   asta citește ca „două businessuri", nu unul singur cu date complete.

   Acum: un singur `@id` (`#organization`), aceleași date (telefon, adresă,
   program, sameAs) pe FIECARE pagină indexabilă — nu doar pe Home. Motiv:
   verificat (Faza 1) — crawlerele AI pot ajunge direct pe /servicii sau
   /contact, fără să treacă vreodată prin /, deci fiecare pagină trebuie să
   fie autosuficientă, nu doar să refere alt document prin @id. */
export const ORG_ID = `${SITE_URL}/#organization`;
export const FOUNDER_ID = `${SITE_URL}/#founder-nicu`;
export const FOUNDER_MIHAELA_ID = `${SITE_URL}/#founder-mihaela`;

const FOUNDER_JOB_TITLE: Record<Language, string> = {
  ro: 'Fondator NOMA · Designer de interior',
  ru: 'Основатель NOMA · Дизайнер интерьера',
  en: 'NOMA Founder · Interior Designer',
};

// Co-fondatoare (confirmat 2026-09-30) — pe /curs apare explicit „Mihaela și
// Nicolae" ca fondatori împreună; conturile din `sameAs` de mai jos (Facebook,
// TikTok) sunt ale ei. Fără schema asta, Organization-ul cita conturile ei
// oficiale dar entitatea Person legată prin `founder` era doar Nicu.
const FOUNDER_MIHAELA_JOB_TITLE: Record<Language, string> = {
  ro: 'Co-fondatoare NOMA',
  ru: 'Соучредительница NOMA',
  en: 'NOMA Co-Founder',
};

// aceeași propoziție deja aprobată, folosită ca og:description pe homepage
// (t.seo.homeOgDescription) — nu text nou, doar reutilizat aici ca să
// Organization-ul aibă o descriere în limba corectă pe fiecare pagină.
const ORG_DESCRIPTION: Record<Language, string> = {
  ro: 'Transformăm spațiile în experiențe unice prin design interior și exterior de lux.',
  ru: 'Превращаем пространства в уникальный опыт через дизайн интерьера и экстерьера класса люкс.',
  en: 'We transform spaces into unique experiences through luxury interior and exterior design.',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function organizationSchema(language: Language): Record<string, any> {
  return {
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ORG_ID,
    name: 'NOMA Studio',
    url: SITE_URL,
    description: ORG_DESCRIPTION[language] ?? ORG_DESCRIPTION.ro,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png` },
    image: `${SITE_URL}/og-image.jpg`,
    telephone: '+37362167165',
    priceRange: '€€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Strada Designului 24',
      addressLocality: 'Chișinău',
      addressRegion: 'Chișinău',
      addressCountry: 'MD',
    },
    geo: { '@type': 'GeoCoordinates', latitude: '47.0105', longitude: '28.8638' },
    areaServed: [
      { '@type': 'City', name: 'Chișinău' },
      { '@type': 'City', name: 'Bălți' },
      { '@type': 'City', name: 'Ialoveni' },
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    // confirmate explicit cu clientul — Facebook/TikTok sunt ale
    // proprietarei, folosite ca prezență oficială NOMA (nu conturi terțe).
    // Google Business Profile lipsește INTENȚIONAT: sediul e nou, oficiul
    // nu e deschis oficial încă, profilul nu există — se adaugă când apare.
    sameAs: [
      'https://www.instagram.com/noma.studio.design/',
      'https://www.facebook.com/mihaela.borta.2025',
      'https://www.tiktok.com/@mihaelaborta10',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+37362167165',
      availableLanguage: ['Romanian', 'Russian', 'English'],
    },
    founder: [{ '@id': FOUNDER_ID }, { '@id': FOUNDER_MIHAELA_ID }],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function founderSchema(language: Language): Record<string, any> {
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: 'Nicu',
    jobTitle: FOUNDER_JOB_TITLE[language] ?? FOUNDER_JOB_TITLE.ro,
    image: `${SITE_URL}/cursuri/nicu-avatar.jpg`,
    worksFor: { '@id': ORG_ID },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function founderMihaelaSchema(language: Language): Record<string, any> {
  return {
    '@type': 'Person',
    '@id': FOUNDER_MIHAELA_ID,
    name: 'Mihaela',
    jobTitle: FOUNDER_MIHAELA_JOB_TITLE[language] ?? FOUNDER_MIHAELA_JOB_TITLE.ro,
    image: `${SITE_URL}/cursuri/mihaela-avatar.jpg`,
    worksFor: { '@id': ORG_ID },
    sameAs: [
      'https://www.facebook.com/mihaela.borta.2025',
      'https://www.tiktok.com/@mihaelaborta10',
    ],
  };
}

/* BreadcrumbList — aceeași formă pe toate paginile interioare (Home > ...).
   `trail` = pașii DUPĂ Home, în ordine (ex. [{name:'Servicii', path:'/servicii'}]). */
export function breadcrumbSchema(
  language: Language,
  homeLabel: string,
  trail: Array<{ name: string; path: string }>
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: canonicalUrl('/', language) },
      ...trail.map((step, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: step.name,
        item: canonicalUrl(step.path, language),
      })),
    ],
  };
}

/* og:locale pe limbă (format Open Graph: limbă_TERITORIU). Folosit de <SiteMeta/>. */
export const OG_LOCALE: Record<string, string> = { ro: 'ro_MD', ru: 'ru_RU', en: 'en_US' };
