import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createPortal } from 'react-dom';
import { IconClose, IconArrowLeft, IconZoom, IconChevronLeft, IconChevronRight } from '../components/PremiumIcons';
import { type RoomCategory } from '../data/projects';
import { usePortfolio } from '../context/PortfolioContext';
import { useLanguage } from '../i18n/LanguageContext';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import ScrollDivider from '../components/ScrollDivider';
import './ProjectDetails.css';

const lbSlideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 0.92 }),
  center: { x: 0, opacity: 1, scale: 1, zIndex: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, scale: 0.92, zIndex: 0 }),
};

// swipe = distanță × viteză → gest natural (un flick rapid trece, chiar și scurt)
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;
const SWIPE_THRESHOLD = 8000;

/* Filtru SVG „liquid glass" (refracție reală, stil Apple). Definit o singură
   dată în DOM; e folosit din CSS prin `filter: url(#glass-distortion)`. */
const GlassDistortionFilter = () => (
  <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
    <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.001 0.005" numOctaves={1} seed={17} result="turbulence" />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
        <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
        <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
      <feSpecularLighting in="softMap" surfaceScale={5} specularConstant={1} specularExponent={100} lightingColor="white" result="specLight">
        <fePointLight x={-200} y={-200} z={300} />
      </feSpecularLighting>
      <feComposite in="specLight" operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result="litImage" />
      <feDisplacementMap in="SourceGraphic" in2="softMap" scale={50} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

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
  },
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projects, loading: portfolioLoading } = usePortfolio();

  const project = projects.find((p) => p.id === Number(id));

  // Lightbox & Filtering State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'all' | 'living' | 'bucatarie' | 'dormitor' | 'baie'>('all');
  const [heroInView, setHeroInView] = useState(false);

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
        <title>{`${project.name} — Proiect Design Interior | NOMA Studio`}</title>
        <meta name="description" content={`${project.name}: proiect complet de design interior realizat de NOMA Studio în Chișinău — randări 3D fotorealiste și galerie foto.`} />
        <link rel="canonical" href={`https://noma.md/portofoliu/${project.id}`} />
        <meta property="og:title" content={`${project.name} — Proiect Design Interior | NOMA Studio`} />
        <meta property="og:url" content={`https://noma.md/portofoliu/${project.id}`} />
        {project.images[0] && <meta property="og:image" content={`https://noma.md${project.images[0]}`} />}
      </Helmet>
      <Link to="/portofoliu" className="pd-floating-back" aria-label={t.portfolio.backToPortfolio}>
        <div className="pd-floating-back-circle">
          <IconArrowLeft size={20} strokeWidth={1.5} />
        </div>
        <span className="pd-floating-back-label">{t.portfolio.backToPortfolio}</span>
      </Link>

      {/* ── 1. CINEMATIC HERO ── */}
      <section className="pd-hero">
        <div className="pd-hero-bg">
          <img
            src={project.images[0]}
            alt={project.name}
            className="pd-hero-img"
            fetchPriority="high"
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
            Galeria Proiectului
          </motion.h2>
          <p className="pd-gallery-subtitle">
            Dă click pe orice imagine pentru a o vizualiza la fidelitate maximă
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
                  { id: 'all', label: 'Toate' },
                  { id: 'living', label: 'Living' },
                  { id: 'bucatarie', label: 'Bucătărie' },
                  { id: 'dormitor', label: 'Dormitor' },
                  { id: 'baie', label: 'Baie' }
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
            <div className="pd-gallery-editorial" key={activeCategory}>
              {editorialRows.map((row, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  className={`pd-gallery-row pd-row-${row.type.toLowerCase()}`}
                  variants={galleryRowVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: false, margin: '0px 0px -12% 0px' }}
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
                        src={item.img}
                        alt={
                          activeCategory === 'all'
                            ? `${project.name} - Detaliu ${item.originalIndex + 1}`
                            : `${project.name} - ${activeCategory} ${item.originalIndex + 1}`
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
              viewport={{ once: false, margin: '0px 0px -10% 0px' }}
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
                    src={item.img}
                    alt={`${project.name} - Detaliu ${index + 1}`}
                    className="pd-gallery-img"
                    loading="lazy"
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
          <GlassDistortionFilter />

          {/* Decoupled Backdrop layer to resolve WebKit/Blink stacking bugs and guarantee rendering */}
          <div className="pd-lightbox-backdrop" onClick={() => setLightboxOpen(false)}></div>

          <button 
            className="pd-lightbox-close" 
            onClick={() => setLightboxOpen(false)}
            aria-label="Închide vizualizarea"
          >
            <IconClose size={24} strokeWidth={1.5} />
          </button>

          {filteredGallery.length > 1 && (
            <>
              {/* Zone invizibile de tap stânga/dreapta (mobil) */}
              <div className="pd-lightbox-tap-left" onClick={handlePrevImage} aria-label="Imaginea anterioară" />
              <div className="pd-lightbox-tap-right" onClick={handleNextImage} aria-label="Imaginea următoare" />

              {/* Săgeți vizibile (desktop) */}
              <button
                className="pd-lightbox-arrow pd-lightbox-arrow-left"
                onClick={handlePrevImage}
                aria-label="Imaginea anterioară"
              >
                <IconChevronLeft size={26} strokeWidth={1.5} />
              </button>
              <button
                className="pd-lightbox-arrow pd-lightbox-arrow-right"
                onClick={handleNextImage}
                aria-label="Imaginea următoare"
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
                  src={filteredGallery[activePhotoIndex]?.img}
                  alt={`${project.name} - Detaliu lightbox ${activePhotoIndex + 1}`}
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
