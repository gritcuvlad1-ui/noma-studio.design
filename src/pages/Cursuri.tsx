import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useTransform,
  animate
} from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  User, 
  Monitor, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  X,
  Cpu,
  Layers,
  ShieldCheck,
  Award,
  BookOpen,
  Briefcase,
  Zap,
  Layout,
  MousePointer2,
  Star,
} from 'lucide-react';
import { Magnetic } from '../components/Magnetic';
import ScrollDivider from '../components/ScrollDivider';
import SectionHeader from '../components/SectionHeader';
import { useLanguage } from '../i18n/LanguageContext';
import { canonicalUrl, hreflangLinks } from '../utils/seo';
import './Cursuri.css';

// Move static data to useMemo or keep outside
const EASE = [0.16, 1, 0.3, 1] as const;

const getOptimizedPdfUrl = (url: string, isMobile: boolean) => {
  // Google Docs viewer nu funcționează pe localhost deoarece nu poate accesa fișiere locale.
  // Returnăm mereu URL-ul direct pentru ca PDF-urile să poată fi deschise.
  return url;
};

const TESTIMONIALS = [
  {
    initials: 'AM',
    name: 'Ana Maria',
    role: 'Cursantă — Modul Începători',
    quote: '"Cursul NOMA mi-a oferit încrederea de care aveam nevoie. Am învățat nu doar software, ci și cum să gestionez un proiect real de la cap la coadă. Vizitele pe șantier au fost fascinante!"'
  },
  {
    initials: 'DV',
    name: 'Dan Vârlan',
    role: 'Arhitect — Modul Avansați',
    quote: '"Recomand experiența oricărui profesionist care vrea să își ridice standardul. Viteza de lucru în 3Ds Max și calitatea randărilor mele au crescut incredibil după doar câteva săptămâni."'
  },
  {
    initials: 'EL',
    name: 'Elena Luca',
    role: 'Designer — Modul 3Ds Max',
    quote: '"Un mediu de învățare foarte sincer și practic. Nu este doar teorie, ci experiență pură de studio. Echipa NOMA este alături de tine la fiecare pas."'
  }
];

/* ── Testimoniale interactive (rotație + navigare cu buline + carduri animate),
   reconstruite în stil NOMA (crem/auriu, serif premium) ── */
function NomaTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (TESTIMONIALS.length <= 1) return;
    const id = setInterval(
      () => setActiveIndex((i) => (i + 1) % TESTIMONIALS.length),
      6000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section ref={ref} className="nc-testimonials nt-section" aria-labelledby="nc-testimonials-title">
      <div className="nc-container">
        <div className="nt-grid">
          {/* STÂNGA: titlu, subtitlu, navigare */}
          <motion.div
            className="nt-left"
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <span className="nc-section-badge">Testimoniale</span>

            <h2 id="nc-testimonials-title" className="nc-section-title nt-title">
              Ce spun <em>cursanții</em>
            </h2>

            <p className="nt-subtitle">
              Experiențe reale ale celor care au trecut prin atelierele NOMA — de la
              primii pași până la proiecte profesionale.
            </p>
          </motion.div>

          {/* DREAPTA: carduri rotative + navigare dedesubt */}
          <div className="nt-right">
            <div className="nt-stage" aria-live="polite">
              {TESTIMONIALS.map((t, i) => (
                <motion.article
                  key={i}
                  className="nt-card"
                  initial={false}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0,
                    y: activeIndex === i ? 0 : 16,
                    scale: activeIndex === i ? 1 : 0.97,
                    filter: activeIndex === i ? 'blur(0px)' : 'blur(6px)',
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.22, 1, 0.36, 1],
                    opacity: { duration: 0.65 },
                  }}
                  style={{
                    zIndex: activeIndex === i ? 2 : 1,
                    pointerEvents: activeIndex === i ? 'auto' : 'none',
                  }}
                  aria-hidden={activeIndex !== i}
                >
                  <p className="nt-card__quote">{t.quote}</p>

                  <span className="nt-card__divider" aria-hidden="true" />

                  <div className="nt-card__author">
                    <div className="nt-card__avatar">{t.initials}</div>
                    <div className="nt-card__meta">
                      <span className="nt-card__name">{t.name}</span>
                      <span className="nt-card__role">{t.role}</span>
                    </div>
                  </div>
                </motion.article>
              ))}

              <div className="nt-dots" role="tablist" aria-label="Selectează testimonialul">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === i}
                    className={`nt-dot ${activeIndex === i ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Testimonialul ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



// Reveal carduri — EXACT ca pe pagina Portofoliu
const courseCardVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1] as const,
      opacity: { duration: 1.2 },
    },
  },
};

/* ── Course Data ─────────────────────────────────────── */
const COURSES = [
  {
    id: 'grup-incepatori',
    badge: 'GRUP · ÎNCEPĂTORI',
    badgeIcon: Users,
    title: 'De la Zero la Primul Proiect',
    tagline: 'Curs de design interior în grup — fundamente complete',
    description:
      'Creat special pentru persoanele care doresc să intre în domeniu, chiar fără experiență anterioară. Construim totul pas cu pas, clar și practic.',
    duration: '8 săptămâni',
    level: 'Începător',
    format: 'Grup',
    modules: [
      {
        title: 'Modulul 1 — Fundamentul profesiei',
        icon: BookOpen,
        items: [
          'Tipologii de clienți și comunicare profesională',
          'Lucrul corect cu furnizorii și colaboratorii',
          'Materiale, selecții și gestionarea bugetului',
          'Electricitate în proiectele de interior',
          'Apeduct și canalizare explicate practic',
        ],
      },
      {
        title: 'Modulul 2 — Software: AutoCAD & 3Ds Max',
        icon: Monitor,
        items: [
          'AutoCAD: relevee, plan mobilare, electricitate, iluminat, pardoseli, desfășurate',
          '3Ds Max: modelare, materiale, lumini, camere, randări premium',
          'Proiect complet de la desen tehnic la imagine finală',
        ],
      },
      {
        title: 'Experiență practică inclusă',
        icon: Zap,
        items: [
          'Ieșire pe șantier — măsurători reale și etape de execuție',
          'Vizită showroom mobilier — materiale, proporții, soluții tehnice',
          'Vizită showroom obiecte sanitare',
          'Vizită showroom mobilier moale',
        ],
      },
      {
        title: 'Suport complet NOMA',
        icon: Users,
        items: [
          'Instalăm programele necesare pentru curs',
          'Chat dedicat cu răspunsuri și ghidare constantă',
          'Certificat oficial NOMA la finalizare',
          'Posibilitate de practică și integrare în echipă',
        ],
      },
    ],
  },
  {
    id: 'individual-avansat',
    badge: 'INDIVIDUAL · AVANSAT',
    badgeIcon: User,
    title: 'Exclusiv pentru Profesioniști',
    tagline: 'Curs individual 1 la 1 — evoluție rapidă și personalizată',
    description:
      'Destinat designerilor, arhitecților sau persoanelor cu experiență care vor să își ridice nivelul tehnic, viteza de lucru și calitatea proiectelor.',
    duration: '',
    level: 'Avansat',
    format: 'Individual 1:1',
    modules: [
      {
        title: 'Software & Tehnic',
        icon: Cpu,
        items: [
          'AutoCAD — planuri tehnice profesionale',
          '3ds Max — modelare eficientă și scene organizate',
          'Randări premium și atmosferă realistă',
        ],
      },
      {
        title: 'Workflow & Clienți',
        icon: Briefcase,
        items: [
          'Lucrul corect: comunicare și poziționare',
          'Etapele unui proiect de la A la Z',
          'Prezentarea ofertelor și contractelor',
        ],
      },
      {
        title: 'Audit & Perfecționare',
        icon: ShieldCheck,
        items: [
          'Greșeli frecvente și cum pot fi evitate',
          'Analiza proiectelor tale actuale',
          'Corectarea profesionistă a workflow-ului',
        ],
      },
      {
        title: 'Certificare & Resurse',
        icon: Award,
        items: [
          'Diplomă oficială NOMA Individual',
          'Acces la biblioteca de resurse premium',
          'Suport post-curs și networking',
        ],
      },
    ],
  },
  {
    id: '3dsmax-grup',
    badge: 'GRUP · SOFT',
    badgeIcon: Monitor,
    title: '3Ds Max — De la Zero',
    tagline: 'Curs 3Ds Max în grup — pentru începători absoluți',
    description:
      'Învață să stăpânești cel mai puternic software de vizualizare arhitecturală. De la modelarea spațiilor complexe la crearea materialelor realiste și iluminat profesional, acest curs îți oferă instrumentele necesare pentru a crea imagini fotorealiste de impact.',
    duration: '6 săptămâni',
    level: 'Începător',
    format: 'Grup',
    modules: [
      {
        title: 'Interfață & Navigare',
        icon: Layout,
        items: [
          'Setările importante și navigarea corectă',
          'Organizarea scenelor și a layere-lor',
          'Importul planurilor la scară reală',
        ],
      },
      {
        title: 'Modelare & Mobilier',
        icon: Layers,
        items: [
          'Modelare de bază pentru spații interioare',
          'Pereți, tavane, uși și ferestre',
          'Crearea și editarea pieselor de mobilier',
        ],
      },
      {
        title: 'Materiale & Lumină',
        icon: Zap,
        items: [
          'Crearea materialelor și texturi realiste',
          'Iluminare naturală (V-Ray / Corona)',
          'Iluminare artificială și scenarii de lumină',
        ],
      },
      {
        title: 'Randare & Workflow',
        icon: MousePointer2,
        items: [
          'Camere corecte și unghiuri profesionale',
          'Randări curate și atractive',
          'Post-producție și workflow rapid',
        ],
      },
    ],
  },
];

const STATS = [
  { value: '150+', label: 'Cursanți formați' },
  { value: '3', label: 'Programe active' },
  { value: '10+', label: 'Ani de experiență' },
  { value: '100%', label: 'Practică reală' },
];

const STUDENT_PORTFOLIOS = [
  {
    studentName: 'Tataru Inesa',
    projectTitle: 'Apartament Stil Modern',
    course: 'Modul Începători',
    file: '/pdf/portofolii/Proiect (2).pdf',
    image: '/pdf/portofolii/caard1.webp',
    imageMobile: '/pdf/portofolii/caard1_mobile.png',
    thumbnailColor: 'rgba(189, 162, 126, 0.1)'
  },
  {
    studentName: 'Luiza Militaru',
    projectTitle: 'Design Interior Rezidențial',
    course: 'Modul 3Ds Max',
    file: '/pdf/portofolii/militaru-luiza.pdf',
    image: '/pdf/portofolii/card2.webp',
    imageMobile: '/pdf/portofolii/card2_mobile.png',
    thumbnailColor: 'rgba(139, 125, 107, 0.1)'
  },
  {
    studentName: 'Elena Luca',
    projectTitle: 'Portofoliu Vizualizare 3D',
    course: 'Modul 3Ds Max',
    file: '/pdf/portofolii/Portofoliu 3D.pdf',
    image: '/pdf/portofolii/card3.webp',
    imageMobile: '/pdf/portofolii/card3_mobile.png',
    thumbnailColor: 'rgba(176, 141, 62, 0.1)'
  }
];

// ScrollDivider removed, now using shared component

interface CourseCardProps {
  course: typeof COURSES[0];
  isMobile: boolean;
  onExplore: (course: typeof COURSES[0]) => void;
}

const CourseCard = React.memo(({ course, isMobile, onExplore }: CourseCardProps) => {
  const Icon = course.badgeIcon;

  return (
    <motion.div
      className="nc-card"
      variants={courseCardVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      whileHover={!isMobile ? {
        scale: 1.02,
        y: -12,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      } : undefined}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="nc-card__header">
        <div className="nc-card__badge">
          <Icon size={12} strokeWidth={2.5} />
          <span>{course.badge}</span>
        </div>

        <div className="nc-card__meta">
          {course.duration && (
            <>
              <span className="nc-meta-item">{course.duration}</span>
              <span className="nc-meta-divider">·</span>
            </>
          )}
          <span className="nc-meta-item">{course.format}</span>
        </div>
      </div>

      <h2 className="nc-card__title">{course.title}</h2>
      <p className="nc-card__desc">{course.description}</p>

      <button
        className="nc-expand-btn"
        onClick={() => onExplore(course)}
      >
        <span>Explorează programul</span>
        <ArrowRight size={14} strokeWidth={2} />
      </button>

      <div className="nc-card__footer">
        {!isMobile ? (
          <Magnetic strength={0.15}>
            <a
              href={`/contact?course=${course.id}`}
              className="nc-btn nc-btn--noma"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/contact?course=${course.id}`;
              }}
              aria-label={`Înscrie-te la ${course.title}`}
            >
              <span>Vreau să mă înscriu</span>
              <ArrowRight size={14} strokeWidth={2.4} className="btn-icon-svg" />
            </a>
          </Magnetic>
        ) : (
          <a
            href={`/contact?course=${course.id}`}
            className="nc-btn nc-btn--noma"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/contact?course=${course.id}`;
            }}
            aria-label={`Înscrie-te la ${course.title}`}
          >
            <span>Vreau să mă înscriu</span>
            <ArrowRight size={14} strokeWidth={2.4} className="btn-icon-svg" />
          </a>
        )}

        {!isMobile ? (
          <Magnetic strength={0.15}>
            <a
              href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
              {...(isMobile ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
              className="nc-btn nc-btn--ghost"
              aria-label={`Descarcă programul PDF pentru ${course.title}`}
            >
              <Download size={13} strokeWidth={2} />
              <span>Program PDF</span>
            </a>
          </Magnetic>
        ) : (
          <a
            href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
            target="_blank"
            rel="noopener noreferrer"
            className="nc-btn nc-btn--ghost"
            aria-label={`Descarcă programul PDF pentru ${course.title}`}
          >
            <Download size={13} strokeWidth={2} />
            <span>Program PDF</span>
          </a>
        )}
      </div>
    </motion.div>
  );
});

CourseCard.displayName = 'CourseCard';

const Counter = React.memo(({ value }: { value: string }) => {
  const count = useMotionValue(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  
  const num = parseInt(value.replace(/\D/g, '')) || 0;
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    if (inView) {
      const controls = animate(count, num, {
        duration: 2.2,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, num, count]);

  const display = useTransform(count, (v) => Math.round(v) + suffix);

  return <motion.span ref={ref}>{display}</motion.span>;
});

Counter.displayName = 'Counter';

const Cursuri = () => {
  const { language, t } = useLanguage();
  const canonical = canonicalUrl('/cursuri', language);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof COURSES[0] | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    
    document.body.classList.add('nc-page-body');
    return () => {
      window.removeEventListener('resize', check);
      document.body.classList.remove('nc-page-body');
    };
  }, []);

  // Lock body scroll when modal is open — compensăm și lățimea scrollbar-ului
  // ca pagina să NU sară lateral la deschiderea modalului (jump vizibil pe desktop).
  useEffect(() => {
    if (selectedCourse) {
      const originalOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Oprește scroll-ul smooth (Lenis) pe desktop — altfel pagina din spate
      // tot derulează la wheel, pentru că Lenis nu respectă overflow:hidden.
      window.__lenis?.stop();

      return () => {
        document.documentElement.style.overflow = originalOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        window.__lenis?.start();
      };
    }
  }, [selectedCourse]);

  const heroRef = useRef<HTMLDivElement>(null);
  // Am eliminat pre-fetch-ul agresiv al PDF-urilor. Fișierele de 30MB descărcate în fundal blocau complet rețeaua pe mobil, făcând site-ul să se încarce foarte greu.

  const statsRef = useRef<HTMLDivElement>(null);

  const handleCTAClick = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.location.href = '/contact';
  }, []);

  // getOptimizedPdfUrl moved to module scope

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{t.seo.cursuriTitle}</title>
        <meta name="description" content={t.seo.cursuriDescription} />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/cursuri')}
        <meta property="og:title" content={t.seo.cursuriOgTitle} />
        <meta property="og:description" content={t.seo.cursuriOgDescription} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <main className="nc-page" id="main-content" role="main">
        <section className="nc-hero" ref={heroRef} aria-labelledby="nc-hero-title">
          <div className="nc-container">
            <SectionHeader
              as="h1"
              className="nc-hero__inner"
              title={
                <>
                  Te ghidăm profesional
                  <br />
                  <span className="nc-cta__highlight-wrap" style={{ display: 'inline-block', position: 'relative' }}>
                    <em>să alegi corect.</em>
                    <svg className="nc-cta__circle-svg" viewBox="0 0 380 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ top: '55%' }}>
                      <defs>
                        <filter id="ovalGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3.5" result="glow" />
                          <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.path
                        d="M25,60 C35,45 60,35 90,32 C120,29 140,40 170,38 C200,36 220,28 250,30 C280,32 310,45 330,55 C355,68 360,85 345,100 C325,115 280,122 220,118 C160,114 110,125 70,118 C30,111 20,90 25,60 Z"
                        stroke="#c4a24a"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        filter="url(#ovalGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: [0, 0.6, 0.6, 0]
                        }}
                        transition={{
                          duration: 4.5,
                          ease: "easeInOut",
                          delay: 1.2
                        }}
                      />
                    </svg>
                  </span>
                </>
              }
            />
          </div>
        </section>

        <section className="nc-courses" id="nc-cursuri" aria-labelledby="nc-courses-title">
          <div className="nc-container">
            <motion.div
              className="nc-stats-pill-container"
              ref={statsRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <div className="nc-stats-marquee">
                <motion.div 
                  className="nc-stats-track"
                  animate={{
                    x: [0, "-50%"]
                  }}
                  transition={{
                    duration: 35,
                    ease: "linear",
                    repeat: Infinity
                  }}
                >
                  {[...STATS, ...STATS, ...STATS, ...STATS].map((stat, i) => (
                    <div
                      key={i}
                      className="nc-stat-item"
                    >
                      <span className="nc-stat-value">
                        {stat.value}
                      </span>
                      <span className="nc-stat-label">{stat.label}</span>
                      <span className="nc-stat-dot" />
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <div className="nc-courses__grid" role="list">
              {COURSES.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isMobile={isMobile}
                  onExplore={setSelectedCourse}
                />
              ))}
            </div>
          </div>
        </section>

        <ScrollDivider />

        <section className="nc-student-portfolio" aria-labelledby="nc-portfolio-title">
          <div className="nc-container">
            <header className="nc-section-header">
              <span className="nc-section-badge">Rezultate Tangibile</span>
              <div className="sh-clip">
                <motion.h2
                  id="nc-portfolio-title"
                  className="nc-section-title"
                  initial={{ y: '130%' }}
                  whileInView={{ y: '0%' }}
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                  transition={{ duration: 1.4, ease: EASE }}
                >
                  Portofoliul <em>Elevilor</em>
                </motion.h2>
              </div>
            </header>

            <div className="nc-portfolio-grid">
              {STUDENT_PORTFOLIOS.map((project, i) => (
                <motion.div
                  key={i}
                  className="nc-portfolio-card"
                  initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], opacity: { duration: 1.2 }, delay: i * 0.1 }}
                  /* Eliminat whileHover pentru a nu se distanța */
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <a 
                    href={getOptimizedPdfUrl(project.file, isMobile)} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nc-portfolio-card__visual" 
                    style={{ background: project.thumbnailColor, display: 'flex', textDecoration: 'none' }}
                  >
                    {project.image ? (
                      <img 
                        src={project.image} 
                        alt={project.projectTitle} 
                        className="nc-portfolio-card__img" 
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <div className="nc-portfolio-card__overlay">
                      <span className="nc-portfolio-card__overlay-text">Vezi Proiectul</span>
                      <ExternalLink size={20} strokeWidth={1.5} />
                    </div>
                  </a>
                  <div className="nc-portfolio-card__content">
                    <span className="nc-portfolio-card__course">{project.course}</span>
                    <h3 className="nc-portfolio-card__title">{project.projectTitle}</h3>
                    <p className="nc-portfolio-card__student">Realizat de {project.studentName}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <ScrollDivider />

        <NomaTestimonials />
      </main>

      {/* LUXURY PROGRAM MODAL (PORTAL) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {selectedCourse && (
            <motion.div
              key="nc-drawer-backdrop"
              className="nc-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => setSelectedCourse(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 300000,
                background: 'rgba(45, 36, 28, 0.45)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                willChange: 'opacity',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <motion.div
                className="nc-drawer"
                /* Sheet-ul DOAR glisează (fără fade) — curat, fără să se vadă
                   pagina prin el în timpul mișcării. Doar backdrop-ul face fade. */
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                exit={{ y: '100%', transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } }}
                transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  position: 'relative',
                  width: '100%',
                  maxWidth: '1280px',
                  maxHeight: '92dvh',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fdfaf5',
                  borderRadius: '20px 20px 0 0',
                  boxShadow: '0 -8px 40px rgba(26, 21, 16, 0.18)',
                  overflow: 'hidden',
                  border: '1px solid rgba(184, 149, 106, 0.12)',
                  zIndex: 300001,
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <div className="nc-drawer__inner">
                  {/* Drag handle */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
                    <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(184,149,106,0.25)' }} />
                  </div>
                  <header className="nc-drawer__header">
                    <div className="nc-drawer__header-left">
                      <div className="nc-drawer__badge-container">
                        {selectedCourse.badgeIcon && React.createElement(selectedCourse.badgeIcon, { 
                          size: 12, 
                          className: "nc-drawer__badge-icon" 
                        })}
                        <span className="nc-drawer__badge">{selectedCourse.badge}</span>
                      </div>
                      <h2 className="nc-drawer__title">{selectedCourse.title}</h2>
                    </div>
                    <button 
                      className="nc-drawer__close" 
                      onClick={() => setSelectedCourse(null)}
                      aria-label="Închide detaliile"
                    >
                      <X size={20} strokeWidth={1.5} />
                    </button>
                  </header>

                  <div className="nc-drawer__content"
                    style={{
                      WebkitOverflowScrolling: 'touch',
                      overscrollBehavior: 'contain',
                    }}
                  >
                    
                    <div className="nc-drawer__modules">
                      {selectedCourse.modules.map((mod, i) => (
                        <div key={i} className="nc-drawer-module">
                          <div className="nc-drawer-module__header">
                            {mod.icon && React.createElement(mod.icon, { 
                              size: 24, /* Mărit de la 20 */
                              strokeWidth: 1.5, 
                              className: "nc-module-icon" 
                            })}
                            <h3 className="nc-drawer-module__title">{mod.title}</h3>
                          </div>
                          <ul className="nc-drawer-module__list">
                            {mod.items.map((item, j) => (
                              <li key={j} className="nc-drawer-module__item">
                                <CheckCircle2 size={16} strokeWidth={2} className="nc-module-check" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <footer className="nc-drawer__footer">
                    <Magnetic strength={0.2}>
                      <a
                        href={`/contact?course=${selectedCourse.id}`}
                        className="nc-btn nc-btn--noma"
                        onClick={(e) => {
                          e.preventDefault();
                          const courseId = selectedCourse.id;
                          setSelectedCourse(null);
                          window.location.href = `/contact?course=${courseId}`;
                        }}
                      >
                        <span>Rezervă Locul</span>
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </a>
                    </Magnetic>
                    <Magnetic strength={0.15}>
                      <a
                        href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
                        {...(isMobile ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
                        className="nc-btn nc-btn--ghost"
                      >
                        <Download size={13} strokeWidth={2} />
                        <span>Descarcă Program PDF</span>
                      </a>
                    </Magnetic>
                  </footer>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Cursuri;
