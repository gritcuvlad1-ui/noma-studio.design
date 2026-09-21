import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { createPortal } from 'react-dom';
import { IconClose, IconArrowLeft, IconZoom, IconChevronLeft, IconChevronRight } from '../components/PremiumIcons';
import { type RoomCategory } from '../data/projects';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { canonicalUrl, hreflangLinks, organizationSchema, breadcrumbSchema } from '../utils/seo';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { buildSrcSet, smallestSrc, largestSrc } from '../utils/images';
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

const galleryItemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    /* `blur(0px)` NU e gratuit: chiar și cu rază zero, un `filter` activ ține
       elementul pe un strat de compoziție separat, care se repictează la
       fiecare cadru de scroll. Cu zeci de poze în galerie, pe GPU-ul unui
       telefon se adună. `transitionEnd` scoate proprietatea complet după ce
       animația s-a terminat — stratul dispare, poza rămâne clară. */
    transitionEnd: { filter: 'none' },
  },
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { projects, loading: portfolioLoading } = usePortfolio();

  const project = projects.find((p) => p.id === Number(id));

  // Lightbox & Filtering State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'living' | 'bucatarie' | 'dormitor' | 'baie'>('all');
  const [heroInView, setHeroInView] = useState(false);
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

  // Trigger hero reveal immediately on project change (mount)
  useEffect(() => {
    if (!project) return;
    setHeroInView(false);
    const timer = setTimeout(() => {
      setHeroInView(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [project]);

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
  const generateEditorialRows = (images: string[]) => {
    const rowTypes = ['B', 'C_LEFT', 'B', 'C_MID', 'B', 'C_RIGHT', 'A'];
    const rows = [];
    let i = 0;
    while (i < images.length) {
      const remaining = images.length - i;
      
      if (remaining === 4) {
        rows.push({
          type: 'B',
          items: [
            { img: images[i], originalIndex: i, span: 6 },
            { img: images[i + 1], originalIndex: i + 1, span: 6 }
          ]
        });
        rows.push({
          type: 'B',
          items: [
            { img: images[i + 2], originalIndex: i + 2, span: 6 },
            { img: images[i + 3], originalIndex: i + 3, span: 6 }
          ]
        });
        i += 4;
      } else if (remaining === 2) {
        rows.push({
          type: 'B',
          items: [
            { img: images[i], originalIndex: i, span: 6 },
            { img: images[i + 1], originalIndex: i + 1, span: 6 }
          ]
        });
        i += 2;
      } else if (remaining === 1) {
        rows.push({
          type: 'B',
          items: [{ img: images[i], originalIndex: i, span: 12 }]
        });
        i += 1;
      } else {
        const type = rowTypes[(i / 3) % rowTypes.length];
        let spans = [4, 4, 4];
        if (type === 'C_LEFT') spans = [6, 3, 3];
        if (type === 'C_MID') spans = [3, 6, 3];
        if (type === 'C_RIGHT') spans = [3, 3, 6];

        rows.push({
          type,
          items: [
            { img: images[i], originalIndex: i, span: spans[0] },
            { img: images[i + 1], originalIndex: i + 1, span: spans[1] },
            { img: images[i + 2], originalIndex: i + 2, span: spans[2] }
          ]
        });
        i += 3;
      }
    }
    return rows;
  };

  // Galeria filtrată (Living/Bucătărie/...) folosește ACELAȘI grid editorial
  // (forme/span-uri variate) ca „Toate" — doar setul de imagini diferă.
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
        <title>{`${project.name} — ${PROJECT_TITLE_SUFFIX[language]} | NOMA Studio`}</title>
        {/* Preload pt. poza principală: pornește descărcarea din <head>, în
            paralel cu parsarea restului paginii, în loc s-o aștepte până
            React randează <img>-ul. `imageSrcSet`+`imageSizes` trebuie să fie
            IDENTICE cu cele de pe <img>, altfel browserul preîncarcă o
            variantă și apoi descarcă alta — două descărcări în loc de una. */}
        {/* `fetchpriority` (nu `fetchPriority`) — atributul HTML real e
            lowercase; React randează `fetchPriority` camelCase ca atare pe
            server (SSR), dar hidratarea pe client îl compară cu forma
            lowercase și le vede diferite ⇒ mismatch (eroare React #418,
            confirmată în consolă). Aceeași lecție deja aplicată în
            HeroProjectSlider.tsx — cast `any`, TS n-are `fetchpriority`
            în tipurile native de JSX. */}
        <link
          rel="preload"
          as="image"
          href={smallestSrc(project.images[0])}
          imageSrcSet={buildSrcSet(project.images[0])}
          imageSizes="100vw"
          {...({ fetchpriority: 'high' } as any)}
        />
        <meta name="description" content={t.seo.projectDescription.replace('{name}', project.name)} />
        <link rel="canonical" href={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        {hreflangLinks(`/portofoliu/${project.id}`)}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${project.name} — ${PROJECT_TITLE_SUFFIX[language]} | NOMA Studio`} />
        <meta property="og:description" content={project.description} />
        <meta property="og:url" content={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        {project.images[0] && <meta property="og:image" content={`https://noma.md${project.images[0]}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl(`/portofoliu/${project.id}`, language)} />
        <meta name="twitter:title" content={`${project.name} — ${PROJECT_TITLE_SUFFIX[language]} | NOMA Studio`} />
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
                name: `${project.name} — ${PROJECT_TITLE_SUFFIX[language]} | NOMA Studio`,
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
          <img
            src={smallestSrc(project.images[0])}
            /* lățimi REALE din manifest (vezi utils/images.ts) — înainte
               declara `1920w` pentru orice poză, inclusiv pentru cele de
               1280px, deci browserul alegea greșit: pe telefon descărca
               originalul mare (poza principală apărea cu întârziere), pe
               desktop întindea o poză mică peste tot ecranul. */
            srcSet={buildSrcSet(project.images[0])}
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
          <motion.h1
            className="pd-title"
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            {project.name}
          </motion.h1>
          <motion.div
            className="pd-meta-details"
            initial={{ opacity: 0, y: 14 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          >
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
          </motion.div>
        </div>
      </section>

      {/* ── 5. ASYMMETRICAL EDITORIAL GALLERY ── */}
      <section className="pd-gallery-section">
        <div className="pd-gallery-container">
          <motion.h2
            className="pd-gallery-title"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.portfolio.galleryTitle}
          </motion.h2>
          <p className="pd-gallery-subtitle">
            {t.portfolio.gallerySubtitle}
          </p>

          {/* ── Room Filter Bar ── (doar dacă proiectul are camere clasificate) */}
          {isEditorialLayout && availableCategories.size > 0 && (
            <motion.div
              className="pd-filter-container"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
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
            </motion.div>
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
                     pentru multe elemente mici deodată. */
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                >
                  {row.items.map((item) => (
                    <motion.div
                      key={item.originalIndex}
                      className={`pd-gallery-item pd-span-${item.span}`}
                      variants={galleryItemVariants}
                      whileHover={{ y: -8 }}
                      onClick={() => handleOpenLightbox(item.originalIndex)}
                    >
                      <img
                        src={smallestSrc(item.img)}
                        srcSet={buildSrcSet(item.img)}
                        /* pozele din bandă ocupă ~jumătate din lățime pe
                           desktop, toată lățimea pe mobil — fără `sizes`,
                           browserul presupune 100vw și supra-descarcă */
                        sizes="(min-width: 901px) 50vw, 100vw"
                        alt={
                          activeCategory === 'all'
                            ? t.portfolio.detailAlt.replace('{name}', project.name).replace('{n}', String(item.originalIndex + 1))
                            : `${project.name} - ${ROOM_LABEL_KEY[activeCategory] ? t.portfolio[ROOM_LABEL_KEY[activeCategory]] : activeCategory} ${item.originalIndex + 1}`
                        }
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
                  <img
                    src={smallestSrc(item.img)}
                    srcSet={buildSrcSet(item.img)}
                    sizes="(min-width: 901px) 50vw, 100vw"
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
