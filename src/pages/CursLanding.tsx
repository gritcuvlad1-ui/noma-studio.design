import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { AnimatePresence, motion, useInView, useScroll, useTransform, useSpring, Variants } from 'framer-motion';
import { Check, Play, X, ZoomIn } from 'lucide-react';
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

/* ── HISTEREZIS pt. reveal-urile care se repetă (once:false) ──
   BUG raportat (de două ori): cardul stă exact PE pragul de declanșare și
   „nu știe dacă să apară sau să dispară" — tremură haotic. Cauza: cu UN
   SINGUR prag (amount:0.25), o mișcare de 1px peste linie comută
   inView true↔false la fiecare cadru, iar fiecare comutare REPORNEȘTE
   animația de blur de la capăt. La scroll foarte lent stai minute întregi
   fix pe acea linie ⇒ licărire continuă.
   Fix (histerezis, ca la orice comparator care nu trebuie să oscileze):
   DOUĂ praguri diferite, cu o zonă moartă largă între ele.
   - APARE  la 25% vizibil (neschimbat, cerut explicit „la un sfert").
   - DISPARE (se resetează pt. următoarea intrare) DOAR când elementul a
     ieșit COMPLET din ecran (niciun pixel vizibil).
   Între cele două praguri nu se întâmplă absolut nimic — deci oricât de
   lent ai derula, nu există nicio poziție în care starea să poată oscila. */
const useRevealActive = (ref: React.RefObject<any>) => {
  const past25 = useInView(ref, { amount: 0.25 });
  const anyVisible = useInView(ref, { amount: 'some' });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (past25) setActive(true);
    else if (!anyVisible) setActive(false);
  }, [past25, anyVisible]);

  return active;
};

/* Deschiderea/inchiderea overlay-urilor (modal + cele doua lightbox-uri).
   Cerut 2026-09-01: "se deschide foarte urat, vreau cat mai lin si premium,
   si invers cand apas pe X". Inainte se montau/demontau INSTANT
   ({open && createPortal(...)}) - zero animatie, de-aici senzatia de urat.
   AnimatePresence tine elementul in DOM pana se termina animatia de EXIT.
   Portalul sta MEREU montat, AnimatePresence e INAUNTRUL lui - tiparul sigur;
   invers (AnimatePresence in jurul unui createPortal conditionat) e exact
   configuratia in care exit-ul ramane agatat, bug deja platit pe pagina asta
   la trenuletul de cursante.
   Coregrafie identica peste tot: invelisul face fade; continutul vine din
   scale 0.92 + 16px de jos cu easing-ul semnatura [0.16,1,0.3,1]. IESIREA e
   mai scurta si mai putin adanca - intrarea poate sa se lase admirata,
   iesirea trebuie sa para prompta, altfel X se simte lipicios.
   Doar opacity + scale + y (compuse pe GPU); fara filter/blur animat peste
   backdrop-ul care are deja backdrop-filter (regula documentata). */
const OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;       // decelerare lunga (intrare)
const OVERLAY_EASE_OUT = [0.4, 0, 1, 1] as const;      // accelerare (iesire prompta)
/* IESIREA are `transition` PROPRIU in obiectul `exit` - framer aplica altfel
   `transition`-ul de nivel de componenta si la exit, iar 0.5s cu decelerare
   lunga la inchidere = butonul X „lipicios". La inchidere: mai scurt, ease-in
   (pleaca decis), scale mai putin adanc. */
const overlayShellAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.22, ease: OVERLAY_EASE_OUT } },
  transition: { duration: 0.34, ease: OVERLAY_EASE },
};
const overlayPanelAnim = {
  initial: { opacity: 0, scale: 0.92, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.24, ease: OVERLAY_EASE_OUT } },
  transition: { duration: 0.5, ease: OVERLAY_EASE },
};

/* ── Blocarea scroll-ului de fundal cât e deschis un overlay (modal/lightbox) ──
   O SINGURĂ rețetă, pentru toate cele trei overlay-uri ale paginii.

   ⚠️ ATENȚIE — reținut din 2026-09-01: varianta „clasică" cu
   `body { position: fixed; top: -scrollY }` (folosită aici anterior) BLOCHEAZĂ
   corect, dar strică senzația de deschidere pe telefon, iar Vlad a raportat
   exact asta („nu se deschide/închide premium", verificat pe telefon).
   Motivul: comutarea body-ului din `static` în `fixed` colapsează înălțimea
   documentului de la ~8000px la înălțimea ecranului ÎNTR-UN SINGUR CADRU —
   reflow complet al paginii + repictare, exact în cadrul în care overlay-ul e
   încă TRANSPARENT (backdrop-ul abia începe fade-ul). Pe iOS mai vine și
   efectul secundar clasic: pagina nemaifiind derulabilă, Safari își extinde
   bara de adresă ⇒ viewport-ul se redimensionează și tot ecranul „sare".
   Aceeași smucitură, în oglindă, la închidere (restaurare + `scrollTo`).
   Animația era, de fapt, corectă — saltul de layout de dedesubt o strica.

   Varianta de acum NU atinge deloc layout-ul paginii (zero reflow, deci zero
   salt), și acoperă fiecare platformă cu mecanismul potrivit ei:
   1) `touch-action: none` pe overlay (CSS) — pe TELEFON e suficient și e
      metoda modernă: overlay-ul e `position:fixed; inset:0`, deci ORICE
      atingere în timpul cât e deschis începe pe el, iar browserul nu mai
      inițiază panning-ul paginii. Rezolvă și problema pentru care se folosea
      `position:fixed` (pe iOS, `overflow:hidden` pe body chiar e ignorat de
      motorul elastic de scroll) — dar fără să mute nimic în layout.
      `.cl-project-lightbox-content`/`.cl-video-lightbox-content` primesc
      `touch-action: pan-y` (conținutul lor chiar trebuie să poată fi derulat)
      + `overscroll-behavior: contain` ca scroll-ul să nu se propage la
      pagină la capete.
   2) `window.__lenis?.stop()` — pe DESKTOP scroll-ul îl face Lenis, care
      derulează PROGRAMATIC: `overflow:hidden` nu-l oprește (măsurat: fundalul
      se mișca în continuare). Oprit, Lenis face `preventDefault()` pe wheel
      (sursă: `if (this.isStopped || this.isLocked)`). Pe mobil e `undefined`
      ⇒ no-op curat.
   3) `body { overflow: hidden }` — rămâne ca plasă pentru tastatură
      (space/PageDown) și pentru desktopul fără Lenis. NU produce salt:
      `html` are `scrollbar-gutter: stable` (index.css), deci dispariția
      scrollbar-ului nu deplasează nimic, iar pe mobil scrollbar-ul e overlay.
   Nu mai e nevoie nici de salvat/restaurat `scrollY`: poziția paginii nu se
   pierde niciodată, fiindcă documentul nu iese din flux. */
const useScrollLock = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    const body = document.body.style;
    const originalOverflow = body.overflow;
    body.overflow = 'hidden';
    window.__lenis?.stop();
    return () => {
      body.overflow = originalOverflow;
      window.__lenis?.start();
    };
  }, [active]);
};

/* Țintă finală cu `filter: none` EXPLICIT (nu doar absența cheii, și nu
   ștergere manuală din DOM — aceea se bătea cu framer și lăsa uneori blur-ul
   agățat). Framer scrie el însuși `filter: none`, deci starea e deterministă
   și nu se mai poate re-aplica blur(0px) la niciun re-render ulterior al
   paginii (click pe FAQ, schimbare de cursantă etc.). */
const SHOW_YB_CLEAR = { opacity: 1, y: 0, filter: 'none' };

/* `entered` = intrarea s-a terminat. Se folosește pt. DOUĂ lucruri simultan,
   ambele necesare ca aburul să nu rămână agățat:
   1) ținta framer trece pe SHOW_YB_CLEAR ⇒ filtrul dispare complet;
   2) abia ATUNCI se pornește plutirea idle (`cl-card-float`) pe copil.
   Motivul pt. (2) — regula documentată a proiectului: un nod cu strat propriu
   de compositing (animație infinită + will-change/backface-visibility) NU are
   voie să stea în interiorul unei suprafețe cu `filter`. Pe WebKit stratul
   copilului nu invalidează corect suprafața de filtrare a părintelui, iar
   cardul RĂMÂNE vizual aburit deși valoarea calculată e deja blur(0px) —
   exact bug-ul raportat în secțiunea „Programa". Cât timp aburul e pe ecran
   nu există nicio animație continuă dedesubt; după ce filtrul dispare,
   pornește plutirea. Cele două nu coexistă niciodată.
   Pattern-ul standard acum (2026-09-01): `const [entered, setEntered] =
   useState(false)` + `useEffect(() => { if (!inView) setEntered(false); },
   [inView])` — resetat la ieșirea din ecran, ca re-intrarea (useRevealActive)
   să replaieze aburul identic. */

/* Poză din benzile zig-zag — parallax legat de scroll DOAR pe desktop.
   Hook-urile useScroll/useSpring nu doar calculează — atașează un listener
   de scroll activ, cost real pe main thread la fiecare cadru cât timp
   elementul e pe ecran. Pe mobil (traficul e ~100% aici) acest cost, ori de
   câte 6 poze din bandă, se aduna cu restul reveal-urilor și se simțea ca
   „tremur"/lag la scroll pe telefon. Fix: componenta cu hook-urile de
   scroll există DOAR pe desktop (randare condiționată la nivel de
   componentă, nu hook condiționat — respectă regulile hook-urilor); pe
   mobil poza e complet statică, fără niciun listener. */
/* Poza — ACEEAȘI rețetă de intrare ca FloatCard (blur 10px, y 30, aceeași
   durată), plus AICI idle float (cl-card-float), cerut explicit: „la Programa
   cardurile apar într-un fel, pozele în altul" — acum identic. TREI noduri
   separate (nu unul singur), exact ca la FloatCard, ca cele trei transform-uri
   (intrare framer / plutire idle CSS / parallax framer pe imagine) să nu se
   bată pe același element:
   .cl-zigzag-photo-wrap (extern, intrarea) → .cl-zigzag-photo (mijloc,
   cl-card-float — și tot el are overflow:hidden+border, deci plutirea
   mișcă tot cadrul dintr-o bucată, fără să re-taie nimic dinăuntru) →
   <img> (intern, parallax pe desktop). */
/* heightPx — DOAR pt. ultima poză a coloanei stângi (vezi equalize() mai
   jos în componentă): suprascrie aspect-ratio-ul fix cu o înălțime exactă în
   px, ca poza să se termine fix unde se termină cardul din dreapta, în loc
   să lase un gol mort dedesubt. Restul pozelor din bandă nu primesc prop-ul,
   deci rămân la raportul fix (comportament neschimbat).
   `width:'100%'` OBLIGATORIU lângă height (bug raportat de Vlad: „poza
   trebuia să aibă aceeași lățime ca toate, doar la lungime trebuie
   scurtat"). Motiv: pe un element cu `aspect-ratio`, `width:auto` NU mai
   înseamnă „umple părintele" (comportamentul normal de bloc) — lățimea se
   DERIVĂ din înălțime prin raport. Punând doar height, poza se îngusta
   singură: 584px × 4/5 = 467px, față de 508px cât au toate celelalte poze
   din bandă (măsurat). Cu AMBELE dimensiuni date explicit, `aspect-ratio`
   nu mai are cuvânt asupra sizing-ului, dar rămâne CITIBIL din
   getComputedStyle — de care depinde equalize() ca să afle înălțimea
   naturală (vezi naturalPhotoHeight). */
const ZigzagPhotoParallax = ({ src, alt, pos, heightPx }: { src: string; alt: string; pos: string; heightPx?: number }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: parallaxRef, offset: ['start end', 'end start'] });
  const rawY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const y = useSpring(rawY, { stiffness: 120, damping: 26, mass: 0.4 });
  /* aceeași rețetă „beneficii" ca FloatCard (vezi nota de-acolo): reapare la
     scroll înapoi, y 56 / blur 10 / 1s, plutirea idle abia după intrare. */
  const inView = useRevealActive(wrapRef);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!inView) setEntered(false); }, [inView]);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), []);

  return (
    <motion.div
      className="cl-zigzag-photo-wrap"
      ref={wrapRef}
      initial={hidden}
      animate={inView ? (entered ? SHOW_YB_CLEAR : SHOW_YB) : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => { if (inView) setEntered(true); }}
    >
      <div className={`cl-zigzag-photo${inView && entered ? ' cl-card-float' : ''}`} ref={parallaxRef} style={heightPx ? { height: heightPx, width: '100%' } : undefined}>
        <motion.img
          src={src}
          alt={alt}
          className="cl-zigzag-photo-img"
          style={{ y, objectPosition: pos }}
          loading="lazy"
        />
      </div>
    </motion.div>
  );
};

const ZigzagPhotoStatic = ({ src, alt, pos, heightPx }: { src: string; alt: string; pos: string; heightPx?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!inView) setEntered(false); }, [inView]);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), []);

  return (
    <motion.div
      className="cl-zigzag-photo-wrap"
      ref={ref}
      initial={hidden}
      animate={inView ? (entered ? SHOW_YB_CLEAR : photoShow) : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => { if (inView) setEntered(true); }}
    >
      <div className={`cl-zigzag-photo${inView && entered ? ' cl-card-float' : ''}`} style={heightPx ? { height: heightPx, width: '100%' } : undefined}>
        <img
          src={src}
          alt={alt}
          className="cl-zigzag-photo-img"
          style={{ objectPosition: pos }}
          loading="lazy"
        />
      </div>
    </motion.div>
  );
};

const ZigzagPhoto = ({ src, alt, pos = '50% 50%', heightPx }: { src: string; alt: string; pos?: string; heightPx?: number }) => {
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768).current;
  return isMobile
    ? <ZigzagPhotoStatic src={src} alt={alt} pos={pos} heightPx={heightPx} />
    : <ZigzagPhotoParallax src={src} alt={alt} pos={pos} heightPx={heightPx} />;
};

/* Linie delimitatoare între secțiuni — cerută explicit (2026-09-01), la
   fiecare graniță dintre secțiuni pe toată pagina /curs. NU e LuxuryDivider
   (varianta aurie, cu shimmer alb în buclă infinită — ștearsă definitiv din
   tot site-ul, la o cerere anterioară fermă: „nu vreau să aud de ele
   deloc"). Aici e o rețetă nouă, distinctă: statică (fără animație în
   buclă — regula globală „animații fără scop"), o singură intrare
   scaleX (once:true, ca restul reveal-urilor de pe pagină), în roz-ul
   dominant al paginii (nu auriu). */
/* DOUĂ noduri, nu unul — la fel ca la ZigzagPhoto mai sus. Elementul
   MĂSURAT de useInView trebuie să-și păstreze dimensiunea reală tot timpul
   (wrapper simplu, fără transform); dacă am observa direct nodul care se
   scalează la 0 (scaleX:0 la start), aria lui devine 0 înainte să apuce să
   intre-n view, „amount"-ul de intersecție nu se mai atinge NICIODATĂ și
   linia rămâne invizibilă permanent (bug găsit aici, la prima variantă). */
const ClDivider = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, margin: '-20px' });
  return (
    <div ref={wrapRef} className="cl-divider-wrap" aria-hidden="true">
      <motion.div
        className="cl-divider"
        style={{ originX: 0.5 }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
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
/* REVENIT la once:true (era once:false pt. toată pagina, azi) — cu ZECI de
   Reveal simultan pe ecran (titluri + rânduri de text), retriggerul repetat
   la fiecare trecere s-a simțit exact ca „tremurul"/lag documentat (motivul
   pt. care asta era once:true de la bun început). amount:0.25 rămâne (doar
   pragul de declanșare, nu are treabă cu tremurul). Titlurile (cl-section-head)
   trec tot prin Reveal — durata mai mică (0.8s) rămâne ce le diferențiază
   „un pic mai rapid" de carduri. */
const Reveal = ({ children, className = '', delay = 0, noFilter = false }: { children: React.ReactNode; className?: string; delay?: number; noFilter?: boolean }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  /* noFilter: pentru containere al căror conținut se schimbă dinamic (acordeon
     FAQ). Un `filter:blur(0px)` rezidual lăsat de framer ar re-rasteriza toată
     suprafața la fiecare schimbare de înălțime = licărire de border (ex. rămucuța
     de jos a ultimului card). Fără cheia `filter` ⇒ fără suprafață de filtru. */
  const hidden = useMemo(
    () => (noFilter ? { opacity: 0, y: 32 * clScrollDir } : { opacity: 0, y: 32 * clScrollDir, filter: 'blur(6px)' }),
    [noFilter, clScrollDir]
  );
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={inView ? (noFilter ? SHOW_YB_NOFILTER : SHOW_YB) : hidden}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
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
/* 2026-09-01 — cerut explicit: TOATE cardurile paginii intră „fix ca
   «beneficii»" (GainsCard): cardul ÎNTREG ca O SINGURĂ unitate aburită, cu
   ACELEAȘI magnitudini (blur 10px, y 56, durată 1s), și REAPARE la scroll
   înapoi (useRevealActive, nu once:true) — fără stagger între carduri.
   Plutirea idle (cl-card-float) SE PĂSTREAZĂ (cerut), dar pornește abia
   după ce intrarea s-a terminat ȘI filtrul framer e forțat pe `none`
   (SHOW_YB_CLEAR) — regula documentată: niciun nod cu animație CSS infinită
   sub o suprafață cu `filter`. `entered` se resetează când cardul iese
   COMPLET din ecran (useEffect pe !inView), ca re-intrarea să fie identică. */
const FloatCard = ({ children, className = '', wrapClassName = '', floatDelay = 0 }: { children: React.ReactNode; className?: string; wrapClassName?: string; floatDelay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!inView) setEntered(false); }, [inView]);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), []);
  return (
    <motion.div
      ref={ref}
      className={wrapClassName}
      initial={hidden}
      animate={inView ? (entered ? SHOW_YB_CLEAR : SHOW_YB) : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => { if (inView) setEntered(true); }}
    >
      <div
        className={`${className}${inView && entered ? ' cl-card-float' : ''}`}
        style={{ animationDelay: `${floatDelay}s` }}
      >
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
  const cardRef = useRef<HTMLDivElement>(null);
  /* HISTEREZIS (vezi useRevealActive) — cu once:false + prag unic, cardul
     oprit exact pe linie licărea haotic. Acum apare la 25% și se resetează
     doar după ce a ieșit complet din ecran. */
  const inView = useRevealActive(ref);
  /* INSIGNA — FĂRĂ `filter` deloc (nici în hidden, nici în show): ea conține
     `cl-card-float`, o animație CSS infinită. Regula documentată a
     proiectului: niciun filtru pe un nod care înfășoară o animație continuă,
     altfel suprafața se re-rasterizează la fiecare cadru = licărire. E un
     element mic, aburul oricum nu s-ar fi văzut pe el. */
  /* insigna: mai mult drum (26px, era 10) ca să „plutească" în ecran O DATĂ
     cu cardul, nu să pocnească instant cât timp cardul încă intră aburit —
     asta dădea senzația „robotizat". Rămâne FĂRĂ filtru (conține
     cl-card-float — vezi nota de mai jos). */
  const hiddenBadge = useMemo(() => ({ opacity: 0, y: 26 * clScrollDir }), [clScrollDir]);
  /* Magnitudini ca GainsCard (y 56, blur 10, 1s). Cele 3 carduri stau pe
     ACELAȘI rând (grid 3×1fr) ⇒ trec pragul de 25% în aceeași clipă; fără
     un mic decalaj per card apăreau toate deodată, sincron perfect =
     „robotizat / prea repede" (raportat 2026-09-01). `delay: index*0.13`
     le face să curgă una după alta — la fel de organic ca bannerele din
     Programa (care se decalează singure, fiindcă sunt pe coordonate Y
     diferite). Filtrul cardului e forțat pe `none` la final. */
  const hiddenCard = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  const showCard = SHOW_YB;
  const cardDelay = index * 0.13;

  return (
    <div ref={ref} className="cl-result-pdf-item">
      {p.badges.map((b, bi) => (
        <motion.span
          key={b.text}
          className={`cl-result-pdf-badge-wrap cl-result-pdf-badge-wrap--${b.side}`}
          initial={hiddenBadge}
          animate={inView ? SHOW_YB_NOFILTER : hiddenBadge}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: cardDelay + 0.06 }}
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
        ref={cardRef}
        className="cl-result-pdf-card"
        initial={hiddenCard}
        animate={inView ? showCard : hiddenCard}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: cardDelay }}
        onAnimationComplete={() => { if (inView && cardRef.current) cardRef.current.style.filter = 'none'; }}
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
        </a>
      </motion.div>
    </div>
  );
};

/* Cardul „Te regăsești aici?" — CARDUL ÎNTREG (cadru + text) apare ca o
   singură unitate „aburită", nu textul separat de un cadru deja static —
   cerut explicit („textul să fie ca și cum e deja pe card").
   once:false + amount:0.25 — se declanșează la un sfert din card vizibil ȘI
   se reia identic când revii peste el derulând înapoi în sus (clScrollDir
   memorat ca dependență — vezi motivul la ResultPdfCard).
   NU mai e legat de viteza scroll-ului (încercare anterioară, prea greu de
   controlat — bug persistent cu abur reapărut din inerția de scroll de pe
   telefon). Simplu, previzibil, cerut explicit: aburul e DOAR tranziția de
   intrare — blur(10px)→0 topit în ~1s, exact cât durează cardul să ajungă
   la poziția lui; după aceea zero abur, până iese din ecran și revine. */
const PainCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  return (
    <motion.div
      ref={ref}
      className="cl-pain-frame"
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-pain-grid">
        {PAIN_POINTS.map((p, i) => (
          <div key={i} className="cl-pain-row">
            <span className="cl-pain-num"><span>{i + 1}</span></span>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* Cardul „Beneficiile" — exact aceeași rețetă ca la PainCard, cerut explicit:
   cardul ÎNTREG (cadru + rânduri) apare ca o singură unitate aburită, nu
   textul separat de un cadru deja static. */
const GainsCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  return (
    <motion.div
      ref={ref}
      className="cl-gains-frame"
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-gains">
        {GAINS.map((g, i) => (
          <div key={g.title} className="cl-gain-row">
            <span className="cl-gain-num"><span>{i + 1}</span></span>
            <div>
              <h4>{g.title}</h4>
              <p>{g.text}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* Cardul „Oportunitățile" — aceeași rețetă: cadrul ÎNTREG (rânduri cu gem +
   rămucuța de suport de jos) apare ca o singură unitate aburită. Rămucuța
   (cl-support-note) nu mai are Reveal separat cu delay propriu — face parte
   din același card, deci trebuie să vină O DATĂ cu restul, nu decalat. */
const AfterCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  return (
    <motion.div
      ref={ref}
      className="cl-after-card-frame"
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-after-grid">
        {AFTER_COURSE.map((a) => (
          <div key={a} className="cl-after-card">
            <Arrow />
            <p>{a}</p>
          </div>
        ))}
      </div>

      <div className="cl-support-note">
        Pe parcursul cursului și după <em>finalizare</em>, rămânem alături de tine: te ajutăm cu programele,
        cu sfaturi din experiență practică și cu contacte utile în industrie.
      </div>
    </motion.div>
  );
};

/* Cardul „Procesul de înregistrare" — exact rețeta PainCard (rânduri
   numerotate, un singur cadru), reutilizată ca atare pt. pașii de
   înregistrare (2026-09-01, cerut explicit de clientă). */
const ProcessCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  return (
    <motion.div
      ref={ref}
      className="cl-pain-frame"
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-pain-grid">
        {REGISTRATION_STEPS.map((s, i) => (
          <div key={i} className="cl-pain-row">
            <span className="cl-pain-num"><span>{i + 1}</span></span>
            <p>{s}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* Cardul „Absolvire" — exact rețeta GainsCard (titlu + text, numerotat),
   reutilizată ca atare (2026-09-01, cerut explicit de clientă). */
const GraduationCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  /* wrapper NEUTRU (fără fundal/ramă proprii) — secțiunea e `cl-section--tint`,
     unde gutter-ul de 24px de pe margini nu stă pe secțiune (fundalul e
     full-bleed), ci pe copilul direct (`.cl-section--tint > *`). Cardul
     vizibil (cl-graduation-frame) trebuie să fie NEPOTUL secțiunii, nu
     copilul direct — altfel gutter-ul ajunge padding în interiorul cardului,
     iar rama/fundalul lui tot ating marginile ecranului (bug raportat
     2026-09-01). Exact tiparul deja funcțional cl-video-card-wrap →
     cl-video-card, din aceeași secțiune. */
  return (
    <div className="cl-graduation-frame-wrap">
      <motion.div
        ref={ref}
        className="cl-graduation-frame"
        initial={hidden}
        animate={inView ? SHOW_YB : hidden}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* medalie/sigiliu, uriaș și estompat în colț — filigran decorativ, ca
            „N"-ul de la cardul video (cl-video-mark), aici pe temă de absolvire */}
        <span className="cl-graduation-mark" aria-hidden="true"><IconMedal /></span>

        <div className="cl-graduation-list">
          {GRADUATION.map((g) => (
            <div key={g.title} className="cl-graduation-row">
              <span className="cl-graduation-icon"><g.Icon /></span>
              <div>
                <h4>{g.title}</h4>
                <p>{g.text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* Cardul „Format" — aceeași rețetă de intrare ca Pain/Gains/After (cadrul
   ÎNTREG ca o unitate aburită, useRevealActive, blur 10 / y 56 / 1s). Rânduri
   etichetă → valoare + nota-callout pentru sâmbete, toate în același cadru. */
const FormatCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  return (
    <motion.div
      ref={ref}
      className="cl-format-frame"
      initial={hidden}
      animate={inView ? SHOW_YB : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-format-list">
        {FORMAT_ROWS.map((r) => (
          <div key={r.label} className={`cl-format-row${r.accent ? ' cl-format-row--accent' : ''}`}>
            <span className="cl-format-label">{r.label}</span>
            <span className="cl-format-value">
              {r.value}
              {r.note && <span className="cl-format-note-inline">{r.note}</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="cl-format-note">
        {FORMAT_NOTE.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </motion.div>
  );
};

/* carusel discret pt. cele 3 topice (măsurări/șantier/showroom) — „ca
   înainte": un singur cadru, track glisant (translateX(-active*100%)),
   bulină unică sincronă cu poza curentă, tilt fix în colț. */
const PracticeTopicsCarousel = ({ floatReady = false }: { floatReady?: boolean }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % PRACTICE_TOPICS.length), 3400);
    return () => clearInterval(id);
  }, []);

  /* FĂRĂ reveal propriu (era unul pe insignă + altul pe cadru): tot blocul
     „Cum lucrăm" intră ca O SINGURĂ unitate, din Reveal-ul părinte
     (.cl-practice). Reveal-uri imbricate = opacitatea se înmulțea (părinte
     0→1 peste copil 0→1) și fiecare copil avea propriul prag de viewport, la
     altă coordonată Y ⇒ elementele se aprindeau în trepte, „robotizat".
     Aceeași regulă ca la PainCard/GainsCard/AfterCard: cardul întreg apare
     dintr-o mișcare, nu bucată cu bucată. */
  return (
    <div className="cl-practice-carousel">
      <span
        className="cl-practice-badge-wrap"
      >
        <span
          className={`cl-practice-badge${floatReady ? ' cl-card-float' : ''}`}
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
      </span>

      <div className="cl-practice-frame">
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
      </div>
    </div>
  );
};

/* bandă continuă (11 poze din ședința foto) — EXACT tehnica de la
   „Înveți. Aplici. Realizezi." din hero (.cl-hero-sub-track): conținut
   dublat + translateX(0→-50%) infinit = buclă perfect continuă. Poze
   NECLICKABILE, fără legendă (documentare vizuală generică). */
const PracticeShootMarquee = () => {
  /* FĂRĂ reveal propriu — intră o dată cu tot blocul „Cum lucrăm", din
     Reveal-ul părinte (vezi nota de la PracticeTopicsCarousel). Banda stă
     mult mai jos decât cardurile, deci un prag de viewport propriu o
     aprindea vizibil mai târziu = a treia treaptă din efectul „robotizat".
     Mișcarea e o animație CSS pură (compositor, nu main-thread ⇒ fără lag),
     cu translateX 2D simplu — exact ca librăriile de marquee testate. Vezi CSS. */
  return (
    <div
      className="cl-practice-marquee"
      aria-hidden="true"
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
    </div>
  );
};

/* Cardul cu clipul video „Nicu" — adus (cerut explicit 2026-09-01) din
   secțiunea Cursuri a homepage-ului (`CourseVideoCard` din
   SplineDesignSection.tsx). ACEEAȘI structură: „N" contur pe fundal, credit
   autor ancorat în colț, citat cu cuvinte `*em*`, pătrat video autoplay-mut
   cu iconiță play, lightbox fullscreen cu sunet (createPortal + Escape +
   scroll-lock). DIFERĂ: recolorat în roz-ul secțiunii „Cum lucrăm"
   (rgb(222,152,162)), cu rețeta de ramă/glow a paginii /curs (ca
   `.cl-gains-frame`), copy RO hardcodat (pagina nu folosește i18n).
   Refoloseste fișierele video deja existente din `public/cursuri/`.
   Intrare `noFilter` (opacity+y, FĂRĂ blur) — regula documentată: blur
   tranzitoriu peste un `<video>` = abur agățat pe WebKit (homepage face
   exact aceeași excepție, `<RevealCard noFilter>`). */
const CURS_VIDEO_QUOTE =
  'Trebuie să avem ambiția aceasta de a *crește*, ambiția de a *cunoaște*, de a ne *dezvolta* și de a *ști tot*.';

const renderClVideoQuote = (text: string) =>
  text.split('*').map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : part));

const CursVideoCard = () => {
  const revealRef = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(revealRef);
  const hidden = useMemo(() => ({ opacity: 0, y: 40 * clScrollDir }), [clScrollDir]);

  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /* autoplay ambiental — pornit O SINGURĂ dată, prima oară când cardul devine
     vizibil (nu la montare: `preload="none"` ⇒ nu tragem ~10MB dacă userul nu
     ajunge aici). Nu-l punem pe pauză la ieșire — reintrarea ar re-decoda
     clipul (stalling pe iOS), vezi nota din CourseVideoCard. */
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = true;
    const el = cardRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          /* pre-incalzeste clipul CU SUNET din lightbox (fisier separat,
             7.8/11.9MB). `<link rel=prefetch>` = hint low-priority,
             non-blocking; cand userul apasa pe clip, fisierul e deja in
             cache ⇒ lightbox-ul se deschide cu clipul pornit, nu maro gol.
             mp4 (iOS foloseste mp4 oricum; nu prefetch-uim si webm-ul ca sa
             nu tragem 20MB). */
          if (!document.getElementById('cl-video-sound-prefetch')) {
            const link = document.createElement('link');
            link.id = 'cl-video-sound-prefetch';
            link.rel = 'prefetch';
            link.as = 'video';
            link.href = '/cursuri/curs-video-sound.mp4';
            document.head.appendChild(link);
          }
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '250px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* scroll-ul de fundal e blocat de `useScrollLock` (vezi rețeta de sus) */
  useScrollLock(modalOpen);
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  /* clipul din lightbox se aude (sursă separată, cu audio) — `.play()` explicit
     imediat după click-ul care a deschis modalul ⇒ browserul îl consideră
     pornit dintr-un gest real (permite autoplay CU sunet). */
  useEffect(() => {
    if (!modalOpen) return;
    modalVideoRef.current?.play().catch(() => {});
  }, [modalOpen]);

  const openModal = () => { videoRef.current?.pause(); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); videoRef.current?.play().catch(() => {}); };

  return (
    <motion.div
      ref={revealRef}
      className="cl-video-card-wrap"
      initial={hidden}
      animate={inView ? SHOW_YB_NOFILTER : hidden}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cl-video-card" ref={cardRef}>
        {/* „N" contur (feMorphology dilate + composite out = inel, nu literă
            plină), tăiat de `overflow:hidden` la granița cardului. ID de
            filtru propriu (nu cel de pe homepage — pot coexista pe alt DOM,
            dar un ID duplicat rămâne incorect). */}
        <svg className="cl-video-mark" aria-hidden="true" focusable="false">
          <defs>
            <filter id="noma-cl-video-mark-outline" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
              <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
              <feFlood floodColor="currentColor" result="ink" />
              <feComposite in="ink" in2="ring" operator="in" />
            </filter>
          </defs>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" filter="url(#noma-cl-video-mark-outline)">N</text>
        </svg>

        <div className="cl-video-author">
          <img src="/cursuri/nicu-avatar.jpg" alt="Nicu" className="cl-video-author-avatar" loading="lazy" />
          <div className="cl-video-author-info">
            <span className="cl-video-author-name">Nicu</span>
            <span className="cl-video-author-role">Fondator NOMA · Designer de interior</span>
          </div>
        </div>

        <div className="cl-video-text">
          <p>{renderClVideoQuote(CURS_VIDEO_QUOTE)}</p>
        </div>

        <div className="cl-video-visual">
          <button
            type="button"
            className="cl-video-frame"
            onClick={openModal}
            aria-label="Deschide clipul video NOMA School"
          >
            <video
              ref={videoRef}
              className="cl-video-el"
              poster="/cursuri/curs-video-poster.jpg"
              muted
              loop
              playsInline
              preload="none"
            >
              <source src="/cursuri/curs-video.webm" type="video/webm" />
              <source src="/cursuri/curs-video.mp4" type="video/mp4" />
            </video>
            <span className="cl-video-play-badge" aria-hidden="true">
              <Play size={15} strokeWidth={0} fill="currentColor" />
            </span>
          </button>
        </div>

        {createPortal(
          <AnimatePresence>
            {modalOpen && (
              <motion.div
                key="cl-video-lightbox"
                className="cl-video-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label="Clip video NOMA School"
                initial={overlayShellAnim.initial}
                animate={overlayShellAnim.animate}
                exit={overlayShellAnim.exit}
                transition={overlayShellAnim.transition}
              >
                <div className="cl-video-lightbox-backdrop" onClick={closeModal} />
                <button
                  type="button"
                  className="cl-video-lightbox-close"
                  onClick={closeModal}
                  aria-label="Închide"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
                <motion.div
                  className="cl-video-lightbox-content"
                  initial={overlayPanelAnim.initial}
                  animate={overlayPanelAnim.animate}
                  exit={overlayPanelAnim.exit}
                  transition={overlayPanelAnim.transition}
                >
                  <video
                    ref={modalVideoRef}
                    className="cl-video-lightbox-el"
                    loop
                    playsInline
                    preload="auto"
                    poster="/cursuri/curs-video-poster.jpg"
                  >
                    {/* surse SEPARATE, CU sunet (cele din card sunt `-an`) */}
                    <source src="/cursuri/curs-video-sound.webm" type="video/webm" />
                    <source src="/cursuri/curs-video-sound.mp4" type="video/mp4" />
                  </video>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </motion.div>
  );
};

/* Blocul „Cum lucrăm" (carusel + card + pastilă + trenuleț) — 2026-09-01,
   cerut explicit: intră „fix ca «beneficii»", adică tot blocul ca O SINGURĂ
   unitate aburită, dintr-un singur `motion.div` (nu două siblings cu delay
   diferit, cum era înainte). Aceleași magnitudini ca GainsCard: blur 10px,
   y 56, durată 1s, `useRevealActive` (reapare la scroll înapoi).
   Blocul conține animații CSS infinite (trenulețul + plutirea insignei
   caruselului): filtrul framer NU are voie să rămână rezidual peste ele
   (regula documentată — re-rasterizare per-cadru = licărire pe iOS). De
   aceea, la fel ca FloatCard: `entered` → ținta trece pe SHOW_YB_CLEAR
   (`filter: none` explicit), iar plutirea insignei (`floatReady`) pornește
   abia atunci. `entered` se resetează la ieșirea din ecran. */
const PracticeBlock = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!inView) setEntered(false); }, [inView]);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);

  return (
    <div ref={ref} className="cl-practice">
      <motion.div
        initial={hidden}
        animate={inView ? (entered ? SHOW_YB_CLEAR : SHOW_YB) : hidden}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => { if (inView) setEntered(true); }}
      >
        {/* 2026-09-01, cerut explicit: cardul-poză din dreapta (fostul „Cum
            decurg lecțiile", devenit doar decor după ce conținutul lui a
            fost mutat pe pagină, fără onClick — vezi vechea HowWeWorkCard)
            e scos. În locul lui, lângă carusel, intră direct cardul cu
            informația (lista de 6 puncte, .cl-how-inline-list) — nu mai
            stă separat mai jos pe pagină. */}
        <div className="cl-how-duo">
          <PracticeTopicsCarousel floatReady={inView && entered} />
          <ul className="cl-how-modal-list cl-how-inline-list">
            {HOW_WE_WORK.map((text) => (
              <li key={text} className="cl-how-modal-row">{text}</li>
            ))}
          </ul>
        </div>
        <div className="cl-practice-extra">
          <span className="cl-check-dot"><Check size={9} strokeWidth={3.5} /></span>
          {PRACTICE_EXTRA}
        </div>
        <PracticeShootMarquee />
      </motion.div>
    </div>
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
/* ── Contrast ADAPTIV pentru pastila flotantă ──
   Cerut 2026-09-01: „scrisul din interior ar fi frumos să-și schimbe culoarea
   când trecem pe un fundal alb". Măsurat pe pagină (elementsFromPoint la
   fiecare 5% de scroll): pe sub buton trec ŞI suprafeţe deschise —
   `.cl-testimonial-project-img` (planuri 2D, practic albe) şi
   `.cl-result-pdf-img` (coperţi PDF). Restul paginii e espresso închis.

   Soluţia (fără listă manuală de „elemente deschise", deci merge şi pentru
   poze adăugate în viitor): CITIM LUMINANŢA REALĂ a ce e sub buton.
   - `document.elementsFromPoint()` la 3 puncte de sub pastilă ⇒ primul
     element opac de dedesubt;
   - dacă e `<img>`, desenăm în canvas DOAR dreptunghiul aflat efectiv sub
     buton (mapat din coordonatele ecranului în coordonatele sursei, ţinând
     cont de `object-fit: cover`) şi calculăm luminanţa medie. Pozele sunt
     same-origin ⇒ canvas-ul nu e „tainted", `getImageData` merge;
   - altfel citim `backgroundColor` şi compunem alpha-ul peste ce e dedesubt.
   Rezultatul comută clasa `.cl-float-cta--light`, iar CSS-ul schimbă
   culoarea textului/ramei/vălului (tranziţie lină prin `@property`).

   Cost: canvas de ~32x10px, doar când sub buton chiar e o imagine, throttled
   la ~110ms şi sărit complet dacă nimic nu s-a schimbat. Luminanţa per
   (src + bandă de scroll) e memorată, deci derularea peste aceeaşi poză nu
   recalculează. Zero muncă per-cadru ⇒ nu atinge fluiditatea scroll-ului
   (regula documentată: nimic scump legat de scroll pe desktop, unde rulează
   Lenis). */
const LUMA_THRESHOLD = 0.58; // peste = fundal deschis ⇒ text închis

const relLuma = (r: number, g: number, b: number) =>
  (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

const useAdaptiveCtaContrast = () => {
  useEffect(() => {
    const btn = document.querySelector<HTMLElement>('.cl-float-cta');
    if (!btn) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const cache = new Map<string, number>();
    let lastKey = '';
    let lastRun = 0;

    /* luminanţa medie a porţiunii de imagine aflată sub dreptunghiul `rect`.
       `object-fit: cover` ⇒ sursa e decupată şi scalată: calculăm factorul de
       scalare real şi offset-ul de crop, altfel am eşantiona alt fragment. */
    const imageLuma = (img: HTMLImageElement, rect: DOMRect): number | null => {
      if (!ctx || !img.naturalWidth || !img.complete) return null;
      const box = img.getBoundingClientRect();
      const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
      const cropW = box.width / scale;
      const cropH = box.height / scale;
      const offX = (img.naturalWidth - cropW) / 2;
      const offY = (img.naturalHeight - cropH) / 2;
      const sx = offX + (Math.max(rect.left, box.left) - box.left) / scale;
      const sy = offY + (Math.max(rect.top, box.top) - box.top) / scale;
      const sw = Math.max(1, (Math.min(rect.right, box.right) - Math.max(rect.left, box.left)) / scale);
      const sh = Math.max(1, (Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top)) / scale);
      canvas.width = 32;
      canvas.height = 10;
      try {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 32, 10);
        const { data } = ctx.getImageData(0, 0, 32, 10);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += relLuma(data[i], data[i + 1], data[i + 2]);
        return sum / (data.length / 4);
      } catch {
        return null; // canvas „tainted" (poză cross-origin) ⇒ rămânem pe varianta închisă
      }
    };

    const parseRgb = (v: string): [number, number, number, number] | null => {
      const m = v.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map(parseFloat);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };

    const sample = () => {
      const rect = btn.getBoundingClientRect();
      const xs = [rect.left + 14, rect.left + rect.width / 2, rect.right - 14];
      const y = rect.top + rect.height / 2;

      let lumaSum = 0;
      let n = 0;
      let key = '';

      for (const x of xs) {
        const stack = document.elementsFromPoint(Math.round(x), Math.round(y));
        for (const el of stack) {
          if (el.closest('.cl-float-cta-wrap')) continue;
          if (el instanceof HTMLImageElement) {
            /* cheia include banda de scroll ⇒ derularea peste aceeaşi poză
               reeşantionează doar când chiar s-a mutat vizibil */
            const k = el.currentSrc + '|' + Math.round((rect.top - el.getBoundingClientRect().top) / 40);
            key += k;
            let l = cache.get(k);
            if (l === undefined) {
              const measured = imageLuma(el, rect);
              if (measured === null) break;
              l = measured;
              cache.set(k, l);
            }
            lumaSum += l;
            n++;
            break;
          }
          const bg = parseRgb(getComputedStyle(el).backgroundColor);
          if (bg && bg[3] > 0.35) {
            key += el.className + bg.join(',');
            lumaSum += relLuma(bg[0], bg[1], bg[2]);
            n++;
            break;
          }
        }
      }

      if (!n || key === lastKey) return;
      lastKey = key;
      btn.classList.toggle('cl-float-cta--light', lumaSum / n > LUMA_THRESHOLD);
    };

    /* Throttle pe TIMER, nu pe `requestAnimationFrame`. Motivul e practic:
       rAF nu rulează în tab-uri ascunse/nerandate, ceea ce face funcţia
       imposibil de verificat automat (exact ce s-a întâmplat prima dată —
       codul părea inert, deşi măsurătoarea de luminanţă era corectă). Un
       `setTimeout` de ~110ms are acelaşi cost neglijabil, dar rulează
       determinist. Coada de final (`trailing`) garantează o ultimă citire
       după ce scroll-ul s-a oprit, ca pastila să nu rămână pe culoarea
       intermediară. */
    let pending: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      const now = Date.now();
      const since = now - lastRun;
      if (since >= 110) {
        lastRun = now;
        sample();
      } else if (pending === null) {
        pending = setTimeout(() => {
          pending = null;
          lastRun = Date.now();
          sample();
        }, 110 - since);
      }
    };

    sample();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (pending !== null) clearTimeout(pending);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
};

const FloatingCTA = () => {
  useAdaptiveCtaContrast();
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
  'Nu știi de unde să începi un proiect: de la prima întâlnire până la final.',
  'Ai idei bune, dar nu le poți transforma în planuri și randări reale.',
  'Îți dorești o carieră în design, dar simți că nu ai experiență suficientă.',
  'Nu știi să lucrezi în softurile de proiectare: AutoCAD sau 3Ds Max.',
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
    items: ['Modelarea tehnică a interiorului', 'Perspective geometrice și cadre de detaliu', 'Integrarea corectă a iluminatului', 'Materiale și texturi realiste', 'Randări la nivel de portofoliu, cu texturi și lumină de proiect real'],
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
    items: ['O prezentare care adună toată documentația proiectului tău final, gata de arătat clientului'],
  },
];

/* Secțiunea „Format" (după Programa) — datele concrete de logistică, trimise
   de client. Rânduri etichetă → valoare (fișă), rândul de preț evidențiat,
   plus o notă-callout pentru sâmbete (orar flexibil). */
const FORMAT_ROWS = [
  { label: 'Start', value: '8 februarie 2027', note: null as string | null, accent: false },
  { label: 'Durată', value: '4 luni', note: null as string | null, accent: false },
  { label: 'Lecții live', value: '17:30–19:30', note: 'luni și joi', accent: false },
  { label: 'Preț', value: '1500 €', note: 'poți plăti în 2 sau 3 tranșe', accent: true },
  { label: 'Rezervare', value: '200 €', note: 'intră în preț, nu e sumă în plus', accent: false },
];

/* extins 2026-09-01, cerut explicit de clientă (Mihaela) — orele exacte de
   sâmbătă, nu doar „orar flexibil" generic. Rămâne un array (nu un singur
   paragraf): trei idei distincte (șantier, verificare teme, fără suprapunere),
   randate ca linii separate în același callout (.cl-format-note). */
const FORMAT_NOTE = [
  'Ieșiri în șantier și showroomuri: sâmbătă, ora 10:00. Durata întâlnirii e în funcție de volumul de informație și exerciții din ziua respectivă.',
  'Verificarea temelor pentru acasă, live: sâmbătă, ora 9:00. Durata lecției e în funcție de volumul de verificare.',
  'Aceste lecții de sâmbătă, online și pe teren, nu se suprapun: sunt organizate separat, în săptămâni diferite.',
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
    <FloatCard key={block.title} className="cl-zigzag-banner" wrapClassName="cl-zigzag-banner-wrap" floatDelay={i * 0.35}>
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

const renderZigzagPhoto = (i: number, heightPx?: number) => {
  const p = ZIGZAG_PHOTOS[i];
  return <ZigzagPhoto key={p.src} src={p.src} alt={p.alt} pos={p.pos} heightPx={heightPx} />;
};

/* 2026-09-02: cele 6 iconiţe custom ale acestei liste au fost ŞTERSE, nu doar
   ascunse — cerut explicit („iconiţele nu cred că au vreun sens aici").
   Erau folosite exclusiv aici (verificat), deci nu au rămas resturi. Odată cu
   ele a picat şi împărţirea titlu + descriere: fiecare punct e acum O SINGURĂ
   frază scurtă, aşa cum a cerut Vlad („de exemplu să avem doar «Primeşti
   lecţiile înregistrate»"). Lista se citeşte dintr-o privire şi cardul scade
   mult în înălţime — exact ce se cerea. */
const HOW_WE_WORK = [
  'Înveți de la zero, fără experiență',
  'Instalăm AutoCAD, 3ds Max, Corona, V-Ray și scripturile utile',
  'Lecții live pe Zoom, pe proiecte reale',
  'Lucrezi pe un apartament real, cu măsurătorile noastre',
  'Temă după fiecare lecție, verificată individual',
  'Primești lecțiile înregistrate',
];

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
  { title: 'Claritate la fiecare pas', text: 'Înțelegi fiecare etapă a unui proiect și știi exact ce ai de făcut, de la prima întâlnire până la final.' },
  { title: 'Colaborezi ca un profesionist', text: 'Descoperi cum funcționează colaborarea cu furnizorii, companiile de materiale și echipele de execuție.' },
  { title: 'Iei decizii cu siguranță', text: 'Alegi materiale, culori, mobilier și soluții tehnice cu argumente clare și logică.' },
  { title: 'Experiență reală', text: 'Lucrezi pe proiecte reale și primești informații practice pe care nu le găsești în tutoriale.' },
  { title: 'Softuri avansate de proiectare', text: 'Lucrezi cu încredere în AutoCAD și 3Ds Max, de la planurile tehnice până la randările fotorealiste ale proiectului tău.' },
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

/* Secțiunea „Procesul de înregistrare" — cerută explicit de clientă
   (Mihaela), 2026-09-01: pașii de la primul mesaj până la prima lecție,
   reformulați la persoana a II-a (ca restul paginii). Aceeași rețetă
   vizuală ca PainCard (rânduri numerotate într-un singur cadru). */
const REGISTRATION_STEPS = [
  'Ne scrii pe WhatsApp că vrei să te înscrii. De acolo pornește tot.',
  'Achiți avansul de 200€, care intră în prețul total, ca să-ți rezervi locul.',
  'Semnezi contractul cu toate detaliile cursului scrise negru pe alb, ca să știi exact la ce te înscrii.',
  'Te adăugăm în grupul de Telegram al cursului, unde rămâne toată informația, mereu la îndemână.',
  'Stabilim împreună o zi și o oră ca să-ți instalăm softurile de la distanță, direct pe calculatorul tău.',
  'În ziua primei lecții, primești link-ul de conectare.',
  'Primești măsurătorile reale ale unui apartament și lucrăm pe el chiar din prima lecție.',
  'Fiecare lecție rămâne înregistrată în grup. O poți revedea oricând ai nevoie, în ritmul tău.',
];

/* Iconițe custom pentru „Absolvire" — la temă cu fiecare punct (regula
   documentată: nicio iconiță generică), NU bulinele numerotate de la
   Beneficii. 2026-09-01, cerut explicit: cardul „arată de buget" — bulina cu
   cifră era exact același element reciclat de 3 ori pe pagină deja; aici
   fiecare are semnul lui, ca la „Cum lucrăm". */
/* diplomă + sigiliu cu panglică — literal la temă cu „certificat" */
const IconCertificate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.4" y="3.2" width="14.4" height="12.2" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6.2 7.1H14.8M6.2 10.1H11.6" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" opacity="0.6" />
    <circle cx="16.6" cy="16.3" r="3.35" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14.8 18.75L13.85 21.7L16.6 20.35L19.35 21.7L18.4 18.75" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
  </svg>
);

/* două baloane de discuție suprapuse — „poveștite, stând de vorbă" */
const IconStory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.6 6.6A2 2 0 0 1 5.6 4.6H12.4A2 2 0 0 1 14.4 6.6V10.4A2 2 0 0 1 12.4 12.4H8.3L5.4 14.7V12.4H5.6A2 2 0 0 1 3.6 10.4V6.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity="0.5" />
    <path d="M9.6 9.9A2 2 0 0 1 11.6 7.9H18.4A2 2 0 0 1 20.4 9.9V13.4A2 2 0 0 1 18.4 15.4H17.5V18L14.9 15.4H11.6A2 2 0 0 1 9.6 13.4V9.9Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/* telefon + „like" ancorat în colț — social media, la temă cu bonusul */
const IconSocialBonus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="6.3" y="2.4" width="10.2" height="17.6" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9.9 5.15H12.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <circle cx="17.2" cy="16.4" r="4.1" fill="var(--noma-overlay-panel-2, #1c1214)" stroke="currentColor" strokeWidth="1.1" opacity="0.9" />
    <path d="M17.2 18.35C15.55 17.05 15.15 16.35 15.15 15.55C15.15 14.85 15.7 14.35 16.35 14.35C16.8 14.35 17.05 14.6 17.2 14.85C17.35 14.6 17.6 14.35 18.05 14.35C18.7 14.35 19.25 14.85 19.25 15.55C19.25 16.35 18.85 17.05 17.2 18.35Z" fill="currentColor" />
  </svg>
);

/* medalie simplă (cerc cu inel interior + panglică în V) — filigran de
   fundal pt. cardul de Absolvire, aceeași idee ca „N"-ul de pe cardul video
   (cl-video-mark): un singur glyph, uriaș și estompat, într-un colț. */
const IconMedal = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="9.4" r="6" stroke="currentColor" strokeWidth="1" />
    <circle cx="12" cy="9.4" r="3.5" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
    <path d="M8.3 14.4L6.5 22L12 18.9L17.5 22L15.7 14.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Secțiunea „Absolvire" — cerută explicit de clientă, 2026-09-01: certificat
   + feedback personalizat, întâlnire motivațională cu culisele meseriei, plus
   bonusul cu specialistul în social media.
   Reformulat 2026-09-01 (raportat „sună generic") — scoase cuvintele-șablon
   de curs online (Bonus, mini sesiune profesionistă, schema de lucru) și
   înlocuite cu detalii concrete, ancorate în conținutul real al paginii.
   Iconițe adăugate 2026-09-01 (raportat „arată de buget" — vezi cardul de mai
   jos, GraduationCard, cu rețetă proprie, nu mai reciclează Beneficii). */
const GRADUATION = [
  { Icon: IconCertificate, title: 'Certificat, cu feedback pe bune', text: 'La ultima întâlnire primești certificatul de absolvire și treci, punct cu punct, prin tot parcursul tău: ce ai făcut bine, unde mai ai de lucrat.' },
  { Icon: IconStory, title: 'Povești din culisele meseriei', text: 'Vorbim despre situații reale din proiecte și despre partea din meserie care nu se vede din exterior. Genul de lucruri pe care le afli stând de vorbă, nu dintr-un curs.' },
  { Icon: IconSocialBonus, title: 'Primul pas pe social media', text: 'Ni se alătură un specialist în social media marketing care îți arată, concret, cum să-ți prezinți munca online și cum să-ți atragi primii clienți ca freelancer.' },
];

/* trenulețul de cursante — poze + poveste + o poză din proiectul lor real
   (2D/3D). Fără citate puse în ghilimele — doar povestea, la toate trei. */
const TESTIMONIALS = [
  {
    name: 'Inesa',
    age: 22,
    photo: '/curs-landing/testimonial-inesa.webp',
    photoPos: '62% 22%',
    story: 'A făcut 2 cursuri, apoi practică, apoi a devenit proiectant 2D principal în echipă. De un an lucrează intens la proiecte reale, iar acum face și proiect 3D, full cu tot cu moodboard.',
    project: '/curs-landing/testimonial-inesa-proiect.webp',
    projectRatio: 1000 / 827,
    projectLabel: 'Proiect 3D: moodboard și panouri decorative',
  },
  {
    name: 'Andreea',
    age: 21,
    photo: '/curs-landing/testimonial-andreea.webp',
    photoPos: '45% 25%',
    story: 'A renunțat la jobul de barber ca să învețe design interior. A câștigat stagiul de practică în compania noastră și deja execută primul ei proiect: participă la discuțiile cu clientul, a luat măsurători și îl va duce cap-coadă, cu verificarea noastră amănunțită.',
    project: '/curs-landing/testimonial-andreea-proiect.webp',
    projectRatio: 1000 / 915,
    projectLabel: 'Plan 2D: apartament complet',
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
  { q: 'Pentru cine este acest curs?', a: 'Pentru oricine vrea să înceapă sau să-și consolideze o carieră în design interior. Nu ai nevoie de experiență anterioară.' },
  { q: 'Am nevoie de cunoștințe de AutoCAD sau 3Ds Max?', a: 'Nu. Înveți totul de la zero, pas cu pas, cu teme practice verificate individual.' },
  { q: 'Ce primesc la finalul cursului?', a: 'Un album tehnic complet, randări fotorealiste, moodboard și o prezentare finală: practic, un portofoliu gata de arătat primului client.' },
  { q: 'Rămâneți alături după finalizarea cursului?', a: 'Da. Oferim suport cu programele, sfaturi din experiență practică și contacte utile în industrie.' },
  { q: 'Cum mă înscriu?', a: 'Scrie-ne direct pe WhatsApp. Îți răspundem cu toate detaliile despre format și locurile disponibile.' },
];

const CursLanding = () => {
  /* Lock manual pt. unitatea de viewport, NU vh/svh/dvh nativ din CSS —
     în browserul in-app Instagram (WKWebView-ul lor), inclusiv svh/dvh se
     comportă NESTANDARD: se recalculează live la fiecare apariție/dispariție
     a barei, exact ca vechiul vh buggy dinainte să existe aceste unități.
     Asta cauza „ridicarea" secțiunilor și tremurul titlurilor/liniilor la
     scroll. Fix robust: măsurăm noi 1% din window.innerHeight O SINGURĂ
     dată la mount (bara e vizibilă la încărcare = exact ce ar trebui să dea
     svh), punem valoarea într-o variabilă CSS în px, și recalculăm DOAR
     dacă lățimea s-a schimbat cu adevărat (rotire telefon) — niciodată
     doar pt. că înălțimea a fluctuat (bara care apare/dispare). Toate
     clamp(...vh...) din CursLanding.css folosesc var(--cl-vh) în loc de
     vh — valoare complet statică, imună la orice bug de viewport al
     browserului in-app. */
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const setClVh = () => {
      document.documentElement.style.setProperty('--cl-vh', `${window.innerHeight * 0.01}px`);
    };
    setClVh();
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setClVh();
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', setClVh);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', setClVh);
    };
  }, []);

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

  // lightbox pentru poza de proiect a cursantei — click = vezi mai de-aproape
  // (aceeași idee ca galeria de la /portofoliu/:id, variantă simplificată)
  const [projectLightboxOpen, setProjectLightboxOpen] = useState(false);
  useScrollLock(projectLightboxOpen);
  useEffect(() => {
    if (!projectLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setProjectLightboxOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
     flex-ului dintre iteme, deci nu adaugă un gap „fantomă".

     2026-09-01 (raportat de Vlad): coloana stângă se termină ÎNTOTDEAUNA în
     ultima poză (index impar, alternanța banner/poză din JSX mai jos) — o
     poză cu aspect-ratio FIX nu „cade" niciodată exact la nivelul ultimului
     banner din dreapta. Cu padding pe coloana mai scurtă, poza mai înaltă
     atârna vizibil sub cardul din dreapta, iar dreapta rămânea cu un gol mort
     invizibil dedesubt — exact raportul „ultima poză nu se termină unde se
     termină cardul din dreapta". Fix: când STÂNGA e mai înaltă (poza e de
     vină), NU mai punem padding în dreapta — scurtăm direct ultima poză cu
     diferența (object-fit:cover + object-position deja tunat per poză
     înseamnă că scurtarea doar crop-ează puțin mai mult sus/jos, nu
     deformează). Restul pozelor din bandă rămân la raportul fix — doar asta,
     ultima, se poate scurta, cel mult 55% din înălțimea ei naturală (dincolo
     de-atât crop-ul ar tăia prea mult din cadru); dacă diferența depășește
     plafonul, restul rămâne padding invizibil, ca plasă de siguranță.
     De ce 55% și nu 35% (prima valoare pusă): pe MOBIL coloanele diferă cu
     ~120px dintr-o poză naturală de 237px, adică 51% — cu plafon 35%
     scurtarea se oprea la jumătatea drumului și poza tot rămânea 37px sub
     card. Plafonul trebuie să acopere cazul real măsurat, nu o valoare
     „rotundă" aleasă din burtă. Când
     DREAPTA e mai înaltă (bannerul de închidere are text lung), poza rămâne
     neatinsă — acolo tot padding-ul vechi pe stânga e corect, nu există nicio
     poză de scurtat pe partea aia. */
  const zigzagLeftRef = useRef<HTMLDivElement>(null);
  const zigzagRightRef = useRef<HTMLDivElement>(null);
  const [zigzagPad, setZigzagPad] = useState({ left: 0, right: 0 });
  const [zigzagLastPhotoH, setZigzagLastPhotoH] = useState<number | undefined>(undefined);

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

    /* înălțimea NATURALĂ (aspect-ratio, neatinsă) a ultimei poze — citită
       direct din `aspect-ratio` (CSS), nu reconstruită din „cât am scurtat
       data trecută". Proprietatea `aspect-ratio` rămâne neschimbată chiar
       dacă am suprascris `height` inline peste ea (sunt proprietăți CSS
       separate) — deci width × aspect-ratio dă mereu valoarea corectă,
       independent de orice stare anterioară. Bug găsit cu varianta veche
       (ref care ținea „ultima scurtare aplicată"): la o redimensionare
       tranzitorie/degenerată a ferestrei (0×0, o singură trecere), ref-ul a
       reținut o valoare stricată și diferența nu s-a mai auto-corectat nici
       după ce fereastra a revenit la o lățime normală — fiindcă fiecare
       calcul nou pornea de la valoarea (greșită) ținută anterior, nu de la
       adevărul din CSS. Varianta asta e idempotentă: fiecare apel recalculează
       de la zero, din geometria REALĂ curentă, deci se auto-corectează mereu,
       oricâte treceri intermediare stricate ar exista între. */
    const naturalPhotoHeight = (box: HTMLElement) => {
      const w = box.getBoundingClientRect().width;
      const arRaw = getComputedStyle(box).aspectRatio;
      const ratio = arRaw.includes('/')
        ? (() => { const [a, b] = arRaw.split('/').map(Number); return b ? a / b : 0; })()
        : parseFloat(arRaw);
      return ratio > 0 ? w / ratio : box.getBoundingClientRect().height;
    };

    const equalize = () => {
      const leftPad = readPad(leftEl);
      const rightPad = readPad(rightEl);

      const lastPhotoBox = leftEl.lastElementChild?.querySelector<HTMLElement>('.cl-zigzag-photo') ?? null;
      const naturalPhotoH = lastPhotoBox ? naturalPhotoHeight(lastPhotoBox) : 0;
      const appliedShrink = lastPhotoBox ? Math.max(0, Math.round(naturalPhotoH - lastPhotoBox.getBoundingClientRect().height)) : 0;

      const leftContent = leftEl.getBoundingClientRect().height - leftPad + appliedShrink;
      const rightContent = rightEl.getBoundingClientRect().height - rightPad;
      const diff = Math.round(leftContent - rightContent);

      let nextShrink = 0;
      let next = { left: 0, right: 0 };

      if (diff > 1 && lastPhotoBox && naturalPhotoH > 0) {
        const clampedShrink = Math.min(diff, Math.round(naturalPhotoH * 0.55));
        nextShrink = clampedShrink;
        next = { left: 0, right: Math.max(0, diff - clampedShrink) };
      } else if (diff < -1) {
        next = { left: -diff, right: 0 };
      }

      if (next.left !== leftPad || next.right !== rightPad) {
        setZigzagPad(next);
      }
      setZigzagLastPhotoH((prev) => {
        const nextH = nextShrink > 0 ? Math.round(naturalPhotoH - nextShrink) : undefined;
        return prev === nextH ? prev : nextH;
      });
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

  /* ── FIX „pe desktop se mișcă nu-ș cum toată pagina" la deschiderea unui
     răspuns din FAQ (raportat 2026-09-01, DOAR pe desktop) ──
     Profilul „bun pe telefon / stricat pe desktop" e semnătura Lenis:
     smooth-scroll-ul JS rulează DOAR pe desktop (App.tsx — `if
     (window.innerWidth < 768) return`), pe mobil e scroll nativ. Vezi
     reference_stability_antivibration, Cauza 11.
     Mecanica exactă aici: Lenis își ține PROPRIA poziție de scroll
     (`animatedScroll`) și propriul plafon (`limit`), iar plafonul se
     reîmprospătează printr-un ResizeObserver DEBOUNCED (~250ms, vezi
     `lenis.dimensions.debouncedResize`). FAQ-ul e ULTIMA secțiune din
     pagină (verificat: `.cl-faq-section` e ultimul copil al `.cl-page`),
     deci deschiderea/închiderea unui răspuns schimbă CHIAR plafonul de
     scroll, sub picioarele userului. Cât durează tranziția de înălțime
     (380ms), Lenis scrie în fiecare cadru o poziție calculată față de un
     plafon VECHI, browserul o taie la plafonul NOU, Lenis citește înapoi
     altă valoare și corectează — de aici „se mișcă toată pagina". Pe mobil
     nu se întâmplă: acolo nu există Lenis ȘI tranziția de înălțime e oprită
     (`transition:none`, vezi CSS), deci deschiderea e instantanee.
     Fix: îi spunem lui Lenis să-și recitească dimensiunile la FIECARE
     schimbare de înălțime a listei — ResizeObserver pe `.cl-faq`, nu un
     timer ghicit pe durata tranziției (RO se declanșează exact când se
     schimbă înălțimea, inclusiv dacă cineva schimbă durata/curba din CSS).
     `lenis.resize()` doar RECITEȘTE dimensiunile, nu scrie nimic în layout,
     deci nu poate intra în buclă cu observatorul.
     Pe mobil `window.__lenis` e `undefined` ⇒ callback-ul e un no-op.
     querySelector (nu ref): `.cl-faq` e randat de `Reveal`, care nu
     forwardează ref — același tipar ca la FloatingCTA/PracticeBlock. */
  useEffect(() => {
    const list = document.querySelector<HTMLElement>('.cl-faq');
    if (!list) return;
    const ro = new ResizeObserver(() => { window.__lenis?.resize(); });
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  useScrollDirectionTracker();

  return (
    <>
      <Helmet>
        <html lang="ro" />
        <title>Curs de Design Interior — NOMA School</title>
        <meta name="description" content="Curs practic de design interior: AutoCAD, 3Ds Max, lucrul cu clienții și furnizorii. De la curs, direct la primul client." />
        <meta name="robots" content="noindex, nofollow" />
        {/* noindex la Google, dar link-ul e distribuit direct din bio
            Instagram — OG/Twitter tot contează, ca preview-ul din
            aplicația de mesagerie/rețea socială să nu arate „gol". */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Curs de Design Interior — NOMA School" />
        <meta property="og:description" content="Curs practic de design interior: AutoCAD, 3Ds Max, lucrul cu clienții și furnizorii. De la curs, direct la primul client." />
        <meta property="og:url" content="https://noma.md/curs" />
        <meta property="og:image" content="https://noma.md/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://noma.md/curs" />
        <meta name="twitter:title" content="Curs de Design Interior — NOMA School" />
        <meta name="twitter:description" content="Curs practic de design interior: AutoCAD, 3Ds Max, lucrul cu clienții și furnizorii. De la curs, direct la primul client." />
        <meta name="twitter:image" content="https://noma.md/og-image.jpg" />
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

        <ClDivider />

        {/* ── PAIN POINTS ── */}
        <section className="cl-section cl-pain-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Te regăsești aici?</span>
            <h2 className="cl-h2">Atunci acest curs e <em>pentru tine</em></h2>
          </Reveal>

          <PainCard />
        </section>

        <ClDivider />

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
              {[0, 1, 2, 3, 4, 5].map((i) => (i % 2 === 0 ? renderZigzagBanner(i) : renderZigzagPhoto(i, i === 5 ? zigzagLastPhotoH : undefined)))}
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

        <ClDivider />

        {/* ── CUM LUCRĂM ── */}
        <section className="cl-section cl-section--tint cl-how-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Cum lucrăm</span>
            <h2 className="cl-h2">3Ds Max &amp; <em>AutoCAD</em></h2>
          </Reveal>

          <CursVideoCard />

          <PracticeBlock />
        </section>

        <ClDivider />

        {/* ── CE CÂȘTIGI ── */}
        <section className="cl-section cl-gains-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Beneficiile</span>
            <h2 className="cl-h2">Ce <em>câștigi</em> din acest curs</h2>
          </Reveal>

          <GainsCard />
        </section>

        <ClDivider />

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

        <ClDivider />

        {/* ── DUPĂ CURS ── */}
        <section className="cl-section cl-after-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Oportunitățile</span>
            <h2 className="cl-h2"><span className="cl-h2-line">Ce opțiuni ai după</span> <em>finalizare</em></h2>
          </Reveal>

          <AfterCard />
        </section>

        <ClDivider />

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

        <ClDivider />

        {/* ── LIGHTBOX poză proiect — click pe poza de mai sus, inspirat de
            galeria /portofoliu/:id (variantă simplificată, o singură poză). ── */}
        {createPortal(
          <AnimatePresence>
            {projectLightboxOpen && (
              <motion.div
                key="cl-project-lightbox"
                className="cl-project-lightbox"
                role="dialog"
                aria-modal="true"
                aria-label={student.projectLabel}
                initial={overlayShellAnim.initial}
                animate={overlayShellAnim.animate}
                exit={overlayShellAnim.exit}
                transition={overlayShellAnim.transition}
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
                <motion.div
                  className="cl-project-lightbox-content"
                  initial={overlayPanelAnim.initial}
                  animate={overlayPanelAnim.animate}
                  exit={overlayPanelAnim.exit}
                  transition={overlayPanelAnim.transition}
                >
                  <img
                    src={student.project}
                    alt={student.projectLabel}
                    className="cl-project-lightbox-img"
                  />
                  <span className="cl-project-lightbox-caption">{student.projectLabel}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* ── PROCESUL DE ÎNREGISTRARE — cerut explicit de clientă,
            2026-09-01: pașii de la primul mesaj până la prima lecție. ── */}
        <section className="cl-section cl-process-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Pas cu pas</span>
            <h2 className="cl-h2">Cum decurge <em>înscrierea</em></h2>
          </Reveal>

          <ProcessCard />
        </section>

        <ClDivider />

        {/* ── ABSOLVIRE — cerut explicit de clientă, 2026-09-01: certificat
            + feedback personalizat + întâlnire motivațională + bonus social
            media. ── */}
        <section className="cl-section cl-section--tint cl-graduation-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">La final</span>
            <h2 className="cl-h2">Absolvire și <em>certificare</em></h2>
          </Reveal>

          <GraduationCard />
        </section>

        <ClDivider />

        {/* ── FORMAT — logistica cursului (date trimise de client). Mutată
            aici (2026-09-01, cerut explicit de clientă): rubrica de preț nu
            mai apare devreme pe pagină, ca prețul să nu sperie „dintr-o
            dată" înainte ca vizitatorul să vadă tot ce oferă cursul. ── */}
        <section className="cl-section cl-format-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Format</span>
            <h2 className="cl-h2">Când începe și <em>cât costă</em></h2>
          </Reveal>

          <FormatCard />
        </section>

        <ClDivider />

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
