import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/types';
import './Navbar.css';
import './HomeContactForm.css';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ro', label: 'Română' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const langRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  const ticking = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
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
    // Must exceed overlay exit (0.58s) + navbar brand delay (0.35s) + duration (0.45s) = 0.8s total
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('nav-closing');
    }, 900);
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
        // Closing: trigger coordinated navbar reveal — 900ms matches full CSS sequence
        document.documentElement.classList.add('nav-closing');
        setTimeout(() => {
          document.documentElement.classList.remove('nav-closing');
        }, 900);
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
                  <svg
                    className={`lang-chevron ${langOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
            <Link
              to="/contact"
              className="btn-submit-modern"
              style={{ display: 'inline-flex', marginTop: '10px' }}
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              {t.overlay.ctaButton}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;