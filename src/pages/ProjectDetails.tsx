import { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, ArrowRight, ZoomIn } from 'lucide-react';
import { projects } from '../data/projects';
import { useLanguage } from '../i18n/LanguageContext';
import { motion } from 'framer-motion';
import ScrollDivider from '../components/ScrollDivider';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  // Redirect if project is not found
  useEffect(() => {
    if (!project) {
      navigate('/portofoliu');
    }
  }, [project, navigate]);

  // Synchronous scroll to top on mount to eliminate layout flash
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const getCategoryForIndex = (index: number, total: number): 'living' | 'bucatarie' | 'dormitor' | 'baie' => {
    if (project.id === 1) {
      if ([0, 1, 2, 3, 4, 5, 15].includes(index)) return 'living';
      if ([6, 7, 8, 9, 16, 17].includes(index)) return 'bucatarie';
      if ([10, 11, 13, 14, 20, 21].includes(index)) return 'dormitor';
      return 'baie';
    } else {
      // Dynamically distribute for other projects
      const chunk = total / 4;
      if (index < chunk) return 'living';
      if (index < chunk * 2) return 'bucatarie';
      if (index < chunk * 3) return 'dormitor';
      return 'baie';
    }
  };

  const filteredGallery = isEditorialLayout && activeCategory !== 'all'
    ? galleryImages.map((img, originalIndex) => ({ img, originalIndex }))
        .filter(item => getCategoryForIndex(item.originalIndex, galleryImages.length) === activeCategory)
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

  const handleOpenLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + filteredGallery.length) % filteredGallery.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % filteredGallery.length);
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

  const editorialRows = isEditorialLayout ? generateEditorialRows(galleryImages) : [];

  return (
    <div className="project-details-page">
      <Link to="/portofoliu" className="pd-floating-back" aria-label={t.portfolio.backToPortfolio}>
        <div className="pd-floating-back-circle">
          <ArrowLeft size={20} strokeWidth={1.5} />
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
            style={{
              objectPosition: project.id === 3 ? 'center 75%' : (project.id === 5 ? 'center 70%' : (project.id === 2 ? 'center 40%' : 'center center')),
            }}
          />
          <div className="pd-hero-overlay"></div>
        </div>

        <div className="pd-hero-content">
          <h1 className={`pd-title noma-reveal ${heroInView ? 'in-view' : ''}`} style={{ '--delay': '0.2s' } as React.CSSProperties}>
            {project.name}
          </h1>
          <div className={`pd-meta-details noma-reveal ${heroInView ? 'in-view' : ''}`} style={{ '--delay': '0.35s' } as React.CSSProperties}>
            <span>{project.year}</span>
            {project.tag && (
              <>
                <span className="pd-meta-dot">·</span>
                <span>{project.tag}</span>
              </>
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
          <ScrollDivider />
          <h2 className="pd-gallery-title noma-reveal">Galeria Proiectului</h2>
          <p className="pd-gallery-subtitle noma-reveal">
            Dă click pe orice imagine pentru a o vizualiza la fidelitate maximă
          </p>

          {/* ── Room Filter Bar ── */}
          {isEditorialLayout && (
            <div className="pd-filter-container noma-reveal">
              <div className="pd-filter-bar">
                {[
                  { id: 'all', label: 'Toate' },
                  { id: 'living', label: 'Living' },
                  { id: 'bucatarie', label: 'Bucătărie' },
                  { id: 'dormitor', label: 'Dormitor' },
                  { id: 'baie', label: 'Baie' }
                ].map((cat) => (
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
            activeCategory === 'all' ? (
              <div className="pd-gallery-editorial">
                {editorialRows.map((row, rowIndex) => (
                  <div key={rowIndex} className={`pd-gallery-row pd-row-${row.type.toLowerCase()}`}>
                    {row.items.map((item) => (
                      <div
                        key={item.originalIndex}
                        className={`pd-gallery-item noma-reveal pd-span-${item.span}`}
                        style={{ '--delay': `${(item.originalIndex % 3) * 0.1}s` } as React.CSSProperties}
                        onClick={() => handleOpenLightbox(item.originalIndex)}
                      >
                        <img 
                          src={item.img} 
                          alt={`${project.name} - Detaliu ${item.originalIndex + 1}`} 
                          className="pd-gallery-img"
                          loading="lazy"
                        />
                        <div className="pd-gallery-overlay">
                          <div className="pd-zoom-icon">
                            <ZoomIn size={20} strokeWidth={1.5} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="pd-gallery-grid filtered">
                {filteredGallery.map((item, index) => (
                  <div
                    key={item.originalIndex}
                    className="pd-gallery-item noma-reveal"
                    style={{ '--delay': `${(index % 3) * 0.08}s` } as React.CSSProperties}
                    onClick={() => handleOpenLightbox(index)}
                  >
                    <img 
                      src={item.img} 
                      alt={`${project.name} - ${activeCategory} ${index + 1}`} 
                      className="pd-gallery-img"
                      loading="lazy"
                    />
                    <div className="pd-gallery-overlay">
                      <div className="pd-zoom-icon">
                        <ZoomIn size={20} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="pd-gallery-grid">
              {filteredGallery.map((item, index) => (
                <div
                  key={item.originalIndex}
                  className="pd-gallery-item noma-reveal"
                  style={{ '--delay': `${(index % 3) * 0.1}s` } as React.CSSProperties}
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
                      <ZoomIn size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <ScrollDivider />

      {/* ── 2. MATERIALS MARQUEE ── */}
      <section className="pd-materials-marquee-section">
        <div className="pd-materials-header noma-reveal" style={{ '--delay': '0.1s' } as React.CSSProperties}>
          <h2 className="pd-materials-title">Materiale & Finisaje</h2>
        </div>
        <div className="pd-materials-marquee-container noma-reveal" style={{ '--delay': '0.2s', overflow: 'hidden', width: '100%', position: 'relative' } as React.CSSProperties}>
          <div className="pd-materials-marquee" style={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
            <motion.div
              className="pd-materials-track"
              style={{ display: 'flex', flexWrap: 'nowrap', width: 'max-content' }}
              animate={{
                x: [0, "-50%"]
              }}
              transition={{
                duration: 45, // balanced, luxurious continuous movement
                ease: "linear",
                repeat: Infinity
              }}
            >
              {(() => {
                const list = project.materials && project.materials.length > 0
                  ? project.materials
                  : [
                      'Lemn de stejar periat',
                      'Piatră naturală cu finisaj mat',
                      'Profile metalice bronz-auriu',
                      'Tencuieli decorative cu micro-textură',
                      'Sticlă securizată extra-clară',
                      'Țesături din in și bumbac organic',
                      'Marmură Calacatta',
                      'Accente de alamă periată',
                      'Microciment fin'
                    ];
                // Replicate items so that the moving track has sufficient width to cycle seamlessly
                const items = [...list, ...list, ...list, ...list, ...list, ...list];
                return items.map((mat, i) => (
                  <div key={i} className="pd-material-item">
                    <span className="pd-material-bullet">✦</span>
                    <span className="pd-material-name">{mat}</span>
                  </div>
                ));
              })()}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 7. LIGHTBOX MODAL VIEWER ── */}
      {lightboxOpen && createPortal(
        <div className="pd-lightbox">
          {/* Decoupled Backdrop layer to resolve WebKit/Blink stacking bugs and guarantee rendering */}
          <div className="pd-lightbox-backdrop" onClick={() => setLightboxOpen(false)}></div>

          <button 
            className="pd-lightbox-close" 
            onClick={() => setLightboxOpen(false)}
            aria-label="Închide vizualizarea"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {filteredGallery.length > 1 && (
            <>
              <button 
                className="pd-lightbox-arrow pd-lightbox-arrow-left" 
                onClick={handlePrevImage}
                aria-label="Imaginea anterioară"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </button>
              
              <button 
                className="pd-lightbox-arrow pd-lightbox-arrow-right" 
                onClick={handleNextImage}
                aria-label="Imaginea următoare"
              >
                <ArrowRight size={20} strokeWidth={1.5} />
              </button>
            </>
          )}

          <div className="pd-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={filteredGallery[activePhotoIndex]?.img} 
              alt={`${project.name} - Detaliu lightbox ${activePhotoIndex + 1}`} 
              className="pd-lightbox-img"
            />
            <div className="pd-lightbox-caption">
              <span className="pd-lightbox-counter">
                {activePhotoIndex + 1} / {filteredGallery.length}
              </span>
              {project.name} — Detaliu Design
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProjectDetails;
