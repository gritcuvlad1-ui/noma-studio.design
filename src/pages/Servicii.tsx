import { useState, useEffect } from 'react';
import { motion, useReducedMotion, Variants, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronDown } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import './Servicii.css';

const SITE_URL = 'https://nomastudio.md';
const OG_IMAGE = `${SITE_URL}/og-servicii.jpg`;
const EASE = [0.16, 1, 0.3, 1] as const;

const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/servicii/#webpage`,
      url: `${SITE_URL}/servicii`,
      name: 'Servicii Design Interior & Exterior — Moldova',
      description: 'Pachete de design interior premium: Basic 17€/m², Tehnic 28€/m², Signature 37€/m². Soluții complete de amenajare interioară.',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Acasă', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Servicii', item: `${SITE_URL}/servicii` },
        ],
      },
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/servicii/#packages`,
      name: 'Pachete Design Interior Premium',
      description: 'Servicii design interior: Basic, Tehnic și Signature',
      numberOfItems: 3,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Service',
            name: 'Pachet Basic — Design Interior',
            description: 'Vizita șantier, plan releveu, amplasare mobilier, plan compartimentare, randări 3D',
            offers: {
              '@type': 'Offer',
              price: '17',
              priceCurrency: 'EUR',
              unitText: 'mp',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/contact`,
            },
            provider: { '@type': 'Organization', name: 'NOMA Studio', url: SITE_URL },
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Service',
            name: 'Pachet Tehnic — Design Interior Complet',
            description: 'Album tehnic, 2 variante amplasare mobilier, randări 3D modificabile, consultanță post-proiect',
            offers: {
              '@type': 'Offer',
              price: '28',
              priceCurrency: 'EUR',
              unitText: 'mp',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/contact`,
            },
            provider: { '@type': 'Organization', name: 'NOMA Studio', url: SITE_URL },
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'Service',
            name: 'Pachet Signature — Design Rezidențial Premium',
            description: 'Compartimentări interioare, 5 vizite magazine partenere, supraveghere șantier, consultanță post-proiect',
            offers: {
              '@type': 'Offer',
              price: '37',
              priceCurrency: 'EUR',
              unitText: 'mp',
              availability: 'https://schema.org/InStock',
              url: `${SITE_URL}/contact`,
            },
            provider: { '@type': 'Organization', name: 'NOMA Studio', url: SITE_URL },
          },
        },
      ],
    },
  ],
};

const CheckIcon = () => (
  <svg
    width="17"
    height="17"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Servicii = () => {
  const { language, t } = useLanguage();
  const shouldReduce = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isPartnerVisitsExpanded, setIsPartnerVisitsExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardVariants: Variants = shouldReduce ? {
    initial: { opacity: 1, y: 0, scale: 1 },
    animate: { opacity: 1, y: 0, scale: 1 }
  } : {
    initial: { opacity: 0, y: 52, filter: 'blur(6px) brightness(1)', scale: 1 },
    animate: { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', scale: 1, transition: { duration: 0.7, ease: EASE } },
    hover: { 
      scale: 1.02, 
      y: -8, 
      filter: 'blur(0px) brightness(1.01)',
      transition: { duration: 0.6, ease: EASE } 
    }
  };

  const featuredVariants: Variants = shouldReduce ? {
    initial: { opacity: 1, y: 0, scale: 1 },
    animate: { opacity: 1, y: 0, scale: 1 }
  } : {
    initial: { opacity: 0, y: 52, filter: 'blur(6px) brightness(1)', scale: 1 },
    animate: { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', scale: 1, transition: { duration: 0.7, ease: EASE } },
    hover: { 
      scale: 1.03, 
      y: -10, 
      filter: 'blur(0px) brightness(1.02)',
      transition: { duration: 0.6, ease: EASE } 
    }
  };




  return (
    <>
      <Helmet>
        <title>Servicii Design Interior & Exterior — Prețuri Moldova</title>
        <meta name="description" content="Pachete design interior premium în Moldova: Basic 17€/m², Tehnic 28€/m², Signature 37€/m². Soluții complete de amenajare interioară." />
        <meta name="keywords" content="servicii design interior Moldova, prețuri design interior, pachet design interior, amenajare apartament, design interior Chișinău" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="NOMA Studio" />
        <link rel="canonical" href={`${SITE_URL}/servicii`} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NOMA Studio" />
        <meta property="og:url" content={`${SITE_URL}/servicii`} />
        <meta property="og:title" content="Servicii și Pachete Design Interior" />
        <meta property="og:description" content="Pachete design interior premium: Basic 17€/m², Tehnic 28€/m², Signature 37€/m². Solicită ofertă acum." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Pachete servicii design interior Moldova" />
        <meta property="og:locale" content="ro_MD" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Servicii și Pachete Design Interior" />
        <meta name="twitter:description" content="Pachete design interior premium: Basic 17€/m², Tehnic 28€/m², Signature 37€/m²." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content="Servicii design interior Moldova" />

        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <main className="servicii" role="main" id="main-content">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="servicii-hero" aria-labelledby="servicii-heading">
          <div className="container">
            <SectionHeader 
              title={t.services.pageTitle}
              subtitle={t.services.pageSubtitle}
            />
          </div>
        </section>

        {/* ── EDITORIAL MANIFESTO QUOTE ── */}
        <section className="servicii-quote-section" aria-label="Manifesto quote">
          <div className="servicii-quote-wrapper">
            <div className="servicii-quote-drawing-container">
              {/* Central Frame Drawing containing the room furniture sketch */}
              <svg viewBox="0 60 800 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="servicii-quote-sketch-svg">
                {/* Background Grid */}
                <line x1="50" y1="80" x2="750" y2="80" stroke="rgba(184, 149, 106, 0.08)" strokeDasharray="5 5" />
                <line x1="50" y1="380" x2="750" y2="380" stroke="rgba(184, 149, 106, 0.08)" strokeDasharray="5 5" />
                <line x1="50" y1="230" x2="750" y2="230" stroke="rgba(184, 149, 106, 0.04)" strokeDasharray="3 3" />
                <line x1="140" y1="50" x2="140" y2="450" stroke="rgba(184, 149, 106, 0.05)" strokeDasharray="5 5" />
                <line x1="660" y1="50" x2="660" y2="450" stroke="rgba(184, 149, 106, 0.05)" strokeDasharray="5 5" />

                {/* Floor Line */}
                <line x1="50" y1="420" x2="750" y2="420" stroke="#3d2b1f" strokeWidth="1" opacity="0.4" />

                {/* Central Frame & Dimensions */}
                <g className="quote-frame-group">
                  {/* Frame Shadow */}
                  <rect x="154" y="148" width="492" height="175" fill="rgba(61,43,31,0.08)" filter="blur(6px)" />
                  
                  {/* Outer Frame (Wood/Gold) */}
                  <rect x="150" y="140" width="500" height="180" stroke="#8b7565" strokeWidth="4" fill="#ffffff" rx="2" />
                  
                  {/* Passepartout (Inner white border) */}
                  <rect x="165" y="155" width="470" height="150" fill="#fcfaf8" />
                  <rect x="165" y="155" width="470" height="150" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" fill="none" />
                  <rect x="166" y="156" width="468" height="148" stroke="rgba(184,149,106,0.15)" strokeWidth="1" fill="none" />
                  
                  {/* Canvas area */}
                  <rect x="167" y="157" width="466" height="146" fill="#f9f5f0" />

                  {/* Abstract Paint Splatters & Brush Strokes (Realistic Art) */}
                  <g className="quote-art" opacity="0.6">
                    {/* Sweeping brush strokes */}
                    <path d="M 175 270 Q 250 180 320 220 T 450 170" stroke="#e1cfa5" strokeWidth="24" strokeLinecap="round" fill="none" opacity="0.5" filter="blur(2px)" />
                    <path d="M 350 280 Q 450 200 620 250" stroke="#d4c1ac" strokeWidth="35" strokeLinecap="round" fill="none" opacity="0.4" filter="blur(4px)" />
                    <path d="M 220 260 Q 300 280 400 240" stroke="#b8956a" strokeWidth="15" strokeLinecap="round" fill="none" opacity="0.25" filter="blur(1px)" />
                    
                    {/* Golden splatters (dots & drips) */}
                    <g fill="#b8956a" opacity="0.8">
                      <circle cx="210" cy="190" r="2.5" />
                      <circle cx="218" cy="184" r="1.5" />
                      <circle cx="202" cy="195" r="2" />
                      <circle cx="225" cy="205" r="1" />
                      <circle cx="215" cy="175" r="2" />
                      
                      <circle cx="480" cy="250" r="3" />
                      <circle cx="490" cy="240" r="2" />
                      <circle cx="470" cy="260" r="1.5" />
                      <circle cx="500" cy="255" r="2.5" />
                      <circle cx="510" cy="245" r="1" />
                      
                      <circle cx="340" cy="220" r="2" />
                      <circle cx="345" cy="210" r="1" />
                      <circle cx="330" cy="230" r="2" />
                      <circle cx="600" cy="260" r="3" />
                      <circle cx="615" cy="255" r="1.5" />
                      <circle cx="590" cy="270" r="2" />
                      <circle cx="605" cy="245" r="1" />
                      
                      {/* Drips */}
                      <path d="M 480 250 Q 482 260 481 270" stroke="#b8956a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      <path d="M 210 190 Q 209 200 211 205" stroke="#b8956a" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                      <path d="M 600 260 Q 601 270 599 280" stroke="#b8956a" strokeWidth="1" strokeLinecap="round" fill="none" />
                    </g>
                    
                    {/* Lighter sandy splatters */}
                    <g fill="#d4c1ac">
                      <circle cx="280" cy="260" r="4.5" opacity="0.8" />
                      <circle cx="290" cy="250" r="2.5" opacity="0.7" />
                      <circle cx="270" cy="270" r="3" opacity="0.9" />
                      <circle cx="295" cy="265" r="1.5" />
                      
                      <circle cx="420" cy="180" r="3.5" opacity="0.8" />
                      <circle cx="430" cy="175" r="2" />
                      <circle cx="415" cy="190" r="2.5" />
                      
                      {/* Small subtle dots */}
                      <circle cx="275" cy="245" r="1" />
                      <circle cx="285" cy="275" r="1.5" />
                      <circle cx="425" cy="195" r="1" />
                      <circle cx="410" cy="170" r="1.5" />
                    </g>
                  </g>
                  
                  {/* Frame hanging wire and nail */}
                  <circle cx="400" cy="75" r="3" fill="#3d2b1f" />
                  <line x1="400" y1="75" x2="340" y2="140" stroke="#3d2b1f" strokeWidth="0.75" />
                  <line x1="400" y1="75" x2="460" y2="140" stroke="#3d2b1f" strokeWidth="0.75" />

                  {/* Dimension Markers (Blueprint style) */}
                  <g className="quote-dimensions">
                    {/* Width */}
                    <path d="M 150 110 L 150 130" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    <path d="M 650 110 L 650 130" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    <line x1="150" y1="120" x2="650" y2="120" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    <text x="400" y="115" fontFamily="'Jost', sans-serif" fontSize="9" fill="#3d2b1f" textAnchor="middle" opacity="0.6" letterSpacing="0.1em">5000 mm</text>

                    {/* Height */}
                    <path d="M 665 140 L 685 140" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    <path d="M 665 320 L 685 320" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    <line x1="675" y1="140" x2="675" y2="320" stroke="#3d2b1f" strokeWidth="0.75" opacity="0.4" />
                    {/* Rotated text for height */}
                    <text x="683" y="230" fontFamily="'Jost', sans-serif" fontSize="9" fill="#3d2b1f" opacity="0.6" transform="rotate(90 683 230)" textAnchor="middle" letterSpacing="0.1em">1800 mm</text>
                  </g>
                </g>

                {/* Left Side: Modern Lounge Chair & Floor Lamp (Shifted 60px left from original) */}
                <g className="quote-furniture-left">
                  {/* Shadow under chair */}
                  <ellipse cx="80" cy="422" rx="55" ry="3" fill="rgba(61, 43, 31, 0.06)" />
                  {/* Chair frame */}
                  <path d="M 25 300 Q 35 350 45 360 L 115 375 Q 128 378 132 360" stroke="#3d2b1f" strokeWidth="1.2" fill="none" />
                  {/* Cushion outline */}
                  <path d="M 30 310 Q 40 348 50 355 L 110 370" stroke="#b08d3e" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" fill="none" />
                  {/* Legs */}
                  <line x1="115" y1="375" x2="128" y2="420" stroke="#3d2b1f" strokeWidth="1.2" />
                  <line x1="45" y1="360" x2="35" y2="420" stroke="#3d2b1f" strokeWidth="1.2" />
                  {/* Armrest */}
                  <path d="M 40 325 Q 85 332 105 350" stroke="#3d2b1f" strokeWidth="1" fill="none" />

                  {/* Floor Lamp behind chair */}
                  {/* Base */}
                  <path d="M 0 420 C 0 417 30 417 30 420 Z" fill="#3d2b1f" opacity="0.6" />
                  {/* Pole */}
                  <path d="M 15 417 V 230 C 15 170 85 170 90 220" stroke="#3d2b1f" strokeWidth="1" fill="none" />
                  {/* Shade */}
                  <path d="M 80 220 L 100 220 L 95 230 L 85 230 Z" fill="#b08d3e" opacity="0.8" />
                  {/* Light Ray cone */}
                  <polygon points="85,230 95,230 120,330 65,330" fill="rgba(184, 149, 106, 0.05)" />
                </g>

                {/* Right Side: Sleek Console Table & Vase (Shifted right to avoid measurement overlap) */}
                <g className="quote-furniture-right">
                  {/* Console shadow */}
                  <ellipse cx="740" cy="420" rx="35" ry="3.5" fill="rgba(61, 43, 31, 0.06)" />
                  {/* Console Table */}
                  <line x1="700" y1="330" x2="780" y2="330" stroke="#3d2b1f" strokeWidth="1.2" />
                  <line x1="715" y1="330" x2="715" y2="420" stroke="#3d2b1f" strokeWidth="1" />
                  <line x1="765" y1="330" x2="765" y2="420" stroke="#3d2b1f" strokeWidth="1" />
                  
                  {/* Vase */}
                  <path d="M 730 330 Q 722 312 733 298 L 733 293 L 747 293 L 747 298 Q 758 312 750 330 Z" fill="rgba(253, 250, 245, 0.9)" stroke="#b08d3e" strokeWidth="1" />

                  {/* Organic Botanical Branches */}
                  {/* Branch 1 */}
                  <path d="M 740 293 Q 735 245 710 205" stroke="#3d2b1f" strokeWidth="0.8" fill="none" />
                  <path d="M 725 260 C 717 256 713 262 725 260 Z" fill="#b08d3e" opacity="0.6" />
                  <path d="M 718 238 C 710 234 706 240 718 238 Z" fill="#b08d3e" opacity="0.6" />
                  <path d="M 710 212 C 702 208 698 214 710 212 Z" fill="#b08d3e" opacity="0.6" />
                  {/* Branch 2 */}
                  <path d="M 740 293 Q 755 235 770 190" stroke="#3d2b1f" strokeWidth="0.8" fill="none" />
                  <path d="M 748 262 C 756 258 760 264 748 262 Z" fill="#b08d3e" opacity="0.6" />
                  <path d="M 757 228 C 765 224 769 230 757 228 Z" fill="#b08d3e" opacity="0.6" />
                  <path d="M 767 198 C 775 194 779 200 767 198 Z" fill="#b08d3e" opacity="0.6" />
                </g>
              </svg>

              {/* HTML Overlay Text positioned inside the central Frame */}
              <div className="servicii-quote-overlay">
                <p className="servicii-quote-text">
                  {language === 'ru'
                    ? '«Интерьер — это естественная проекция души.»'
                    : language === 'en'
                    ? '"Interior is the natural projection of the soul."'
                    : '„Interiorul este proiecția naturală a sufletului.”'}
                </p>
                <span className="servicii-quote-author">
                  {language === 'ru' ? 'Коко Шанель' : 'Coco Chanel'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────── */}
        <section className="pricing-section" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="sr-only">Pachete și prețuri design interior</h2>
          <div className="container">
            <motion.div
              className="pricing-grid"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.05, margin: "-50px" }}
              role="list"
            >

              {/* BASIC */}
              <motion.article
                className="pricing-card"
                role="listitem"
                itemScope
                itemType="https://schema.org/Service"
                variants={cardVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.6 }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, filter" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.basicTitle}</h3>
                  <div className="pricing-price" aria-label="Preț 17 euro pe metru pătrat" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="17">17€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label="Ce include pachetul Basic">
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.siteVisit}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.surveyPlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.furniturePlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.partitionPlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.renders3d}</span></li>
                </ul>
                <div className="pricing-card-footer">
                  <span className="pricing-card__link">
                    Solicită ofertă
                  </span>
                </div>
                <a href="/contact?package=basic" className="pricing-cta-overlay" aria-label={`Solicită ofertă pachet ${t.services.basicTitle} — 17€/m²`}>
                  &nbsp;
                </a>
              </motion.article>

              {/* TEHNIC - Apare primul */}
              <motion.article
                className="pricing-card featured"
                role="listitem"
                aria-label="Pachet recomandat"
                itemScope
                itemType="https://schema.org/Service"
                variants={featuredVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, filter" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.technicTitle}</h3>
                  <div className="pricing-price" aria-label="Preț 28 euro pe metru pătrat" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="28">28€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label="Ce include pachetul Tehnic">
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.techAlbum}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.furnitureVariants}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.renders3dModifiable}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.postConsultancy}</span></li>
                </ul>
                <div className="pricing-card-footer">
                  <span className="pricing-card__link">
                    Solicită ofertă
                  </span>
                </div>
                <a href="/contact?package=tehnic" className="pricing-cta-overlay" aria-label={`Solicită ofertă pachet ${t.services.technicTitle} — 28€/m²`}>
                  &nbsp;
                </a>
              </motion.article>

              {/* SIGNATURE */}
              <motion.article
                className="pricing-card"
                role="listitem"
                itemScope
                itemType="https://schema.org/Service"
                variants={cardVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.8 }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, filter" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.signatureTitle}</h3>
                  <div className="pricing-price" aria-label="Preț 37 euro pe metru pătrat" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="37">37€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label="Ce include pachetul Signature">
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.interiorCompartments}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.siteSupervision}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.postConsultancy}</span></li>
                  <li 
                    className="feature-item partner-visits-toggle" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPartnerVisitsExpanded(!isPartnerVisitsExpanded);
                    }}
                    style={{ position: 'relative', zIndex: 12, cursor: 'pointer' }}
                  >
                    <CheckIcon />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      {t.services.features.partnerVisits}
                      <ChevronDown size={14} style={{ transition: 'transform 0.3s ease', transform: isPartnerVisitsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#b8956a' }} />
                    </span>
                  </li>
                  <AnimatePresence>
                    {isPartnerVisitsExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        style={{ overflow: 'hidden', position: 'relative', zIndex: 12 }}
                      >
                        <ul className="partner-visits-sublist" style={{ listStyle: 'none', padding: 0, margin: '4px 0 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <li className="feature-subitem"><span style={{ color: '#b8956a', marginRight: '6px' }}>•</span>{t.services.features.flooring}</li>
                          <li className="feature-subitem"><span style={{ color: '#b8956a', marginRight: '6px' }}>•</span>{t.services.features.lighting}</li>
                          <li className="feature-subitem"><span style={{ color: '#b8956a', marginRight: '6px' }}>•</span>{t.services.features.hardFurniture}</li>
                          <li className="feature-subitem"><span style={{ color: '#b8956a', marginRight: '6px' }}>•</span>{t.services.features.softFurniture}</li>
                          <li className="feature-subitem"><span style={{ color: '#b8956a', marginRight: '6px' }}>•</span>{t.services.features.sanitary}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <li style={{ listStyle: 'none', width: '100%', marginTop: '6px', marginBottom: '16px' }}>
                    <p className="pricing-warning" role="note" style={{ position: 'relative', zIndex: 12, margin: 0 }}>{t.services.signatureWarning}</p>
                  </li>
                </ul>
                <div className="pricing-card-footer">
                  <span className="pricing-card__link">
                    Solicită ofertă
                  </span>
                </div>
                <a href="/contact?package=signature" className="pricing-cta-overlay" aria-label={`Solicită ofertă pachet ${t.services.signatureTitle} — 37€/m²`}>
                  &nbsp;
                </a>
              </motion.article>

            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Servicii;