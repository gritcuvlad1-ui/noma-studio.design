import { useState } from 'react';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import './Footer.css';

const Footer = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  return (
    <footer className="site-footer">
      {/* Linie delimitatoare premium NOMA — fix unde se termină stofa */}
      <div className="footer-top-divider" aria-hidden="true" />

      <div className="footer-inner">

        <div className="footer-contact">
          <h2 className="footer-contact-title">{t.footer.contactTitle}</h2>
          <p className="footer-contact-desc">
            {t.footer.contactDesc} {' '}
            <a href={withLang('/contact', language)} className="footer-cta-link">
              {t.footer.contactDescLink1}
            </a>
          </p>

          <div className="contact-items">
            <a href="tel:+37362167165" className="contact-item">
              <div className="contact-icon">
                <i className="fa-solid fa-phone" aria-hidden="true"></i>
              </div>
              <span className="contact-value">+373 62 167 165</span>
            </a>

            <a href="mailto:hello@noma.studio" className="contact-item">
              <div className="contact-icon">
                <i className="fa-solid fa-envelope" aria-hidden="true"></i>
              </div>
              <span className="contact-value">hello@noma.studio</span>
            </a>

            <a
              href="https://maps.google.com/?q=Chisinau,Moldova"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-item"
            >
              <div className="contact-icon">
                <i className="fa-solid fa-map-marker-alt" aria-hidden="true"></i>
              </div>
              <span className="contact-value">{t.overlay.location}</span>
            </a>
          </div>
        </div>

        <div className="footer-links-grid">

          <section
            className={`footer-section ${openSection === 'company' ? 'is-open' : ''}`}
          >
            <button
              className="footer-toggle"
              onClick={() => toggleSection('company')}
              aria-expanded={openSection === 'company'}
              aria-controls="footer-company"
              type="button"
            >
              <span>{t.footer.company}</span>
              <span className="footer-toggle-icon" aria-hidden="true">&#9662;</span>
            </button>
            <ul id="footer-company" className="footer-links">
              <li><a href={withLang('/', language)}>{t.footer.home}</a></li>
              <li><a href={withLang('/servicii', language)}>{t.footer.services}</a></li>
              <li><a href={withLang('/portofoliu', language)}>{t.footer.projects}</a></li>
              <li><a href={withLang('/contact', language)}>{t.footer.contact}</a></li>
              <li><a href="/privacy">{t.footer.privacy}</a></li>
              <li><a href="/terms">{t.footer.terms}</a></li>
            </ul>
          </section>

          <section
            className={`footer-section ${openSection === 'resources' ? 'is-open' : ''}`}
          >
            <button
              className="footer-toggle"
              onClick={() => toggleSection('resources')}
              aria-expanded={openSection === 'resources'}
              aria-controls="footer-resources"
              type="button"
            >
              <span>{t.footer.resources}</span>
              <span className="footer-toggle-icon" aria-hidden="true">&#9662;</span>
            </button>
            <ul id="footer-resources" className="footer-links">
              <li><a href={withLang('/blog', language)}>{t.footer.blogDesign}</a></li>
              <li><a href={withLang('/cursuri', language)}>{t.footer.designCourses}</a></li>
              <li><a href={withLang('/portofoliu', language)}>{t.footer.fullDesign}</a></li>
              <li><a href={withLang('/servicii', language)}>{t.footer.renders3d}</a></li>
              <li><a href={withLang('/contact', language)}>{t.footer.consultancy}</a></li>
            </ul>
          </section>

        </div>

        <div className="footer-social">
          <a href="https://www.instagram.com/noma.studio.design/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <i className="fa-brands fa-instagram" aria-hidden="true"></i>
          </a>
          <a href="https://www.facebook.com/mihaela.borta.2025" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <i className="fa-brands fa-facebook-f" aria-hidden="true"></i>
          </a>
          <a href="https://www.tiktok.com/@mihaelaborta10" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <i className="fa-brands fa-tiktok" aria-hidden="true"></i>
          </a>
        </div>

        <p className="footer-copy">&copy; 2026 NOMA Studio Design</p>
      </div>
    </footer>
  );
};

export default Footer;