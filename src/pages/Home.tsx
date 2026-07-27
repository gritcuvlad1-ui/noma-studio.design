import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, Variants } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import HeroProjectSlider from '../components/HeroProjectSlider';
import HeroProjectShowcase from '../components/HeroProjectShowcase';
import HomeContactForm from '../components/HomeContactForm';
import SectionHeader from '../components/SectionHeader';
import LuxuryDivider from '../components/LuxuryDivider';
// Planul tehnic e un modul mare (geometrie 1:1 din PDF) → lazy, ca să nu
// îngreuneze bundle-ul inițial al homepage-ului. Se încarcă async, sub fold.
const ProjectInquirySketch = lazy(() => import('../components/ProjectInquirySketch'));
import { Magnetic } from '../components/Magnetic';
import SplineDesignSection from '../components/SplineDesignSection';
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { usePortfolio } from '../context/PortfolioContext';
import './Home.css';

const SITE_URL = 'https://noma.md';

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
  const { projects } = usePortfolio();
  const aboutLines = t.home.aboutTitle.split('\n');

  /* Desktop: showcase editorial (piramidă + ramă); mobil: slider-ul clasic
     (noma1) — redare condiționată, nu display:none, ca autoplay-ul/rAF-ul
     variantei nefolosite să nu ruleze degeaba. Pragul = 768px, sincron cu
     media query-urile din HeroProjectSlider.module.css. */
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 769px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /* secțiunea „proiect nou" încape integral într-un ecran (100svh) — titlul
     și CTA-ul sunt deja vizibile de îndată ce secțiunea intră în cadru, deci
     pragurile sunt mici (doar cât să impună un scroll real, nu load imediat),
     nu adânci ca la secțiunile care se derulează pe mai multe ecrane. */
  const titleRef    = useRef<HTMLHeadingElement>(null);
  const titleInView  = useInView(titleRef,    { once: true, margin: '0px 0px -8% 0px' });

  const ctaRef      = useRef<HTMLDivElement>(null);
  const ctaInView    = useInView(ctaRef,      { once: true, margin: '0px 0px -2% 0px' });

  const aboutTxtRef  = useRef<HTMLDivElement>(null);
  const aboutTxtIn   = useInView(aboutTxtRef, { once: true, margin: '0px 0px -20% 0px' });

  const aboutImgRef  = useRef<HTMLDivElement>(null);
  const aboutImgIn   = useInView(aboutImgRef, { once: true, margin: '0px 0px -20% 0px' });

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
        <meta property="og:image" content={`${SITE_URL}/hero-villa.webp`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={SITE_URL} />
        <meta property="twitter:title" content="NOMA Studio — Design Interior & Exterior Premium" />
        <meta property="twitter:description" content="Design interior și exterior de lux în Chișinău. Proiecte complete și randări 3D." />
        <meta property="twitter:image" content={`${SITE_URL}/hero-villa.webp`} />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="home">
        {/* Titlu-statement premium, ÎN AFARA banerului (deasupra) — text „gooey"
            care se topește între cele două jumătăți ale tag-line-ului. */}
        <div className="hero-heading">
          <h1 className="sr-only">Designul tău, identitatea ta.</h1>
          <GooeyText
            texts={['Designul tău,', 'identitatea ta.']}
            morphTime={1.5}
            cooldownTime={2.5}
            className="hero-gooey"
            textClassName="hero-gooey-text"
          />
        </div>

        {isDesktop
          ? <HeroProjectShowcase projects={projects} />
          : <HeroProjectSlider projects={projects} duration={4000} />}

        <LuxuryDivider delay={0.8} className="divider-hero-inquiry" />

        {/* --- PROJECT INQUIRY SECTION (servicii) — layout editorial: titlu
              colț stânga-sus, desen centrat, CTA colț stânga-jos --- */}
        <section className="project-inquiry" aria-label="Proiect nou">
          <div className="inquiry-inner">
            <div className="inquiry-title-block">
              {/* eyebrow simplu — fără cerc; centrat peste titlu, apropiat de el */}
              <motion.span
                className="inquiry-eyebrow"
                initial={{ opacity: 0, y: 14 }}
                animate={titleInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                Servicii
              </motion.span>

              <h2 className="inquiry-title" ref={titleRef}>
                <div className="sh-clip">
                  <motion.span
                    className="inquiry-title-line inquiry-title-line--lead"
                    initial="hidden"
                    animate={titleInView ? 'show' : 'hidden'}
                    variants={{
                      hidden: { y: '150%' },
                      show: { y: '0%', transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    Ai nevoie de
                  </motion.span>
                </div>
                <div className="sh-clip">
                  <motion.span
                    className="inquiry-title-line"
                    initial="hidden"
                    animate={titleInView ? 'show' : 'hidden'}
                    variants={{
                      hidden: { y: '150%' },
                      show: { y: '0%', transition: { duration: 1.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] } },
                    }}
                  >
                    <em>un proiect?</em>
                  </motion.span>
                </div>
              </h2>
            </div>

            <div className="inquiry-sketch-wrap">
              <Suspense fallback={<div style={{ width: '100%', maxWidth: 600, aspectRatio: '680 / 514' }} aria-hidden="true" />}>
                <ProjectInquirySketch />
              </Suspense>
            </div>

            <motion.div
              ref={ctaRef}
              className="inquiry-cta-wrap"
              initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
              animate={ctaInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 32, filter: 'blur(8px)' }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <Magnetic strength={0.3}>
                <Link to="/servicii" className="inquiry-cta-btn">
                  Începe un proiect
                </Link>
              </Magnetic>
              <p className="inquiry-sub">Consultație gratuită · Răspuns în 24h</p>
            </motion.div>
          </div>
        </section>

        <LuxuryDivider />

        {/* --- SPLINE CURSURI SECTION --- */}
        <SplineDesignSection />

        <LuxuryDivider />

        {/* --- ABOUT SECTION — penultima secțiune --- */}
        <section
          className="about-preview"
          aria-labelledby="about-heading"
        >
          <div className="about-container">
            <motion.div
              ref={aboutTxtRef}
              className="about-text"
              initial={{ opacity: 0, y: 36 }}
              animate={aboutTxtIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>

            <motion.div
              ref={aboutImgRef}
              className="about-image-wrap"
              initial={{ opacity: 0, y: 36 }}
              animate={aboutImgIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
              transition={{ duration: 1.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=1000&fit=crop"
                alt="NOMA Studio Interior"
                className="luxury-image"
                loading="lazy"
              />
              <div className="image-overlay-glow" />
            </motion.div>
          </div>
        </section>

        <LuxuryDivider />

        {/* --- CONTACT SECTION --- */}
        <HomeContactForm />

        <LuxuryDivider className="noma-footer-divider" />
      </div>
    </>
  );
};

export default Home;
