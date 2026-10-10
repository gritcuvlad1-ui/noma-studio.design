import { useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Head as Helmet, ClientOnly } from 'vite-react-ssg';
import { useInView } from 'framer-motion';
import { Reveal, RevealLine } from '../components/HomeReveal';
import HeroProjectSlider from '../components/HeroProjectSlider';
import HomeContactForm from '../components/HomeContactForm';
// Planul tehnic e un modul mare (geometrie 1:1 din PDF) → lazy, ca să nu
// îngreuneze bundle-ul inițial al homepage-ului. Se încarcă async, sub fold.
const ProjectInquirySketch = lazy(() => import('../components/ProjectInquirySketch'));
import SplineDesignSection from '../components/SplineDesignSection';
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { SITE_URL, canonicalUrl, hreflangLinks, organizationSchema, founderSchema, founderMihaelaSchema } from '../utils/seo';
import type { Language } from '../i18n/types';
import './Home.css';

const INLANG: Record<string, string> = { ro: 'ro-MD', ru: 'ru-MD', en: 'en' };

function getStructuredData(language: Language) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema(language),
      founderSchema(language),
      founderMihaelaSchema(language),
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

        {/* --- PROJECT INQUIRY SECTION (servicii) — layout editorial: titlu
              colț stânga-sus, desen centrat, CTA colț stânga-jos --- */}
        <section className="project-inquiry" aria-label={t.home.inquiryAriaLabel}>
          <div className="inquiry-inner" ref={inquiryRef}>
            <div className="inquiry-title-block">
              <h2 className="inquiry-title">
                <RevealLine
                  active={inquiryInView}
                  delay={0}
                  className="inquiry-title-line inquiry-title-line--lead"
                >
                  {t.home.inquiryHeadline1}
                </RevealLine>
                <RevealLine
                  active={inquiryInView}
                  delay={0.12}
                  className="inquiry-title-line"
                >
                  <em>{t.home.inquiryHeadline2}</em>
                </RevealLine>
              </h2>
            </div>

            <div className="inquiry-sketch-wrap">
              {/* ClientOnly (nu doar Suspense) — geometria e 436KB de coordonate
                  SVG statice, fără nicio valoare textuală pentru un crawler.
                  Prerendată, umfla index.html de la 8KB la 465KB, ceea ce
                  încetinește exact ce voiam să grăbim (timeout-ul agresiv al
                  crawlerelor AI, Faza 4c). ClientOnly o exclude din HTML-ul
                  static și o randează DOAR în browser, exact ca înainte —
                  fallback-ul (aceleași dimensiuni rezervate) apare și în HTML,
                  și în browser până se hidratează, ca desenul animat de scroll
                  să nu producă layout shift la încărcare. */}
              <ClientOnly fallback={<div style={{ width: '100%', maxWidth: 600, aspectRatio: '680 / 514' }} aria-hidden="true" />}>
                {() => (
                  <Suspense fallback={<div style={{ width: '100%', maxWidth: 600, aspectRatio: '680 / 514' }} aria-hidden="true" />}>
                    <ProjectInquirySketch />
                  </Suspense>
                )}
              </ClientOnly>
            </div>

            {/* `noFilter` OBLIGATORIU aici, nu doar din obișnuință: un `filter`
                (chiar și `blur(0px)` rezidual) creează o suprafață de filtrare
                lipită exact de cutia butonului, care RETEAZĂ box-shadow-ul ce
                iese în afara ei — de-aia haloul apărea „tăiat".
                Ultimul din cascada secțiunii (titlu → titlu → buton). */}
            <Reveal className="inquiry-cta-wrap" active={inquiryInView} delay={0.42} noFilter>
              {/* fără <Magnetic> — butonul nu mai „fuge după mouse" (cerut explicit) */}
              <Link to={withLang('/servicii', language)} className="inquiry-cta-btn">
                {t.home.inquiryCta}
              </Link>
            </Reveal>
          </div>
        </section>

        {/* --- SPLINE CURSURI SECTION --- */}
        <SplineDesignSection />

        {/* --- CONTACT SECTION --- */}
        <HomeContactForm />
      </div>
    </>
  );
};

export default Home;
