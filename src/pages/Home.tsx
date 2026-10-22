import { useRef, lazy, Suspense, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Head as Helmet, ClientOnly } from 'vite-react-ssg';
import { RevealCard, RevealLine, HomeDivider, useRevealActive } from '../components/HomeReveal';
import HeroProjectSlider from '../components/HeroProjectSlider';
// Planul tehnic e un modul mare (geometrie 1:1 din PDF) → lazy, ca să nu
// îngreuneze bundle-ul inițial al homepage-ului. Se încarcă async, sub fold.
const ProjectInquirySketch = lazy(() => import('../components/ProjectInquirySketch'));
import SplineDesignSection from '../components/SplineDesignSection';
// Formularul (validare, selector de telefon, micșorarea pozelor: ~31 KB JS +
// stiluri) se cere abia când ajungi la ~1000px de el. Importat static, intra
// în tot ce descărca pagina înainte de primul ecran (PageSpeed, 2026-10-23).
const HomeContactForm = lazy(() => import('../components/HomeContactForm'));
import { GooeyText } from '../components/ui/gooey-text-morphing';
import { useBarTheme } from '../components/BarScrims';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { SITE_URL, canonicalUrl, hreflangLinks, organizationSchema, founderSchema, founderMihaelaSchema } from '../utils/seo';
import type { Language } from '../i18n/types';
import { useNearViewport } from '../utils/useNearViewport';
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
        name: 'NOMA Design',
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: INLANG[language] ?? 'ro-MD',
      },
    ],
  };
}



const Home = () => {
  const { projects } = usePortfolio();
  const contactSlotRef = useRef<HTMLDivElement>(null);
  const contactNear = useNearViewport(contactSlotRef, 1000);
  const { language, t } = useLanguage();
  const canonical = canonicalUrl('/', language);
  const structuredData = getStructuredData(language);

  /* UN SINGUR prag pentru toată secțiunea „proiect nou" (înainte erau două,
     unul pe titlu și unul pe CTA, la praguri diferite ⇒ piesele se aprindeau
     fiecare la altă coordonată de scroll, dezordonat). Secțiunea încape
     într-un ecran, deci când 35% din ea e vizibilă tot conținutul e pe cale
     să intre — de acolo pornește cascada, iar ordinea o dau delay-urile. */
  /* titlul și butonul se REIAU la fiecare trecere (cerut: „de câte ori trec,
     mereu efectele prezente”); trigger pe un nod mic (blocul de titlu), nu pe
     toată secțiunea, altfel pornea abia la 35% din ea. */
  const inquiryTitleRef = useRef<HTMLDivElement>(null);
  const inquiryInView = useRevealActive(inquiryTitleRef, 0.3);

  /* 2026-10-19, cerut explicit de Vlad: pe homepage barele browserului sus ȘI
     jos în cafeniul meniului hamburger. Safari pe iOS 26 IGNORĂ theme-color și
     își colorează singur barele: sus din fundalul documentului (`html`, la
     scroll 0), jos din elementul FIX lipit de marginea de jos (≥3px, lat).
     De aceea: clasa `noma-brown-bars` pe <html> (pusă prin Helmet, deci și în
     HTML-ul pregenerat, înainte de JS) + `.bar-edge-bottom` (bottom:0, nu o
     bandă care urmărește bara: aceea rămânea în urmă la derulare și lăsa o
     linie bej). theme-color rămâne pentru Chrome pe Android.
     LIMITĂ iOS 26 (testat pe iPhone de Vlad, 2026-10-19): la încărcare bara de
     jos e o pastilă de sticlă peste pagină și arată conținutul; Safari o
     umple cafeniu abia la primul scroll. Încercate și PICATE: banda pe 100dvh
     (rămâne în urmă), ::after sub ecran (tăiat), fără fâșie (nu se mai
     colorează), fâșie invizibilă, bandă ascunsă la scroll printr-o clasă pe
     <html> (a stricat navbarul: re-randare la fiecare scroll). NU reîncerca. */
  useBarTheme(true, '#1c1410');
  /* Helmet pune clasa doar în HTML-ul pregenerat; pe client (navigare în
     aplicație) o punem și o scoatem aici, ca să nu rămână pe alte pagini. */
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('noma-brown-bars');
    return () => root.classList.remove('noma-brown-bars');
  }, []);

  return (
    <>
      <div className="bar-edge-bottom" aria-hidden="true" />
      <Helmet>
        <html lang={language} className="noma-brown-bars" />
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

        <HomeDivider />

        {/* --- PROJECT INQUIRY SECTION (servicii) — layout editorial: titlu
              colț stânga-sus, desen centrat, CTA colț stânga-jos --- */}
        <section className="project-inquiry" aria-label={t.home.inquiryAriaLabel}>
          <div className="inquiry-inner">
            <div className="inquiry-title-block" ref={inquiryTitleRef}>
              {/* FĂRĂ animație de intrare (2026-10-12, decizia lui Vlad): titlul e
                  elementul LCP pe mobil și stătea ASCUNS (mască, y:150%) până la
                  hidratare + 35% din secțiune în ecran — PSI: „întârziere la
                  redare” 3.66s, iar la intrare pe telefon locul lui părea gol
                  („buguit”) până la primul scroll. Aceeași structură ca RevealLine
                  (`.sh-clip` + span block) ⇒ layout identic, doar fără mișcare. */}
              <h2 className="inquiry-title">
                <RevealLine active={inquiryInView} delay={0} className="inquiry-title-line inquiry-title-line--lead">
                  {t.home.inquiryHeadline1}
                </RevealLine>
                <RevealLine active={inquiryInView} delay={0.1} className="inquiry-title-line">
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
            {/* 2026-10-19 (cerut: „fix ca cardurile, ca pe /curs"): aceeași
                intrare ca toate cardurile: abur 10px + urcă 56px, reluată la
                fiecare trecere. Ca la Fog de pe /curs: la final data-fog='on'
                ⇒ `filter:none !important` (Home.css), iar cutia e lărgită ca
                umbra butonului să stea ÎN zona filtrului, nu tăiată la margine. */}
            <RevealCard className="inquiry-cta-wrap">
              {/* fără <Magnetic> — butonul nu mai „fuge după mouse" (cerut explicit) */}
              <Link to={withLang('/servicii', language)} className="inquiry-cta-btn">
                {t.home.inquiryCta}
              </Link>
            </RevealCard>
          </div>
        </section>

        <HomeDivider />

        {/* --- SPLINE CURSURI SECTION --- */}
        <SplineDesignSection />

        <HomeDivider />

        {/* --- CONTACT SECTION --- */}
        {/* până se încarcă: o cutie goală de înălțimea formularului, ca pagina
            să nu-și schimbe lungimea (Home.css, .home-contact-slot) */}
        <div ref={contactSlotRef} className="home-contact-slot">
          {contactNear && (
            <Suspense fallback={null}>
              <HomeContactForm />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
