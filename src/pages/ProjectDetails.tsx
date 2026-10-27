import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { createPortal } from 'react-dom';
import { IconClose, IconArrowLeft, IconZoom, IconChevronLeft, IconChevronRight } from '../components/PremiumIcons';
import BarScrims, { useBarTheme } from '../components/BarScrims';
import { type RoomCategory } from '../data/projects';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { canonicalUrl, hreflangLinks, organizationSchema, breadcrumbSchema } from '../utils/seo';
import { m as motion, AnimatePresence, type Variants } from 'framer-motion';
import { largestSrc } from '../utils/images';
import PortfolioPicture from '../components/PortfolioPicture';
import { GALLERY_SIZES, generateEditorialRows } from '../utils/projectGallery';
import './ProjectDetails.css';

// numele proiectului (project.name) e SCRIS LA FEL în toate limbile (nume
// propriu, ex. „Casa NOMA Signature") — doar eticheta din jurul lui se traduce.
const PROJECT_TITLE_SUFFIX: Record<string, string> = {
  ro: 'Proiect Design Interior',
  ru: 'Проект Дизайна Интерьера',
  en: 'Interior Design Project',
};

// leagă id-ul de cameră (folosit intern, neschimbat) de cheia i18n cu eticheta tradusă
const ROOM_LABEL_KEY: Record<RoomCategory, 'roomLiving' | 'roomBucatarie' | 'roomDormitor' | 'roomBaie'> = {
  living: 'roomLiving',
  bucatarie: 'roomBucatarie',
  dormitor: 'roomDormitor',
  baie: 'roomBaie',
};

const lbSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1, zIndex: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, scale: 0.92, zIndex: 0 }),
};

// swipe = distanță × viteză → gest natural (un flick rapid trece, chiar și scurt)
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
const SWIPE_THRESHOLD = 8000;

/* Selecția variantelor de imagine (srcSet cu lățimi reale, cea mai mică
   variantă ca fallback, cea mai mare pt. lightbox) → utils/images.ts.
   Lățimile vin din manifestul generat de scripts/generate-image-manifest.mjs. */

// ── Variante framer-motion pentru galeria (apariție fluidă, una câte una) ──

const galleryRowVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.04 },
  },
};

/* FĂRĂ blur (2026-10-14, raportat de Vlad: „scrolul e buguit” pe /portofoliu/1).
   Măsurat pe live, derulare cu rotița, Chrome desktop, 2 rulări/variantă:
   cu `filter: blur(6px)` animat pe poze = 13-26 cadre pierdute și înghețări de
   183-650 ms la intrarea rândurilor; fără blur = 8-9 cadre, maxim 83 ms.
   Blur animat pe poze mari se re-rasterizează la fiecare cadru. NU reintroduce. */
const galleryItemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

/* Poza din galerie apare cu fade CÂND E COMPLETĂ, nu desenată bucată cu bucată
   în dreptunghiul alb (2026-10-14, „nu apare totul frumos lin" pe telefon).
   Ascunderea o pune DOAR JS-ul, înainte de primul paint (ref la montare), și
   doar dacă poza nu e deja în cache ⇒ fără JS / pt. crawlere pozele rămân
   vizibile normal. */
const markImgPending = (el: HTMLImageElement | null) => {
  if (el && !el.complete) el.classList.add('pd-img-pending');
};
const clearImgPending = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.classList.remove('pd-img-pending');
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { projects, loading: portfolioLoading } = usePortfolio();

  const project = projects.find((p) => p.id === Number(id));

  // Lightbox & Filtering State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  useBarTheme(lightboxOpen, '#2c241d');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'living' | 'bucatarie' | 'dormitor' | 'baie'>('all');
  const [backVisible, setBackVisible] = useState(true);

  /* Butonul „Înapoi la Portofoliu" apare la scroll ÎN SUS (oricât de puțin)
     și se retrage la scroll în jos — ca să nu stea peste poze cât derulezi,
     dar să fie la un gest distanță de oriunde ai fi ajuns în pagină.
     - sus de tot (< 80px): mereu vizibil, indiferent de direcție;
     - HISTEREZIS asimetric (6px sus / 12px jos): fără el, micro-oscilațiile
       de scroll (inerție iOS, trackpad) comută starea la fiecare cadru și
       butonul licărește. Pragul de ascundere e mai mare decât cel de
       afișare, deci „apare ușor, dispare greu" — exact senzația cerută.
     - rAF-throttle cu `ticking` (același pattern ca bara de navigare), ca
       handler-ul să nu ruleze de sute de ori pe secundă. */
  const lastScrollY = useRef(0);
  const backTicking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (backTicking.current) return;
      backTicking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastScrollY.current;

        if (y < 80) {
          setBackVisible(true);
        } else if (delta < -6) {
          setBackVisible(true);
        } else if (delta > 12) {
          setBackVisible(false);
        }

        // actualizez reperul DOAR când mișcarea a depășit zona moartă,
        // altfel un scroll lent, cumulativ, nu ar declanșa niciodată pragul
        if (Math.abs(delta) > 6) lastScrollY.current = y;

        backTicking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Redirect if project is not found (doar după ce portofoliul s-a încărcat)
  useEffect(() => {
    if (!project && !portfolioLoading) {
      navigate('/portofoliu');
    }
  }, [project, portfolioLoading, navigate]);


  // Intersection Observer for luxury scroll animations
  useEffect(() => {
    if (!project) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    // Small delay to ensure React DOM has completed rendering
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.noma-reveal');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [project, activeCategory]);

  if (!project) return null;

  const galleryImages = project.allImages || project.images;

  // Apply the mathematical editorial grid to projects that have allImages
  const isEditorialLayout = true;

  // Camera unei poze = din roomMap (clasificare manuală/vizuală, după index).
  // Lipsă din map = poză ambiguă (hol/balcon/detaliu) → apare doar la „Toate".
  const getCategoryForIndex = (index: number): RoomCategory | undefined =>
    project.roomMap?.[index];

  // Categoriile care chiar EXISTĂ în acest proiect (ca să nu arătăm filtre goale)
  const availableCategories = new Set<RoomCategory>(
    Object.values(project.roomMap ?? {}) as RoomCategory[]
  );

  const filteredGallery = isEditorialLayout && activeCategory !== 'all'
    ? galleryImages.map((img, originalIndex) => ({ img, originalIndex }))
        .filter(item => getCategoryForIndex(item.originalIndex) === activeCategory)
    : galleryImages.map((img, originalIndex) => ({ img, originalIndex }));

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen || !project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const imagesCount = filteredGallery.length;
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % imagesCount);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + imagesCount) % imagesCount);
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, project, filteredGallery.length]);

  // Blochează scroll-ul paginii din spate cât e deschis lightbox-ul
  // (overflow:hidden + compensare scrollbar + oprire Lenis smooth-scroll).
  useEffect(() => {
    if (!lightboxOpen) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.__lenis?.stop();

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.__lenis?.start();
    };
  }, [lightboxOpen]);

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  const lbDirection = useRef<number>(1);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    lbDirection.current = -1;
    setActivePhotoIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    lbDirection.current = 1;
    setActivePhotoIndex((prev) => (prev + 1) % filteredGallery.length);
  };

  // Swipe touch pentru lightbox pe mobil
  const lbTouchStartX = useRef(0);
  const handleLbTouchStart = (e: React.TouchEvent) => {
    lbTouchStartX.current = e.touches[0].clientX;
  };
  const handleLbTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - lbTouchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) {
      lbDirection.current = 1;
      setActivePhotoIndex((prev) => (prev + 1) % filteredGallery.length);
    } else {
      lbDirection.current = -1;
      setActivePhotoIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
    }
  };
  const displayImages = activeCategory === 'all'
    ? galleryImages
    : filteredGallery.map((item) => item.img);
  const editorialRows = isEditorialLayout ? generateEditorialRows(displayImages) : [];

  return (
    <div className="project-details-page">
      {/* meta dinamic per proiect — fără el, toate paginile de proiect aveau
          titlul + canonical-ul homepage-ului (duplicate pt. Google) */}
      <Helmet>
        <html lang={language} />
        <title>{`${project.name}: ${PROJECT_TITLE_SUFFIX[language]} | NOMA Design`}</title>
        {/* FĂRĂ <link rel="preload"> pentru poza principală (scos 2026-10-24):
            Helmet îl punea în <head> ÎNAINTEA meta viewport, deci telefonul îl
            evalua ca pe un ecran de 980px și descărca varianta de 1920px
            (160-255KB), apoi încă o dată pe cea corectă pentru <img>. Poza e
            oricum în HTML, cu fetchpriority="high", deci pornește la fel de devreme. */}
        <meta name="description" content={t.seo.projectDescription.replace('{name}', project.name)} />
        <link rel="canonical" href={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        {hreflangLinks(`/portofoliu/${project.id}`)}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${project.name}: ${PROJECT_TITLE_SUFFIX[language]} | NOMA Design`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:url" content={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        {project.images[0] && <meta property="og:image" content={`https://noma.md${project.images[0]}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        <meta name="twitter:title" content={`${project.name}: ${PROJECT_TITLE_SUFFIX[language]} | NOMA Design`} />
        <meta name="twitter:description" content={project.description} />
        {project.images[0] && <meta name="twitter:image" content={`https://noma.md${project.images[0]}`} />}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              organizationSchema(language),
              {
                '@type': 'WebPage',
                '@id': `${canonicalUrl(`/portofoliu/${project.id}`, language)}#webpage`,
                url: canonicalUrl(`/portofoliu/${project.id}`, language),
                name: `${project.name}: ${PROJECT_TITLE_SUFFIX[language]} | NOMA Design`,
                description: project.description,
                ...(project.images[0] ? { primaryImageOfPage: `https://noma.md${project.images[0]}` } : {}),
                breadcrumb: breadcrumbSchema(language, t.nav.home, [
                  { name: t.nav.portfolio, path: '/portofoliu' },
                  { name: project.name, path: `/portofoliu/${project.id}` },
                ]),
              },
            ],
          })}
        </script>
      </Helmet>
      <Link
        to={withLang('/portofoliu', language)}
        className={`pd-floating-back${backVisible ? '' : ' pd-floating-back--hidden'}`}
        aria-label={t.portfolio.backToPortfolio}
      >
        <div className="pd-floating-back-circle">
          <IconArrowLeft size={20} strokeWidth={1.5} />
        </div>
        <span className="pd-floating-back-label">{t.portfolio.backToPortfolio}</span>
      </Link>

      {/* ── 1. CINEMATIC HERO ── */}
      <section className="pd-hero">
        <div className="pd-hero-bg">
          <PortfolioPicture
            src={project.images[0]}
            /* lățimi REALE din manifest (vezi utils/images.ts) — înainte
               declara `1920w` pentru orice poză, inclusiv pentru cele de
               1280px, deci browserul alegea greșit: pe telefon descărca
               originalul mare (poza principală apărea cu întârziere), pe
               desktop întindea o poză mică peste tot ecranul. */
            sizes="100vw"
            alt={project.name}
            className="pd-hero-img"
            {...({ fetchpriority: 'high' } as any)}
            decoding="sync"
            style={{
              objectPosition: project.heroFocus
                ? project.heroFocus
                : project.id === 3 ? 'center 75%' : (project.id === 5 ? 'center 70%' : (project.id === 2 ? 'center 40%' : 'center center')),
            }}
          />
          <div className="pd-hero-overlay"></div>
        </div>

        <div className="pd-hero-content">
          {/* Intrarea din CSS (ProjectDetails.css, .pd-intro-*), cu valorile
              de dinainte (2026-10-24): pornește odată cu HTML-ul, nu după JS
              (pe telefon lent titlul apărea la ~3.5s, după poză). `key` =
              proiectul ⇒ la trecerea la alt proiect animația se reia. */}
          <h1 key={`t-${project.id}`} className="pd-title pd-intro-title">
            {project.name}
          </h1>
          <div key={`m-${project.id}`} className="pd-meta-details pd-intro-meta">
            <span>{project.year}</span>
            {project.tag && (
              <span className="pd-meta-tag">
                <span className="pd-meta-dot">·</span>
                <span>{project.tag}</span>
              </span>
            )}
            {project.area && (
              <>
                <span className="pd-meta-dot">·</span>
                <span>{project.area}</span>
              </>
            )}
            {project.location && (
              <>
                <span className="pd-meta-dot">·</span>
                <span>{project.location}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. ASYMMETRICAL EDITORIAL GALLERY ── */}
      <section className="pd-gallery-section">
        <div className="pd-gallery-container">
          {/* titlul și filtrele galeriei sunt în primul ecran (telefon și
              desktop) ⇒ aceeași intrare, tot din CSS */}
          <h2 className="pd-gallery-title pd-intro-gtitle">
            {t.portfolio.galleryTitle}
          </h2>
          <p className="pd-gallery-subtitle">
            {t.portfolio.gallerySubtitle}
          </p>

          {/* ── Room Filter Bar ── (doar dacă proiectul are camere clasificate) */}
          {isEditorialLayout && availableCategories.size > 0 && (
            <div className="pd-filter-container pd-intro-filter">
              <div className="pd-filter-bar">
                {[
                  { id: 'all', label: t.portfolio.roomAll },
                  { id: 'living', label: t.portfolio.roomLiving },
                  { id: 'bucatarie', label: t.portfolio.roomBucatarie },
                  { id: 'dormitor', label: t.portfolio.roomDormitor },
                  { id: 'baie', label: t.portfolio.roomBaie }
                ]
                  .filter((cat) => cat.id === 'all' || availableCategories.has(cat.id as RoomCategory))
                  .map((cat) => (
                  <button
                    key={cat.id}
                    className={`pd-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id as any)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isEditorialLayout ? (
            /* FĂRĂ `key={activeCategory}` aici. Cheia pe container forța React
               să demonteze TOATĂ galeria și să monteze una nouă la fiecare
               schimbare de filtru: toate <img>-urile deveneau elemente noi,
               deci `loading="lazy"` relua verificarea de viewport și poza
               trebuia re-decodată — pe telefon (CPU mai slab) asta se vedea
               ca „pozele revin întârziat"; pe desktop decodarea e instant,
               de-aia nu se observa. Fără cheie, React reconciliază: pozele
               care rămân în filtrul nou își păstrează nodul DOM și rămân
               afișate instant. */
            <div className="pd-gallery-editorial">
              {editorialRows.map((row, rowIndex) => (
                <motion.div
                  /* cheie din CONȚINUT, nu din index: la filtrare rândurile se
                     recompun, iar `key={rowIndex}` făcea ca rândul 2 „vechi" să
                     fie reutilizat pentru cu totul alte poze — React păstra
                     nodul dar schimba tot ce e înăuntru. Cu cheia din indecșii
                     pozelor, un rând neschimbat rămâne intact. */
                  key={row.items.map((i) => i.originalIndex).join('-') || rowIndex}
                  className={`pd-gallery-row pd-row-${row.type.toLowerCase()}`}
                  variants={galleryRowVariants}
                  initial="hidden"
                  whileInView="show"
                  /* `once: true` — reveal-ul rulează O SINGURĂ dată, la prima
                     intrare în ecran. Cu `once:false`, orice re-intrare în
                     viewport (inclusiv reașezarea de după filtrare) repornea
                     blur-ul + stagger-ul pe fiecare poză. Regula e deja
                     documentată: reveal repetabil e pentru blocuri mari, nu
                     pentru multe elemente mici deodată.
                     Marjă POZITIVĂ (2026-10-14, „pozele apar greu”): rândul
                     pornește cu ~15% din ecran ÎNAINTE să intre, nu după ce a
                     urcat 12% în el, deci nu mai vezi întâi un loc gol. */
                  viewport={{ once: true, margin: '0px 0px 15% 0px' }}
                >
                  {row.items.map((item) => (
                    <motion.div
                      key={item.originalIndex}
                      className={`pd-gallery-item pd-span-${item.span}`}
                      variants={galleryItemVariants}
                      whileHover={{ y: -8 }}
                      onClick={() => handleOpenLightbox(item.originalIndex)}
                    >
                      <PortfolioPicture
                        src={item.img}
                        withThumbs
                        /* lățimea REALĂ a celulei din mozaic (grilă de 12
                           coloane, max 1300px, pe orice ecran): span 6/4/3 =
                           1/2, 1/3, 1/4. Înainte „50vw, 100vw” ⇒ pe telefon o
                           miniatură de ~130px descărca varianta de 900px. */
                        sizes={GALLERY_SIZES[item.span] ?? GALLERY_SIZES[6]}
                        alt={
                          activeCategory === 'all'
                            ? t.portfolio.detailAlt.replace('{name}', project.name).replace('{n}', String(item.originalIndex + 1))
                            : `${project.name} - ${ROOM_LABEL_KEY[activeCategory] ? t.portfolio[ROOM_LABEL_KEY[activeCategory]] : activeCategory} ${item.originalIndex + 1}`
                        }
                        className="pd-gallery-img"
                        loading="lazy"
                        decoding="async"
                        ref={markImgPending}
                        onLoad={clearImgPending}
                        onError={clearImgPending}
                      />
                      <div className="pd-gallery-overlay">
                        <div className="pd-zoom-icon">
                          <IconZoom size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              className="pd-gallery-grid"
              variants={galleryRowVariants}
              initial="hidden"
              whileInView="show"
              /* `once: true` — vezi nota de la varianta editorială de mai sus */
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            >
              {filteredGallery.map((item, index) => (
                <motion.div
                  key={item.originalIndex}
                  className="pd-gallery-item"
                  variants={galleryItemVariants}
                  whileHover={{ y: -8 }}
                  onClick={() => handleOpenLightbox(index)}
                >
                  <PortfolioPicture
                    src={item.img}
                    withThumbs
                    /* grila filtrată: 3 coloane peste 1024px, 2 sub */
                    sizes="(min-width: 1440px) 430px, (min-width: 1025px) 33vw, 50vw"
                    alt={t.portfolio.detailAlt.replace('{name}', project.name).replace('{n}', String(index + 1))}
                    className="pd-gallery-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="pd-gallery-overlay">
                    <div className="pd-zoom-icon">
                      <IconZoom size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>


      {/* ── 7. LIGHTBOX MODAL VIEWER ── */}
      {lightboxOpen && createPortal(
        <div
          className="pd-lightbox"
          onTouchStart={handleLbTouchStart}
          onTouchEnd={handleLbTouchEnd}
        >
          {/* Filtru SVG pentru efectul liquid-glass al butoanelor */}
          {/* Decoupled Backdrop layer to resolve WebKit/Blink stacking bugs and guarantee rendering */}
          <div className="pd-lightbox-backdrop" onClick={() => setLightboxOpen(false)}></div>
          {/* barele browserului în culoarea marginilor fundalului (vignetă maro închis #2c241d) */}
          <BarScrims top="#2c241d" />

          <button
            className="pd-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label={t.portfolio.closeLightboxAria}
          >
            {/* `simple` — fără liniuțele-fațetă din jurul X-ului */}
            <IconClose size={22} strokeWidth={1.5} simple />
          </button>

          {filteredGallery.length > 1 && (
            <>
              {/* Zone invizibile de tap stânga/dreapta (mobil) */}
              <div className="pd-lightbox-tap-left" onClick={handlePrevImage} aria-label={t.portfolio.prevImageAria} />
              <div className="pd-lightbox-tap-right" onClick={handleNextImage} aria-label={t.portfolio.nextImageAria} />

              {/* Săgeți vizibile (desktop) */}
              <button
                className="pd-lightbox-arrow pd-lightbox-arrow-left"
                onClick={handlePrevImage}
                aria-label={t.portfolio.prevImageAria}
              >
                <IconChevronLeft size={26} strokeWidth={1.5} />
              </button>
              <button
                className="pd-lightbox-arrow pd-lightbox-arrow-right"
                onClick={handleNextImage}
                aria-label={t.portfolio.nextImageAria}
              >
                <IconChevronRight size={26} strokeWidth={1.5} />
              </button>
            </>
          )}

          <div
            className="pd-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pd-lightbox-slide-wrap">
              <AnimatePresence initial={false} custom={lbDirection.current}>
                <motion.img
                  key={activePhotoIndex}
                  custom={lbDirection.current}
                  variants={lbSlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
                    opacity: { duration: 0.25 },
                    scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  }}
                  /* lightbox = poza umple ecranul ⇒ cea mai mare variantă
                     existentă (`-lg` upscalat unde există, altfel originalul) */
                  src={largestSrc(filteredGallery[activePhotoIndex]?.img ?? '')}
                  alt={t.portfolio.lightboxDetailAlt.replace('{name}', project.name).replace('{n}', String(activePhotoIndex + 1))}
                  className="pd-lightbox-img"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -SWIPE_THRESHOLD || offset.x < -80) {
                      lbDirection.current = 1;
                      setActivePhotoIndex((prev) => (prev + 1) % filteredGallery.length);
                    } else if (swipe > SWIPE_THRESHOLD || offset.x > 80) {
                      lbDirection.current = -1;
                      setActivePhotoIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
                    }
                  }}
                />
              </AnimatePresence>
            </div>
            <div className="pd-lightbox-caption">
              <span className="pd-lightbox-caption-project">{project.name}</span>
              <span className="pd-lightbox-caption-divider">—</span>
              <span className="pd-lightbox-counter">{activePhotoIndex + 1} / {filteredGallery.length}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectDetails;
