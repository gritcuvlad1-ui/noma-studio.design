import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Check, Play, X } from 'lucide-react';
import { IconArrowUpRight } from './PremiumIcons';
import { RevealLine, RevealCard } from './HomeReveal';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import './SplineDesignSection.css';

/* Secțiune „Cursuri" de pe homepage — invitație clickabilă spre /cursuri.
   (Am înlocuit scena 3D Spline, grea pe WebGL, cu un card vizual ușor.) */

const COURSE_IMG = '/cursuri/lectiile.jpg';

/* Citatul din t.home.videoQuote are cuvinte marcate `*asa*` (italice, colorate,
   cf. .course-video-text em) — poziția lor diferă per limbă, deci nu poate fi
   stocat direct ca JSX în i18n (doar string-uri). Parsare simplă: */
function renderEmphasized(text: string) {
  return text.split('*').map((part, i) =>
    i % 2 === 1 ? <em key={i}>{part}</em> : part
  );
}

/* Aceleași poze din ședința foto de la cursuri (folosite și la banda de pe
   /curs, secțiunea „Cum lucrăm") — dar aici DOAR câte una per persoană
   (setul de 11 avea 6 persoane, 5 din ele apar de 2 ori în poze diferite;
   cerut explicit să rămână o singură poză/persoană, nu duplicate). */
const PRACTICE_SHOOT_PHOTOS = [
  '/curs-landing/practice-shoot-1.webp',
  '/curs-landing/practice-shoot-2.webp',
  '/curs-landing/practice-shoot-4.webp',
  '/curs-landing/practice-shoot-6.webp',
  '/curs-landing/practice-shoot-8.webp',
  '/curs-landing/practice-shoot-10.webp',
];

/* Cele 3 poze-topic (măsurări/șantier/showroom) care se schimbă singure —
   EXACT tehnica de la /curs (PracticeTopicsCarousel): un cadru fix,
   track glisant (translate3d(-active*100%)), insignă în colț sincronă cu
   poza curentă. Recolorată aici în vișiniul homepage-ului. */
// `labelKey` = numele cheii din t.home.* — traducerea reală se ia în
// componentă (useLanguage), nu aici la nivel de modul, unde `t` nu există.
const PRACTICE_TOPICS = [
  { src: '/curs-landing/practice-masuratori.webp', labelKey: 'topicMeasurements' as const },
  { src: '/curs-landing/practice-santier.webp', labelKey: 'topicSiteAnalysis' as const },
  { src: '/curs-landing/practice-showroom.webp', labelKey: 'topicShowroom' as const },
];

/* Auto-declanșat (RevealCard, nu mai depinde de trigger-ul secțiunii) —
   apare/dispare la fiecare trecere prin dreptul lui, cerut explicit. Reveal-ul
   E chiar .home-practice-carousel (nu un div suplimentar în jurul lui): pe
   mobil caruselul e `display:none`, iar un wrapper vizibil ar fi lăsat în
   grid o coloană/un rând gol. `noFilter` — înăuntru rulează două animații
   continue (track-ul între poze + plutirea insignei). */
const HomeTopicsCarousel = () => {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % PRACTICE_TOPICS.length), 3400);
    return () => clearInterval(id);
  }, []);

  return (
    <RevealCard className="home-practice-carousel" noFilter>
      <span className="home-practice-badge-wrap">
        <span className="home-practice-badge">
          <span className="home-check-dot"><Check size={7} strokeWidth={3.5} /></span>
          <motion.span
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {t.home[PRACTICE_TOPICS[active].labelKey]}
          </motion.span>
        </span>
      </span>

      <div className="home-practice-frame">
        <div
          className="home-practice-track"
          style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}
        >
          {PRACTICE_TOPICS.map((topic, i) => (
            <img
              key={topic.src}
              src={topic.src}
              alt={t.home[topic.labelKey]}
              className="home-practice-photo-img"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
      </div>
    </RevealCard>
  );
};

/* Bandă continuă cu poze — EXACT tehnica de la /curs (.cl-practice-marquee):
   conținut dublat + translateX(0→-50%) infinit = buclă perfect continuă,
   animație CSS pură (compositor, fără lag). Recolorată aici în stilul
   homepage (vezi SplineDesignSection.css), nu în roz-ul de pe /curs. */
const HomePracticeMarquee = () => (
  <div className="home-practice-marquee" aria-hidden="true">
    <div className="home-practice-marquee-track">
      {[...PRACTICE_SHOOT_PHOTOS, ...PRACTICE_SHOOT_PHOTOS].map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="home-practice-marquee-img"
          loading="eager"
          decoding="async"
        />
      ))}
    </div>
  </div>
);

/* Cardul orizontal cu clipul video — PRIMUL card al secțiunii Cursuri,
   sub titlu. UN SINGUR card „stil NOMA" (rama+glow vișiniu, exact rețeta
   panoului de contact — .contact-content__inner-home) care înfășoară
   ATÂT textul cât ȘI clipul, nu două elemente separate alăturate.
   Redare ambientală (în cardul mic): autoplay mut, fără sunet, fără click —
   pornește/oprește singur cu vizibilitatea (IntersectionObserver), NU la
   montare (`preload="none"`), ca să nu tragă cei ~10MB dacă userul nu ajunge
   niciodată la secțiune. Cadrul mic e PĂTRAT (1:1, tăiat/cover) — cu o
   iconiță triunghi vișiniu peste el, care se mărește la hover.
   Click pe card → lightbox FULLSCREEN (createPortal în body, exact rețeta
   „Lightbox simplificat pentru o singură poză" folosită deja pe /curs
   pentru poza de proiect: backdrop + blur, buton „sticlă" cu X în colț,
   Escape + scroll-lock), unde clipul se vede întreg, dreptunghiular, la
   dimensiunea lui reală (necropat) — mare cât permite ecranul. */
const CourseVideoCard = () => {
  const { t } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = true; // siguranță — unele browsere ignoră prop-ul React la autoplay

    const el = wrapRef.current;
    if (!el || !video) return;

    // NU mai punem clipul pe pauză când iese din ecran — pornește o singură
    // dată, prima oară când devine vizibil, și rămâne în buclă mereu de-atunci.
    // Motivul: pauză + `preload="none"` însemna că la reintrarea în ecran
    // (scroll în sus, peste cardul deja vizitat), browserul (mai ales Safari
    // pe iPhone, care eliberează agresiv bufferul clipurilor din afara
    // ecranului) trebuia să re-descarce/re-decodeze clipul — exact stalling-ul
    // („foarte greu se încarcă") raportat explicit de user la scroll în sus.
    // Clipul e mic, mut, în buclă — costul de a-l lăsa să ruleze mai departe
    // în fundal e neglijabil față de un stotter vizibil la fiecare reintrare.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {}); // browserul poate refuza autoplay-ul — nu e o eroare reală
          io.disconnect(); // o singură pornire; nu mai observăm ieșirile din ecran
        }
      },
      { threshold: 0.3, rootMargin: '250px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Escape + scroll-lock cât timp lightbox-ul e deschis — EXACT tiparul
  // de la .cl-project-lightbox (CursLanding.tsx).
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [modalOpen]);

  // Clipul din lightbox se aude (NU mut, spre deosebire de cel ambiental din
  // card). `.play()` apelat explicit aici, nu doar `autoPlay` — rulează la
  // montarea video-ului, imediat după click-ul care a deschis modalul, deci
  // browserul tot îl consideră pornit dintr-un gest real al userului (permite
  // autoplay CU sunet). `autoPlay` ca atribut, singur, e mai puțin sigur în
  // unele browsere pentru pornirea cu sunet.
  useEffect(() => {
    if (!modalOpen) return;
    modalVideoRef.current?.play().catch(() => {});
  }, [modalOpen]);

  const openModal = () => {
    videoRef.current?.pause(); // clipul mare din lightbox pornește propriu, separat
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    videoRef.current?.play().catch(() => {}); // reia redarea ambientală din card
  };

  return (
    <div className="course-video-card" ref={wrapRef}>
      {/* „N"-ul din logo, desenat pe fundal — EXACT tehnica de la
          .home-contact-mark (HomeContactForm.tsx): siluetă doar CONTUR
          (feMorphology dilate + feComposite out = inel, nu literă plină),
          ca să nu acopere textul de deasupra. Card-ul are `overflow:hidden`
          (mai jos, CSS) ca litera, fiind mai mare decât cardul, să fie
          tăiată exact la graniță — cerut explicit. Filtru cu ID propriu
          (nu cel din HomeContactForm) — amândouă componentele trăiesc pe
          același Home.tsx, un ID SVG duplicat ar fi incorect. */}
      <svg className="course-video-mark" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="noma-course-mark-outline"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
            <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
            <feFlood floodColor="currentColor" result="ink" />
            <feComposite in="ink" in2="ring" operator="in" />
          </filter>
        </defs>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          filter="url(#noma-course-mark-outline)"
        >
          N
        </text>
      </svg>

      {/* pozat chiar în colțul stânga al CARDULUI (nu al coloanei de text) —
          poziționare absolută, ca insignele de colț de mai jos în secțiune
          (.home-practice-badge-wrap, .course-visual-points) */}
      <div className="course-video-author">
        <img
          src="/cursuri/nicu-avatar.jpg"
          alt="Nicu"
          className="course-video-author-avatar"
          loading="lazy"
        />
        <div className="course-video-author-info">
          <span className="course-video-author-name">Nicu</span>
          <span className="course-video-author-role">{t.home.videoAuthorRole}</span>
        </div>
      </div>

      <div className="course-video-text">
        <p>
          {renderEmphasized(t.home.videoQuote)}
        </p>
      </div>

      <div className="course-video-visual">
        <button
          type="button"
          className="course-video-frame"
          onClick={openModal}
          aria-label={t.home.videoOpenAria}
        >
          <video
            ref={videoRef}
            className="course-video-el"
            poster="/cursuri/curs-video-poster.jpg"
            muted
            loop
            playsInline
            preload="none"
          >
            <source src="/cursuri/curs-video.webm" type="video/webm" />
            <source src="/cursuri/curs-video.mp4" type="video/mp4" />
          </video>
          <span className="course-video-play-badge" aria-hidden="true">
            <Play size={15} strokeWidth={0} fill="currentColor" />
          </span>
        </button>
      </div>

      {modalOpen && createPortal(
        <div className="course-video-modal" role="dialog" aria-modal="true" aria-label={t.home.videoModalAria}>
          <div className="course-video-modal-backdrop" onClick={closeModal} />
          <button
            type="button"
            className="course-video-modal-close"
            onClick={closeModal}
            aria-label={t.home.videoCloseAria}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
          <div className="course-video-modal-content">
            <video
              ref={modalVideoRef}
              className="course-video-modal-el"
              loop
              playsInline
              poster="/cursuri/curs-video-poster.jpg"
            >
              {/* surse SEPARATE, CU sunet — cele din cardul mic (curs-video.webm/mp4)
                  sunt tăiate de audio intenționat, ca să fie cât mai mici (redare
                  ambientală, mută). Aici clipul chiar se aude, deci sursa e alta. */}
              <source src="/cursuri/curs-video-sound.webm" type="video/webm" />
              <source src="/cursuri/curs-video-sound.mp4" type="video/mp4" />
            </video>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const SplineDesignSection = () => {
  const { t, language } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  // Doar titlul (RevealLine) mai citește asta acum — once:true, apare o
  // singură dată (regula pt. text, vezi HomeReveal.tsx). Cardurile de mai
  // jos au fiecare propriul RevealCard, independent, care se REPETĂ.
  const inView = useInView(ref, { once: true, margin: '0px 0px -18% 0px' });
  // Plutirea pilulelor pornește ABIA după ce animația de intrare (filter
  // blur→0 pe .course-visual-wrap) s-a terminat complet — vezi
  // reference_stability_antivibration.md, Cauza 7: o animație CSS infinită
  // pornită CÂT timp părintele ei mai are `filter` activ lasă „abur" agățat
  // vizual pe toată secțiunea pe WebKit.
  const [pillsEntered, setPillsEntered] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Spotlight-ul care urmărește cursorul — scriu poziția direct pe elementul
  // DOM (nu prin setState), ca mișcarea mouse-ului să nu declanșeze re-render
  // React la fiecare cadru.
  const handleCardMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty('--spot-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <section className="spline-section" aria-label={t.home.videoSectionAria}>
      <div className="spline-inner" ref={ref}>

        {/* Titlul — CLIP-REVEAL, un rând per mască (nu opacity+blur pe text:
            pe iOS Safari aburul/opacity pe litere dă flash alb — vezi
            HomeReveal.tsx). Cele două rânduri urcă decalat, primul apoi al
            doilea, cu ACELAȘI trigger. */}
        <h2 className="spline-title">
          <RevealLine active={inView} delay={0}>{t.home.learnDesignLine1}</RevealLine>
          <RevealLine active={inView} delay={0.12}><em>{t.home.learnDesignLine2}</em></RevealLine>
        </h2>

        {/* Fiecare card de mai jos e independent (RevealCard) — apare/dispare
            aburit, direcțional, de câte ori treci prin dreptul lui, nu doar
            prima dată (cerut explicit). */}

        {/* Cardul cu clipul — `noFilter`: înăuntru rulează un video, iar un
            blur tranzitoriu peste el ar risca „abur agățat" pe WebKit. */}
        <RevealCard noFilter>
          <CourseVideoCard />
        </RevealCard>

        <div className="spline-content-row">
        {/* LEFT — card vizual clickabil spre /cursuri. `onEnter` (nu doar la
            prima intrare) pornește plutirea pilulelor DUPĂ ce blur-ul a
            dispărut complet — un nod cu animație infinită sub o suprafață de
            filtrare rămâne agățat vizual pe WebKit. */}
        <RevealCard
          className="course-visual-wrap"
          onEnter={() => setPillsEntered(true)}
        >
          <Link
            to={withLang('/cursuri', language)}
            className="course-visual"
            aria-label={t.home.courseCardAria}
            ref={cardRef}
            onMouseMove={handleCardMouseMove}
          >
            <img
              className="course-visual-img"
              src={COURSE_IMG}
              alt={t.home.courseCardAlt}
              loading="lazy"
            />
            <span className="course-visual-overlay" aria-hidden="true" />
            <span className="course-visual-spotlight" aria-hidden="true" />

            <div className="course-visual-foot">
              <span className="course-visual-go">
                <span>{t.home.courseCardCta}</span>
                <IconArrowUpRight size={12} strokeWidth={2.2} />
              </span>
            </div>
          </Link>

          {/* DOAR mobil (CSS, sub 900px) — înlocuiesc titlul mic + textul
              descriptiv de lângă card (redundante pe mobil, unde cardul stă
              direct sub titlul principal): două repere scurte, câte unul în
              fiecare colț de sus, înclinate în oglindă (stânga negativ/
              dreapta pozitiv) — ca insignele de pe /curs. NOD SEPARAT, în
              AFARA lui .course-visual (care are overflow:hidden pt. colțurile
              rotunjite ale pozei) — altfel colțul ridicat de rotație era
              tăiat de acel overflow. Aici plutesc liber, deasupra cardului. */}
          <div
            className={`course-visual-points${pillsEntered ? ' course-visual-points--float' : ''}`}
            aria-hidden="true"
          >
            <span
              className="course-visual-point course-visual-point--left"
              style={{ '--tilt': '-7deg' } as React.CSSProperties}
            >
              <Check size={9} strokeWidth={3.5} />
              {t.home.pillGuidance}
            </span>
            <span
              className="course-visual-point course-visual-point--right"
              style={{ '--tilt': '7deg' } as React.CSSProperties}
            >
              <Check size={9} strokeWidth={3.5} />
              {t.home.pillRealProjects}
            </span>
          </div>
        </RevealCard>

        {/* RIGHT — cele 3 poze-topic care se schimbă singure. Reveal-ul e
            înăuntrul componentei (vezi nota de la HomeTopicsCarousel). */}
        <HomeTopicsCarousel />
        </div>

      </div>

      {/* Blocul de jos (pilulă + trenuleț) — trigger PROPRIU, fiindcă stă mult
          mai jos decât restul secțiunii: pe pragul de sus ar fi „apărut" cu
          mult înainte să ajungă efectiv pe ecran.
          UN SINGUR reveal pe tot blocul, nu câte unul pe pilulă și pe bandă:
          pilula e suprapusă peste bandă (margin-bottom negativ), deci sunt o
          singură piesă vizuală — revelate separat, s-ar vedea pilula plutind
          singură înainte să apară banda de sub ea.
          Reveal-ul E chiar .home-practice-block (nu un div în plus în jurul
          lui) ⇒ layout-ul rămâne exact același: centrarea pilulei și lățimea
          edge-to-edge a benzii depind de acest element.
          `noFilter` obligatoriu — banda are animație infinită. Acum RevealCard
          (nu Reveal): se repetă la fiecare trecere, ca restul secțiunii. */}
      <RevealCard className="home-practice-block" noFilter amount={0.15}>
        {/* etichetă deasupra benzii de poze — EXACT design-ul de la
            .cl-practice-extra pe /curs, lipsea aici */}
        <span className="home-practice-extra">
          <span className="home-check-dot"><Check size={9} strokeWidth={3.5} /></span>
          {t.home.photoShootLabel}
        </span>

        <HomePracticeMarquee />
      </RevealCard>
    </section>
  );
};

export default SplineDesignSection;
