import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import HeroProjectSlider from '../components/HeroProjectSlider';
import HomeContactForm from '../components/HomeContactForm';
import SectionHeader from '../components/SectionHeader';
import LuxuryDivider from '../components/LuxuryDivider';
import { projects } from '../data/projects';
import './Home.css';

const SITE_URL = 'https://nomastudio.md';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'NOMA Studio',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['Romanian', 'Russian'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'NOMA Studio',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'ro-MD',
    },
  ],
};



const Home = () => {
  const { t } = useLanguage();
  const aboutLines = t.home.aboutTitle.split('\n');

  return (
    <>
      <Helmet>
        <html lang="ro" />
        <title>NOMA Studio — Design Interior & Exterior Premium în Moldova</title>
        <meta name="description" content="NOMA Studio oferă servicii de design interior și exterior premium în Moldova. Transformăm spațiile în experiențe unice." />
        <meta name="keywords" content="design interior Chisinau, design exterior Moldova, amenajari premium, randari 3D, arhitectura Chisinau" />
        <link rel="canonical" href={SITE_URL} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="NOMA Studio — Design Interior & Exterior Premium în Moldova" />
        <meta property="og:description" content="Transformăm spațiile în experiențe unice prin design interior și exterior de lux." />
        <meta property="og:image" content={`${SITE_URL}/hero-villa.png`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={SITE_URL} />
        <meta property="twitter:title" content="NOMA Studio — Design Interior & Exterior Premium" />
        <meta property="twitter:description" content="Design interior și exterior de lux în Chișinău. Proiecte complete și randări 3D." />
        <meta property="twitter:image" content={`${SITE_URL}/hero-villa.png`} />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="home">
        <HeroProjectSlider projects={projects} />

        <LuxuryDivider delay={0.8} />

        {/* --- SERVICES SECTION --- */}
        <section 
          className="services-preview" 
          aria-labelledby="services-heading"
        >
          <div className="container">
            <SectionHeader 
              title={t.home.whatWeOffer}
              subtitle={t.home.servicesSubtitle}
              eyebrow="Studio Services"
            />

            <motion.div 
              className="services-grid" 
              role="list"
              variants={staggerContainer}
            >
              <article className="service-card" role="listitem">
                <div className="service-icon" aria-hidden="true">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h3>{t.home.interiorDesign}</h3>
                <p>{t.home.interiorDesignDesc}</p>
              </article>

              <article className="service-card" role="listitem">
                <div className="service-icon" aria-hidden="true">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                </div>
                <h3>{t.home.exteriorDesign}</h3>
                <p>{t.home.exteriorDesignDesc}</p>
              </article>
            </motion.div>

            <div className="section-cta">
              <Link to="/servicii" className="cta-link-luxury">
                <span>{t.home.viewAllServices}</span>
                <span className="link-underline"></span>
              </Link>
            </div>
          </div>
        </section>

        <LuxuryDivider />

        {/* --- ABOUT SECTION --- */}
        <section 
          className="about-preview" 
          aria-labelledby="about-heading"
        >
          <div className="about-container">
            <div className="about-text">
              <SectionHeader 
                centered={false}
                eyebrow="The Studio"
                title={
                  <>
                    {aboutLines.map((line, i) => (
                      <span key={i}>{line}{i < aboutLines.length - 1 && <br />}</span>
                    ))}
                  </>
                }
              />
              <p className="editorial-body">{t.home.aboutText}</p>
              <Link to="/despre" className="cta-link-luxury">
                {t.home.aboutLink}
                <span className="link-underline"></span>
              </Link>
            </div>

            <div className="about-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=1000&fit=crop"
                alt="NOMA Studio Interior"
                className="luxury-image"
                loading="lazy"
              />
              <div className="image-overlay-glow" />
            </div>
          </div>
        </section>

        <LuxuryDivider />

        {/* --- CONTACT SECTION --- */}
        <HomeContactForm />
      </div>
    </>
  );
};

export default Home;
