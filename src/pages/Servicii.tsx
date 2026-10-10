import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import type { Language } from '../i18n/types';
import { canonicalUrl, hreflangLinks, organizationSchema, ORG_ID } from '../utils/seo';
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
import { RevealCard, useRevealActive } from '../components/HomeReveal';
import './Servicii.css';
import './ProjectDetails.css'; // For the reused Lightbox modal styles

const SITE_URL = 'https://noma.md';
// era `/og-servicii.jpg` — fișier inexistent (404 la partajare pe
// Facebook/WhatsApp/Twitter); repointat spre og-image.jpg, singurul real.
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const EASE = [0.16, 1, 0.3, 1] as const;
const INLANG: Record<string, string> = { ro: 'ro-MD', ru: 'ru-MD', en: 'en' };

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
    leadAccent: 'O discuție directă cu designerul',
    lead: ', online sau la tine acasă. Vii cu o întrebare despre culoare, despre mobilier sau despre cum reorganizezi spațiul, și pleci cu un răspuns clar.',
    leadShort: ', online sau la tine acasă, cu un răspuns clar pentru spațiul tău.',
    formatsTitle: 'Trei formate, aceeași grijă pentru detaliu',
    formats: [
      { icon: 'site', title: 'Fizic (pe șantier)', desc: 'Venim la tine pe șantier, pentru că un spațiu se înțelege mult mai bine cu piciorul în el decât dintr-o poză. Acolo luăm măsurile corecte și rezolvăm pe loc, cu echipa, tot ce ține de partea tehnică.' },
      { icon: 'office', title: 'Fizic (la birou)', desc: 'Ne vedem la studio, unde poți ține o mostră în mână înainte s-o alegi și poți vedea proiectul pe ecran mare, nu pe telefon. Aici se iau cele mai bune decizii de finisaje și mobilier.' },
      { icon: 'online', title: 'Online (la distanță)', desc: 'De oriunde ai fi, un apel video e suficient. Vezi planul schimbându-se live pe ecran, pe măsură ce discutăm unde merge fiecare piesă de mobilier, și ieșim din apel cu un moodboard deja conturat. E la fel de eficient ca o întâlnire față în față.' },
    ],
    topicsTitle: 'Ce putem analiza într-o consultație',
    topics: [
      { icon: 'color', label: 'Coloristică — coduri reale, o paletă care funcționează', short: 'Coloristică' },
      { icon: 'place', label: 'Amplasare mobilier', short: 'Amplasare mobilier' },
      { icon: 'replan', label: 'Replanificare & compartimentare', short: 'Replanificare' },
      { icon: 'ask', label: 'Întrebări generale, fără filtru', short: 'Întrebări generale' },
      { icon: 'coord', label: 'Coordonarea proceselor pe șantier', short: 'Coordonare șantier' },
    ],
    caseEyebrow: 'STUDIU DE CAZ',
    caseTitle: 'De la living gol, la spațiu cu personalitate',
    caseTitleMobile: 'Rezultatul unei consultații',
    caseText: 'Ne-a scris cu un living complet gol și fără nicio idee de unde să înceapă. Într-o singură consultație online i-am pus mobilierul pe hârtie, i-am arătat moodboard-ul pas cu pas și am decis paleta de culori pe loc. A ieșit un spațiu cald, coerent, pe care l-a montat singură, fără să calce vreodată pe la studio.',
    caseTextMobile: 'Ne-a scris cu un living complet gol și fără nicio idee de unde să înceapă. Într-o consultație online i-am pus mobilierul pe hârtie, i-am arătat moodboard-ul și am decis paleta de culori.',
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

/* ═══════════════════════════════════════════════════════════════
   FAQ (Faza 3, AEO) — răspunsuri scurte, VIZIBILE direct pe pagină
   (nu ascunse după un click), fiindcă un AI care citează un pasaj
   trebuie să-l găsească deja randat, nu după o interacțiune. Fiecare
   răspuns e o cifră/fapt deja prezent altundeva pe pagină (prețuri,
   conținutul pachetelor, formatele de consultație) — nimic inventat
   aici. Marcat și cu schema FAQPage (vezi getSchemaData mai jos). */
type FaqItem = { question: string; answer: string };

const FAQ_CONTENT: Record<string, FaqItem[]> = {
  ro: [
    {
      question: 'Cât costă un proiect de design interior la NOMA Studio?',
      answer: 'Prețurile pornesc de la 17€/m² pentru pachetul Basic, urcă la 28€/m² pentru Tehnic și ajung la 37€/m² pentru Signature. Pentru design exterior, oferta se stabilește individual, în funcție de proiect.',
    },
    {
      question: 'Ce include pachetul NOMA Basic?',
      answer: 'Pachetul acoperă o vizită inițială pe șantier, un plan releveu și un plan de amplasare mobilier, până la planul final de compartimentare. La final primești o variantă de randări 3D, fără modificări ulterioare.',
    },
    {
      question: 'Ce include pachetul NOMA Tehnic?',
      answer: 'Primești un album tehnic complet și 2 variante de amplasare mobilier, plus randări 3D cu câte o modificare pe cameră. Pachetul include și consultanță post-proiect.',
    },
    {
      question: 'Ce include pachetul NOMA Signature?',
      answer: 'Aici intră compartimentările interioare ale mobilierului și supravegherea pe șantier, plus consultanță post-proiect. Ai și 5 vizite în magazine partenere, incluse în pachet.',
    },
    {
      question: 'Pot avea o consultație de design online?',
      answer: 'Da. Poți alege consultația online, prin video, cu planuri și moodboard analizate în timp real. Sau fizic, la birou cu mostre și proiectul pe ecran mare, ori direct pe șantier, cu măsurători și coordonare cu echipa.',
    },
    {
      question: 'NOMA Studio se ocupă și de design exterior?',
      answer: 'Da, ne ocupăm și de design exterior, fără preț fix afișat. Oferta se stabilește individual, în funcție de proiect.',
    },
  ],
  ru: [
    {
      question: 'Сколько стоит проект дизайна интерьера в NOMA Studio?',
      answer: 'Цены начинаются от 17€/м² для пакета Basic, 28€/м² для Tehnic и 37€/м² для Signature. Для дизайна экстерьера стоимость определяется индивидуально, в зависимости от проекта.',
    },
    {
      question: 'Что входит в пакет NOMA Basic?',
      answer: 'Первичный выезд на объект, обмерный план, один план расстановки мебели, финальный план зонирования и один вариант 3D-визуализации, без последующих правок.',
    },
    {
      question: 'Что входит в пакет NOMA Tehnic?',
      answer: 'Полный технический альбом, 2 варианта расстановки мебели, 3D-визуализация с одной правкой на комнату и консультация после проекта.',
    },
    {
      question: 'Что входит в пакет NOMA Signature?',
      answer: 'Внутренняя компоновка мебели, авторский надзор на объекте, консультация после проекта и 5 визитов в магазины-партнёры.',
    },
    {
      question: 'Можно ли получить консультацию по дизайну онлайн?',
      answer: 'Да. Консультация может быть онлайн (по видео, с разбором планов и мудборда в реальном времени), очно в офисе (с образцами и проектом на большом экране) или очно на объекте (замеры и координация напрямую с бригадой).',
    },
    {
      question: 'NOMA Studio занимается дизайном экстерьера?',
      answer: 'Да — без фиксированной цены, стоимость дизайна экстерьера определяется индивидуально, в зависимости от проекта.',
    },
  ],
  en: [
    {
      question: 'How much does an interior design project cost at NOMA Studio?',
      answer: 'Prices start from €17/m² for the Basic package, €28/m² for Tehnic and €37/m² for Signature. For exterior design, the offer is set individually, based on the project.',
    },
    {
      question: 'What does the NOMA Basic package include?',
      answer: 'An initial site visit, a survey plan, one furniture layout plan, a final space-division plan and one round of 3D renders, with no further revisions.',
    },
    {
      question: 'What does the NOMA Tehnic package include?',
      answer: 'A complete technical album, 2 furniture layout options, 3D renders with one revision per room, and post-project consulting.',
    },
    {
      question: 'What does the NOMA Signature package include?',
      answer: 'Interior furniture layout planning, on-site supervision, post-project consulting and 5 visits to partner showrooms.',
    },
    {
      question: 'Can I have a design consultation online?',
      answer: 'Yes. The consultation can be online (by video, reviewing plans and moodboards in real time), in person at the office (with samples and the project on a large screen), or in person on-site (measurements and direct coordination with the team).',
    },
    {
      question: 'Does NOMA Studio also do exterior design?',
      answer: 'Yes — with no fixed price listed; the offer for exterior design is set individually, based on the project.',
    },
  ],
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

function getSchemaData(language: Language, t: ReturnType<typeof useLanguage>['t']) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema(language),
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/servicii/#webpage`,
        url: `${SITE_URL}/servicii`,
        name: t.seo.serviciiOgTitle,
        description: t.seo.serviciiDescription,
        inLanguage: INLANG[language] ?? 'ro-MD',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: t.nav.home, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: t.nav.services, item: `${SITE_URL}/servicii` },
          ],
        },
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/servicii/#packages`,
        name: t.services.itemListName,
        description: t.services.itemListDescription,
        numberOfItems: 3,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@type': 'Service',
              name: t.services.serviceBasicName,
              description: t.services.serviceBasicDescription,
              offers: {
                '@type': 'Offer',
                price: '17',
                priceCurrency: 'EUR',
                unitText: 'mp',
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}/contact`,
              },
              provider: { '@id': ORG_ID },
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@type': 'Service',
              name: t.services.serviceTechnicName,
              description: t.services.serviceTechnicDescription,
              offers: {
                '@type': 'Offer',
                price: '28',
                priceCurrency: 'EUR',
                unitText: 'mp',
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}/contact`,
              },
              provider: { '@id': ORG_ID },
            },
          },
          {
            '@type': 'ListItem',
            position: 3,
            item: {
              '@type': 'Service',
              name: t.services.serviceSignatureName,
              description: t.services.serviceSignatureDescription,
              offers: {
                '@type': 'Offer',
                price: '37',
                priceCurrency: 'EUR',
                unitText: 'mp',
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}/contact`,
              },
              provider: { '@id': ORG_ID },
            },
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/servicii/#faq`,
        mainEntity: (FAQ_CONTENT[language] ?? FAQ_CONTENT.ro).map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  };
}

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
  const canonical = canonicalUrl('/servicii', language);

  // isMobile determinat SINCRON la prima randare → mobilul folosește din start
  // varianta fără blur (altfel cardurile apar/rămân blurate)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [isPartnerVisitsExpanded, setIsPartnerVisitsExpanded] = useState(false);

  // Fiecare card FAQ se deschide/închide independent (nu un acordeon
  // exclusiv) — pe grid de 2 coloane nu are sens ca deschiderea unuia
  // să-l închidă pe altul dintr-o coloană diferită.
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(() => new Set());
  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

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

  /* 2026-09-14 (cerut explicit — „tot situl la fel de fluid ca /curs"):
     cele 3 carduri de preț + blocul de topice foloseau `whileInView` +
     `viewport:{once:false, margin/amount unic}` — exact bug-ul documentat
     pe /curs („licărire haotică la pragul de declanșare" dacă userul se
     oprește cu scroll-ul exact acolo). Înlocuit cu histerezis
     (useRevealActive, HomeReveal.tsx) — apare la prag, dispare doar la
     ieșire completă din ecran, nicio poziție de scroll nu poate oscila. */
  const pricingBasicRef = useRef<HTMLElement>(null);
  const pricingBasicActive = useRevealActive(pricingBasicRef, 0.25);
  const pricingTehnicRef = useRef<HTMLElement>(null);
  const pricingTehnicActive = useRevealActive(pricingTehnicRef, 0.25);
  const pricingSignatureRef = useRef<HTMLElement>(null);
  const pricingSignatureActive = useRevealActive(pricingSignatureRef, 0.25);
  const consultScatterRef = useRef<HTMLDivElement>(null);
  const consultScatterActive = useRevealActive(consultScatterRef, 0.2);

  /* 2026-09-14: Lenis (desktop) ține un plafon de scroll (`limit`) recitit
     printr-un ResizeObserver DEBOUNCED intern (~250ms) — orice conținut
     care-și schimbă înălțimea printr-o TRANZIȚIE (aici: FAQ-ul și
     „vizite parteneri" din cardul SIGNATURE, ambele `max-height`/`height`
     animate) las-ă plafonul STALE cât durează tranziția, iar userul simte
     asta ca „toată pagina se mișcă singură" la click — exact bug-ul
     documentat pe /curs (acordeonul FAQ de-acolo). Fix identic: RO pe
     containerul care-și schimbă înălțimea, `lenis.resize()` la fiecare
     schimbare — nu un timer ghicit pe durata tranziției CSS. */
  useEffect(() => {
    const targets = [
      document.querySelector<HTMLElement>('.faq-list'),
      document.querySelector<HTMLElement>('.pricing-grid'),
    ].filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const ro = new ResizeObserver(() => { window.__lenis?.resize(); });
    targets.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
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

  const schemaData = useMemo(() => getSchemaData(language, t), [language, t]);

  // ── CONSULTAȚII ──────────────────────────────────────
  const consult = CONSULT_CONTENT[language] ?? CONSULT_CONTENT.ro;

  // ── FAQ (Faza 3) ──────────────────────────────────────
  const faq = FAQ_CONTENT[language] ?? FAQ_CONTENT.ro;

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
        <html lang={language} />
        <title>{t.seo.serviciiTitle}</title>
        <meta name="description" content={t.seo.serviciiDescription} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="NOMA Studio" />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/servicii')}

        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={t.seo.serviciiOgTitle} />
        <meta property="og:description" content={t.seo.serviciiOgDescription} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={t.services.ogImageAlt} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={t.seo.serviciiOgTitle} />
        <meta name="twitter:description" content={t.seo.serviciiOgDescription} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content={t.services.twitterImageAlt} />

        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <main className="servicii" role="main" id="main-content">

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="servicii-hero" aria-labelledby="servicii-heading">
          <div className="container">
            {/* Fără subtitlu, cerut explicit. Fraza cu intervalul de preț a
                fost mutată în articolul de blog dedicat
                (`/blog/cat-costa-un-proiect-de-design-interior`), unde e
                explicată pe larg. Pentru AEO, pagina rămâne acoperită: FAQ-ul
                de mai jos conține răspunsul la „cât costă" ȘI e marcat cu
                schema FAQPage, iar fiecare pachet are `Offer` cu preț real în
                schema ItemList (vezi getSchemaData). */}
            <SectionHeader as="h1" title={t.services.pageTitle} />
          </div>
        </section>

        {/* ── EDITORIAL MANIFESTO QUOTE ── */}
        <section className="servicii-quote-section" aria-label={t.services.manifestoAria}>
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
          <h2 id="pricing-heading" className="sr-only">{t.services.pricingSrHeading}</h2>
          <div className="container">
            {/* Răspuns-întâi (Faza 3, AEO): fraza care spune explicit prețul
                NU a dispărut, s-a MUTAT ca subtitlu sub H1 (vezi HERO) —
                aceeași funcție, poziție mai bună, fără s-o repetăm de două
                ori pe aceeași pagină. */}
            <div className="pricing-grid">

              {/* BASIC */}
              <motion.article
                ref={pricingBasicRef}
                className="pricing-card"
                itemScope
                itemType="https://schema.org/Service"
                variants={cardVariants}
                initial="initial"
                animate={pricingBasicActive ? "animate" : "initial"}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.basicTitle}</h3>
                  <div className="pricing-price" aria-label={t.services.priceAriaLabel.replace('{price}', '17')} itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="17">17€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label={t.services.packageIncludesAria.replace('{package}', t.services.basicTitle)}>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.siteVisit}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.surveyPlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.furniturePlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.partitionPlan}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.renders3d}</span></li>
                </ul>
                <div className="pricing-card-footer">
                  <Magnetic strength={0.22} className="pricing-cta-magnetic">
                    <a href={`${withLang('/contact', language)}?package=basic`} className="pricing-card__link">
                      {t.services.requestOffer}
                    </a>
                  </Magnetic>
                </div>
                <a href={`${withLang('/contact', language)}?package=basic`} className="pricing-cta-overlay" aria-label={t.services.requestOfferAria.replace('{package}', t.services.basicTitle).replace('{price}', '17')}>
                  &nbsp;
                </a>
              </motion.article>

              {/* TEHNIC - Apare primul */}
              <motion.article
                ref={pricingTehnicRef}
                className="pricing-card featured"
                aria-label={t.services.recommendedAria}
                itemScope
                itemType="https://schema.org/Service"
                variants={featuredVariants}
                initial="initial"
                animate={pricingTehnicActive ? "animate" : "initial"}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.technicTitle}</h3>
                  <div className="pricing-price" aria-label={t.services.priceAriaLabel.replace('{price}', '28')} itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="28">28€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label={t.services.packageIncludesAria.replace('{package}', t.services.technicTitle)}>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.techAlbum}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.furnitureVariants}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.renders3dModifiable}</span></li>
                  <li className="feature-item"><CheckIcon /><span>{t.services.features.postConsultancy}</span></li>
                </ul>
                <div className="pricing-card-footer">
                  <Magnetic strength={0.22} className="pricing-cta-magnetic">
                    <a href={`${withLang('/contact', language)}?package=tehnic`} className="pricing-card__link">
                      {t.services.requestOffer}
                    </a>
                  </Magnetic>
                </div>
                <a href={`${withLang('/contact', language)}?package=tehnic`} className="pricing-cta-overlay" aria-label={t.services.requestOfferAria.replace('{package}', t.services.technicTitle).replace('{price}', '28')}>
                  &nbsp;
                </a>
              </motion.article>

              {/* SIGNATURE */}
              <motion.article
                ref={pricingSignatureRef}
                className="pricing-card"
                itemScope
                itemType="https://schema.org/Service"
                variants={cardVariants}
                initial="initial"
                animate={pricingSignatureActive ? "animate" : "initial"}
                whileHover={!isMobile ? "hover" : undefined}
                whileFocus={!isMobile ? "hover" : undefined}
                style={{ willChange: "transform, opacity" }}
              >
                <div className="pricing-card-header-mobile">
                  <h3 className="pricing-title" itemProp="name">{t.services.signatureTitle}</h3>
                  <div className="pricing-price" aria-label={t.services.priceAriaLabel.replace('{price}', '37')} itemProp="offers" itemScope itemType="https://schema.org/Offer">
                    <span itemProp="price" content="37">37€</span>/m²
                    <meta itemProp="priceCurrency" content="EUR" />
                    <meta itemProp="availability" content="https://schema.org/InStock" />
                  </div>
                </div>
                <ul className="pricing-features" aria-label={t.services.packageIncludesAria.replace('{package}', t.services.signatureTitle)}>
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
                    <a href={`${withLang('/contact', language)}?package=signature`} className="pricing-card__link">
                      {t.services.requestOffer}
                    </a>
                  </Magnetic>
                </div>
                <a href={`${withLang('/contact', language)}?package=signature`} className="pricing-cta-overlay" aria-label={t.services.requestOfferAria.replace('{package}', t.services.signatureTitle).replace('{price}', '37')}>
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
              ref={consultScatterRef}
              className="consult-scatter"
              aria-label={consult.topicsTitle}
              variants={scatterContainer}
              initial="hidden"
              animate={consultScatterActive ? "show" : "hidden"}
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

            {/* ── STUDIU DE CAZ (before / after) — un SINGUR RevealCard pe tot
                blocul (cerut explicit: „cardul să apară frumos, nu fiecare
                element de pe card"), aceeași rețetă ca pe homepage. */}
            <RevealCard className="consult-case">
              <div className="consult-case-media">
                <figure className="ba-frame" onClick={() => handleOpenLightbox(BA_BEFORE)}>
                  {/* PLACEHOLDER — înlocuiește cu poza REALĂ „înainte" de la consultație */}
                  <img src={BA_BEFORE} alt={`${consult.before} — ${t.services.consultationCaption}`} loading="lazy" />
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
                  <img src={BA_AFTER} alt={`${consult.after} — ${t.services.consultationCaption}`} loading="lazy" />
                  <figcaption className="ba-label ba-label--after">{consult.after}</figcaption>
                  <div className="consult-zoom-overlay">
                    <div className="consult-zoom-icon">
                      <IconZoom size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </figure>
              </div>

              <div className="consult-case-body">
                <span className="consult-case-eyebrow">
                  {consult.caseEyebrow}
                </span>
                <h3 className="consult-case-title">
                  {isMobile && consult.caseTitleMobile ? consult.caseTitleMobile : consult.caseTitle}
                </h3>
                <p className="consult-case-text">
                  {isMobile && consult.caseTextMobile ? consult.caseTextMobile : consult.caseText}
                </p>

                <div className="consult-palette" aria-label={consult.paletteLabel}>
                  <span className="consult-palette-label">{consult.paletteLabel}</span>
                  <div className="consult-palette-row">
                    {CONSULT_PALETTE.map((hex) => (
                      <span key={hex} className="consult-swatch" title={hex}>
                        <span className="consult-swatch-chip" style={{ backgroundColor: hex }} />
                        <span className="consult-swatch-code">{hex}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="consult-cta-wrap">
                  <Magnetic strength={0.22} className="consult-cta-magnetic">
                    <a href={`${withLang('/contact', language)}?package=consultatie`} className="consult-cta">
                      {consult.cta}
                      <IconArrowRight size={16} strokeWidth={2} />
                    </a>
                  </Magnetic>
                </div>
              </div>
            </RevealCard>
          </div>
        </section>

        {/* ── FAQ (Faza 3, AEO) ────────────────────────────
            Static, vizibil direct — nu un acordeon care cere click. Un AI
            care citează un pasaj trebuie să-l găsească deja randat în HTML,
            nu ascuns după o interacțiune JS. */}
        <section className="faq-section" aria-labelledby="faq-heading">
          <div className="container">
            <SectionHeader
              as="h2"
              id="faq-heading"
              title={t.services.faqTitle}
            />
            <motion.div
              className="faq-list"
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            >
              {faq.map((item, i) => {
                const isOpen = openFaqs.has(i);
                return (
                  <motion.div
                    key={item.question}
                    className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
                    variants={riseItem}
                  >
                    <button
                      type="button"
                      className="faq-summary"
                      onClick={() => toggleFaq(i)}
                      aria-expanded={isOpen}
                    >
                      <h3 className="faq-question">{item.question}</h3>
                      <span className="faq-icon" aria-hidden="true" />
                    </button>
                    <div className="faq-panel-wrap">
                      <p className="faq-answer">{item.answer}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
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
            aria-label={t.portfolio.closeLightboxAria}
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
                  alt={t.services.consultationDetailAlt}
                  className="pd-lightbox-img"
                />
              </AnimatePresence>
            </div>
            <div className="pd-lightbox-caption">
              <span className="pd-lightbox-caption-project">{t.services.consultationCaption}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Servicii;