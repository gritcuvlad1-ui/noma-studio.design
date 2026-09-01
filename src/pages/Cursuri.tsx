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
import { Head as Helmet } from 'vite-react-ssg';
import {
  Users,
  User,
  Monitor,
  Download,
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
  type LucideIcon,
} from 'lucide-react';
import { Magnetic } from '../components/Magnetic';
import SectionHeader from '../components/SectionHeader';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import type { Language } from '../i18n/types';
import { canonicalUrl, hreflangLinks, SITE_URL, organizationSchema, breadcrumbSchema, ORG_ID } from '../utils/seo';
import './Cursuri.css';

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/* Course — cele 3 cursuri reale de pe pagină (grup începători, individual
   1:1, 3Ds Max grup), construite direct din `copy.courses` (CURSURI_CONTENT),
   ca să rămână sincronizate automat cu textul afișat — nu o listă separată,
   care ar putea rămâne în urmă la o schimbare de copy. Fără `offers`: niciun
   curs nu are preț afișat pe pagină (contactul se face direct), deci nu
   inventăm o cifră care nu există nicăieri vizibil. */
function coursesSchema(language: Language, canonical: string, courses: CursuriCourseCopy[]) {
  return {
    '@type': 'ItemList',
    '@id': `${canonical}/#courses`,
    numberOfItems: courses.length,
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: c.title,
        description: c.tagline,
        provider: { '@id': ORG_ID },
        ...(c.duration ? { timeRequired: c.duration } : {}),
        courseMode: c.format,
        educationalLevel: c.level,
        inLanguage: language,
      },
    })),
  };
}

// Move static data to useMemo or keep outside
const EASE = [0.16, 1, 0.3, 1] as const;

const getOptimizedPdfUrl = (url: string, isMobile: boolean) => {
  // Google Docs viewer nu funcționează pe localhost deoarece nu poate accesa fișiere locale.
  // Returnăm mereu URL-ul direct pentru ca PDF-urile să poată fi deschise.
  return url;
};

/* ── Conținut text al paginii /cursuri (ro / ru / en) ──
   Iconițele, id-urile și asset-urile (imagini/pdf) rămân în afara acestui
   obiect — sunt aceleași indiferent de limbă, legate prin poziție (index). */
type CursuriModuleCopy = { title: string; items: string[] };
type CursuriCourseCopy = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: string;
  format: string;
  modules: CursuriModuleCopy[];
};
type CursuriTestimonialCopy = { initials: string; name: string; role: string; quote: string };
type CursuriStatCopy = { value: string; label: string };
type CursuriStudentPortfolioCopy = { studentName: string; projectTitle: string; course: string };

type CursuriCopy = {
  heroLine1: string;
  heroLine2: string;
  testimonialsBadge: string;
  /** cuvântul marcat `*asa*` devine <em> la randare */
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonialsDotsAria: string;
  /** {n} inlocuit la randare */
  testimonialAria: string;
  explorProgramCta: string;
  /** {title} inlocuit la randare */
  enrollAria: string;
  enrollCta: string;
  /** {title} inlocuit la randare */
  downloadPdfAria: string;
  downloadPdfCta: string;
  resultsBadge: string;
  /** cuvântul marcat `*asa*` devine <em> la randare */
  portfolioTitle: string;
  viewProjectCta: string;
  /** {name} inlocuit la randare */
  madeByPrefix: string;
  closeDetailsAria: string;
  reserveSeatCta: string;
  downloadProgramPdfCta: string;
  testimonials: CursuriTestimonialCopy[];
  courses: CursuriCourseCopy[];
  stats: CursuriStatCopy[];
  studentPortfolios: CursuriStudentPortfolioCopy[];
};

const CURSURI_CONTENT: Record<string, CursuriCopy> = {
  ro: {
    heroLine1: 'Te ghidăm profesional',
    heroLine2: 'să alegi corect.',
    testimonialsBadge: 'Testimoniale',
    testimonialsTitle: 'Ce spun *cursanții*',
    testimonialsSubtitle:
      'Cursanții NOMA povestesc cum a fost, de la primele exerciții până la proiectele din portofoliul lor de azi.',
    testimonialsDotsAria: 'Selectează testimonialul',
    testimonialAria: 'Testimonialul {n}',
    explorProgramCta: 'Explorează programul',
    enrollAria: 'Înscrie-te la {title}',
    enrollCta: 'Vreau să mă înscriu',
    downloadPdfAria: 'Descarcă programul PDF pentru {title}',
    downloadPdfCta: 'Program PDF',
    resultsBadge: 'Rezultate Tangibile',
    portfolioTitle: 'Portofoliul *Elevilor*',
    viewProjectCta: 'Vezi Proiectul',
    madeByPrefix: 'Realizat de {name}',
    closeDetailsAria: 'Închide detaliile',
    reserveSeatCta: 'Rezervă Locul',
    downloadProgramPdfCta: 'Descarcă Program PDF',
    testimonials: [
      {
        initials: 'AM',
        name: 'Ana Maria',
        role: 'Cursantă — Modul Începători',
        quote:
          '"Cursul NOMA mi-a oferit încrederea de care aveam nevoie. Am învățat nu doar software, ci și cum să gestionez un proiect real de la cap la coadă. Vizitele pe șantier au fost fascinante!"',
      },
      {
        initials: 'DV',
        name: 'Dan Vârlan',
        role: 'Arhitect — Modul Avansați',
        quote:
          '"Recomand experiența oricărui profesionist care vrea să își ridice standardul. Viteza de lucru în 3Ds Max și calitatea randărilor mele au crescut incredibil după doar câteva săptămâni."',
      },
      {
        initials: 'EL',
        name: 'Elena Luca',
        role: 'Designer — Modul 3Ds Max',
        quote:
          '"Un mediu de învățare foarte sincer și practic. Nu este doar teorie, ci experiență pură de studio. Echipa NOMA este alături de tine la fiecare pas."',
      },
    ],
    courses: [
      {
        badge: 'GRUP · ÎNCEPĂTORI',
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
            items: [
              'AutoCAD: relevee, plan mobilare, electricitate, iluminat, pardoseli, desfășurate',
              '3Ds Max: modelare, materiale, lumini, camere, randări premium',
              'Proiect complet de la desen tehnic la imagine finală',
            ],
          },
          {
            title: 'Experiență practică inclusă',
            items: [
              'Ieșire pe șantier — măsurători reale și etape de execuție',
              'Vizită showroom mobilier — materiale, proporții, soluții tehnice',
              'Vizită showroom obiecte sanitare',
              'Vizită showroom mobilier moale',
            ],
          },
          {
            title: 'Suport complet NOMA',
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
        badge: 'INDIVIDUAL · AVANSAT',
        title: 'Exclusiv pentru Profesioniști',
        tagline: 'Curs individual 1 la 1 — evoluție rapidă și personalizată',
        description:
          'Destinat designerilor, arhitecților sau persoanelor cu experiență care vor să își ridice nivelul tehnic, viteza de lucru și calitatea proiectelor.',
        duration: '2 luni',
        level: 'Avansat',
        format: 'Individual 1:1',
        modules: [
          {
            title: 'Software & Tehnic',
            items: [
              'AutoCAD — planuri tehnice profesionale',
              '3ds Max — modelare eficientă și scene organizate',
              'Randări premium și atmosferă realistă',
            ],
          },
          {
            title: 'Workflow & Clienți',
            items: [
              'Lucrul corect: comunicare și poziționare',
              'Etapele unui proiect de la A la Z',
              'Prezentarea ofertelor și contractelor',
            ],
          },
          {
            title: 'Audit & Perfecționare',
            items: [
              'Greșeli frecvente și cum pot fi evitate',
              'Analiza proiectelor tale actuale',
              'Corectarea profesionistă a workflow-ului',
            ],
          },
          {
            title: 'Certificare & Resurse',
            items: [
              'Diplomă oficială NOMA Individual',
              'Acces la biblioteca de resurse premium',
              'Suport post-curs și networking',
            ],
          },
        ],
      },
      {
        badge: 'GRUP · SOFT',
        title: '3Ds Max — De la Zero',
        tagline: 'Curs 3Ds Max în grup — pentru începători absoluți',
        description:
          'Înveți 3Ds Max, softul folosit de majoritatea designerilor pentru randări. De la modelarea spațiilor complexe la materiale realiste și iluminat profesional, ieși din curs știind să faci randări fotorealiste care se vând.',
        duration: '6 săptămâni',
        level: 'Începător',
        format: 'Grup',
        modules: [
          {
            title: 'Interfață & Navigare',
            items: [
              'Setările importante și navigarea corectă',
              'Organizarea scenelor și a layere-lor',
              'Importul planurilor la scară reală',
            ],
          },
          {
            title: 'Modelare & Mobilier',
            items: [
              'Modelare de bază pentru spații interioare',
              'Pereți, tavane, uși și ferestre',
              'Crearea și editarea pieselor de mobilier',
            ],
          },
          {
            title: 'Materiale & Lumină',
            items: [
              'Crearea materialelor și texturi realiste',
              'Iluminare naturală (V-Ray / Corona)',
              'Iluminare artificială și scenarii de lumină',
            ],
          },
          {
            title: 'Randare & Workflow',
            items: [
              'Camere corecte și unghiuri profesionale',
              'Randări curate și atractive',
              'Post-producție și workflow rapid',
            ],
          },
        ],
      },
    ],
    stats: [
      { value: '150+', label: 'Cursanți formați' },
      { value: '3', label: 'Programe active' },
      { value: '10+', label: 'Ani de experiență' },
      { value: '100%', label: 'Practică reală' },
    ],
    studentPortfolios: [
      { studentName: 'Tataru Inesa', projectTitle: 'Apartament Stil Modern', course: 'Modul Începători' },
      { studentName: 'Luiza Militaru', projectTitle: 'Design Interior Rezidențial', course: 'Modul 3Ds Max' },
      { studentName: 'Elena Luca', projectTitle: 'Portofoliu Vizualizare 3D', course: 'Modul 3Ds Max' },
    ],
  },
  ru: {
    heroLine1: 'Направляем тебя профессионально',
    heroLine2: 'к верному выбору.',
    testimonialsBadge: 'Отзывы',
    testimonialsTitle: 'Что говорят *наши студенты*',
    testimonialsSubtitle:
      'Реальный опыт тех, кто прошёл мастерские NOMA — от первых шагов до профессиональных проектов.',
    testimonialsDotsAria: 'Выбрать отзыв',
    testimonialAria: 'Отзыв {n}',
    explorProgramCta: 'Изучить программу',
    enrollAria: 'Записаться на курс {title}',
    enrollCta: 'Хочу записаться',
    downloadPdfAria: 'Скачать программу PDF для курса {title}',
    downloadPdfCta: 'Программа PDF',
    resultsBadge: 'Реальные результаты',
    portfolioTitle: 'Портфолио *студентов*',
    viewProjectCta: 'Смотреть проект',
    madeByPrefix: 'Автор: {name}',
    closeDetailsAria: 'Закрыть детали',
    reserveSeatCta: 'Забронировать место',
    downloadProgramPdfCta: 'Скачать программу PDF',
    testimonials: [
      {
        initials: 'AM',
        name: 'Ana Maria',
        role: 'Студентка — Модуль для начинающих',
        quote:
          '"Курс NOMA дал мне ту уверенность, которой мне не хватало. Я научилась не только программам, но и тому, как вести реальный проект от начала до конца. Выезды на объект были потрясающими!"',
      },
      {
        initials: 'DV',
        name: 'Dan Vârlan',
        role: 'Архитектор — Модуль для продвинутых',
        quote:
          '"Рекомендую этот опыт любому профессионалу, который хочет поднять свой уровень. Скорость работы в 3Ds Max и качество моих рендеров невероятно выросли всего за пару недель."',
      },
      {
        initials: 'EL',
        name: 'Elena Luca',
        role: 'Дизайнер — Модуль 3Ds Max',
        quote:
          '"Очень честная и практичная учебная среда. Это не просто теория, а настоящий опыт студии. Команда NOMA рядом с тобой на каждом шаге."',
      },
    ],
    courses: [
      {
        badge: 'ГРУППА · НАЧИНАЮЩИЕ',
        title: 'От нуля до первого проекта',
        tagline: 'Групповой курс дизайна интерьера — полная база',
        description:
          'Создан специально для тех, кто хочет войти в профессию, даже без предыдущего опыта. Строим всё шаг за шагом, понятно и практично.',
        duration: '8 недель',
        level: 'Начинающий',
        format: 'Группа',
        modules: [
          {
            title: 'Модуль 1 — Основы профессии',
            items: [
              'Типы клиентов и профессиональная коммуникация',
              'Правильная работа с поставщиками и подрядчиками',
              'Материалы, подбор и управление бюджетом',
              'Электрика в проектах интерьера',
              'Водопровод и канализация на практике',
            ],
          },
          {
            title: 'Модуль 2 — Софт: AutoCAD и 3Ds Max',
            items: [
              'AutoCAD: обмерные планы, расстановка мебели, электрика, освещение, полы, развёртки',
              '3Ds Max: моделирование, материалы, свет, камеры, премиальные рендеры',
              'Полный проект от технического чертежа до финального изображения',
            ],
          },
          {
            title: 'Практический опыт включён',
            items: [
              'Выезд на объект — реальные замеры и этапы стройки',
              'Визит в шоурум мебели — материалы, пропорции, технические решения',
              'Визит в шоурум сантехники',
              'Визит в шоурум мягкой мебели',
            ],
          },
          {
            title: 'Полная поддержка NOMA',
            items: [
              'Устанавливаем необходимые программы для курса',
              'Отдельный чат с ответами и постоянным сопровождением',
              'Официальный сертификат NOMA по завершении',
              'Возможность стажировки и вхождения в команду',
            ],
          },
        ],
      },
      {
        badge: 'ИНДИВИДУАЛЬНО · ПРОДВИНУТЫЙ',
        title: 'Эксклюзивно для профессионалов',
        tagline: 'Индивидуальный курс 1 на 1 — быстрый и персональный рост',
        description:
          'Для дизайнеров, архитекторов и опытных специалистов, которые хотят поднять свой технический уровень, скорость работы и качество проектов.',
        duration: '2 месяца',
        level: 'Продвинутый',
        format: 'Индивидуально 1:1',
        modules: [
          {
            title: 'Софт и техника',
            items: [
              'AutoCAD — профессиональные технические планы',
              '3ds Max — эффективное моделирование и организованные сцены',
              'Премиальные рендеры и реалистичная атмосфера',
            ],
          },
          {
            title: 'Рабочий процесс и клиенты',
            items: [
              'Правильная работа: коммуникация и позиционирование',
              'Этапы проекта от А до Я',
              'Презентация предложений и договоров',
            ],
          },
          {
            title: 'Аудит и совершенствование',
            items: [
              'Частые ошибки и как их избежать',
              'Анализ твоих текущих проектов',
              'Профессиональная коррекция рабочего процесса',
            ],
          },
          {
            title: 'Сертификация и ресурсы',
            items: [
              'Официальный диплом NOMA Individual',
              'Доступ к библиотеке премиальных ресурсов',
              'Поддержка после курса и нетворкинг',
            ],
          },
        ],
      },
      {
        badge: 'ГРУППА · СОФТ',
        title: '3Ds Max — с нуля',
        tagline: 'Групповой курс 3Ds Max — для абсолютных новичков',
        description:
          'Научись владеть самым мощным софтом для архитектурной визуализации. От моделирования сложных пространств до создания реалистичных материалов и профессионального света — этот курс даёт тебе инструменты для создания эффектных фотореалистичных изображений.',
        duration: '6 недель',
        level: 'Начинающий',
        format: 'Группа',
        modules: [
          {
            title: 'Интерфейс и навигация',
            items: [
              'Важные настройки и правильная навигация',
              'Организация сцен и слоёв',
              'Импорт планов в реальном масштабе',
            ],
          },
          {
            title: 'Моделирование и мебель',
            items: [
              'Базовое моделирование интерьерных пространств',
              'Стены, потолки, двери и окна',
              'Создание и редактирование предметов мебели',
            ],
          },
          {
            title: 'Материалы и свет',
            items: [
              'Создание материалов и реалистичных текстур',
              'Естественное освещение (V-Ray / Corona)',
              'Искусственное освещение и световые сценарии',
            ],
          },
          {
            title: 'Рендер и workflow',
            items: [
              'Правильные камеры и профессиональные ракурсы',
              'Чистые и привлекательные рендеры',
              'Постобработка и быстрый workflow',
            ],
          },
        ],
      },
    ],
    stats: [
      { value: '150+', label: 'Обученных студентов' },
      { value: '3', label: 'Активные программы' },
      { value: '10+', label: 'Лет опыта' },
      { value: '100%', label: 'Реальная практика' },
    ],
    studentPortfolios: [
      { studentName: 'Tataru Inesa', projectTitle: 'Квартира в современном стиле', course: 'Модуль для начинающих' },
      { studentName: 'Luiza Militaru', projectTitle: 'Дизайн жилого интерьера', course: 'Модуль 3Ds Max' },
      { studentName: 'Elena Luca', projectTitle: 'Портфолио 3D-визуализации', course: 'Модуль 3Ds Max' },
    ],
  },
  en: {
    heroLine1: 'We guide you professionally',
    heroLine2: 'to choose right.',
    testimonialsBadge: 'Testimonials',
    testimonialsTitle: 'What our *students* say',
    testimonialsSubtitle:
      "Real experiences from those who've been through NOMA's workshops — from first steps to professional projects.",
    testimonialsDotsAria: 'Select testimonial',
    testimonialAria: 'Testimonial {n}',
    explorProgramCta: 'Explore the program',
    enrollAria: 'Enroll in {title}',
    enrollCta: 'I want to enroll',
    downloadPdfAria: 'Download the PDF program for {title}',
    downloadPdfCta: 'PDF Program',
    resultsBadge: 'Tangible Results',
    portfolioTitle: 'Student *Portfolios*',
    viewProjectCta: 'View Project',
    madeByPrefix: 'By {name}',
    closeDetailsAria: 'Close details',
    reserveSeatCta: 'Reserve Your Spot',
    downloadProgramPdfCta: 'Download PDF Program',
    testimonials: [
      {
        initials: 'AM',
        name: 'Ana Maria',
        role: 'Student — Beginner Module',
        quote:
          '"The NOMA course gave me the confidence I needed. I learned not just the software, but how to manage a real project from start to finish. The site visits were fascinating!"',
      },
      {
        initials: 'DV',
        name: 'Dan Vârlan',
        role: 'Architect — Advanced Module',
        quote:
          '"I recommend this experience to any professional who wants to raise their standard. My speed in 3Ds Max and the quality of my renders improved incredibly after just a few weeks."',
      },
      {
        initials: 'EL',
        name: 'Elena Luca',
        role: 'Designer — 3Ds Max Module',
        quote:
          '"A very honest and practical learning environment. It\'s not just theory — it\'s pure studio experience. The NOMA team is with you every step of the way."',
      },
    ],
    courses: [
      {
        badge: 'GROUP · BEGINNERS',
        title: 'From Zero to Your First Project',
        tagline: 'Group interior design course — complete fundamentals',
        description:
          'Built specifically for people who want to enter the field, even with no prior experience. We build everything step by step, clearly and practically.',
        duration: '8 weeks',
        level: 'Beginner',
        format: 'Group',
        modules: [
          {
            title: 'Module 1 — Foundations of the Profession',
            items: [
              'Client types and professional communication',
              'Working correctly with suppliers and collaborators',
              'Materials, selections and budget management',
              'Electrical systems in interior projects',
              'Plumbing and drainage explained practically',
            ],
          },
          {
            title: 'Module 2 — Software: AutoCAD & 3Ds Max',
            items: [
              'AutoCAD: survey plans, furniture layout, electrics, lighting, flooring, elevations',
              '3Ds Max: modeling, materials, lighting, cameras, premium renders',
              'A complete project from technical drawing to final image',
            ],
          },
          {
            title: 'Hands-on experience included',
            items: [
              'Site visit — real measurements and construction stages',
              'Furniture showroom visit — materials, proportions, technical solutions',
              'Sanitary fixtures showroom visit',
              'Soft furniture showroom visit',
            ],
          },
          {
            title: 'Full NOMA support',
            items: [
              'We install the software needed for the course',
              'A dedicated chat with answers and ongoing guidance',
              'Official NOMA certificate on completion',
              'Opportunity for practice and joining the team',
            ],
          },
        ],
      },
      {
        badge: '1:1 · ADVANCED',
        title: 'Exclusively for Professionals',
        tagline: 'One-on-one course — fast, personalized growth',
        description:
          'For designers, architects and experienced professionals who want to raise their technical level, work speed and project quality.',
        duration: '2 months',
        level: 'Advanced',
        format: '1:1 Individual',
        modules: [
          {
            title: 'Software & Technical',
            items: [
              'AutoCAD — professional technical plans',
              '3ds Max — efficient modeling and organized scenes',
              'Premium renders and realistic atmosphere',
            ],
          },
          {
            title: 'Workflow & Clients',
            items: [
              'Doing it right: communication and positioning',
              'Project stages from A to Z',
              'Presenting offers and contracts',
            ],
          },
          {
            title: 'Audit & Refinement',
            items: [
              'Common mistakes and how to avoid them',
              'Analysis of your current projects',
              'Professional workflow correction',
            ],
          },
          {
            title: 'Certification & Resources',
            items: [
              'Official NOMA Individual diploma',
              'Access to the premium resource library',
              'Post-course support and networking',
            ],
          },
        ],
      },
      {
        badge: 'GROUP · SOFTWARE',
        title: '3Ds Max — From Zero',
        tagline: 'Group 3Ds Max course — for absolute beginners',
        description:
          'Learn to master the most powerful architectural visualization software. From modeling complex spaces to creating realistic materials and professional lighting, this course gives you the tools to create striking photorealistic images.',
        duration: '6 weeks',
        level: 'Beginner',
        format: 'Group',
        modules: [
          {
            title: 'Interface & Navigation',
            items: [
              'Important settings and correct navigation',
              'Organizing scenes and layers',
              'Importing plans at true scale',
            ],
          },
          {
            title: 'Modeling & Furniture',
            items: [
              'Basic modeling for interior spaces',
              'Walls, ceilings, doors and windows',
              'Creating and editing furniture pieces',
            ],
          },
          {
            title: 'Materials & Light',
            items: [
              'Creating materials and realistic textures',
              'Natural lighting (V-Ray / Corona)',
              'Artificial lighting and light scenarios',
            ],
          },
          {
            title: 'Rendering & Workflow',
            items: [
              'Correct cameras and professional angles',
              'Clean, appealing renders',
              'Post-production and a fast workflow',
            ],
          },
        ],
      },
    ],
    stats: [
      { value: '150+', label: 'Students trained' },
      { value: '3', label: 'Active programs' },
      { value: '10+', label: 'Years of experience' },
      { value: '100%', label: 'Real-world practice' },
    ],
    studentPortfolios: [
      { studentName: 'Tataru Inesa', projectTitle: 'Modern Style Apartment', course: 'Beginner Module' },
      { studentName: 'Luiza Militaru', projectTitle: 'Residential Interior Design', course: '3Ds Max Module' },
      { studentName: 'Elena Luca', projectTitle: '3D Visualization Portfolio', course: '3Ds Max Module' },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   FAQ (Faza 3, AEO) — vezi nota identică din Servicii.tsx. Fiecare
   răspuns e un fapt deja afișat pe pagină (durate, format, statistici,
   software) — nimic inventat. Prețul e răspuns generic, INTENȚIONAT —
   pagina nu afișează nicio cifră de preț pentru cursuri. */
type FaqItem = { question: string; answer: string };

const FAQ_CONTENT: Record<string, FaqItem[]> = {
  ro: [
    {
      question: 'Ce cursuri de design interior oferă NOMA School?',
      answer: 'Trei programe: „De la Zero la Primul Proiect" (grup, pentru începători), „Exclusiv pentru Profesioniști" (individual 1:1, pentru avansați) și „3Ds Max — De la Zero" (grup, pentru randare 3D).',
    },
    {
      question: 'Cât durează cursul pentru începători?',
      answer: 'Cursul „De la Zero la Primul Proiect" durează 8 săptămâni, în format de grup.',
    },
    {
      question: 'Cât durează cursul individual 1:1?',
      answer: 'Cursul „Exclusiv pentru Profesioniști" durează 2 luni.',
    },
    {
      question: 'Cât durează cursul de 3Ds Max?',
      answer: 'Cursul „3Ds Max — De la Zero" durează 6 săptămâni, în format de grup.',
    },
    {
      question: 'Ce diferență este între cursul de grup și cel individual?',
      answer: 'Cursul de grup e pentru cei fără experiență anterioară, construit pas cu pas. Cursul individual 1:1 e pentru designeri și arhitecți cu experiență care vor să-și ridice nivelul tehnic și viteza de lucru.',
    },
    {
      question: 'Ce software se învață la cursurile NOMA?',
      answer: 'AutoCAD și 3Ds Max — de la planuri tehnice și amplasare mobilier, până la randări 3D fotorealiste.',
    },
    {
      question: 'Primesc certificat la finalul cursului?',
      answer: 'Da, un certificat oficial NOMA la finalizarea cursului.',
    },
    {
      question: 'Cât costă un curs NOMA School?',
      answer: 'Prețul se stabilește în funcție de programul ales — scrie-ne pentru o ofertă personalizată.',
    },
  ],
  ru: [
    {
      question: 'Какие курсы дизайна интерьера предлагает NOMA School?',
      answer: 'Три программы: «С нуля до первого проекта» (группа, для начинающих), «Эксклюзивно для профессионалов» (индивидуально 1 на 1, для продвинутых) и «3Ds Max — с нуля» (группа, для 3D-визуализации).',
    },
    {
      question: 'Сколько длится курс для начинающих?',
      answer: 'Курс «С нуля до первого проекта» длится 8 недель, в групповом формате.',
    },
    {
      question: 'Сколько длится индивидуальный курс 1 на 1?',
      answer: 'Курс «Эксклюзивно для профессионалов» длится 2 месяца.',
    },
    {
      question: 'Сколько длится курс 3Ds Max?',
      answer: 'Курс «3Ds Max — с нуля» длится 6 недель, в групповом формате.',
    },
    {
      question: 'В чём разница между групповым и индивидуальным курсом?',
      answer: 'Групповой курс — для тех, кто без опыта, построен шаг за шагом. Индивидуальный курс 1 на 1 — для дизайнеров и архитекторов с опытом, которые хотят поднять технический уровень и скорость работы.',
    },
    {
      question: 'Какое ПО изучают на курсах NOMA?',
      answer: 'AutoCAD и 3Ds Max — от технических планов и расстановки мебели до фотореалистичной 3D-визуализации.',
    },
    {
      question: 'Получу ли я сертификат по окончании курса?',
      answer: 'Да, официальный сертификат NOMA по завершении курса.',
    },
    {
      question: 'Сколько стоит курс в NOMA School?',
      answer: 'Стоимость определяется в зависимости от выбранной программы — напишите нам для персонального предложения.',
    },
  ],
  en: [
    {
      question: 'What interior design courses does NOMA School offer?',
      answer: 'Three programs: "From Zero to Your First Project" (group, for beginners), "Exclusively for Professionals" (1:1 individual, for advanced learners) and "3Ds Max — From Zero" (group, for 3D rendering).',
    },
    {
      question: 'How long is the beginner course?',
      answer: 'The "From Zero to Your First Project" course runs for 8 weeks, in a group format.',
    },
    {
      question: 'How long is the 1:1 individual course?',
      answer: 'The "Exclusively for Professionals" course runs for 2 months.',
    },
    {
      question: 'How long is the 3Ds Max course?',
      answer: 'The "3Ds Max — From Zero" course runs for 6 weeks, in a group format.',
    },
    {
      question: 'What is the difference between the group and individual course?',
      answer: 'The group course is for those with no prior experience, built step by step. The 1:1 individual course is for designers and architects with experience who want to raise their technical level and work speed.',
    },
    {
      question: 'What software is taught in NOMA courses?',
      answer: 'AutoCAD and 3Ds Max — from technical plans and furniture layout to photorealistic 3D renders.',
    },
    {
      question: 'Do I get a certificate at the end of the course?',
      answer: 'Yes, an official NOMA certificate upon completion.',
    },
    {
      question: 'How much does a NOMA School course cost?',
      answer: 'The price depends on the program you choose — get in touch for a personalized quote.',
    },
  ],
};

const FAQ_TITLE: Record<string, { eyebrow: string; title: string }> = {
  ro: { eyebrow: 'ÎNTREBĂRI FRECVENTE', title: 'Întrebări frecvente' },
  ru: { eyebrow: 'ЧАСТЫЕ ВОПРОСЫ', title: 'Частые вопросы' },
  en: { eyebrow: 'FREQUENTLY ASKED QUESTIONS', title: 'Frequently asked questions' },
};

const renderEmphasized = (text: string) =>
  text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part));

/* ── Icoane/id-uri/assets — aceleași indiferent de limbă, legate prin index ── */
const COURSE_META: { id: string; badgeIcon: LucideIcon; moduleIcons: LucideIcon[] }[] = [
  { id: 'grup-incepatori', badgeIcon: Users, moduleIcons: [BookOpen, Monitor, Zap, Users] },
  { id: 'individual-avansat', badgeIcon: User, moduleIcons: [Cpu, Briefcase, ShieldCheck, Award] },
  { id: '3dsmax-grup', badgeIcon: Monitor, moduleIcons: [Layout, Layers, Zap, MousePointer2] },
];

const STUDENT_META = [
  {
    file: '/pdf/portofolii/Proiect (2).pdf',
    image: '/pdf/portofolii/caard1.webp',
    imageMobile: '/pdf/portofolii/caard1_mobile.png',
    thumbnailColor: 'rgba(189, 162, 126, 0.1)',
  },
  {
    file: '/pdf/portofolii/militaru-luiza.pdf',
    image: '/pdf/portofolii/card2.webp',
    imageMobile: '/pdf/portofolii/card2_mobile.png',
    thumbnailColor: 'rgba(139, 125, 107, 0.1)',
  },
  {
    file: '/pdf/portofolii/Portofoliu 3D.pdf',
    image: '/pdf/portofolii/card3.webp',
    imageMobile: '/pdf/portofolii/card3_mobile.png',
    thumbnailColor: 'rgba(176, 141, 62, 0.1)',
  },
];

type CursuriModule = { title: string; icon: LucideIcon; items: string[] };
type Course = {
  id: string;
  badgeIcon: LucideIcon;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: string;
  format: string;
  modules: CursuriModule[];
};

function buildCourses(copy: CursuriCopy): Course[] {
  return COURSE_META.map((meta, i) => {
    const c = copy.courses[i];
    return {
      id: meta.id,
      badgeIcon: meta.badgeIcon,
      badge: c.badge,
      title: c.title,
      tagline: c.tagline,
      description: c.description,
      duration: c.duration,
      level: c.level,
      format: c.format,
      modules: c.modules.map((m, j) => ({ title: m.title, icon: meta.moduleIcons[j], items: m.items })),
    };
  });
}

/* ── Testimoniale interactive (rotație + navigare cu buline + carduri animate),
   reconstruite în stil NOMA (crem/auriu, serif premium) ── */
function NomaTestimonials() {
  const { language } = useLanguage();
  const copy = CURSURI_CONTENT[language] ?? CURSURI_CONTENT.ro;
  const testimonials = copy.testimonials;
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const id = setInterval(
      () => setActiveIndex((i) => (i + 1) % testimonials.length),
      6000
    );
    return () => clearInterval(id);
  }, [testimonials.length]);

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
            <h2 id="nc-testimonials-title" className="nc-section-title nt-title">
              {renderEmphasized(copy.testimonialsTitle)}
            </h2>

            <p className="nt-subtitle">
              {copy.testimonialsSubtitle}
            </p>
          </motion.div>

          {/* DREAPTA: carduri rotative + navigare dedesubt */}
          <div className="nt-right">
            <div className="nt-stage" aria-live="polite">
              {testimonials.map((t, i) => (
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

              <div className="nt-dots" role="tablist" aria-label={copy.testimonialsDotsAria}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === i}
                    className={`nt-dot ${activeIndex === i ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(i)}
                    aria-label={copy.testimonialAria.replace('{n}', String(i + 1))}
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

interface CourseCardProps {
  course: Course;
  isMobile: boolean;
  onExplore: (course: Course) => void;
}

const CourseCard = React.memo(({ course, isMobile, onExplore }: CourseCardProps) => {
  const { language } = useLanguage();
  const copy = CURSURI_CONTENT[language] ?? CURSURI_CONTENT.ro;
  const Icon = course.badgeIcon;
  const contactHref = `${withLang('/contact', language)}?course=${course.id}`;

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
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
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
            <span className="nc-meta-item">{course.duration}</span>
          )}
        </div>
      </div>

      <h2 className="nc-card__title">{course.title}</h2>
      <p className="nc-card__desc">{course.description}</p>

      <button
        className="nc-expand-btn"
        onClick={() => onExplore(course)}
      >
        <span>{copy.explorProgramCta}</span>
      </button>

      <div className="nc-card__footer">
        {!isMobile ? (
          <Magnetic strength={0.15}>
            <a
              href={contactHref}
              className="nc-btn nc-btn--noma"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = contactHref;
              }}
              aria-label={copy.enrollAria.replace('{title}', course.title)}
            >
              <span>{copy.enrollCta}</span>
            </a>
          </Magnetic>
        ) : (
          <a
            href={contactHref}
            className="nc-btn nc-btn--noma"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = contactHref;
            }}
            aria-label={copy.enrollAria.replace('{title}', course.title)}
          >
            <span>{copy.enrollCta}</span>
          </a>
        )}

        {!isMobile ? (
          <Magnetic strength={0.15}>
            <a
              href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
              {...(isMobile ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
              className="nc-btn nc-btn--ghost"
              aria-label={copy.downloadPdfAria.replace('{title}', course.title)}
            >
              <Download size={13} strokeWidth={2} />
              <span>{copy.downloadPdfCta}</span>
            </a>
          </Magnetic>
        ) : (
          <a
            href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
            target="_blank"
            rel="noopener noreferrer"
            className="nc-btn nc-btn--ghost"
            aria-label={copy.downloadPdfAria.replace('{title}', course.title)}
          >
            <Download size={13} strokeWidth={2} />
            <span>{copy.downloadPdfCta}</span>
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
  const copy = CURSURI_CONTENT[language] ?? CURSURI_CONTENT.ro;
  const courses = React.useMemo(() => buildCourses(copy), [copy]);
  const studentPortfolios = React.useMemo(
    () => STUDENT_META.map((meta, i) => ({ ...meta, ...copy.studentPortfolios[i] })),
    [copy]
  );
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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
    window.location.href = withLang('/contact', language);
  }, [language]);

  // getOptimizedPdfUrl moved to module scope

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{t.seo.cursuriTitle}</title>
        <meta name="description" content={t.seo.cursuriDescription} />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/cursuri')}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t.seo.cursuriOgTitle} />
        <meta property="og:description" content={t.seo.cursuriOgDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={t.seo.cursuriOgTitle} />
        <meta name="twitter:description" content={t.seo.cursuriOgDescription} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              organizationSchema(language),
              {
                '@type': 'WebPage',
                '@id': `${canonical}#webpage`,
                url: canonical,
                name: t.seo.cursuriOgTitle,
                description: t.seo.cursuriDescription,
                breadcrumb: breadcrumbSchema(language, t.nav.home, [
                  { name: t.nav.courses, path: '/cursuri' },
                ]),
              },
              coursesSchema(language, canonical, copy.courses),
              {
                '@type': 'FAQPage',
                '@id': `${canonical}#faq`,
                mainEntity: (FAQ_CONTENT[language] ?? FAQ_CONTENT.ro).map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: { '@type': 'Answer', text: item.answer },
                })),
              },
            ],
          })}
        </script>
      </Helmet>

      <main className="nc-page" id="main-content" role="main">
        <section className="nc-hero" ref={heroRef} aria-labelledby="nc-hero-title">
          <div className="nc-container">
            <SectionHeader
              as="h1"
              className="nc-hero__inner"
              title={
                <>
                  {copy.heroLine1}
                  <br />
                  <span className="nc-cta__highlight-wrap" style={{ display: 'inline-block', position: 'relative' }}>
                    <em>{copy.heroLine2}</em>
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
                  {[...copy.stats, ...copy.stats, ...copy.stats, ...copy.stats].map((stat, i) => (
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
              {courses.map((course) => (
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

        <section className="nc-student-portfolio" aria-labelledby="nc-portfolio-title">
          <div className="nc-container">
            <header className="nc-section-header">
              <div className="sh-clip">
                <motion.h2
                  id="nc-portfolio-title"
                  className="nc-section-title"
                  initial={{ y: '130%' }}
                  whileInView={{ y: '0%' }}
                  viewport={{ once: true, margin: '0px 0px -12% 0px' }}
                  transition={{ duration: 1.4, ease: EASE }}
                >
                  {renderEmphasized(copy.portfolioTitle)}
                </motion.h2>
              </div>
            </header>

            <div className="nc-portfolio-grid">
              {studentPortfolios.map((project, i) => (
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
                      <span className="nc-portfolio-card__overlay-text">{copy.viewProjectCta}</span>
                      <ExternalLink size={20} strokeWidth={1.5} />
                    </div>
                  </a>
                  <div className="nc-portfolio-card__content">
                    <span className="nc-portfolio-card__course">{project.course}</span>
                    <h3 className="nc-portfolio-card__title">{project.projectTitle}</h3>
                    <p className="nc-portfolio-card__student">{copy.madeByPrefix.replace('{name}', project.studentName)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <NomaTestimonials />

        {/* ── FAQ (Faza 3, AEO) — vezi nota din Servicii.tsx: static,
            vizibil direct, nu acordeon. ── */}
        <section className="nc-faq-section" aria-labelledby="nc-faq-heading">
          <div className="nc-container">
            <SectionHeader
              as="h2"
              id="nc-faq-heading"
              title={(FAQ_TITLE[language] ?? FAQ_TITLE.ro).title}
            />
            <motion.div
              className="nc-faq-list"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
            >
              {(FAQ_CONTENT[language] ?? FAQ_CONTENT.ro).map((item) => (
                <motion.div
                  key={item.question}
                  className="nc-faq-item"
                  variants={{ hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } } }}
                >
                  <h3 className="nc-faq-question">{item.question}</h3>
                  <p className="nc-faq-answer">{item.answer}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
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
                      aria-label={copy.closeDetailsAria}
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
                        href={`${withLang('/contact', language)}?course=${selectedCourse.id}`}
                        className="nc-btn nc-btn--noma"
                        onClick={(e) => {
                          e.preventDefault();
                          const courseId = selectedCourse.id;
                          setSelectedCourse(null);
                          window.location.href = `${withLang('/contact', language)}?course=${courseId}`;
                        }}
                      >
                        <span>{copy.reserveSeatCta}</span>
                      </a>
                    </Magnetic>
                    <Magnetic strength={0.15}>
                      <a
                        href={getOptimizedPdfUrl("/pdf/noma-school-program.pdf", isMobile)}
                        {...(isMobile ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
                        className="nc-btn nc-btn--ghost"
                      >
                        <Download size={13} strokeWidth={2} />
                        <span>{copy.downloadProgramPdfCta}</span>
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
