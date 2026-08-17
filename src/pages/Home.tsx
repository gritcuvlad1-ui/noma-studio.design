import { useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useInView } from 'framer-motion';
import { Reveal, RevealLine } from '../components/HomeReveal';
import HeroProjectSlider from '../components/HeroProjectSlider';
import HomeContactForm from '../components/HomeContactForm';
import LuxuryDivider from '../components/LuxuryDivider';
// Planul tehnic e un modul mare (geometrie 1:1 din PDF) → lazy, ca să nu
// îngreuneze bundle-ul inițial al homepage-ului. Se încarcă async, sub fold.
const ProjectInquirySketch = lazy(() => import('../components/ProjectInquirySketch'));
import SplineDesignSection from '../components/SplineDesignSection';
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { SITE_URL, canonicalUrl, hreflangLinks } from '../utils/seo';
import './Home.css';

const INLANG: Record<string, string> = { ro: 'ro-MD', ru: 'ru-MD', en: 'en' };

function getStructuredData(language: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'NOMA Studio',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          // era `/logo.png` — fișier inexistent (404); Google nu poate valida
          // logo-ul organizației dacă imaginea nu se încarcă. Repointat spre
          // fișierul real, deja folosit cu același rol în schema
          // ProfessionalService din index.html.
          url: `${SITE_URL}/apple-touch-icon.png`,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          availableLanguage: ['Romanian', 'Russian', 'English'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'NOMA Studio',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: INLANG[language] ?? 'ro-MD',
      },
    ],
  };
}



const Home = () => {
  const { projects } = usePortfolio();
  const { language, t } = useLanguage();
  const canonical = canonicalUrl('/', language);
  const structuredData = getStructuredData(language);

  /* UN SINGUR prag pentru toată secțiunea „proiect nou" (înainte erau două,
     unul pe titlu și unul pe CTA, la praguri diferite ⇒ piesele se aprindeau
     fiecare la altă coordonată de scroll, dezordonat). Secțiunea încape
     într-un ecran, deci când 35% din ea e vizibilă tot conținutul e pe cale
     să intre — de acolo pornește cascada, iar ordinea o dau delay-urile. */
  const inquiryRef = useRef<HTMLDivElement>(null);
  const inquiryInView = useInView(inquiryRef, { once: true, amount: 0.35 });

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{t.seo.homeTitle}</title>
        <meta name="description" content={t.seo.homeDescription} />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/')}

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={t.seo.homeOgTitle} />
        <meta property="og:description" content={t.seo.homeOgDescription} />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={canonical} />
        <meta property="twitter:title" content={t.seo.homeOgTitle} />
        <meta property="twitter:description" content={t.seo.homeOgDescription} />
        <meta property="twitter:image" content={`${SITE_URL}/og-image.jpg`} />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="home">
        {/* Titlu-statement premium, ÎN AFARA banerului (deasupra) — text „gooey"
            care se topește între cele două jumătăți ale tag-line-ului. */}
        <div className="hero-heading">
          <h1 className="sr-only">{t.hero.headline1} {t.hero.headline2}</h1>
          <GooeyText
            texts={[t.hero.headline1, t.hero.headline2]}
            morphTime={1.5}
            cooldownTime={1.9}
            className="hero-gooey"
            textClassName="hero-gooey-text"
          />
        </div>

        <HeroProjectSlider projects={projects} duration={4000} />

        <LuxuryDivider delay={0.8} className="divider-hero-inquiry" />

        {/* --- PROJECT INQUIRY SECTION (servicii) — layout editorial: titlu
              colț stânga-sus, desen centrat, CTA colț stânga-jos --- */}
        <section className="project-inquiry" aria-label="Proiect nou">
          <div className="inquiry-inner" ref={inquiryRef}>
            <div className="inquiry-title-block">
              <h2 className="inquiry-title">
                <RevealLine
                  active={inquiryInView}
                  delay={0}
                  className="inquiry-title-line inquiry-title-line--lead"
                >
                  Ai nevoie de
                </RevealLine>
                <RevealLine
                  active={inquiryInView}
                  delay={0.12}
                  className="inquiry-title-line"
                >
                  <em>un proiect?</em>
                </RevealLine>
              </h2>
            </div>

            <div className="inquiry-sketch-wrap">
              <Suspense fallback={<div style={{ width: '100%', maxWidth: 600, aspectRatio: '680 / 514' }} aria-hidden="true" />}>
                <ProjectInquirySketch />
              </Suspense>
            </div>

            {/* `noFilter` OBLIGATORIU aici, nu doar din obișnuință: un `filter`
                (chiar și `blur(0px)` rezidual) creează o suprafață de filtrare
                lipită exact de cutia butonului, care RETEAZĂ box-shadow-ul ce
                iese în afara ei — de-aia haloul apărea „tăiat".
                Ultimul din cascada secțiunii (titlu → titlu → buton). */}
            <Reveal className="inquiry-cta-wrap" active={inquiryInView} delay={0.42} noFilter>
              {/* fără <Magnetic> — butonul nu mai „fuge după mouse" (cerut explicit) */}
              <Link to={withLang('/servicii', language)} className="inquiry-cta-btn">
                Începe un proiect
              </Link>
            </Reveal>
          </div>
        </section>

        <LuxuryDivider className="divider-inquiry-cursuri" />

        {/* --- SPLINE CURSURI SECTION --- */}
        <SplineDesignSection />

        <LuxuryDivider className="divider-cursuri-contact" />

        {/* --- CONTACT SECTION --- */}
        <HomeContactForm />
      </div>
    </>
  );
};

export default Home;
