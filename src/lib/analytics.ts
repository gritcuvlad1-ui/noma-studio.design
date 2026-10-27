/* Măsurare GA4, încărcată DOAR după acordul vizitatorului.

   Reguli (decise împreună cu Vlad, 2026-10-26):
   - fără VITE_GA_ID valid (ex. G-ABC123XYZ0) nu face nimic: nu se încarcă script, nu apare banner;
   - înainte de acord NU se cere nicio resursă de la Google (nici gtag.js, nici ping fără
     cookie-uri); script-ul vine abia după „Accept", la o pauză a browserului (idle);
   - Consent Mode v2: toate patru semnalele pornesc `denied`; doar `analytics_storage` devine
     `granted`. Reclamele (ad_*) rămân refuzate până decidem separat;
   - evenimente: form_submitted, phone_click, whatsapp_click, instagram_click, messenger_click.
     ZERO date personale în parametri (fără nume, email, telefon, mesaj).
   NU adăuga scriptul în index.html și nu-l pune în <head>: ar bloca randarea și ar trimite
   date fără acord. */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const RAW_ID = (import.meta.env.VITE_GA_ID as string | undefined)?.trim() ?? '';
const GA_ID = /^G-[A-Z0-9]{6,}$/.test(RAW_ID) ? RAW_ID : '';

/** Constantă de build: la fel pe server (SSG) și în browser, deci nu produce eroare de hidratare. */
export const ANALYTICS_ENABLED = GA_ID !== '';

/** Eveniment pe `window`: footerul îl trimite, bannerul se redeschide. */
export const COOKIE_SETTINGS_EVENT = 'noma-cookie-settings';

const STORAGE_KEY = 'noma-analytics-consent';
export type ConsentChoice = 'granted' | 'denied';

export function readChoice(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

function writeChoice(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* modul privat / stocare blocată: alegerea ține doar până la închiderea paginii */
  }
}

let loaded = false;
let granted = false;

function gtagPush(..._args: unknown[]) {
  // GA4 cere obiectul `arguments`, nu un array
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer = window.dataLayer ?? []).push(arguments);
}

/** Pune scriptul gtag.js pe pagină (o singură dată), cu consimțământul deja acordat. */
function loadGtag() {
  if (loaded || !ANALYTICS_ENABLED) return;
  loaded = true;
  window.gtag = gtagPush;
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('config', GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

/** Șterge cookie-urile GA (_ga, _ga_XXXX) la retragerea acordului. */
function clearGaCookies() {
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = [host, ...(parts.length > 2 ? [parts.slice(-2).join('.')] : []), `.${parts.slice(-2).join('.')}`];
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name !== '_ga' && !name.startsWith('_ga_')) return;
    document.cookie = `${name}=; Max-Age=0; path=/`;
    domains.forEach((d) => {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${d}`;
    });
  });
}

/** Rulează `fn` după încărcarea paginii, când browserul e liber. Nu atinge primul desen. */
export function whenIdle(fn: () => void, delay = 1200) {
  const run = () => {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => fn(), { timeout: 3000 });
      else fn();
    }, delay);
  };
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
}

/** Apelat la montarea aplicației: vizitatorul care a acceptat deja primește măsurarea. */
export function initAnalytics() {
  if (!ANALYTICS_ENABLED) return;
  if (readChoice() === 'granted') {
    granted = true;
    whenIdle(loadGtag);
  }
}

export function setConsent(choice: ConsentChoice) {
  if (!ANALYTICS_ENABLED) return;
  writeChoice(choice);
  if (choice === 'granted') {
    granted = true;
    if (loaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'granted' });
    else whenIdle(loadGtag, 0);
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = false;
  } else {
    granted = false;
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_ID}`] = true;
    if (loaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    clearGaCookies();
  }
}

/** Trimite un eveniment doar dacă există acord și scriptul e activ. Altfel nu face nimic. */
export function track(name: string, params: Record<string, string> = {}) {
  if (!granted || !loaded || !window.gtag) return;
  window.gtag('event', name, params);
}

/* Evită dublarea aceluiași eveniment (dublu-click, re-randare): același nume în 3 s. */
const lastFired = new Map<string, number>();
export function trackOnce(name: string, params: Record<string, string> = {}, windowMs = 3000) {
  const now = Date.now();
  if (now - (lastFired.get(name) ?? 0) < windowMs) return;
  lastFired.set(name, now);
  track(name, params);
}

function linkLocation(el: Element): string {
  if (el.closest('.noma-contact-widget')) return 'widget';
  if (el.closest('footer')) return 'footer';
  if (el.closest('nav, header')) return 'navbar';
  return 'page';
}

/** Un singur ascultător pe document (fază de captură): tel:, WhatsApp, Instagram, Viber, Telegram. */
export function initClickTracking() {
  if (!ANALYTICS_ENABLED) return () => {};
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a) return;
    const href = a.getAttribute('href') ?? '';
    const where = { link_location: linkLocation(a) };
    if (href.startsWith('tel:')) return trackOnce('phone_click', where, 1000);
    if (href.startsWith('viber:')) return trackOnce('messenger_click', { ...where, method: 'viber' }, 1000);
    let host = '';
    try {
      host = new URL(href, window.location.href).hostname.replace(/^www\./, '');
    } catch {
      return;
    }
    if (host === 'wa.me' || host === 'api.whatsapp.com') return trackOnce('whatsapp_click', where, 1000);
    if (host === 't.me') return trackOnce('messenger_click', { ...where, method: 'telegram' }, 1000);
    if (host === 'instagram.com') return trackOnce('instagram_click', where, 1000);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
