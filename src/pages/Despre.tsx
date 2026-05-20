import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import SectionHeader from '../components/SectionHeader';
import LuxuryDivider from '../components/LuxuryDivider';
import './Despre.css';

const DESPRE_STATS = [
  { value: '200+', label: 'Proiecte Finalizate' },
  { value: '3', label: 'Pachete Servicii' },
  { value: '15+', label: 'Premii Design' },
  { value: '100%', label: 'Clienți Mulțumiți' },
  { value: '3', label: 'Programe Active' },
  { value: '150+', label: 'Cursanți Formați' },
];

const Despre = () => {
  const { t } = useLanguage();

  // IntersectionObserver for Staggered Reveal Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Drop observer after showing so it stays visible
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.noma-reveal, .blur-reveal, .despre-image');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="despre">
      <section className="despre-hero">
        <div className="container">
          <SectionHeader 
            title={
              <>
                <span className="desktop-title">{t.about.pageTitle}</span>
                <span className="mobile-title">Despre NOMA</span>
              </>
            }
            subtitle={t.about.pageSubtitle}
            className="despre-hero-header"
          />
        </div>
      </section>

      <section className="stats-section-marquee">
        <div className="despre-stats-container">
          <div className="despre-stats-marquee">
            <motion.div 
              className="despre-stats-track"
              animate={{
                x: [0, "-50%"]
              }}
              transition={{
                duration: 40,
                ease: "linear",
                repeat: Infinity
              }}
            >
              {[...DESPRE_STATS, ...DESPRE_STATS, ...DESPRE_STATS, ...DESPRE_STATS].map((stat, i) => (
                <div key={i} className="despre-stat-pill">
                  <span className="despre-stat-value">{stat.value}</span>
                  <span className="despre-stat-label">{stat.label}</span>
                  <span className="despre-stat-dot" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="despre-content">
        <div className="despre-container">
          <div className="despre-text">
            <p className="noma-reveal" style={{ '--delay': '0.1s' } as React.CSSProperties}>
              {t.about.text1}
            </p>
            <p className="noma-reveal" style={{ '--delay': '0.2s' } as React.CSSProperties}>
              {t.about.text2}
            </p>
            <p className="noma-reveal" style={{ '--delay': '0.3s' } as React.CSSProperties}>
              {t.about.text3}
            </p>
          </div>

          <div className="despre-image noma-reveal" style={{ '--delay': '0.4s' } as React.CSSProperties}>
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1000&fit=crop"
              alt="Echipa NOMA Studio Design"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <LuxuryDivider />

      <section className="values-section">
        <SectionHeader 
          title={t.about.valuesTitle}
        />

        <div className="values-grid">
          <div className="value-card noma-reveal" style={{ '--delay': '0.1s' } as React.CSSProperties}>
            <div className="value-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>{t.about.excellence}</h3>
            <p>{t.about.excellenceDesc}</p>
          </div>

          <div className="value-card noma-reveal" style={{ '--delay': '0.2s' } as React.CSSProperties}>
            <div className="value-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3>{t.about.punctuality}</h3>
            <p>{t.about.punctualityDesc}</p>
          </div>

          <div className="value-card noma-reveal" style={{ '--delay': '0.3s' } as React.CSSProperties}>
            <div className="value-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3>{t.about.innovation}</h3>
            <p>{t.about.innovationDesc}</p>
          </div>

          <div className="value-card noma-reveal" style={{ '--delay': '0.4s' } as React.CSSProperties}>
            <div className="value-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3>{t.about.personalization}</h3>
            <p>{t.about.personalizationDesc}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Despre;
