import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, useScroll, useTransform, useSpring, Variants } from 'framer-motion';
import { Check, X, ZoomIn } from 'lucide-react';
import LuxuryDivider from '../components/LuxuryDivider';
import { Magnetic } from '../components/Magnetic';
import './CursLanding.css';

/* direcția de scroll — cerut explicit: elementele trebuie să apară „de sus
   sau de jos, depinde de unde venim". UN SINGUR listener de scroll pentru
   toată pagina (nu un `useScroll` per element — asta era exact anti-
   pattern-ul care cauza tremurul documentat în memoria proiectului), variabilă
   simplă la nivel de modul, citită direct de componentele de reveal de mai
   jos (closures, fără prop-drilling). +1 = derulezi în JOS (elementele intră
   de JOS, comportamentul implicit de până acum); -1 = derulezi în SUS
   (elementele intră de SUS — simți că „vin de unde vii tu"). */
let clScrollDir: 1 | -1 = 1;
let clLastScrollY = 0;

const useScrollDirectionTracker = () => {
  useEffect(() => {
    clLastScrollY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - clLastScrollY) > 4) {
        clScrollDir = y > clLastScrollY ? 1 : -1;
        clLastScrollY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
};

/* ținte „show" STABILE (constante la nivel de modul, NU obiecte inline
   recreate la fiecare render) — critic pt. framer-motion: un obiect nou de
   fiecare dată la `animate`/`initial`, chiar cu ACELEAȘI valori, poate
   retrigger-ui/reevalua tranziția ori de câte ori părintele re-randează
   din alt motiv (ex. orice click de pe pagină schimbă state-ul lui
   CursLanding → tot subarborele re-randează). Asta a cauzat exact
   „vibrația" raportată la FAQ: un card deja vizibil (.cl-faq, învelit în
   Reveal) primea un obiect `animate` nou la fiecare click, chiar dacă
   valorile erau identice. Obiectele `hidden` (care DEPIND de clScrollDir)
   sunt memorate cu useMemo în fiecare componentă, o singură dată la mount
   — nu la fiecare render. */
const SHOW_YB = { opacity: 1, y: 0, filter: 'blur(0px)' };
const photoShow = SHOW_YB;

/* Reveal FĂRĂ filter — pentru elemente care conțin o animație CSS infinită
   (marquee). Un `filter` ≠ none (chiar și blur(0px)) lăsat de framer forțează
   pe iOS/WebKit un filter render-surface re-rasterizat la fiecare frame cât
   conținutul se mișcă ⇒ licărire. Aici animăm doar opacity + y. */
const SHOW_YB_NOFILTER = { opacity: 1, y: 0 };

/* Poză din benzile zig-zag — parallax legat de scroll DOAR pe desktop.
   Hook-urile useScroll/useSpring nu doar calculează — atașează un listener
   de scroll activ, cost real pe main thread la fiecare cadru cât timp
   elementul e pe ecran. Pe mobil (traficul e ~100% aici) acest cost, ori de
   câte 6 poze din bandă, se aduna cu restul reveal-urilor și se simțea ca
   „tremur"/lag la scroll pe telefon. Fix: componenta cu hook-urile de
   scroll există DOAR pe desktop (randare condiționată la nivel de
   componentă, nu hook condiționat — respectă regulile hook-urilor); pe
   mobil poza e complet statică, fără niciun listener. */
const ZigzagPhotoParallax = ({ src, alt, pos }: { src: string; alt: string; pos: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const y = useSpring(rawY, { stiffness: 120, damping: 26, mass: 0.4 });
  const hidden = useMemo(() => ({ opacity: 0, y: 26 * clScrollDir, filter: 'blur(16px)' }), []);

  return (
    <motion.div
      className="cl-zigzag-photo"
      ref={ref}
      initial={hidden}
      whileInView={photoShow}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="cl-zigzag-photo-img"
        style={{ y, objectPosition: pos }}
        loading="lazy"
      />
    </motion.div>
  );
};

const ZigzagPhotoStatic = ({ src, alt, pos }: { src: string; alt: string; pos: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const hidden = useMemo(() => ({ opacity: 0, y: 26 * clScrollDir, filter: 'blur(16px)' }), []);

  return (
    <motion.div
      className="cl-zigzag-photo"
      ref={ref}
      initial={hidden}
      animate={inView ? photoShow : hidden}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        src={src}
        alt={alt}
        className="cl-zigzag-photo-img"
        style={{ objectPosition: pos }}
        loading="lazy"
      />
    </motion.div>
  );
};

const ZigzagPhoto = ({ src, alt, pos = '50% 50%' }: { src: string; alt: string; pos?: string }) => {
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768).current;
  return isMobile
    ? <ZigzagPhotoStatic src={src} alt={alt} pos={pos} />
    : <ZigzagPhotoParallax src={src} alt={alt} pos={pos} />;
};

/* ────────────────────────────────────────────────────────────────
   Pagină DEDICATĂ cursului, pentru link-ul din bio Instagram.
   NU e listată în navigare/meniu — accesibilă doar pe URL direct
   (vezi App.tsx: ruta există, dar Navbar/Footer nu se randează aici).
   Fundal espresso închis (paleta overlay-ului din meniul hamburger —
   vars deja globale, definite în Navbar.css :root).
──────────────────────────────────────────────────────────────── */

const WHATSAPP_NUMBER = '37362167165';
const WHATSAPP_MSG = encodeURIComponent(
  'Bună! Vreau să mă înscriu la cursul de design interior NOMA School.'
);
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

/* Săgeată diagonală — același limbaj vizual ca bulinele din story-urile NOMA */
// Marcaj custom premium — gem fațetat (brilliant cut), pe motivul de lux NOMA.
// NU săgeată generică. Culoarea vine din CSS (currentColor = tonul secțiunii).
const Arrow = () => (
  <svg className="cl-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 4.5H18L21 8.7L12 20L3 8.7L6 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 8.7H21M6 4.5L7.5 8.7L12 20M18 4.5L16.5 8.7L12 20" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.45" />
  </svg>
);

/* iconiță „viewfinder" (4 colțuri de cadru foto) pt. butonul de deschidere
   a PDF-urilor — cerut explicit „ceva deosebit", nu o săgeată/lupă
   generică. Citește ca „deschide/vezi în mare", potrivit pt. un PDF. */
const ExpandIcon = () => (
  <svg className="cl-expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 9V5.6C4 4.7 4.7 4 5.6 4H9M15 4H18.4C19.3 4 20 4.7 20 5.6V9M20 15V18.4C20 19.3 19.3 20 18.4 20H15M9 20H5.6C4.7 20 4 19.3 4 18.4V15"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* Iconița WhatsApp — DOAR pe pastila flotantă (Arrow rămâne neschimbată,
   e reutilizată și la „După curs"). Glif oficial simplificat (fill,
   currentColor), nu stroke — recognoscibil ca „WhatsApp" dintr-o privire. */
const WhatsAppIcon = () => (
  <svg className="cl-whatsapp-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.1h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.37c0-4.55 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.55-3.71 8.24-8.25 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.81-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.24-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.47-.01a.9.9 0 0 0-.65.3c-.23.24-.85.83-.85 2.03s.87 2.36.99 2.52c.12.16 1.71 2.6 4.14 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
  </svg>
);

/* ── Titlu cu clip-reveal (o singură linie fiecare — regula anti-bug iOS) ── */
const clipUp: Variants = {
  hidden: { y: '150%' },
  show: { y: '0%', transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] } },
};

const ClipLine = ({
  children,
  delay = 0,
  as: Tag = 'span',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  as?: 'span' | 'em';
  className?: string;
}) => {
  const Comp = (motion as any)[Tag];
  return (
    <span className={`cl-clip ${className}`}>
      <Comp
        className="cl-clip-inner"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { delayChildren: delay } } }}
      >
        <motion.span variants={clipUp} style={{ display: 'block' }}>{children}</motion.span>
      </Comp>
    </span>
  );
};

/* ── Card cu fundal propriu (opacity+blur e sigur, nu e text gol) ──
   y înmulțit cu clScrollDir — vine de SUS când urci cu scroll-ul, de JOS
   când cobori. useMemo (nu obiect inline) — obiect NOU la fiecare render
   putea retrigger-ui tranziția framer ori de câte ori state-ul din altă
   parte a paginii schimba (ex. click pe FAQ re-randează tot subarborele),
   simțit ca „vibrație" pe cardurile deja vizibile. */
const Reveal = ({ children, className = '', delay = 0, noFilter = false }: { children: React.ReactNode; className?: string; delay?: number; noFilter?: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  /* noFilter: pentru containere al căror conținut se schimbă dinamic (acordeon
     FAQ). Un `filter:blur(0px)` rezidual lăsat de framer ar re-rasteriza toată
     suprafața la fiecare schimbare de înălțime = licărire de border (ex. rămucuța
     de jos a ultimului card). Fără cheia `filter` ⇒ fără suprafață de filtru. */
  const hidden = useMemo(
    () => (noFilter ? { opacity: 0, y: 32 * clScrollDir } : { opacity: 0, y: 32 * clScrollDir, filter: 'blur(6px)' }),
    [noFilter]
  );
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={inView ? (noFilter ? SHOW_YB_NOFILTER : SHOW_YB) : hidden}
      transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

/* intrare fade+blur+y de jos — wrapper-ul EXTERIOR (acesta) e diferit de
   nodul cu plutirea idle CSS (.cl-card-float, copilul din interior), deci
   cele două transform-uri NU se bat (noduri separate). hidden are propria
   tranziție (mai scurtă) = ieșire grațioasă „în abur" când cardul părăsește
   ecranul, nu dispariție bruscă. Durată redusă (0.9s, nu 1.5s) — chiar și
   la retrigger (scroll înainte-înapoi), se stabilizează rapid. */
/* Card generic „plutitor" — intrare fade+blur+y pe wrapper, plutire idle
   CSS pe cardul vizibil din interior (nod separat, fără conflict de
   transform). Refolosit pe TOATE
   cardurile cu informație din pagină, inclusiv bannerul din perechea
   zig-zag — un singur mecanism, uniform peste tot (nu mai are și parallax
   de scroll separat: combinat cu plutirea idle, cele două mișcări se
   cumulau și „mâncau" gap-ul mic dintre rânduri, provocând suprapuneri).
   once:FALSE — cardurile ies „în abur" când părăsesc ecranul și reapar la
   fel când derulezi înapoi în sus. margin:-10% pe useInView de mai jos —
   pragul de declanșare NU mai e chiar la marginea ecranului; fără el, un
   scroll normal (nu doar oscilație mică) re-declanșa animația de fiecare
   dată câte un card trecea granița, iar cu MULTE carduri pe ecran simultan
   asta arăta ca un „tremur" continuu la scroll în jos/sus. Cardurile au
   suprafață proprie (fundal, ramă), deci blur+opacity NU licăre pe iOS
   (doar textul gol are problema).
   wrapClassName = clasă opțională pe wrapper-ul EXTERIOR, pt. cazurile în
   care acela trebuie să fie itemul flex (ex. .cl-zigzag-banner-wrap). */
const FloatCard = ({ children, className = '', wrapClassName = '', delay = 0, floatDelay = 0 }: { children: React.ReactNode; className?: string; wrapClassName?: string; delay?: number; floatDelay?: number }) => {
  const ref = useRef(null);
  /* once:true — pagina asta e f. lungă, cu ZECI de carduri FloatCard pe
     ecran; cu once:false, fiecare card își relua animația filter:blur()
     de fiecare dată când trecea granița viewport-ului la orice scroll
     (nu doar oscilație), iar pe mobil (traficul e ~100%) suma re-blur-
     urilor simultane încărca principalul thread suficient cât să se simtă
     ca „tremur"/lag la scroll. Reveal-ul tot rulează prima dată, doar nu
     se mai repetă la fiecare trecere. */
  const inView = useInView(ref, { once: true, margin: '-10%' });
  /* y înmulțit cu clScrollDir — vine de SUS când urci, de JOS când cobori.
     useMemo — vezi motivul la Reveal (evită „vibrația" la re-render extern). */
  const hidden = useMemo(() => ({ opacity: 0, y: 30 * clScrollDir, filter: 'blur(10px)' }), []);
  return (
    <motion.div
      ref={ref}
      className={wrapClassName}
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
    >
      <div className={`${className} cl-card-float`} style={{ animationDelay: `${floatDelay}s` }}>
        {children}
      </div>
    </motion.div>
  );
};

/* Card PDF din „Rezultatul final" — cerut explicit: cardul NU mai plutește
   idle (doar insigna lui plutește), iar cardul + insigna apar SINCRON la
   scroll, din același `useInView` (un singur ref, pe wrapper-ul comun) —
   nu două detectoare de viewport separate, care ar declanșa reveal-urile
   la momente ușor diferite (insigna atârnă deasupra cardului, la o
   coordonată Y diferită). Insigna păstrează structura în DOI noduri
   (wrap = poziționare + reveal framer, corner = stilul vizual + plutirea
   idle CSS) ca cele două transform-uri (framer y/opacity vs. CSS
   rotate/translateY) să nu se bată pe același element. */
const ResultPdfCard = ({ p, index }: { p: (typeof RESULT_PDFS)[number]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-10%' });
  /* once:false aici (cerut explicit — reveal repetat la scroll) — spre
     deosebire de Reveal/FloatCard (once:true), clScrollDir chiar se poate
     schimba între re-reveal-uri succesive, deci memorăm cu clScrollDir ca
     dependență (recalculează DOAR când direcția s-a schimbat cu adevărat,
     nu la orice re-render extern — același motiv ca la Reveal). */
  const hiddenBadge = useMemo(() => ({ opacity: 0, y: 10 * clScrollDir, filter: 'blur(6px)' }), [clScrollDir]);
  const hiddenCard = useMemo(() => ({ opacity: 0, y: 30 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  const showBadge = SHOW_YB;
  const showCard = SHOW_YB;

  return (
    <div ref={ref} className="cl-result-pdf-item">
      {p.badges.map((b, bi) => (
        <motion.span
          key={b.text}
          className={`cl-result-pdf-badge-wrap cl-result-pdf-badge-wrap--${b.side}`}
          initial={hiddenBadge}
          animate={inView ? showBadge : hiddenBadge}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 + bi * 0.05 }}
        >
          <span
            className={`cl-result-pdf-badge-corner cl-result-pdf-badge-corner--${b.side} cl-card-float`}
            style={{ '--tilt': `${b.tilt}deg`, animationDelay: `${index * 0.3 + bi * 0.15}s` } as React.CSSProperties}
          >
            <span className="cl-check-dot"><Check size={7} strokeWidth={3.5} /></span>
            {b.text}
          </span>
        </motion.span>
      ))}

      <motion.div
        className="cl-result-pdf-card"
        initial={hiddenCard}
        animate={inView ? showCard : hiddenCard}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      >
        <a
          href={p.file}
          target="_blank"
          rel="noopener noreferrer"
          className="cl-result-pdf-visual"
          aria-label={`Deschide PDF: ${p.title} — ${p.subtitle}`}
        >
          <img
            src={p.cover}
            alt={`${p.title} — ${p.subtitle}`}
            className="cl-result-pdf-img"
            loading="lazy"
            decoding="async"
          />
          <span className="cl-result-pdf-open" aria-hidden="true">
            <ExpandIcon />
            <span>Deschide</span>
          </span>
          <span className="cl-result-pdf-footer" aria-hidden="true" />
        </a>
      </motion.div>
    </div>
  );
};

/* carusel discret pt. cele 3 topice (măsurări/șantier/showroom) — „ca
   înainte": un singur cadru, track glisant (translateX(-active*100%)),
   bulină unică sincronă cu poza curentă, tilt fix în colț. */
const PracticeTopicsCarousel = () => {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  /* once:true — cu `false`, caruselul își relua alunecarea de 30px la FIECARE
     intrare în ecran, în timp ce cardul de alături (once:true) stătea pe loc:
     alăturate, se vedea ca și cum cardurile își schimbă poziția între ele.
     Restul paginii folosește oricum once:true (vezi FloatCard/Reveal). */
  const inView = useInView(ref, { once: true, margin: '-10%' });

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % PRACTICE_TOPICS.length), 3400);
    return () => clearInterval(id);
  }, []);

  /* FĂRĂ `filter`: cadrul conține track-ul care alunecă la fiecare schimbare de
     poză, iar un blur(0px) rezidual l-ar re-rasteriza de fiecare dată (vezi
     regula din Reveal/noFilter). Doar opacity + y. */
  const hiddenBadge = useMemo(() => ({ opacity: 0, y: 10 * clScrollDir }), [clScrollDir]);
  const hiddenFrame = useMemo(() => ({ opacity: 0, y: 30 * clScrollDir }), [clScrollDir]);

  return (
    <div ref={ref} className="cl-practice-carousel">
      <motion.span
        className="cl-practice-badge-wrap"
        initial={hiddenBadge}
        animate={inView ? SHOW_YB_NOFILTER : hiddenBadge}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <span
          className="cl-practice-badge cl-card-float"
          style={{ '--tilt': '-6deg', animationDelay: '0.2s' } as React.CSSProperties}
        >
          <span className="cl-check-dot"><Check size={7} strokeWidth={3.5} /></span>
          <motion.span
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {PRACTICE_TOPICS[active].label}
          </motion.span>
        </span>
      </motion.span>

      <motion.div
        className="cl-practice-frame"
        initial={hiddenFrame}
        animate={inView ? SHOW_YB_NOFILTER : hiddenFrame}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* translate3d, NU translateX: stilul inline suprascria complet
            `transform: translateZ(0)` din CSS, deci track-ul NU primea niciodată
            strat propriu de compositing. Fără el, alunecarea de 1s repicta la
            fiecare cadru tot cadrul-părinte — chenarul subțire și cele două
            umbre blurate — iar rămucuța „dispărea" până se termina tranziția. */}
        <div className="cl-practice-track" style={{ transform: `translate3d(-${active * 100}%, 0, 0)` }}>
          {PRACTICE_TOPICS.map((topic, i) => (
            <img
              key={topic.src}
              src={topic.src}
              alt={topic.label}
              className="cl-practice-photo-img"
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* bandă continuă (11 poze din ședința foto) — EXACT tehnica de la
   „Înveți. Aplici. Realizezi." din hero (.cl-hero-sub-track): conținut
   dublat + translateX(0→-50%) infinit = buclă perfect continuă. Poze
   NECLICKABILE, fără legendă (documentare vizuală generică). */
const PracticeShootMarquee = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  /* fără blur în hidden/animate: containerul rulează marquee-ul infinit, iar un
     filter rezidual (blur 0) l-ar face să licăre pe iOS. Vezi SHOW_YB_NOFILTER. */
  const hidden = useMemo(() => ({ opacity: 0, y: 30 * clScrollDir }), []);

  /* Mișcarea e o animație CSS pură (compositor, nu main-thread ⇒ fără lag),
     cu translateX 2D simplu — exact ca librăriile de marquee testate. Vezi CSS. */
  return (
    <motion.div
      ref={ref}
      className="cl-practice-marquee"
      aria-hidden="true"
      initial={hidden}
      animate={inView ? SHOW_YB_NOFILTER : hidden}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-practice-marquee-track">
        {[...PRACTICE_SHOOT_PHOTOS, ...PRACTICE_SHOOT_PHOTOS].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="cl-practice-marquee-img"
            /* TOATE eager — pozele lazy din a doua jumătate (buclă) apăreau
               brusc când intrau în cadru = „licărire" la un anumit interval.
               Sunt mici (~15-25KB), încărcarea totală e neglijabilă. */
            loading="eager"
            decoding="async"
          />
        ))}
      </div>
    </motion.div>
  );
};

const WhatsAppCTA = ({ label, className = '' }: { label: string; className?: string }) => (
  <Magnetic strength={0.25}>
    <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={`cl-cta-btn ${className}`}>
      {label}
    </a>
  </Magnetic>
);

/* buton flotant, fix jos pe ecran — MEREU vizibil, pe toate secțiunile
   (inclusiv hero și footer, care nu mai au CTA propriu). Fiecare zonă a
   pastilei are propria culoare din familia bej/kaki-olive/bordo-vișinie
   (nu se repetă): text cremos, ramă olive/kaki, bulina din dreapta
   bordo/vișinie — toate PALE și cu efect de sticlă (glassmorphism:
   backdrop-blur + fundal translucid + highlight subțire sus), nu solide.
   Glow LED cald păstrat dedesubt.
   PORTAL în document.body: App.tsx animă tranziția de pagină cu framer-motion
   pe `<main key={pathname}>`, care rămâne cu `transform` inline (chiar matrice
   identitate) — orice ancestor cu transform creează un containing block nou
   și rupe `position:fixed` pentru descendenți (verificat: getBoundingClientRect
   avea `top` în mii de px, nu relativ la viewport). Portalul iese din arborele
   animat, deci fixed se comportă normal.
   Vibrație periodică — EXACT timing-ul widget-ului de mesagerie
   (MessengerWidget.tsx): prima dată după 4s, apoi la fiecare 8s. Clasa se
   adaugă/scoate manual pe elementul DOM (Magnetic nu expune ref extern spre
   `<a>`, deci querySelector, ca în widget). */
const FloatingCTA = () => {
  useEffect(() => {
    const btn = document.querySelector<HTMLElement>('.cl-float-cta');
    if (!btn) return;
    let stopped = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const trigger = () => {
      if (stopped) return;
      btn.classList.add('cl-attention');
      const onEnd = () => {
        btn.classList.remove('cl-attention');
        btn.removeEventListener('animationend', onEnd);
      };
      btn.addEventListener('animationend', onEnd);
    };

    const timerId = setTimeout(() => {
      trigger();
      intervalId = setInterval(trigger, 8000);
    }, 4000);

    return () => {
      stopped = true;
      clearTimeout(timerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return createPortal(
    <div className="cl-float-cta-wrap">
      <Magnetic strength={0.15}>
        <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="cl-float-cta">
          <span className="cl-float-cta-label">Rezervă-ți locul la curs</span>
          <span className="cl-float-cta-icon"><WhatsAppIcon /></span>
        </a>
      </Magnetic>
    </div>,
    document.body
  );
};

const PAIN_POINTS = [
  'Ești confuz când lucrezi cu clienții și nu știi ce să răspunzi la obiecții.',
  'Nu știi de unde să începi un proiect — de la prima întâlnire până la final.',
  'Ai idei bune, dar nu le poți transforma în planuri și randări reale.',
  'Îți dorești o carieră în design, dar simți că nu ai experiență suficientă.',
  'Nu știi să lucrezi în softurile de proiectare — AutoCAD sau 3Ds Max.',
  'Ești începător și nu știi absolut nimic despre această profesie.',
];

/* poze reale de pe șantier/consultanță, împerecheate cu primele 6 topice
   din Programa, într-o bandă zig-zag (baner↔poză alternând stânga/dreapta) */
/* pos = object-position — ține subiectul (față/mâini/document) în cadru
   după ce coloana devine îngustă/lungită (raport 2/3 pe mobil); tăiem doar
   spațiul irelevant din jur (perete, fundal gol), nu subiectul. */
const ZIGZAG_PHOTOS = [
  { src: '/curs-landing/zigzag-1.webp', alt: 'Consultanță pe teren, cu randarea în mână', pos: '68% 32%' },
  { src: '/curs-landing/zigzag-2.webp', alt: 'Discuție cu clientul, direct de pe șantier', pos: '50% 38%' },
  { src: '/curs-landing/zigzag-3.webp', alt: 'Prezentarea documentației tehnice pe șantier', pos: '42% 30%' },
  { src: '/curs-landing/zigzag-4.webp', alt: 'Verificarea randării, comparată cu execuția reală', pos: '58% 35%' },
  { src: '/curs-landing/santier-consultanta.webp', alt: 'Consultanță pe șantier, cu planul tehnic în mână', pos: '65% 48%' },
  { src: '/curs-landing/zigzag-5.webp', alt: 'Coborând scările șantierului, discutând planul cu clienta', pos: '55% 28%' },
];

/* title conține "\n" — punct de rupere ALES manual (nu lăsat pe seama
   wrap-ului automat), ca primul rând să fie mereu mai lung decât al doilea */
const CURRICULUM = [
  {
    title: 'Planuri tehnice\nîn AutoCAD',
    items: ['Releveu și instalații existente', 'Demolare și montare construcții', 'Amplasare mobilier, cotat și explicat', 'Prize, întrerupătoare și iluminat', 'Conexiuni electrice și circuite', 'Tavan, pardoseală, apeduct, canalizare', 'Obiecte sanitare și desfășurate pereți', 'Note tehnice și detalii de execuție'],
  },
  {
    title: 'Randări fotorealiste\nîn 3Ds Max',
    items: ['Modelarea tehnică a interiorului', 'Perspective geometrice și cadre de detaliu', 'Integrarea corectă a iluminatului', 'Materiale și texturi realiste'],
  },
  {
    title: 'Punctele-cheie ale\nunui șantier',
    items: ['Electricitate', 'Apeduct și canalizare', 'Calculul iluminatului', 'Ergonomia spațiului'],
  },
  {
    title: 'Poziționarea ta ca\ndesigner',
    items: ['Cum te poziționezi ca designer pe piață', 'Schema de lucru a unui proiect, de la A la Z'],
  },
  {
    title: 'Lucrul cu clienții\nși furnizorii',
    items: ['Comunicare clară în fiecare etapă', 'Cum alegi și colaborezi cu furnizorii', 'Materiale, calcule și gestionarea bugetului'],
  },
  {
    title: 'Moodboard',
    items: ['Produse reale, cu coduri și referințe', 'Stilul potrivit clientului', 'Gama coloristică'],
  },
  {
    title: 'Prezentarea finală',
    items: ['O prezentare care adună toată documentația proiectului tău final — gata de arătat clientului'],
  },
];

/* baner + poză, randate ca funcții separate — refolosite în DOUĂ coloane
   independente (vezi cl-zigzag-2col, mai jos), nu într-un „rând" comun.
   Un rând comun (flex row) forța gap-ul dintre banda 0 și banda 1 să fie
   dictat de cel mai înalt element din rând (de regulă bannerul, care poate
   avea 8 sau doar 2 iteme) — elementul mai scurt de pe ACEEAȘI coloană
   (ex. poza de sus + bannerul de dedesubt, ambele pe aceeași parte) rămânea
   mult mai departe decât gap-ul „normal", pentru că depindea de partenerul
   lui de rând, nu de vecinul lui real de pe coloană. Cu coloane
   independente, fiecare element urmează direct pe cel de deasupra LUI,
   din ACEEAȘI coloană — gap egal, peste tot, sus/jos. */
const renderZigzagBanner = (i: number) => {
  const block = CURRICULUM[i];
  return (
    <FloatCard key={block.title} className="cl-zigzag-banner" wrapClassName="cl-zigzag-banner-wrap" delay={i * 0.06} floatDelay={i * 0.35}>
      <h3>
        {block.title.split('\n').map((line, li) => (
          <span key={li} className="cl-curriculum-card-titleline">{line}</span>
        ))}
      </h3>
      <ul>
        {block.items.map((it) => (
          <li key={it}>
            <span className="cl-check-dot">
              <Check size={8} strokeWidth={3.5} />
            </span>
            {it}
          </li>
        ))}
      </ul>
    </FloatCard>
  );
};

const renderZigzagPhoto = (i: number) => {
  const p = ZIGZAG_PHOTOS[i];
  return <ZigzagPhoto key={p.src} src={p.src} alt={p.alt} pos={p.pos} />;
};

/* Iconițe custom pentru cele 4 puncte din „Cum lucrăm" — fiecare punct are
   SEMNUL LUI (regula: fiecare particică se deosebește în felul ei, iconițe la
   temă, niciodată săgeți generice). currentColor ⇒ preiau albastrul secțiunii
   din CSS, cu glow prin drop-shadow. */
/* „de la zero" = chiar cifra ZERO, în varianta TĂIATĂ folosită în desenul
   tehnic/planșe (AutoCAD) — literal și la temă. Frunza de dinainte n-avea
   nicio legătură cu subiectul. */
const IconFromZero = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="5.6" ry="7.6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9.1 16.6L14.9 7.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const IconLive = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <path d="M8 8A5.6 5.6 0 0 0 8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 8A5.6 5.6 0 0 1 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 5A9.8 9.8 0 0 0 5 19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
    <path d="M19 5A9.8 9.8 0 0 1 19 19" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
  </svg>
);

const IconScreenShare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.6" y="4" width="18.8" height="13" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 17v3.4M8.8 20.4h6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    <path d="M9.9 7.9L15.4 11.2L12.9 11.9L11.9 14.2L9.9 7.9Z" fill="currentColor" />
  </svg>
);

const IconReplay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.2 12A8.2 8.2 0 1 1 17.5 5.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M20.4 3.4V8.1H15.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 9.4L14.9 12L10.5 14.6V9.4Z" fill="currentColor" opacity="0.85" />
  </svg>
);

/* Cele 4 puncte NU mai stau ca listă plată de bife identice — trăiesc acum
   într-o ferestruică deschisă din cardul cu poză de mai jos. Fiecare are
   titlu scurt + iconiță proprie, ca ochiul să le separe. */
const HOW_WE_WORK = [
  { Icon: IconFromZero, title: 'De la zero', text: 'Înveți de la zero, chiar dacă nu ai nicio experiență.' },
  { Icon: IconLive, title: 'Lecții LIVE pe Zoom', text: 'Vezi pas cu pas cum se lucrează la un proiect real, în direct.' },
  { Icon: IconScreenShare, title: 'Verificat individual', text: 'Prin partajarea ecranului primești feedback personalizat la fiecare temă.' },
  { Icon: IconReplay, title: 'Rămân înregistrate', text: 'Primești lecțiile înregistrate — suport la care revii oricând ai nevoie.' },
];

/* poza cardului „Cum lucrăm" — cadru real, ecran dublu (3Ds Max + plan
   tehnic) cu microfoanele de înregistrare vizibile */
const HOW_CARD_PHOTO = '/curs-landing/how-lessons.jpg';

/* Cardul cu poză din „Cum lucrăm": poza + un buton-pastilă de sticlă ancorat
   jos, care deschide ferestruica cu cele 4 puncte. Înlocuiește lista plată de
   4 carduri identice — textul stă acum ÎN vizual, nu lângă el. */
const HowWeWorkCard = ({ onOpen }: { onOpen: () => void }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  /* fără `filter` — stă lipit de carusel, într-un container care se repictează
     continuu (trenulețul); orice blur rezidual ar re-rasteriza și cardul ăsta */
  const hidden = useMemo(() => ({ opacity: 0, y: 30 * clScrollDir }), []);

  return (
    <motion.div
      ref={ref}
      className="cl-how-card"
      initial={hidden}
      animate={inView ? SHOW_YB_NOFILTER : hidden}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <img
        src={HOW_CARD_PHOTO}
        alt="Lecție pe un proiect real, cu planul tehnic în față"
        className="cl-how-card-img"
        loading="lazy"
      />
      <span className="cl-how-card-veil" aria-hidden="true" />
      {/* pastila e doar VIZUAL (span, nu button): ca <button> primea
          `min-height:44px` din regulile globale de touch-target și ieșea
          disproporționat de înaltă pe telefon. Zona de apăsare e cardul
          ÎNTREG, de mai jos — țintă mult mai mare, exact tiparul
          `.pricing-cta-overlay` de la /servicii. */}
      <span className="cl-how-card-btn">
        <span className="cl-how-card-btn-dot" aria-hidden="true" />
        Cum decurg lecțiile
      </span>
      <button
        type="button"
        className="cl-how-card-hit"
        onClick={onOpen}
        aria-label="Cum decurg lecțiile — vezi detaliile"
      />
    </motion.div>
  );
};

/* 3 topice cu poză reală, „ca înainte" — carusel discret (o poză
   dispare/alta apare, track glisant), cu bulina proprie sincronă, NU
   amestecate în banda continuă de mai jos (userul a semnalat că poza cu
   șantierul/showroom-ul nu are ce căuta printre portretele din ședința
   foto — sunt alt gen de conținut). */
const PRACTICE_TOPICS = [
  { src: '/curs-landing/practice-masuratori.webp', label: 'Propriile măsurări' },
  { src: '/curs-landing/practice-santier.webp', label: 'Analiza șantier 6 etaje' },
  { src: '/curs-landing/practice-showroom.webp', label: 'Vizite la showroomuri' },
];

/* cele 11 poze din ședința foto profesionistă (optimizate: orientare EXIF
   corectată, redimensionate, webp) — bandă continuă separată, fără
   legendă (documentare vizuală, nu topic-uri individuale) */
const PRACTICE_SHOOT_PHOTOS = [
  '/curs-landing/practice-shoot-1.webp',
  '/curs-landing/practice-shoot-2.webp',
  '/curs-landing/practice-shoot-3.webp',
  '/curs-landing/practice-shoot-4.webp',
  '/curs-landing/practice-shoot-5.webp',
  '/curs-landing/practice-shoot-6.webp',
  '/curs-landing/practice-shoot-7.webp',
  '/curs-landing/practice-shoot-8.webp',
  '/curs-landing/practice-shoot-9.webp',
  '/curs-landing/practice-shoot-10.webp',
  '/curs-landing/practice-shoot-11.webp',
];
const PRACTICE_EXTRA = 'Ședință foto pentru social media';

const GAINS = [
  { title: 'Încredere în comunicare', text: 'Vorbești deschis cu clienții, îți prezinți ideile clar și răspunzi fără emoții la întrebări sau obiecții.' },
  { title: 'Fără confuzie, doar claritate', text: 'Înțelegi fiecare etapă a unui proiect și știi exact ce ai de făcut, de la prima întâlnire până la final.' },
  { title: 'Colaborezi ca un profesionist', text: 'Descoperi cum funcționează colaborarea cu furnizorii, companiile de materiale și echipele de execuție.' },
  { title: 'Iei decizii cu siguranță', text: 'Alegi materiale, culori, mobilier și soluții tehnice cu argumente clare și logică.' },
  { title: 'Experiență reală', text: 'Lucrezi pe proiecte reale și primești informații practice pe care nu le găsești în tutoriale.' },
  { title: 'Softuri avansate de proiectare', text: 'Lucrezi cu încredere în AutoCAD și 3Ds Max — de la planurile tehnice până la randările fotorealiste ale proiectului tău.' },
];

/* cele 3 PDF-uri de portofoliu real, cu poza pdf1/2/3 (din Downloads) ca
   imagine principală a cardului — deschise direct într-un tab nou, PDF-uri
   deja comprimate (imagini redimensionate + recompresie JPEG) pentru
   încărcare rapidă chiar și pe conexiune mobilă.
   badges = insigne mici plutitoare, poziționate DEASUPRA cardului (nu în
   interiorul lui — cardul are overflow:hidden pt. colțurile rotunjite ale
   pozei, orice ar fi înăuntru și ar depăși marginea de sus era tăiat).
   side='left'/'right' → colțul de care atârnă insigna (Moodboard are una
   pe fiecare parte). */
const RESULT_PDFS = [
  {
    title: 'Album tehnic',
    subtitle: 'Apartament Ciocana',
    cover: '/curs-landing/rezultat-pdf-1.webp',
    file: '/pdf/curs-landing/album-tehnic-apartament-ciocana.pdf',
    badges: [{ text: 'Album tehnic complet', tilt: -6, side: 'left' as const }],
  },
  {
    title: 'Moodboard',
    subtitle: 'Apartament Ciocana',
    cover: '/curs-landing/rezultat-pdf-2.webp',
    file: '/pdf/curs-landing/moodboard-apartament-ciocana.pdf',
    badges: [
      { text: 'Moodboard complex', tilt: -6, side: 'left' as const },
      { text: 'Randări fotorealiste', tilt: 6, side: 'right' as const },
    ],
  },
  {
    title: 'Portofoliu',
    subtitle: 'Design interior — Carolina',
    cover: '/curs-landing/rezultat-pdf-3.webp',
    file: '/pdf/curs-landing/portofoliu-design-interior-carolina.pdf',
    badges: [{ text: 'Prezentare finală', tilt: -6, side: 'left' as const }],
  },
];

const AFTER_COURSE = [
  'Poți lucra ca designer de interior freelancer și să îți construiești propriul portofoliu de clienți.',
  'Poți colabora cu birouri de arhitectură sau design interior.',
  'Poți oferi servicii complete, de la concept la proiect tehnic și prezentare.',
  'Poți transforma pasiunea ta într-o carieră stabilă și creativă.',
];

/* trenulețul de cursante — poze + poveste + o poză din proiectul lor real
   (2D/3D). Fără citate puse în ghilimele — doar povestea, la toate trei. */
const TESTIMONIALS = [
  {
    name: 'Inesa',
    age: 22,
    photo: '/curs-landing/testimonial-inesa.webp',
    photoPos: '62% 22%',
    story: 'A făcut 2 cursuri, apoi practică, apoi a devenit proiectant 2D principal în echipă — iar de 1 an lucrează intens la proiecte reale. Acum a avansat și face și proiect 3D, full cu tot cu moodboard.',
    project: '/curs-landing/testimonial-inesa-proiect.webp',
    projectRatio: 1000 / 827,
    projectLabel: 'Proiect 3D — moodboard și panouri decorative',
  },
  {
    name: 'Andreea',
    age: 21,
    photo: '/curs-landing/testimonial-andreea.webp',
    photoPos: '45% 25%',
    story: 'A renunțat la jobul de barber ca să învețe design interior. A câștigat stagiul de practică în compania noastră și deja execută primul ei proiect: participă la discuțiile cu clientul, a luat măsurători și îl va duce cap-coadă, cu verificarea noastră amănunțită.',
    project: '/curs-landing/testimonial-andreea-proiect.webp',
    projectRatio: 1000 / 915,
    projectLabel: 'Plan 2D — apartament complet',
  },
  {
    name: 'Ana Maria',
    age: 17,
    photo: '/curs-landing/testimonial-ana.webp',
    photoPos: '78% 30%',
    story: 'Încă elevă la liceu, după finalizarea cursului lucrează deja la primul ei proiect de design interior: amenajarea unui salon de frumusețe.',
    project: '/curs-landing/testimonial-ana-proiect.webp',
    projectRatio: 1170 / 709,
    projectLabel: 'Amenajare salon de frumusețe',
  },
];

const FAQ = [
  { q: 'Pentru cine este acest curs?', a: 'Pentru oricine vrea să înceapă sau să-și consolideze o carieră în design interior — nu ai nevoie de experiență anterioară.' },
  { q: 'Am nevoie de cunoștințe de AutoCAD sau 3Ds Max?', a: 'Nu. Înveți totul de la zero, pas cu pas, cu teme practice verificate individual.' },
  { q: 'Ce primesc la finalul cursului?', a: 'Un album tehnic complet, randări fotorealiste, moodboard și o prezentare finală — practic, un portofoliu gata de arătat primului client.' },
  { q: 'Rămâneți alături după finalizarea cursului?', a: 'Da. Oferim suport cu programele, sfaturi din experiență practică și contacte utile în industrie.' },
  { q: 'Cum mă înscriu?', a: 'Scrie-ne direct pe WhatsApp — îți răspundem cu toate detaliile despre format și locurile disponibile.' },
];

const CursLanding = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStudent, setActiveStudent] = useState(0);
  /* crossfade premium la schimbarea profilului: wrapper-ul (NU motion.div-ul
     interior, care își are propriul opacity animat de framer — un conflict
     ar face ca valoarea lui React să fie suprascrisă de framer la fiecare
     cadru) se face invizibil 180ms, se schimbă cursanta ÎN SPATELE
     tranziției, apoi reapare — swap-ul dur (remount instant) nu se mai vede,
     doar un fade-cross lin, la fel pe click ȘI pe swipe. */
  const [studentSwitching, setStudentSwitching] = useState(false);
  const selectStudent = (i: number) => {
    if (i === activeStudent || studentSwitching) return;
    setStudentSwitching(true);
    setTimeout(() => {
      setActiveStudent(i);
      setStudentSwitching(false);
    }, 180);
  };
  const student = TESTIMONIALS[activeStudent];

  /* Cardul are înălțime diferită per cursantă (poveste mai lungă/scurtă —
     măsurat: 427-604px, diferență de 177px), iar la schimbare tot ce e sub
     secțiune „sărea" în sus/jos cu diferența asta. Fix, ACEEAȘI tehnică ca la
     egalizarea zigzag de mai sus: măsor live înălțimea NATURALĂ a fiecărei
     cursante (toate 3 randate simultan, ascunse — height:0+overflow:hidden pe
     wrapper NU afectează geometria proprie a copiilor din interior) și dau
     min-height cardului vizibil = maximul, recalculat la resize/font-load. */
  const testimonialMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [testimonialMinH, setTestimonialMinH] = useState(0);

  useEffect(() => {
    const measure = () => {
      const heights = testimonialMeasureRefs.current.map((el) => el?.getBoundingClientRect().height ?? 0);
      const max = Math.round(Math.max(...heights));
      if (max > 0) setTestimonialMinH((prev) => (prev !== max ? max : prev));
    };
    measure();
    let cancelled = false;
    document.fonts?.ready?.then(() => { if (!cancelled) measure(); });
    window.addEventListener('load', measure);
    window.addEventListener('resize', measure);
    const finalCheck = setTimeout(measure, 1200);
    const ro = new ResizeObserver(measure);
    testimonialMeasureRefs.current.forEach((el) => el && ro.observe(el));
    return () => {
      cancelled = true;
      window.removeEventListener('load', measure);
      window.removeEventListener('resize', measure);
      clearTimeout(finalCheck);
      ro.disconnect();
    };
  }, []);

  /* ferestruica „Cum decurg lecțiile" — portal + Escape + blocarea scrollului.
     NU doar `overflow:hidden` pe body: pe iOS Safari asta nu oprește
     scroll-ul/bounce-ul de fundal (bug cunoscut — overflow:hidden e ignorat
     de motorul elastic de scroll al iOS). Fix real: body devine `position:
     fixed`, cu `top` negativ = exact scrollY-ul curent, ca pagina să rămână
     vizual pe loc; la închidere, se restaurează poziția și se sare înapoi
     la același scrollY (fără fixed, scrollTo ar sări la 0 înainte). */
  const [howModalOpen, setHowModalOpen] = useState(false);
  useEffect(() => {
    if (!howModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setHowModalOpen(false); };
    window.addEventListener('keydown', onKey);
    const scrollY = window.scrollY;
    const body = document.body.style;
    const original = { position: body.position, top: body.top, width: body.width, overflow: body.overflow };
    body.position = 'fixed';
    body.top = `-${scrollY}px`;
    body.width = '100%';
    body.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      body.position = original.position;
      body.top = original.top;
      body.width = original.width;
      body.overflow = original.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [howModalOpen]);

  // lightbox pentru poza de proiect a cursantei — click = vezi mai de-aproape
  // (aceeași idee ca galeria de la /portofoliu/:id, variantă simplificată)
  const [projectLightboxOpen, setProjectLightboxOpen] = useState(false);
  useEffect(() => {
    if (!projectLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProjectLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [projectLightboxOpen]);

  /* egalizare coloane Programa (zigzag) — GARANTAT la orice lățime de ecran.
     Coloana dreaptă are un banner în plus (7 vs 6) cu conținut mai scurt per-
     banner → se termină la alt nivel decât stânga. Un gap/padding FIX (CSS)
     nu ține la orice lățime: textul trece pe altă linie la câțiva px
     diferență, schimbând înălțimea cu zeci de px — independent de orice
     valoare am pune static. Soluția reală: măsurăm live cele două coloane și
     dăm padding-bottom EXACT (nu ghicit) coloanei mai scurte, oricare ar fi
     ea, la orice rezoluție — recalculat la fiecare resize/schimbare de font.
     padding-bottom (nu un element „spacer") = nu interacționează cu gap-ul
     flex-ului dintre iteme, deci nu adaugă un gap „fantomă". */
  const zigzagLeftRef = useRef<HTMLDivElement>(null);
  const zigzagRightRef = useRef<HTMLDivElement>(null);
  const [zigzagPad, setZigzagPad] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const leftEl = zigzagLeftRef.current;
    const rightEl = zigzagRightRef.current;
    if (!leftEl || !rightEl) return;

    /* citim padding-ul aplicat DIRECT din DOM (nu dintr-un ref/state separat)
       — React actualizează atributul de style abia după re-render, care nu
       e mereu sincron cu al doilea apel al ResizeObserver-ului pentru
       ACEEAȘI schimbare. Dacă am scădea o valoare „aplicată" ținută separat
       (înainte ca DOM-ul chiar s-o aibă), am scădea de două ori același
       padding = supra-corectare exact dublă (bug găsit + reparat aici). */
    const readPad = (el: HTMLDivElement) => parseFloat(el.style.paddingBottom || '0') || 0;

    const equalize = () => {
      const leftPad = readPad(leftEl);
      const rightPad = readPad(rightEl);
      const leftContent = leftEl.getBoundingClientRect().height - leftPad;
      const rightContent = rightEl.getBoundingClientRect().height - rightPad;
      const diff = Math.round(leftContent - rightContent);
      const next = diff > 1 ? { left: 0, right: diff } : diff < -1 ? { left: -diff, right: 0 } : { left: 0, right: 0 };
      if (next.left !== leftPad || next.right !== rightPad) {
        setZigzagPad(next);
      }
    };

    equalize();

    /* plasă de siguranță, PE LÂNGĂ ResizeObserver — pe mobil, la prima
       vizită (fonturile web NU sunt încă în cache), măsurătoarea de mai sus
       rulează cu fontul de REZERVĂ (Inter încă nu s-a descărcat), deci
       calculează pe alt text-wrap decât cel final. document.fonts.ready se
       rezolvă exact când fontul real s-a instalat — recalculăm atunci,
       + încă o dată la 'load' (poze/tot ce mai poate schimba înălțimea) și
       o ultimă verificare la 1.2s, ca ultimă plasă dacă ceva a mai scăpat. */
    let cancelled = false;
    document.fonts?.ready?.then(() => { if (!cancelled) equalize(); });
    window.addEventListener('load', equalize);
    const finalCheck = setTimeout(equalize, 1200);

    const ro = new ResizeObserver(equalize);
    ro.observe(leftEl);
    ro.observe(rightEl);
    return () => {
      cancelled = true;
      window.removeEventListener('load', equalize);
      clearTimeout(finalCheck);
      ro.disconnect();
    };
  }, []);

  useScrollDirectionTracker();

  return (
    <>
      <Helmet>
        <html lang="ro" />
        <title>Curs de Design Interior — NOMA School</title>
        <meta name="description" content="Curs practic de design interior: AutoCAD, 3Ds Max, lucrul cu clienții și furnizorii. De la curs, direct la primul client." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="cl-page">
        {/* ── mark — lockup de logo: NOMA (spaced caps) + School (italic,
             lipit) — un singur cuvânt vizual, nu o siglă + un tag separat ── */}
        <div className="cl-mark">
          NOMA<span className="cl-mark-school">School</span>
        </div>
        <p className="cl-mark-sub">Curs avansat de design interior</p>

        {/* ── HERO ── */}
        <section className="cl-hero">
          <h1 className="cl-hero-title">
            <ClipLine delay={0.08} as="span">De la curs,</ClipLine>
            <ClipLine delay={0.2} as="span">direct la</ClipLine>
            <ClipLine delay={0.32} as="em">primul client.</ClipLine>
          </h1>

          {/* „trenuleț" — bandă în mișcare continuă, nu reveal o singură
              dată: textul intră dintr-o parte, iese pe cealaltă, în buclă.
              Conținutul dublat + translateX(-50%) = buclă perfect continuă
              (fără salt vizibil la capăt). Mască orizontală = fade la
              margini, „apare"/„dispare" lin, nu tăiat brusc. */}
          <div className="cl-hero-sub" aria-hidden="true">
            <div className="cl-hero-sub-track">
              <span className="cl-hero-sub-item">Înveți. Aplici. Realizezi.</span>
              <span className="cl-hero-sub-item">Înveți. Aplici. Realizezi.</span>
            </div>
          </div>
          <p className="sr-only">Înveți. Aplici. Realizezi.</p>
        </section>

        <LuxuryDivider className="cl-divider-1" />

        {/* ── PAIN POINTS ── */}
        <section className="cl-section cl-pain-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Te regăsești aici?</span>
            <h2 className="cl-h2">Atunci acest curs e <em>pentru tine</em></h2>
          </Reveal>

          <div className="cl-pain-frame">
            <div className="cl-pain-grid">
              {PAIN_POINTS.map((p, i) => (
                <Reveal key={i} className="cl-pain-row" delay={i * 0.06}>
                  <span className="cl-pain-num"><span>{i + 1}</span></span>
                  <p>{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <LuxuryDivider className="cl-divider-2" />

        {/* ── CURRICULUM ── */}
        <section className="cl-section cl-curriculum-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Programa</span>
            <h2 className="cl-h2">Ce înveți în <em>curs</em></h2>
          </Reveal>

          {/* bandă zig-zag: primele 6 topice, fiecare împerecheat cu o poză
              reală, alternând baner/poză — DOUĂ coloane independente (nu
              „rânduri"), ca gap-ul dintre elementele consecutive de pe
              ACEEAȘI coloană să fie mereu egal, indiferent cât de înalt e
              elementul de pe coloana alăturată (vezi comentariul de la
              renderZigzagBanner/renderZigzagPhoto). Parallax pe fiecare
              poză (ZigzagPhoto), independent. „Prezentarea finală" (al
              7-lea topic, fără poză pereche) închide coloana din DREAPTA,
              perfect încadrată cu aceeași estetică de card ca restul
              bannerelor din bandă. */}
          <div className="cl-zigzag cl-zigzag-2col">
            <div className="cl-zigzag-col" ref={zigzagLeftRef} style={{ paddingBottom: zigzagPad.left }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (i % 2 === 0 ? renderZigzagBanner(i) : renderZigzagPhoto(i)))}
            </div>
            {/* coloana dreaptă are 7 iteme (una în plus) cu bannere mai scurte
                în total → nivelul de jos diferă de stânga. Alinierea e
                calculată live (vezi zigzagPad/equalize mai sus), nu ghicită
                static — garantat corectă la orice lățime de ecran. */}
            <div className="cl-zigzag-col cl-zigzag-col--right" ref={zigzagRightRef} style={{ paddingBottom: zigzagPad.right }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (i % 2 === 0 ? renderZigzagPhoto(i) : renderZigzagBanner(i)))}
              {renderZigzagBanner(6)}
            </div>
          </div>
        </section>

        <LuxuryDivider className="cl-divider-3" />

        {/* ── CUM LUCRĂM ── */}
        <section className="cl-section cl-section--tint cl-how-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Cum lucrăm</span>
            <h2 className="cl-h2">3Ds Max &amp; <em>AutoCAD</em></h2>
          </Reveal>

          {/* noFilter OBLIGATORIU: blocul ăsta conține trenulețul (animație CSS
              infinită) ȘI caruselul care schimbă poza la 3.4s. Un `filter:blur(0px)`
              rezidual lăsat de framer pe container re-rasterizează tot subarborele
              la fiecare cadru al benzii ⇒ exact „vibrația" raportată pe carduri. */}
          <Reveal className="cl-practice" delay={0.3} noFilter>
            {/* cele două carduri cu poză, umăr la umăr: caruselul (stânga) și
                cardul care deschide ferestruica (dreapta) */}
            <div className="cl-how-duo">
              <PracticeTopicsCarousel />
              <HowWeWorkCard onOpen={() => setHowModalOpen(true)} />
            </div>
            <div className="cl-practice-extra">
              <span className="cl-check-dot"><Check size={9} strokeWidth={3.5} /></span>
              {PRACTICE_EXTRA}
            </div>
            <PracticeShootMarquee />
          </Reveal>
        </section>

        {/* ── FERESTRUICA „Cum decurg lecțiile" — cele 4 puncte, fiecare cu
            iconița lui, deschisă din butonul de pe cardul cu poză ── */}
        {howModalOpen && createPortal(
          <div
            className="cl-how-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cum decurg lecțiile"
          >
            <div className="cl-how-modal-backdrop" onClick={() => setHowModalOpen(false)} />
            <div className="cl-how-modal-panel">
              <button
                type="button"
                className="cl-how-modal-close"
                onClick={() => setHowModalOpen(false)}
                aria-label="Închide"
              >
                <X size={15} strokeWidth={1.6} />
              </button>
              <span className="cl-how-modal-eyebrow">Cum decurg lecțiile</span>
              <ul className="cl-how-modal-list">
                {HOW_WE_WORK.map(({ Icon, title, text }) => (
                  <li key={title} className="cl-how-modal-row">
                    <span className="cl-how-modal-icon"><Icon /></span>
                    <div>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body
        )}

        <LuxuryDivider className="cl-divider-4" />

        {/* ── CE CÂȘTIGI ── */}
        <section className="cl-section cl-gains-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Beneficiile</span>
            <h2 className="cl-h2">Ce <em>câștigi</em> din acest curs</h2>
          </Reveal>

          <div className="cl-gains-frame">
            <div className="cl-gains">
              {GAINS.map((g, i) => (
                <Reveal key={g.title} className="cl-gain-row" delay={i * 0.06}>
                  <span className="cl-gain-num"><span>{i + 1}</span></span>
                  <div>
                    <h4>{g.title}</h4>
                    <p>{g.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <LuxuryDivider className="cl-divider-5" />

        {/* ── CU CE PLECI ── */}
        <section className="cl-section cl-section--tint cl-deliverables-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Rezultatul <em>final</em></h2>
          </Reveal>

          <div className="cl-result-pdfs">
            {RESULT_PDFS.map((p, i) => (
              <ResultPdfCard key={p.file} p={p} index={i} />
            ))}
          </div>
        </section>

        <LuxuryDivider className="cl-divider-6" />

        {/* ── DUPĂ CURS ── */}
        <section className="cl-section cl-after-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Oportunitățile</span>
            <h2 className="cl-h2"><span className="cl-h2-line">Ce opțiuni ai după</span> <em>finalizare</em></h2>
          </Reveal>

          <div className="cl-after-card-frame">
            <div className="cl-after-grid">
              {AFTER_COURSE.map((a, i) => (
                <Reveal key={a} className="cl-after-card" delay={i * 0.07}>
                  <Arrow />
                  <p>{a}</p>
                </Reveal>
              ))}
            </div>

            <Reveal className="cl-support-note" delay={0.3}>
              Pe parcursul cursului și după <em>finalizare</em>, rămânem alături de tine cu suport și ghidare —
              ajutor cu programele, sfaturi din experiență practică și contacte utile în industrie.
            </Reveal>
          </div>
        </section>

        <LuxuryDivider className="cl-divider-7" />

        {/* ── TESTIMONIAL — trenuleț de 3 cursante, click = detalii + proiect ── */}
        <section className="cl-section cl-testimonial-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Rezultate reale</span>
            <h2 className="cl-h2">Evoluția <em>cursanților</em> <span className="cl-h2-white">noștri</span></h2>
          </Reveal>

          {/* noFilter: conține inelul care pulsează continuu (.cl-student-tap-hint) —
              un `filter:blur(0px)` rezidual repictează tot subarborele la fiecare
              cadru al pulsului, exact bug-ul de la Cum lucrăm. */}
          <Reveal className="cl-students-train" noFilter>
            {TESTIMONIALS.map((s, i) => {
              const isActive = i === activeStudent;
              return (
                <button
                  key={s.name}
                  type="button"
                  className={`cl-student-avatar${isActive ? ' cl-student-avatar--active' : ''}`}
                  onClick={() => selectStudent(i)}
                  aria-pressed={isActive}
                >
                  <span className="cl-student-avatar-photo-wrap">
                    <img
                      src={s.photo}
                      alt={s.name}
                      className="cl-student-avatar-photo"
                      style={{ objectPosition: s.photoPos }}
                      loading="lazy"
                    />
                    {/* semn discret „apasă-mă" — inel care pulsează, doar cât timp
                        cursanta nu e selectată (cea activă are deja glow-ul solid) */}
                    {!isActive && <span className="cl-student-tap-hint" aria-hidden="true" />}
                  </span>
                  <span className="cl-student-avatar-name">{s.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </Reveal>

          {/* key={activeStudent} → React demontează complet vechiul nod și
              montează unul nou la fiecare schimbare (click SAU swipe), deci
              initial→animate rulează mereu din nou (fade-in curat).
              AnimatePresence (varianta anterioară) rămânea blocat — exit-ul
              nu se finaliza niciodată, deci conținutul vechi rămânea afișat
              permanent. Fără exit aici (simplu remount), dar fade+scale de
              intrare (mai lent, 0.6s) dă senzația de „poză următoare" ca
              într-o galerie, fără riscul de blocare al AnimatePresence.
              drag="x" + onDragEnd = swipe cu degetul între cursante;
              dragConstraints 0/0 „arcuiește" ușor cardul (dragElastic) și îl
              trage mereu înapoi la centru — nu se deplasează efectiv, doar
              dă senzația tactilă, schimbarea reală o face selectStudent.
              Wrapper-ul din jur (.cl-testimonial-fade) face crossfade-ul
              premium (vezi comentariul de la selectStudent) — hard-cut-ul
              remontării e ascuns în spatele lui. */}
          {/* strat ascuns de măsurare — toate 3 cursantele randate simultan,
              invizibile (height:0 pe wrapper NU afectează geometria proprie a
              copiilor), doar ca să le citesc înălțimea naturală. Poza e <img>
              REALĂ (nu doar un div cu aspect-ratio) ca efect secundar util:
              preîncarcă toate cele 3 poze din start, deci la schimbarea
              cursantei poza vizibilă apare instant, nu „parcă se reîncarcă". */}
          <div aria-hidden="true" style={{ height: 0, overflow: 'hidden', visibility: 'hidden' }}>
            {TESTIMONIALS.map((s, i) => (
              <div
                key={s.name}
                ref={(el) => { testimonialMeasureRefs.current[i] = el; }}
                className="cl-testimonial"
              >
                <div className="cl-testimonial-content">
                  <p className="cl-testimonial-story">
                    <strong><em>{s.name}, {s.age} ani</em></strong> — {s.story}
                  </p>
                  <div className="cl-testimonial-project">
                    <img
                      src={s.project}
                      alt=""
                      className="cl-testimonial-project-img"
                      loading="eager"
                      style={{ aspectRatio: s.projectRatio }}
                    />
                    <span className="cl-testimonial-project-label">{s.projectLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="cl-testimonial-fade"
            style={{ opacity: studentSwitching ? 0 : 1, minHeight: testimonialMinH || undefined }}
          >
            <motion.div
              key={activeStudent}
              className="cl-testimonial"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) {
                  selectStudent((activeStudent + 1) % TESTIMONIALS.length);
                } else if (info.offset.x > 50) {
                  selectStudent((activeStudent - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
                }
              }}
            >
              <div className="cl-testimonial-content">
                <p className="cl-testimonial-story">
                  <strong><em>{student.name}, {student.age} ani</em></strong> — {student.story}
                </p>
                <div className="cl-testimonial-project">
                  <button
                    type="button"
                    className="cl-testimonial-project-photo"
                    onClick={() => setProjectLightboxOpen(true)}
                    aria-label={`Vezi mai aproape: ${student.projectLabel}`}
                  >
                    <img
                      src={student.project}
                      alt={student.projectLabel}
                      className="cl-testimonial-project-img"
                      /* eager, nu lazy: cardul se remontează complet la fiecare
                         schimbare de cursantă (key={activeStudent}), deci un img
                         `lazy` trece din nou prin verificarea de viewport de
                         fiecare dată — asta se vedea ca „poza parcă se reîncarcă".
                         Sunt doar 3 poze, oricum preîncărcate mai jos. */
                      loading="eager"
                      /* spațiul e rezervat din start, cu proporția EXACTĂ a
                         pozei (nu una forțată/uniformă — cele 3 poze au
                         proporții diferite, nu vrem crop) — altfel, cât timp
                         poza se încarcă, containerul colapsează la 0 și
                         „sare" la mărimea reală = exact bug-ul vizibil pe
                         desktop (bannerul din stânga e scurt, deci saltul
                         pozei se vede clar). */
                      style={{ aspectRatio: student.projectRatio }}
                    />
                    <span className="cl-testimonial-zoom-icon" aria-hidden="true">
                      <ZoomIn size={18} strokeWidth={1.5} />
                    </span>
                  </button>
                  <span className="cl-testimonial-project-label">{student.projectLabel}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── LIGHTBOX poză proiect — click pe poza de mai sus, inspirat de
            galeria /portofoliu/:id (variantă simplificată, o singură poză). ── */}
        {projectLightboxOpen && createPortal(
          <div
            className="cl-project-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={student.projectLabel}
          >
            <div className="cl-project-lightbox-backdrop" onClick={() => setProjectLightboxOpen(false)} />
            <button
              type="button"
              className="cl-project-lightbox-close"
              onClick={() => setProjectLightboxOpen(false)}
              aria-label="Închide"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <div className="cl-project-lightbox-content">
              <img
                src={student.project}
                alt={student.projectLabel}
                className="cl-project-lightbox-img"
              />
              <span className="cl-project-lightbox-caption">{student.projectLabel}</span>
            </div>
          </div>,
          document.body
        )}

        <LuxuryDivider className="cl-divider-8" />

        {/* ── FAQ ── */}
        <section className="cl-section cl-faq-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Întrebări <em>frecvente</em></h2>
          </Reveal>

          {/* acordeon controlat din React (nu <details> nativ, care „sare"
              instant fără nicio animație posibilă). Tehnica grid-template-rows
              0fr→1fr (NU framer-motion height:'auto') — height:'auto' avea o
              vibrație vizibilă la final de animație (framer măsoară înălțimea
              reală și „sare" pe ea, cauzând un mic recul). Grid-ul e nativ
              CSS, tranziție perfect lină, fără nicio măsurătoare JS. */}
          <Reveal className="cl-faq" noFilter>
            {FAQ.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={f.q} className={`cl-faq-item ${isOpen ? 'cl-faq-item--open' : ''}`}>
                  <button
                    type="button"
                    className="cl-faq-summary"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    {f.q}
                    <span className="cl-faq-icon" aria-hidden="true" />
                  </button>
                  <div className="cl-faq-panel-wrap">
                    <div className="cl-faq-panel-inner">
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </section>

      </main>

      <FloatingCTA />
    </>
  );
};

export default CursLanding;
