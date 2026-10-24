import { useLanguage, withLang } from '../i18n/LanguageContext';
import './Footer.css';
import FaIcon from './FaIcon';

const Footer = () => {
  const { t, language } = useLanguage();

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
                <FaIcon name="phone" />
              </div>
              <span className="contact-value">+373 62 167 165</span>
            </a>

            <a href="mailto:office@noma.md" className="contact-item">
              <div className="contact-icon">
                <FaIcon name="envelope" />
              </div>
              <span className="contact-value">office@noma.md</span>
            </a>

            <a
              href="https://maps.google.com/?q=%C8%98os.+H%C3%AEnce%C8%99ti+104,+Chi%C8%99in%C4%83u,+Moldova"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-item"
            >
              <div className="contact-icon">
                <FaIcon name="location-dot" />
              </div>
              {/* doar strada: orașul e deja în titlul și textul de deasupra ("Design Chisinau").
                  `t.overlay.location` (cu orașul) rămâne pt. meniul de pe telefon. */}
              <span className="contact-value">{t.contact.visitAddress.split('\n')[0]}</span>
            </a>
          </div>
        </div>

        <div className="footer-links-grid">

          {/* 2 coloane, mereu deschise, pe orice lățime (2026-10-14, cerut de Vlad:
              „în footer nu trebuie să avem acordionul pe mobil”). Titlurile sunt
              titluri simple, nu butoane: nu mai deschid/închid nimic. */}
          <section className="footer-section" aria-labelledby="footer-company-h">
            <h3 className="footer-heading" id="footer-company-h">{t.footer.company}</h3>
            <ul className="footer-links">
              <li><a href={withLang('/', language)}>{t.footer.home}</a></li>
              <li><a href={withLang('/servicii', language)}>{t.footer.services}</a></li>
              <li><a href={withLang('/portofoliu', language)}>{t.footer.projects}</a></li>
              <li><a href={withLang('/contact', language)}>{t.footer.contact}</a></li>
              <li><a href={withLang('/privacy', language)}>{t.footer.privacy}</a></li>
              <li><a href={withLang('/terms', language)}>{t.footer.terms}</a></li>
            </ul>
          </section>

          <section className="footer-section" aria-labelledby="footer-resources-h">
            <h3 className="footer-heading" id="footer-resources-h">{t.footer.resources}</h3>
            <ul className="footer-links">
              <li><a href={withLang('/blog', language)}>{t.footer.blogDesign}</a></li>
              <li><a href={withLang('/cursuri', language)}>{t.footer.designCourses}</a></li>
              <li><a href={withLang('/portofoliu', language)}>{t.footer.fullDesign}</a></li>
              <li><a href={withLang('/servicii', language)}>{t.footer.renders3d}</a></li>
              <li><a href={withLang('/contact', language)}>{t.footer.consultancy}</a></li>
            </ul>
          </section>

        </div>

        <div className="footer-social">
          <a href="https://www.instagram.com/noma.design.srl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaIcon name="instagram" />
          </a>
          <a href="https://www.facebook.com/mihaela.borta.2025" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FaIcon name="facebook-f" />
          </a>
          <a href="https://www.tiktok.com/@mihaelaborta10" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <FaIcon name="tiktok" />
          </a>
        </div>

        <p className="footer-copy">&copy; 2026 NOMA Design</p>
      </div>
    </footer>
  );
};

export default Footer;