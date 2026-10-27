import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import {
  ANALYTICS_ENABLED,
  COOKIE_SETTINGS_EVENT,
  initAnalytics,
  initClickTracking,
  readChoice,
  setConsent,
  type ConsentChoice,
} from '../lib/analytics';
import './CookieConsent.css';

/* Banner de acord pentru măsurare (GA4). Regulile stau în src/lib/analytics.ts.
   - Nu există fără VITE_GA_ID (constantă de build, la fel pe server și în browser);
   - apare la hidratare (nu în HTML-ul pregenerat), `position: fixed`, doar opacitate (zero mutări
     de pagină, zero CLS). NU-l amâna cu timer/idle: întunecarea tardivă urcă Speed Index și
     scade scorul PageSpeed cu 2-3 puncte (măsurat 2026-10-27: amânat 93/94, la hidratare 95/95);
   - cât timp e deschis, un strat gri peste pagină blochează clickurile: vizitatorul alege
     „Refuz" sau „Accept" (cerut explicit de Vlad, 2026-10-27); după alegere totul revine normal;
   - „Accept" și „Refuz" au aceeași mărime și aceeași greutate;
   - se redeschide din linkul „Setări cookie" din footer (eveniment COOKIE_SETTINGS_EVENT).. */

const CookieConsent = () => {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  /* pe paginile legale stratul gri nu blochează: omul trebuie să poată citi politica înainte să aleagă */
  const onLegalPage = /^\/(?:(?:ru|en)\/)?(?:privacy|terms)\/?$/.test(pathname);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    initAnalytics();
    const stopClicks = initClickTracking();
    if (readChoice() === null) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => {
      stopClicks();
      window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
    };
  }, []);

  /* Strat blocant: focusul intră în banner și Tab rămâne între elementele lui. */
  useEffect(() => {
    if (!open) return;
    const box = boxRef.current;
    box?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>('a[href], button'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === box)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      else if (!box.contains(active)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);

  if (!ANALYTICS_ENABLED || !open) return null;

  const choose = (choice: ConsentChoice) => {
    setConsent(choice);
    setOpen(false);
  };

  return (
    <div className={`cookie-overlay${onLegalPage ? ' cookie-overlay--legal' : ''}`}>
    <div className="cookie-banner" role="dialog" aria-modal="true" aria-label={t.cookies.aria} tabIndex={-1} ref={boxRef}>
      <p className="cookie-banner__text">
        {t.cookies.text}{' '}
        <Link to={withLang('/privacy', language)} className="cookie-banner__link">
          {t.cookies.more}
        </Link>
      </p>
      <div className="cookie-banner__actions">
        <button type="button" className="cookie-btn cookie-btn--decline" onClick={() => choose('denied')}>
          {t.cookies.decline}
        </button>
        <button type="button" className="cookie-btn cookie-btn--accept" onClick={() => choose('granted')}>
          {t.cookies.accept}
        </button>
      </div>
    </div>
    </div>
  );
};

export default CookieConsent;
