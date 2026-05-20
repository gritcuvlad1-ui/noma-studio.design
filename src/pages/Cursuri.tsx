import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
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
} from 'lucide-react';
import { Magnetic } from '../components/Magnetic';
import ScrollDivider from '../components/ScrollDivider';
import './Cursuri.css';

// Move static data to useMemo or keep outside
const EASE = [0.16, 1, 0.3, 1] as const;
const SITE_URL = 'https://nomastudio.md';

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

/* ── Animations ──────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
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
    image: '/pdf/portofolii/caard1.png',
    imageMobile: '/pdf/portofolii/caard1_mobile.png',
    thumbnailColor: 'rgba(189, 162, 126, 0.1)'
  },
  {
    studentName: 'Luiza Militaru',
    projectTitle: 'Design Interior Rezidențial',
    course: 'Modul 3Ds Max',
    file: '/pdf/portofolii/militaru-luiza.pdf',
    image: '/pdf/portofolii/card2.png',
    imageMobile: '/pdf/portofolii/card2_mobile.png',
    thumbnailColor: 'rgba(139, 125, 107, 0.1)'
  },
  {
    studentName: 'Elena Luca',
    projectTitle: 'Portofoliu Vizualizare 3D',
    course: 'Modul 3Ds Max',
    file: '/pdf/portofolii/Portofoliu 3D.pdf',
    image: '/pdf/portofolii/card3.png',
    imageMobile: '/pdf/portofolii/card3_mobile.png',
    thumbnailColor: 'rgba(176, 141, 62, 0.1)'
  }
];

// ScrollDivider removed, now using shared component

interface CourseCardProps {
  course: typeof COURSES[0];
  index: number;
  shouldReduce: boolean;
  isMobile: boolean;
  onExplore: (course: typeof COURSES[0]) => void;
}

const CourseCard = React.memo(({ course, index, shouldReduce, isMobile, onExplore }: CourseCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const Icon = course.badgeIcon;

  return (
    <motion.div
      ref={ref}
      className="nc-card"
      initial={shouldReduce ? false : { opacity: 0, y: isMobile ? 30 : 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.2 }}
      whileHover={!isMobile && !shouldReduce ? {
        scale: 1.02,
        y: -12,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      } : undefined}
      style={{ 
        willChange: 'transform, opacity',
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
              href="/pdf/noma-school-program.pdf"
              download
              className="nc-btn nc-btn--ghost"
              aria-label={`Descarcă programul PDF pentru ${course.title}`}
            >
              <Download size={13} strokeWidth={2} />
              <span>Program PDF</span>
            </a>
          </Magnetic>
        ) : (
          <a
            href="/pdf/noma-school-program.pdf"
            download
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
  const inView = useInView(ref, { once: true, margin: "-100px" });
  
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
  const shouldReduce = useReducedMotion() ?? false;
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

  const heroRef = useRef<HTMLDivElement>(null);
  // Aggressive PDF pre-fetching for instant opening on Safari/Android
  useEffect(() => {
    // Delay prefetching to prioritize main page assets
    const timer = setTimeout(() => {
      const pdfsToPrefetch = [
        ...STUDENT_PORTFOLIOS.map(p => p.file),
        '/pdf/noma-school-program.pdf'
      ];

      pdfsToPrefetch.forEach(url => {
        // 1. Standard prefetch hint
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'fetch';
        document.head.appendChild(link);

        // 2. Background fetch to warm up browser cache (more reliable for Safari)
        if ('fetch' in window) {
          fetch(url, { 
            mode: 'no-cors', 
            // @ts-ignore - fetchPriority is supported in modern browsers
            fetchPriority: 'low' 
          }).catch(() => {});
        }
      });
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, []);

  const statsRef = useRef<HTMLDivElement>(null);

  const handleCTAClick = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    window.location.href = '/contact';
  }, []);

  return (
    <>
      <Helmet>
        <title>NOMA School — Cursuri de Design Interior Chisinau</title>
        <meta
          name="description"
          content="Cursuri de design interior profesionale în Chișinău. AutoCAD, 3Ds Max, proiecte reale. Grup pentru începători și individual pentru avansați. Certificat NOMA."
        />
        <meta name="keywords" content="cursuri design interior Chisinau, curs AutoCAD, curs 3Ds Max, școală design interior Moldova, NOMA school" />
        <link rel="canonical" href={`${SITE_URL}/cursuri`} />
        <meta property="og:title" content="NOMA School — Cursuri de Design Interior" />
        <meta property="og:description" content="Intră în lumea designului interior cu cursurile NOMA. Practică reală, software profesional, certificare." />
        <meta property="og:url" content={`${SITE_URL}/cursuri`} />
      </Helmet>

      <main className="nc-page" id="main-content" role="main">
        <section className="nc-hero" ref={heroRef} aria-labelledby="nc-hero-title">
          <div className="nc-container">
            <motion.div
              className="nc-hero__inner"
              variants={shouldReduce ? {} : stagger}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                id="nc-hero-title"
                className="nc-hero__title"
                variants={shouldReduce ? {} : fadeUp}
              >
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
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut",
                          delay: 1.2
                        }}
                      />
                    </svg>
                </span>
              </motion.h1>

              <div className="divider-luxury-center" aria-hidden="true">
                <motion.span
                  className="line"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.6 }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  style={{ transformOrigin: 'right center' }}
                />
                <motion.span
                  className="diamond"
                  initial={{ scale: 0.001, opacity: 0, rotate: 45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 45 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
                <motion.span
                  className="line"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 0.6 }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  style={{ transformOrigin: 'left center' }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="nc-courses" id="nc-cursuri" aria-labelledby="nc-courses-title">
          <div className="nc-container">
            <motion.div
              className="nc-stats-pill-container"
              ref={statsRef}
              initial={shouldReduce ? { opacity: 1 } : { opacity: 0 }}
              animate={shouldReduce ? { opacity: 1 } : { opacity: 1 }}
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
              {COURSES.map((course, i) => (
                <div key={course.id}>
                  <CourseCard
                    course={course}
                    index={i}
                    shouldReduce={shouldReduce}
                    isMobile={isMobile}
                    onExplore={setSelectedCourse}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <ScrollDivider />

        <section className="nc-student-portfolio" aria-labelledby="nc-portfolio-title">
          <div className="nc-container">
            <header className="nc-section-header">
              <span className="nc-section-badge">Rezultate Tangibile</span>
              <h2 id="nc-portfolio-title" className="nc-section-title">
                Portofoliul <em>Elevilor</em>
              </h2>
            </header>

            <div className="nc-portfolio-grid">
              {STUDENT_PORTFOLIOS.map((project, i) => (
                <motion.div
                  key={i}
                  className="nc-portfolio-card"
                  initial={shouldReduce ? false : { opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  whileHover={!isMobile && !shouldReduce ? {
                    y: -8,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                  } : undefined}
                  style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                >
                  <a 
                    href={project.file} 
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

        <section className="nc-testimonials" aria-labelledby="nc-testimonials-title">
          <div className="nc-container">
            <header className="nc-section-header">
              <h2 id="nc-testimonials-title" className="nc-section-title">
                Ce spun cursanții <em>noștri</em>
              </h2>
            </header>

            <div className="nc-testimonials__grid">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  className="nc-testimonial-card"
                  initial={shouldReduce ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={!isMobile && !shouldReduce ? {
                    y: -4,
                    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                  } : undefined}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
                  style={{ willChange: 'transform, opacity', backfaceVisibility: 'hidden' }}
                >
                  <p className="nc-testimonial__quote">{t.quote}</p>
                  <div className="nc-testimonial__author">
                    <div className="nc-author__avatar">{t.initials}</div>
                    <div className="nc-author__info">
                      <span className="nc-author__name">{t.name}</span>
                      <span className="nc-author__role">{t.role}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* LUXURY PROGRAM MODAL (PORTAL) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedCourse && (
            <motion.div
              key="nc-drawer-backdrop"
              className="nc-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourse(null)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 300000,
                background: 'rgba(255, 254, 252, 0.55)',
                backdropFilter: 'blur(32px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                className="nc-drawer"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.45, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                style={{ 
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '95vw',
                  maxWidth: '1280px',
                  maxHeight: '82vh',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fdfaf5',
                  borderRadius: '24px',
                  boxShadow: '0 40px 120px rgba(26, 21, 16, 0.12)',
                  overflow: 'hidden',
                  border: '1px solid rgba(184, 149, 106, 0.12)',
                  zIndex: 300001
                }}
              >
                <div className="nc-drawer__inner">
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

                  <div className="nc-drawer__content">
                    <p className="nc-drawer__desc">{selectedCourse.tagline}</p>
                    
                    <div className="nc-drawer__modules">
                      {selectedCourse.modules.map((mod, i) => (
                        <div key={i} className="nc-drawer-module">
                          <div className="nc-drawer-module__header">
                            {mod.icon && React.createElement(mod.icon, { 
                              size: 20, 
                              strokeWidth: 1.5, 
                              className: "nc-module-icon" 
                            })}
                            <h3 className="nc-drawer-module__title">{mod.title}</h3>
                          </div>
                          <ul className="nc-drawer-module__list">
                            {mod.items.map((item, j) => (
                              <li key={j} className="nc-drawer-module__item">
                                <CheckCircle2 size={14} strokeWidth={2} className="nc-module-check" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <footer className="nc-drawer__footer">
                    <Magnetic strength={0.15}>
                      <a
                        href="/contact"
                        className="nc-btn nc-btn--noma"
                        onClick={(e) => {
                          setSelectedCourse(null);
                          handleCTAClick(e);
                        }}
                      >
                        <span>Rezervă Locul</span>
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </a>
                    </Magnetic>
                    <a
                      href="/pdf/noma-school-program.pdf"
                      download
                      className="nc-btn nc-btn--ghost"
                    >
                      <Download size={13} strokeWidth={2} />
                      <span>Descarcă Program PDF</span>
                    </a>
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
