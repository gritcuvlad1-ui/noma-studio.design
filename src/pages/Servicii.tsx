import { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../i18n/LanguageContext';
import {
  HardHat,
  Building2,
  Video,
  Palette,
  Sofa,
  PencilRuler,
  MessageCircleQuestion,
  Workflow,
} from 'lucide-react';
import { IconChevronDown, IconArrowRight, IconZoom, IconClose } from '../components/PremiumIcons';
import { Magnetic } from '../components/Magnetic';
import SectionHeader from '../components/SectionHeader';
import './Servicii.css';
import './ProjectDetails.css'; // For the reused Lightbox modal styles

const SITE_URL = 'https://noma.md';
const OG_IMAGE = `${SITE_URL}/og-servicii.jpg`;
const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Conținut secțiunea CONSULTAȚII (ro / ru / en) ──
   Pozele before/after și moodboard-ul sunt PLACEHOLDER din portofoliu —
   se înlocuiesc cu pozele reale de la consultația respectivă. */
const BA_BEFORE = '/portofoliu-studio2/IMG_2616.webp';
const BA_AFTER = '/portofoliu-studio2/IMG_2620.webp';

// Paleta reală recomandată într-o consultație (coloristică — coduri reale)
const CONSULT_PALETTE = ['#EDE4D6', '#C9B299', '#B08D3E', '#6E5A43', '#3D2B1F'];

type ConsultCopy = {
  eyebrow: string;
  title: string;
  leadAccent: string;
  lead: string;
  leadShort: string;
  formatsTitle: string;
  formats: { icon: 'site' | 'office' | 'online'; title: string; desc: string }[];
  topicsTitle: string;
  topics: { icon: 'color' | 'place' | 'replan' | 'ask' | 'coord'; label: string; short: string }[];
  caseEyebrow: string;
  caseTitle: string;
  caseTitleMobile?: string;
  caseText: string;
  caseTextMobile?: string;
  before: string;
  after: string;
  paletteLabel: string;
  cta: string;
};

const CONSULT_CONTENT: Record<string, ConsultCopy> = {
  ro: {
    eyebrow: 'CONSULTAȚII',
    title: 'Consultații de design',
    leadAccent: 'O întâlnire 1-la-1 cu designerul',
    lead: ' — online sau la fața locului — unde primești răspunsuri și soluții concrete pentru spațiul tău: culoare, amplasare, replanificare, coordonare pe șantier.',
    leadShort: ' — online sau fizic — cu soluții concrete pentru spațiul tău.',
    formatsTitle: 'Trei formate, aceeași grijă pentru detaliu',
    formats: [
      { icon: 'site', title: 'Fizic (pe șantier)', desc: 'Venim la fața locului: vedem spațiul real, măsurăm, identificăm problemele tehnice și coordonăm procesele direct cu echipa.' },
      { icon: 'office', title: 'Fizic (la birou)', desc: 'Ne vedem la studio, cu mostre, paleta de materiale și proiectul pe ecran mare. Ideal pentru decizii de finisaje și mobilier.' },
      { icon: 'online', title: 'Online (la distanță)', desc: 'De oriunde, prin video. Analizăm planuri, amplasare și moodboard în timp real — la fel de eficient ca o întâlnire fizică.' },
    ],
    topicsTitle: 'Ce putem analiza într-o consultație',
    topics: [
      { icon: 'color', label: 'Coloristică — coduri reale, palete care funcționează', short: 'Coloristică' },
      { icon: 'place', label: 'Amplasare mobilier', short: 'Amplasare mobilier' },
      { icon: 'replan', label: 'Replanificare & compartimentare', short: 'Replanificare' },
      { icon: 'ask', label: 'Întrebări generale, fără filtru', short: 'Întrebări generale' },
      { icon: 'coord', label: 'Coordonarea proceselor pe șantier', short: 'Coordonare șantier' },
    ],
    caseEyebrow: 'STUDIU DE CAZ',
    caseTitle: 'O consultație online, transformată în rezultat real',
    caseTitleMobile: 'Rezultatul unei consultații',
    caseText: 'Clienta ne-a scris cu un living gol și fără direcție. Într-o singură consultație online am stabilit amplasarea, am ghidat-o prin moodboard și am ales paleta de culori. Rezultatul — un spațiu coerent și cald, pe care l-a putut aplica pas cu pas, fără nicio deplasare fizică.',
    caseTextMobile: 'Clienta ne-a scris cu un living gol și fără direcție. Într-o singură consultație online am stabilit amplasarea, am ghidat-o prin moodboard și am ales paleta de culori.',
    before: 'Înainte',
    after: 'După',
    paletteLabel: 'Paleta recomandată în consultație',
    cta: 'Programează',
  },
  ru: {
    eyebrow: 'КОНСУЛЬТАЦИИ',
    title: 'Дизайн-консультации',
    leadAccent: 'Личная встреча с дизайнером',
    lead: ' — онлайн или очно — где вы получаете ответы и конкретные решения для вашего пространства: цвет, расстановка, перепланировка, координация на объекте.',
    leadShort: ' — онлайн или очно — с конкретными решениями для вашего пространства.',
    formatsTitle: 'Три формата, одно внимание к деталям',
    formats: [
      { icon: 'site', title: 'Очно (на объекте)', desc: 'Приезжаем на место: видим реальное пространство, замеряем, выявляем технические проблемы и координируем процессы с бригадой.' },
      { icon: 'office', title: 'Очно (в офисе)', desc: 'Встречаемся в студии — с образцами, палитрой материалов и проектом на большом экране. Идеально для решений по отделке и мебели.' },
      { icon: 'online', title: 'Онлайн (удалённо)', desc: 'Откуда угодно, по видео. Разбираем планы, расстановку и мудборд в реальном времени — так же эффективно, как очно.' },
    ],
    topicsTitle: 'Что можно разобрать на консультации',
    topics: [
      { icon: 'color', label: 'Колористика — реальные коды, рабочие палитры', short: 'Колористика' },
      { icon: 'place', label: 'Расстановка мебели', short: 'Расстановка мебели' },
      { icon: 'replan', label: 'Перепланировка и зонирование', short: 'Перепланировка' },
      { icon: 'ask', label: 'Общие вопросы, без фильтра', short: 'Общие вопросы' },
      { icon: 'coord', label: 'Координация процессов на объекте', short: 'Координация объекта' },
    ],
    caseEyebrow: 'КЕЙС',
    caseTitle: 'Онлайн-консультация, ставшая реальным результатом',
    caseTitleMobile: 'Результат консультации',
    caseText: 'Клиентка написала нам с пустой гостиной и без направления. За одну онлайн-консультацию мы определили расстановку, провели её через мудборд и подобрали палитру. Результат — целостная, тёплая гостиная, которую она применила шаг за шагом, без личного визита.',
    caseTextMobile: 'Клиентка написала нам с пустой гостиной и без направления. За одну онлайн-консультацию мы определили расстановку, провели её через мудборд и подобрали палитру.',
    before: 'До',
    after: 'После',
    paletteLabel: 'Палитра, рекомендованная на консультации',
    cta: 'Записаться',
  },
  en: {
    eyebrow: 'CONSULTATIONS',
    title: 'Design consultations',
    leadAccent: 'A 1-to-1 meeting with the designer',
    lead: ' — online or in person — where you get answers and concrete solutions for your space: colour, layout, replanning, on-site coordination.',
    leadShort: ' — online or in person — with concrete solutions for your space.',
    formatsTitle: 'Three formats, the same eye for detail',
    formats: [
      { icon: 'site', title: 'On-site (in person)', desc: 'We come to you: we read the real space, measure, spot the technical issues and coordinate the processes with the crew.' },
      { icon: 'office', title: 'At the studio (in person)', desc: 'We meet in person with samples, the material palette and your project on the big screen. Ideal for finishes and furniture decisions.' },
      { icon: 'online', title: 'Online (remote)', desc: 'From anywhere, over video. We review plans, layout and moodboard in real time — as effective as meeting in person.' },
    ],
    topicsTitle: 'What we can cover in a consultation',
    topics: [
      { icon: 'color', label: 'Colour — real codes, palettes that work', short: 'Colour' },
      { icon: 'place', label: 'Furniture layout', short: 'Furniture layout' },
      { icon: 'replan', label: 'Replanning & partitioning', short: 'Replanning' },
      { icon: 'ask', label: 'General questions, no filter', short: 'General questions' },
      { icon: 'coord', label: 'Coordinating the on-site processes', short: 'Site coordination' },
    ],
    caseEyebrow: 'CASE STUDY',
    caseTitle: 'An online consultation turned into a real result',
    caseTitleMobile: 'Consultation result',
    caseText: 'The client reached out with an empty, directionless living room. In a single online consultation we set the layout, guided her through the moodboard and chose the palette. The result — a cohesive, warm living room she could apply step by step, with no in-person visit.',
    caseTextMobile: 'The client reached out with an empty, directionless living room. In a single online consultation we set the layout, guided her through the moodboard and chose the palette.',
    before: 'Before',
    after: 'After',
    paletteLabel: 'Palette recommended in the consultation',
    cta: 'Book now',
  },
};

// Împrăștiere „random" pe lățime. dir = direcția din care intră (-1 stânga,
// 1 dreapta, 0 din jos), top = decalaj vertical ca să pară aruncate aleatoriu.
// Distanța reală de intrare se calculează din lățimea viewport-ului (vine COMPLET
// din afara ecranului, pe orice ecran).
const CONSULT_SCATTER = [
  { dir: -1, top: -16 },
  { dir: -1, top: 30 },
  { dir: 0, top: -26 },
  { dir: 1, top: 26 },
  { dir: 1, top: 4 },
] as const;

// Observatorul stă pe BANDĂ (mereu în flux), copiii animă din off-screen cu stagger.
// (Dacă `whileInView` ar fi pe fiecare element pornit în afara ecranului, IO nu l-ar
//  vedea niciodată → ar rămâne ascuns. Vezi skill mobile-premium-animations.)
const scatterContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const scatterItemVariants: Variants = {
  hidden: (c: { x: number; y: number }) => ({ opacity: 0, x: c.x, y: c.y }),
  show: { opacity: 1, x: 0, y: 0, transition: { duration: 1, ease: EASE } },
};

const CONSULT_ICONS = {
  site: HardHat,
  office: Building2,
  online: Video,
  color: Palette,
  place: Sofa,
  replan: PencilRuler,
  ask: MessageCircleQuestion,
  coord: Workflow,
} as const;

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
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6 4.5H18L21 8.7L12 20L3 8.7L6 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 8.7H21M6 4.5L7.5 8.7L12 20M18 4.5L16.5 8.7L12 20" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.45" />
  </svg>
);

const Servicii = () => {
  const { language, t } = useLanguage();

  // isMobile determinat SINCRON la prima randare → mobilul folosește din start
  // varianta fără blur (altfel cardurile apar/rămân blurate)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [isPartnerVisitsExpanded, setIsPartnerVisitsExpanded] = useState(false);

  // Lightbox state for consultation before/after images
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const handleOpenLightbox = (src: string) => {
    setActiveImage(src);
    setLightboxOpen(true);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carduri pline de TEXT → FĂRĂ blur (blur pe text licărește pe iOS).
  // Doar opacity + slide-up = la fel de elegant, dar perfect smooth.
  const cardVariants: Variants = {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
    hover: { scale: 1.02, y: -8, transition: { duration: 0.6, ease: EASE } },
  };

  const featuredVariants: Variants = {
    initial: { opacity: 0, y: 40 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
    hover: { scale: 1.03, y: -10, transition: { duration: 0.6, ease: EASE } },
  };

  // ── CONSULTAȚII ──────────────────────────────────────
  const consult = CONSULT_CONTENT[language] ?? CONSULT_CONTENT.ro;

  // Titlu italic cu fade de la negru (primul cuvânt) spre kaki (restul)
  const consultTitleNode = <span className="consult-title-accent">{consult.title}</span>;

  // Container care declanșează stagger pentru copii (apar pe rând).
  const staggerParent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  };

  // Carduri/elemente cu suprafață → opacity+y sigur (fără blur pe text).
  const riseItem: Variants = {
    hidden: { opacity: 0, y: 34 },
    show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
  };

  // Imaginile au suprafață proprie → blur-ul e ok și dă profunzime.
  const mediaItem: Variants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: EASE } },
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
            <div className="pricing-grid" role="list">

              {/* BASIC */}
              <motion.article
                className="pricing-card"
                role="listitem"
                itemScope
                itemType="https://schema.org/Service"
                variants={cardVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: false, margin: '0px 0px -12% 0px' }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
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
                  <Magnetic strength={0.22} className="pricing-cta-magnetic">
                    <a href="/contact?package=basic" className="pricing-card__link">
                      Solicită ofertă
                    </a>
                  </Magnetic>
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
                viewport={{ once: false, margin: '0px 0px -12% 0px' }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
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
                  <Magnetic strength={0.22} className="pricing-cta-magnetic">
                    <a href="/contact?package=tehnic" className="pricing-card__link">
                      Solicită ofertă
                    </a>
                  </Magnetic>
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
                viewport={{ once: false, margin: '0px 0px -12% 0px' }}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
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
                      <IconChevronDown size={14} style={{ transition: 'transform 0.3s ease', transform: isPartnerVisitsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', color: '#b8956a' }} />
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
                  <Magnetic strength={0.22} className="pricing-cta-magnetic">
                    <a href="/contact?package=signature" className="pricing-card__link">
                      Solicită ofertă
                    </a>
                  </Magnetic>
                </div>
                <a href="/contact?package=signature" className="pricing-cta-overlay" aria-label={`Solicită ofertă pachet ${t.services.signatureTitle} — 37€/m²`}>
                  &nbsp;
                </a>
              </motion.article>

            </div>
          </div>
        </section>

        {/* ── CONSULTAȚII ──────────────────────────────── */}
        <section className="consultatii-section" aria-labelledby="consultatii-heading">
          <div className="container">
            {/* Linie delimitatoare NOMA între secțiuni (pachete → consultații) */}
            <div className="consult-divider consult-divider--section" aria-hidden="true">
              <span className="consult-divider-line" />
            </div>

            {/* Fără eyebrow „CONSULTAȚII" — ar dubla titlul „Consultații de design" */}
            <SectionHeader
              as="h2"
              id="consultatii-heading"
              title={consultTitleNode}
            />

            <motion.p
              className="consult-lead"
              variants={riseItem}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            >
              {consult.leadAccent}{isMobile ? consult.leadShort : consult.lead}
            </motion.p>

            {/* ── FORMATE ── */}
            <motion.div
              className="consult-formats"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -12% 0px' }}
            >
              {consult.formats.map((f) => {
                const Icon = CONSULT_ICONS[f.icon];
                return (
                  <motion.article key={f.title} className="consult-format-card" variants={riseItem}>
                    <span className="consult-format-pill" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <h3 className="consult-format-title">{f.title}</h3>
                    <p className="consult-format-desc">{f.desc}</p>
                  </motion.article>
                );
              })}
            </motion.div>

            {/* Linie delimitatoare NOMA — sus (aproape de buline, departe de carduri) */}
            <div className="consult-divider consult-divider--top" aria-hidden="true">
              <span className="consult-divider-line" />
            </div>

            <motion.div
              className="consult-scatter"
              aria-label={consult.topicsTitle}
              variants={scatterContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false, amount: 0.2 }}
            >
              {/* Pe telefon: 4 buline pe 3 rânduri:
                  Rând 1: [0] Coloristică (scurtă, singură)
                  Rând 2: [1] Amplasare mobilier + [4] Coordonare șantier (cele mai lungi, la mijloc)
                  Rând 3: [2] Replanificare (scurtă, singură) */}
              {(isMobile
                ? [consult.topics[0], consult.topics[1], consult.topics[4], consult.topics[2]]
                : consult.topics
              ).map((tp, i) => {
                const Icon = CONSULT_ICONS[tp.icon];
                const s = CONSULT_SCATTER[i] ?? CONSULT_SCATTER[0];
                // Distanță garantat în afara ecranului (raportată la lățimea viewport-ului)
                const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
                const fromX = s.dir * vw * 0.9;
                const fromY = s.dir === 0 ? vw * 0.22 : 0;
                return (
                  <Fragment key={tp.label}>
                    <div className="consult-scatter-slot" style={{ top: `${s.top}px` }}>
                      <motion.div
                        className="consult-scatter-item"
                        title={tp.label}
                        custom={{ x: fromX, y: fromY }}
                        variants={scatterItemVariants}
                      >
                        <span className="consult-scatter-icon" aria-hidden="true">
                          <Icon size={18} strokeWidth={1.7} />
                        </span>
                        <span className="consult-scatter-label">{tp.short}</span>
                      </motion.div>
                    </div>
                  </Fragment>
                );
              })}
            </motion.div>

            {/* Linie delimitatoare NOMA — jos (aproape de buline, departe de studiul de caz) */}
            <div className="consult-divider consult-divider--bottom" aria-hidden="true">
              <span className="consult-divider-line" />
            </div>

            {/* ── STUDIU DE CAZ (before / after) ── */}
            <motion.article
              className="consult-case"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -12% 0px' }}
            >
              <motion.div className="consult-case-media" variants={mediaItem}>
                <figure className="ba-frame" onClick={() => handleOpenLightbox(BA_BEFORE)}>
                  {/* PLACEHOLDER — înlocuiește cu poza REALĂ „înainte" de la consultație */}
                  <img src={BA_BEFORE} alt={`${consult.before} — consultație design NOMA`} loading="lazy" />
                  <figcaption className="ba-label ba-label--before">{consult.before}</figcaption>
                  <div className="consult-zoom-overlay">
                    <div className="consult-zoom-icon">
                      <IconZoom size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </figure>
                <span className="ba-arrow" aria-hidden="true">
                  <IconArrowRight size={18} strokeWidth={2} />
                </span>
                <figure className="ba-frame" onClick={() => handleOpenLightbox(BA_AFTER)}>
                  {/* PLACEHOLDER — înlocuiește cu poza REALĂ „după" de la consultație */}
                  <img src={BA_AFTER} alt={`${consult.after} — consultație design NOMA`} loading="lazy" />
                  <figcaption className="ba-label ba-label--after">{consult.after}</figcaption>
                  <div className="consult-zoom-overlay">
                    <div className="consult-zoom-icon">
                      <IconZoom size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </figure>
              </motion.div>

              <div className="consult-case-body">
                <motion.span className="consult-case-eyebrow" variants={riseItem}>
                  {consult.caseEyebrow}
                </motion.span>
                <motion.h3 className="consult-case-title" variants={riseItem}>
                  {isMobile && consult.caseTitleMobile ? consult.caseTitleMobile : consult.caseTitle}
                </motion.h3>
                <motion.p className="consult-case-text" variants={riseItem}>
                  {isMobile && consult.caseTextMobile ? consult.caseTextMobile : consult.caseText}
                </motion.p>

                <motion.div className="consult-palette" variants={riseItem} aria-label={consult.paletteLabel}>
                  <span className="consult-palette-label">{consult.paletteLabel}</span>
                  <div className="consult-palette-row">
                    {CONSULT_PALETTE.map((hex) => (
                      <span key={hex} className="consult-swatch" title={hex}>
                        <span className="consult-swatch-chip" style={{ backgroundColor: hex }} />
                        <span className="consult-swatch-code">{hex}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>

                <motion.div className="consult-cta-wrap" variants={riseItem}>
                  <Magnetic strength={0.22} className="consult-cta-magnetic">
                    <a href="/contact?package=consultatie" className="consult-cta">
                      {consult.cta}
                      <IconArrowRight size={16} strokeWidth={2} />
                    </a>
                  </Magnetic>
                </motion.div>
              </div>
            </motion.article>
          </div>
        </section>
      </main>

      {/* ── LIGHTBOX MODAL VIEWER ── */}
      {lightboxOpen && activeImage && typeof document !== 'undefined' && createPortal(
        <div
          className="pd-lightbox"
        >
          {/* Decoupled Backdrop layer to resolve WebKit/Blink stacking bugs and guarantee rendering */}
          <div className="pd-lightbox-backdrop" onClick={() => setLightboxOpen(false)}></div>

          <button 
            className="pd-lightbox-close" 
            onClick={() => setLightboxOpen(false)}
            aria-label="Închide vizualizarea"
          >
            <IconClose size={24} strokeWidth={1.5} />
          </button>

          <div
            className="pd-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pd-lightbox-slide-wrap">
              <AnimatePresence initial={false}>
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1, zIndex: 1 }}
                  exit={{ opacity: 0, scale: 0.92, zIndex: 0 }}
                  transition={{
                    opacity: { duration: 0.25 },
                    scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  }}
                  src={activeImage}
                  alt={`Detaliu consultație`}
                  className="pd-lightbox-img"
                />
              </AnimatePresence>
            </div>
            <div className="pd-lightbox-caption">
              <span className="pd-lightbox-caption-project">Consultație NOMA</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Servicii;