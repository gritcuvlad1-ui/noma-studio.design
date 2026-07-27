import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/types';
import { Magnetic } from './Magnetic';
import { IconChevronDown, IconClose } from './PremiumIcons';
import './Navbar.css';
import './HomeContactForm.css';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ro', label: 'Română' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const langRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  const ticking = useRef(false);
  const lastY = useRef(0);
  useEffect(() => {
    // hide-on-scroll DOAR pe telefon: după puțin scroll în jos pastila dispare
    // elegant; la scroll în sus (sau aproape de top) reapare
    const isMobile = window.matchMedia('(max-width: 992px)').matches;
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled(y > 50);
          if (isMobile) {
            const delta = y - lastY.current;
            if (y > 140 && delta > 4) setIsHidden(true);
            else if (delta < -4 || y <= 80) setIsHidden(false);
            lastY.current = y;
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Add 'nav-closing' class for coordinated CSS navbar fade-in
  const closeMenu = useCallback(() => {
    document.documentElement.classList.add('nav-closing');
    // Fast coordinated reveal
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('nav-closing');
    }, 300);
    setIsMobileMenuOpen(false);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) closeMenu();
    else setIsMobileMenuOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isMobileMenuOpen) {
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.touchAction = 'none';
      body.setAttribute('data-menu-open', 'true');
    } else {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.touchAction = '';
      body.removeAttribute('data-menu-open');
    }

    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.touchAction = '';
      body.removeAttribute('data-menu-open');
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMenu();
        burgerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen, closeMenu]);

  /* iOS Safari: FĂRĂ meta theme-color, INTENȚIONAT (scos din index.html) —
     Safari eșantionează singur pagina. Ambele bare (sus/jos) au benzi solide
     cafeniu închis #1c1410 (nuanța meniului hamburger, cerut explicit) pictate
     în pagină → elementele nu se văd prin ele. html bg identic = overscroll
     continuu. */
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#1c1410';
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const handleLangSelect = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      setLangOpen(false);
    },
    [setLanguage],
  );

  const toggleMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      if (prev) {
        // Closing: fast coordinated reveal
        document.documentElement.classList.add('nav-closing');
        setTimeout(() => {
          document.documentElement.classList.remove('nav-closing');
        }, 300);
      }
      return !prev;
    });
  }, []);

  const navLinks = [
    { to: '/', label: t.nav.home, i: 1 },
    { to: '/despre', label: t.nav.about, i: 2 },
    { to: '/servicii', label: t.nav.services, i: 3 },
    { to: '/portofoliu', label: t.nav.portfolio, i: 4 },
    { to: '/cursuri', label: t.nav.courses, i: 5 },
    { to: '/contact', label: t.nav.contact, i: 6 },
  ];

  return (
    <>
      <header
        className={[
          'noma-header',
          isScrolled ? 'scrolled' : '',
          isMobileMenuOpen ? 'nav-open' : '',
          isHidden && !isMobileMenuOpen ? 'nav-hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <nav className="noma-nav-shell" aria-label="Navigare principală">
          <div className="nav-container">
            <div className="nav-brand">
              <Link
                to="/"
                onClick={e => {
                  if (window.location.pathname === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <span className="brand-name">NOMA</span>
              </Link>
            </div>

            <div className="nav-center-right">
              <ul className="nav-links-desktop">
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to}>{label}</Link>
                  </li>
                ))}
              </ul>

              <div className="lang-switcher" ref={langRef}>
                <button
                  className="lang-toggle"
                  type="button"
                  onClick={() => setLangOpen(prev => !prev)}
                  aria-label="Select language"
                  aria-expanded={langOpen}
                >
                  <span className="lang-code">{language.toUpperCase()}</span>
                  <IconChevronDown
                    className={`lang-chevron ${langOpen ? 'open' : ''}`}
                    size={12}
                    strokeWidth={2.2}
                  />
                </button>

                {langOpen && (
                  <div className="lang-dropdown" role="listbox">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        className={`lang-option ${language === l.code ? 'active' : ''}`}
                        type="button"
                        role="option"
                        aria-selected={language === l.code}
                        onClick={() => handleLangSelect(l.code)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              ref={burgerRef}
              className="burger-btn"
              type="button"
              aria-label={isMobileMenuOpen ? 'Închide meniu' : 'Deschide meniu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-overlay"
              onClick={toggleMenu}
            >
              <span className="burger-line" aria-hidden="true" />
              <span className="burger-line" aria-hidden="true" />
              <span className="burger-line" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-nav-overlay"
        ref={overlayRef}
        className={`nav-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        aria-hidden={!isMobileMenuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Meniu mobile"
      >
        <div
          className="nav-overlay-inner"
          style={{ contain: 'layout style' }}
        >
          <button
            className="overlay-close"
            type="button"
            onClick={closeMenu}
            aria-label="Închide meniu"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          >
            <IconClose size={24} strokeWidth={1.6} />
          </button>
          <header className="overlay-header" aria-hidden="true">
            <span className="overlay-brand">{t.overlay.brandSubtitle}</span>
            <span className="overlay-location">{t.overlay.location}</span>
          </header>

          <nav className="overlay-nav" aria-label="Meniu principal">
            <div className="nav-separator" aria-hidden="true" />
            {navLinks.map(({ to, label, i }) => (
              <Link
                key={to}
                to={to}
                className="nav-link"
                style={{ '--i': i } as React.CSSProperties}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                <span className="nav-link-inner">{label}</span>
              </Link>
            ))}
            <div className="nav-separator" aria-hidden="true" />
          </nav>

          <div className="overlay-cta">
            <p>{t.overlay.ctaText}</p>
            <Magnetic strength={0.2}>
              <Link
                to="/contact"
                className="btn-submit-modern"
                style={{ display: 'inline-flex' }}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {t.overlay.ctaButton}
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;