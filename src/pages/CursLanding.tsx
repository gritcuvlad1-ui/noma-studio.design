import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { AnimatePresence, motion, useInView, useScroll, useTransform, Variants } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
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
/* `amount` = cât din element trebuie să fie vizibil ca să pornească intrarea.
   Default 0.25 (valoarea istorică, folosită de tot restul paginii — NU o
   schimba global). Se coboară punctual pe blocuri ÎNALTE, unde 25% din
   înălțime înseamnă mult scroll până se declanșează ceva. */
const useRevealActive = (ref: React.RefObject<any>, amount: number = 0.25) => {
  const pastThreshold = useInView(ref, { amount });
  const anyVisible = useInView(ref, { amount: 'some' });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (pastThreshold) setActive(true);
    else if (!anyVisible) setActive(false);
  }, [pastThreshold, anyVisible]);

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
/* 2026-09-14 (raportat: „se opreste la jumatate, apoi se mai ridica" — nu
   citea ca o mișcare, ci în două etape): curba veche, [0.16,1,0.3,1], are
   ambele mânere de control deja la y=1 (la doar 16-30% din durată) — restul
   de ~70% din cele 0.5s e o corecție aproape imperceptibilă spre 100%, care
   pe o mișcare mare (scale+y, privită direct, nu un reveal periferic la
   scroll) se simte exact ca o oprire urmată de-o mică „mai continuă puțin".
   Curba nouă distribuie decelerarea mai uniform pe toată durata — nu mai are
   coadă plată. RĂMÂNE doar pt. acest overlay (constanta e folosită DOAR aici,
   verificat) — restul paginii își păstrează curba semnătură [0.16,1,0.3,1]. */
const OVERLAY_EASE = [0.33, 1, 0.68, 1] as const;      // decelerare uniforma (intrare)
const OVERLAY_EASE_OUT = [0.4, 0, 1, 1] as const;      // accelerare (iesire prompta)
/* IESIREA are `transition` PROPRIU in obiectul `exit` - framer aplica altfel
   `transition`-ul de nivel de componenta si la exit, iar 0.5s cu decelerare
   lunga la inchidere = butonul X „lipicios". La inchidere: mai scurt, ease-in
   (pleaca decis), scale mai putin adanc. */
const overlayShellAnim = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.22, ease: OVERLAY_EASE_OUT } },
  /* 2026-09-14 (raportat: „se deschide în 2 etape, urât"): era 0.34s aici vs
     0.5s la panel (mai jos) — fundalul se termina de "așezat" cu 0.16s
     înaintea conținutului, care mai continua vizibil să se scaleze/lumineze
     după aceea. Aceeași durată la amândouă ⇒ se termină ÎN ACELAȘI cadru,
     citite ca o singură mișcare, exact cum descrie comentariul de mai sus
     ("coregrafie identică") — dar valorile nu chiar se potriveau. */
  transition: { duration: 0.5, ease: OVERLAY_EASE },
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
      niciun overlay al paginii nu are conținut intern derulabil (poza/clipul
      se încadrează mereu în ecran, vezi `aspect-ratio`/`max-height` pe fiecare),
      deci `touch-action: none` de pe cutia de-afară e suficient — nu mai e
      nevoie de `pan-y` pe vreun element din interior.
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

/* ── Eliberarea decodoarelor video cât e deschis un lightbox ──
   2026-09-19, raportat cu screenshot de pe telefon: „la cadrul acesta se
   blochează când deschid clipul, și l-am deschis de vreo 5 ori — se
   buguiește tot mai tare (stă mai multe secunde pe acel cadru)".
   „Tot mai rău cu fiecare deschidere" = ceva se acumulează. Măsurat în DOM:
   clipul din lightbox NU era pus NICIODATĂ pe pauză la închidere —
   `currentTime` continua să avanseze (44.7 → 45.5 → 46.3) cu lightbox-ul
   închis. Plus, pagina are 3 clipuri ambientale care rulează în buclă.
   Pe iOS numărul de clipuri DECODATE simultan e limitat hardware: fiecare
   deschidere cerea un decodor nou fără să-l elibereze pe cel vechi ⇒ la a
   n-a deschidere nu mai era niciunul liber, iar clipul rămânea înghețat pe
   primul cadru — exact simptomul raportat.
   Cât e deschis lightbox-ul, clipurile de fundal NU se văd oricum ⇒ pauză,
   repornite la închidere. Repornim DOAR ce am pauzat noi (nu pornim clipuri
   care erau deja oprite din alt motiv — ex. autoplay blocat de iOS Low
   Power Mode). */
const usePauseBackgroundVideos = (active: boolean, keep: React.RefObject<HTMLVideoElement | null>) => {
  useEffect(() => {
    if (!active) return;
    const paused: HTMLVideoElement[] = [];
    document.querySelectorAll('video').forEach((v) => {
      if (v === keep.current || v.paused) return;
      v.pause();
      paused.push(v);
    });
    return () => { paused.forEach((v) => { v.play().catch(() => {}); }); };
  }, [active, keep]);
};

/* 2026-09-23 — raportat: „dacă stau mai mult sau ies de pe link și intru
   iar, clipul nu mai merge singur". Cauza: clipurile ambientale primesc
   `play()` O SINGURĂ dată (IO deconectat după prima intrare în ecran). Orice
   pauză pusă ulterior de BROWSER — tab/aplicație în fundal, ecran blocat,
   revenire din bfcache (butonul Înapoi), economisire baterie pe iOS — nu mai
   era urmată de nimic, clipul rămânea înghețat pe un cadru.
   Fix: repornire la `visibilitychange` (pagina redevine vizibilă), `pageshow`
   (revenire din bfcache) și la reintrarea cardului în ecran — DOAR dacă
   clipul a pornit deja o dată (respectăm `preload="none"`), cardul e în
   ecran și lightbox-ul nu e deschis. Nu punem pe pauză la ieșire (nota iOS
   de la CursVideoCard rămâne valabilă). */
const useResumeAmbientVideo = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cardRef: React.RefObject<HTMLElement | null>,
  blocked = false,
) => {
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  useEffect(() => {
    const video = videoRef.current;
    const el = cardRef.current;
    if (!video || !el) return;
    let started = false;
    let inView = false;
    const onPlaying = () => { started = true; };
    const resume = () => {
      if (!started || !inView || blockedRef.current || document.hidden || !video.paused) return;
      video.play().catch(() => {});
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      resume();
    }, { threshold: 0.1 });
    const onVisibility = () => { if (!document.hidden) resume(); };
    video.addEventListener('playing', onPlaying);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', resume);
    io.observe(el);
    return () => {
      io.disconnect();
      video.removeEventListener('playing', onPlaying);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', resume);
    };
  }, [videoRef, cardRef]);

  /* la închiderea lightbox-ului pe ORICE cale (X, Escape, click pe fundal) —
     înainte doar butonul X repornea clipul, Escape îl lăsa oprit. */
  useEffect(() => {
    const video = videoRef.current;
    if (blocked || !video || !video.paused || video.currentTime === 0 || document.hidden) return;
    video.play().catch(() => {});
  }, [blocked, videoRef]);
};

/* ── Lightbox de poze GENERIC, reutilizat pe toată pagina ──
   2026-09-20: extras din secțiunea „Practica" (KitFlow, galerie de 7 poze)
   și extins explicit la Bonus (6 poze) și Fondatorii NOMA (1 poză) — cerut:
   „vreau așa să facem și la bonus și la fondatorii noma". O SINGURĂ rețetă
   (evită tripla duplicare a acelorași ~80 de linii de JSX): swipe stânga/
   dreapta între poze + tap simplu în jumătatea stângă/dreaptă a ECRANULUI
   (nu doar a pozei) — `canNav` dezactivează navigarea la o galerie de 1
   singură poză (Fondatorii), rămâne doar swipe-jos + X; swipe de SUS ÎN JOS
   închide peste tot (axa dominantă a gestului decide dacă e „navigare" sau
   „închidere" — `|y| > |x|`); Escape + scroll-lock + `theme-color`
   tranzitoriu (bare Safari/Instagram) — toate comune. Backdrop-ul NU mai
   închide la click (raportat explicit: un tap lângă o poză îngustă cădea pe
   backdrop și închidea din greșeală) — DOAR X/Escape/swipe-jos închid. */
/* /curs e pregenerată ca HTML static (vite.config.ts) — un createPortal pe
   `document.body` în randare crapă în Node și ar diferi la hidratare.
   Portalurile se montează abia după primul efect, pe client. */
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient;
};

const PhotoLightbox = ({
  photos,
  openIndex,
  onClose,
  onNext,
  onPrev,
  ariaLabel,
  variant,
}: {
  photos: { full: string; alt: string }[];
  openIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  ariaLabel: string;
  variant?: string;
}) => {
  const isClient = useIsClient();
  useScrollLock(openIndex !== null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, onClose]);

  useEffect(() => {
    if (openIndex === null) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#100b09';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [openIndex]);

  const canNav = photos.length > 1;
  const current = openIndex !== null ? photos[openIndex] : null;

  /* 2026-09-20, raportat: „nu pot da swipe la poze, nici stânga-dreapta,
     nici sus-jos" — gestul era pe `drag`/`onDragEnd`/`onTap` din framer
     (motion.div). NEÎNCREDERE confirmată: pe telefonul real, NICIUN sens nu
     funcționa. Înlocuit cu Pointer Events NATIVE — EXACT rețeta deja
     dovedită și funcțională a trenulețului (`DragMarquee`, mai sus în
     fișier): `movedRef`-echivalent (`dragRef`) distinge tap de swipe după
     un prag de 4px, `setPointerCapture` abia LA primul semn real de
     mișcare (nu la apăsare) — un tap curat rămâne curat. */
  const dragRef = useRef({ startX: 0, startY: 0, dx: 0, dy: 0, moved: false });

  const onContentPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false };
  };
  const onContentPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(d.dx) > 4 || Math.abs(d.dy) > 4)) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onContentPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d.moved) {
      // tap curat — navighează pe jumătatea stânga/dreaptă a ECRANULUI
      if (canNav) {
        if (e.clientX < window.innerWidth / 2) onPrev();
        else onNext();
      }
      return;
    }
    if (Math.abs(d.dy) > Math.abs(d.dx)) {
      if (d.dy > 80) onClose(); // swipe SUS→JOS = închide (sus, nimic)
    } else if (canNav) {
      if (d.dx < -50) onNext();
      else if (d.dx > 50) onPrev();
    }
  };

  if (!isClient) return null;
  return createPortal(
    <AnimatePresence>
      {openIndex !== null && current && (
        <motion.div
          key="cl-photo-lightbox"
          className={`cl-photo-lightbox${variant ? ` cl-photo-lightbox--${variant}` : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={overlayShellAnim.initial}
          animate={overlayShellAnim.animate}
          exit={overlayShellAnim.exit}
          transition={overlayShellAnim.transition}
        >
          <div className="cl-photo-lightbox-scrim cl-photo-lightbox-scrim--top" aria-hidden="true" />
          <div className="cl-photo-lightbox-scrim cl-photo-lightbox-scrim--bottom" aria-hidden="true" />
          {/* pur vizual (dimming) — `content` (mai jos) acoperă acum TOT
              ecranul și preia el însuși tap-ul/swipe-ul, deci backdrop-ul nu
              mai are nevoie de propriul handler (era oricum sub `content`,
              niciodată atins de un click real după schimbare). */}
          <div className="cl-photo-lightbox-backdrop" aria-hidden="true" />
          <button type="button" className="cl-photo-lightbox-close" onClick={onClose} aria-label="Închide">
            <X size={20} strokeWidth={1.5} />
          </button>
          <motion.div
            key={openIndex}
            className="cl-photo-lightbox-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onPointerDown={onContentPointerDown}
            onPointerMove={onContentPointerMove}
            onPointerUp={onContentPointerUp}
            onPointerCancel={onContentPointerUp}
          >
            <img src={current.full} alt={current.alt} className="cl-photo-lightbox-img" draggable={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
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
/* 2026-09-26 — toate pozele din bandă rămân la raportul fix 2/3 de bază.
   Alinierea coloanelor vine nativ prin CSS (`align-items:stretch` pe
   `.cl-zigzag-2col` + bannerul de închidere care crește, `flex:1`) — dar
   la diferența mare dintre coloane de pe desktop (393px), bannerul crescut
   ajungea cu mult spațiu mort în el. Cerut explicit: „să ne jucăm cu
   mărimile" pe ULTIMELE 2 poze din coada stângii, ca să scadă diferența
   ÎNAINTE să ajungă la bannerul care crește — nu mai mult decât atât
   (restul pozelor din bandă rămân neatinse, la raportul fix). `frameClass`
   e opțional, adaugă o clasă suplimentară PE LÂNGĂ `cl-zigzag-photo`, cu
   override de `aspect-ratio` SCOPED la desktop (`@media min-width:769px`
   în CSS) — pe mobil (unde alinierea era deja perfectă, fără plafon)
   rămân neatinse, la raportul natural. */
const ZigzagPhotoParallax = ({ src, alt, pos, onOpen, frameClass }: { src: string; alt: string; pos: string; onOpen: () => void; frameClass?: string }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLButtonElement>(null);
  /* Raportat 2026-09-16 („scroll buguit pe desktop, primele 3 secțiuni"):
     măsurat cu rAF (824 cadre eșantionate în timpul scroll-ului prin banda
     asta, comparat cu un control static pe pagină) — fiecare din cele 6
     poze din bandă avea, PESTE `useScroll`/`useTransform` deja acceptate
     ca „cost real" (vezi comentariul de mai sus), și un `useSpring`
     propriu. Un spring NU e doar o formulă — rulează propria buclă rAF
     independentă CÂT TIMP ținta se mișcă, adică pe tot parcursul
     scroll-ului prin bandă; 6 simulări fizice paralele, în plus față de
     reveal-uri/plutiri idle, se adună exact în secțiunea asta. `useScroll`
     + `useTransform` rămân (sunt legate direct de evenimentul de scroll,
     nu au buclă proprie) — doar spring-ul a fost scos. Diferența vizuală:
     parallax-ul urmărește scroll-ul 1:1, fără „lag" elastic de prisos;
     mișcarea de bază (±10%) rămâne identică. */
  const { scrollYProgress } = useScroll({ target: parallaxRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
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
      <button
        type="button"
        className={`cl-zigzag-photo cl-zigzag-photo-btn${frameClass ? ` ${frameClass}` : ''}${inView && entered ? ' cl-card-float' : ''}`}
        ref={parallaxRef}
        onClick={onOpen}
        aria-label={`Vezi mai aproape: ${alt}`}
      >
        <motion.img
          src={src}
          alt={alt}
          className="cl-zigzag-photo-img"
          style={{ y, objectPosition: pos }}
          loading="lazy"
        />
      </button>
    </motion.div>
  );
};

const ZigzagPhotoStatic = ({ src, alt, pos, onOpen, frameClass }: { src: string; alt: string; pos: string; onOpen: () => void; frameClass?: string }) => {
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
      <button
        type="button"
        className={`cl-zigzag-photo cl-zigzag-photo-btn${frameClass ? ` ${frameClass}` : ''}${inView && entered ? ' cl-card-float' : ''}`}
        onClick={onOpen}
        aria-label={`Vezi mai aproape: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className="cl-zigzag-photo-img"
          style={{ objectPosition: pos }}
          loading="lazy"
        />
      </button>
    </motion.div>
  );
};

const ZigzagPhoto = ({ src, alt, pos = '50% 50%', onOpen, frameClass }: { src: string; alt: string; pos?: string; onOpen: () => void; frameClass?: string }) => {
  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768).current;
  return isMobile
    ? <ZigzagPhotoStatic src={src} alt={alt} pos={pos} onOpen={onOpen} frameClass={frameClass} />
    : <ZigzagPhotoParallax src={src} alt={alt} pos={pos} onOpen={onOpen} frameClass={frameClass} />;
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

/* trenulețul din hero — o singură frază repetată, cu separator IDENTIC cu
   spațiul dintre cuvinte (nbsp, ca `white-space:nowrap` să nu-l taie), ca
   distanța dintre „Realizezi." și „Înveți." (inclusiv peste cusătura buclei)
   să fie EXACT cât cea dintre „Înveți." și „Aplici.". 2 fraze/jumătate ⇒
   fiecare `.cl-hero-sub-item` e mai lat decât fereastra hero (≤720px), deci
   bucla `translateX(-50%)` nu lasă niciun gol pe ecrane late. */
const HERO_SUB_LOOP = 'Înveți. Aplici. Realizezi. '.repeat(2).replace(/ $/, ' ');

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

/* Cardul „Tur virtual 360°" — 2026-09-25, a doua corecție: NU mai
   secțiune proprie — cerut explicit „trebuie să fie la Rezultatul final,
   ultimul card, cu pilula «Tur vizual 360°»". Devine al 4-lea card din
   `.cl-result-pdfs`, rețetă IDENTICĂ cu `ResultPdfCard` (item/card/insignă
   — vezi acolo), doar conținutul diferă: iframe Kuula în loc de copertă
   PDF, fără link extern (embed-ul se explorează direct în card, nu se
   deschide separat — Kuula are propriul buton de fullscreen, `fs=1`).
   Kuula (link trimis de Vlad), 5 scene, „Living open-space — NOMA Italia
   90m²". Iframe-ul are JS propriu, destul de greu — NU se montează la
   randare, ci abia când cardul intră în ecran (`inView`), o singură dată
   (regula „pornit o singură dată" ca la clipurile video de pe pagină). */
const TOUR_360_URL = 'https://kuula.co/share/collection/7TSfz?fs=1&vr=0&sd=1&thumbs=1&logo=0&info=1';

/* 2026-09-25, a treia corecție — raportat: „stă negru câteva secunde" la
   prima intrare (JS-ul greu al Kuula are nevoie de timp să boot-eze, fix
   fereastra pe care `loading`/`fs=1` n-o acoperă). Fix: poză statică,
   descărcată de la Kuula (`og:image`-ul chiar al tur-ului — 01-cover.jpg,
   aceeași scenă), salvată local (nu hotlink extern — regula site-ului,
   fișierele proprii, nu dependențe de CDN-uri terțe la runtime), afișată
   INSTANT ca `.cl-result-pdf-img` normal (exact ca la celelalte 3 carduri).
   Iframe-ul se montează la fel (lazy, la `inView`), dar stă la opacity:0
   deasupra pozei până la `onLoad` — nicio fereastră neagră vizibilă, doar
   un cross-fade de la poză la tur interactiv. */
const TOUR_360_POSTER = '/curs-landing/tour360-poster.webp';

const ResultTourCard = ({ index }: { index: number }) => {
  const ref = useRef(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const hiddenBadge = useMemo(() => ({ opacity: 0, y: 26 * clScrollDir }), [clScrollDir]);
  const hiddenCard = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  const cardDelay = index * 0.13;
  const [loaded, setLoaded] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (inView) setLoaded(true);
  }, [inView]);

  return (
    <div ref={ref} className="cl-result-pdf-item">
      <motion.span
        className="cl-result-pdf-badge-wrap cl-result-pdf-badge-wrap--left"
        initial={hiddenBadge}
        animate={inView ? SHOW_YB_NOFILTER : hiddenBadge}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: cardDelay + 0.06 }}
      >
        <span
          className="cl-result-pdf-badge-corner cl-result-pdf-badge-corner--left cl-card-float"
          style={{ '--tilt': '-6deg', animationDelay: `${index * 0.3}s` } as React.CSSProperties}
        >
          <span className="cl-check-dot"><Check size={7} strokeWidth={3.5} /></span>
          Tur vizual 360°
        </span>
      </motion.span>

      <motion.div
        ref={cardRef}
        className="cl-result-pdf-card"
        initial={hiddenCard}
        animate={inView ? SHOW_YB : hiddenCard}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: cardDelay }}
        onAnimationComplete={() => { if (inView && cardRef.current) cardRef.current.style.filter = 'none'; }}
      >
        <div className="cl-result-pdf-visual cl-tour360-visual">
          <img
            src={TOUR_360_POSTER}
            alt="Tur virtual 360° — Living open-space, NOMA Italia 90m²"
            className="cl-result-pdf-img"
            loading="lazy"
            decoding="async"
          />
          {loaded && (
            <iframe
              src={TOUR_360_URL}
              className={`cl-tour360-iframe${iframeLoaded ? ' is-loaded' : ''}`}
              allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
              allowFullScreen
              loading="lazy"
              title="Tur virtual 360° — Living open-space, NOMA Italia 90m²"
              onLoad={() => setIframeLoaded(true)}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

/* Secțiunea „Carnetul & metrul" — cerută explicit 2026-09-17, apoi corectată
   tot 2026-09-17: poza mare (carnet+metru) NU mai stă separată într-un card
   premium propriu — Vlad a cerut explicit „poza ceea mai mare trebuie sa
   fie inclusa in trenulet si nu mai trebuie sa fie separata". Fostul
   `KitPhotoCard` (card ramă+glow, insignă „Cadou la înscriere", lightbox
   propriu) a fost ȘTERS — recicla rețeta „card foto premium" deja
   documentată transferabil (ResultPdfCard etc.), nimic pierdut prin
   ștergere. Poza intră PRIMA în trenuleț (`KIT_SHOOT_PHOTOS`), același
   raport 3/4 ca restul cadrelor din bandă, deci se încadrează identic. */

/* bandă de poze de la aceeași zi de măsurători (șantier), curatoriate din
   setul brut de 6 (au picat cele 2 aproape identice cu cardul hero), plus
   poza mare carnet+metru (PRIMA, fostul KitPhotoCard). Cerută inițial
   2026-09-17 ca bandă animată pasiv (CSS, translateX în buclă) — 2026-09-18
   a devenit o bandă DRAGABILĂ, cu poze deschidere-la-click (vezi
   DragMarquee mai jos) — nu mai e „doar decor", nu mai duplic array-ul
   (dubla era un truc pt. bucla infinită CSS, nu mai are sens la o bandă
   condusă din JS de lungime finită). */
/* DOUĂ rezoluții per poză (2026-09-18, raportat: „pozele nu sunt clare
   deloc, iar când o deschizi e cam micuță"). Cauza, măsurată: fișierele
   aveau 500×667px — sub cei ~520px ceruți de bandă pe un ecran retina
   (260px CSS × 2), iar în lightbox `width:auto` NU mărește o poză peste
   mărimea ei reală, deci apărea o poză de 500px în mijlocul ecranului.
   Acum: `src` = 600×800 (bandă, încărcat imediat, ~20-60KB),
   `full` = 1400×1867 (lightbox, se descarcă DOAR la deschidere, fiindcă
   elementul se montează abia atunci). Cadrajele sunt identice cu cele
   aprobate — s-a schimbat strict rezoluția. */
const KIT_SHOOT_PHOTOS = [
  { src: '/curs-landing/kit-carnet-metru.webp', full: '/curs-landing/kit-carnet-metru-full.webp' },
  { src: '/curs-landing/kit-shoot-1.webp', full: '/curs-landing/kit-shoot-1-full.webp' },
  { src: '/curs-landing/kit-shoot-2.webp', full: '/curs-landing/kit-shoot-2-full.webp' },
  { src: '/curs-landing/kit-shoot-3.webp', full: '/curs-landing/kit-shoot-3-full.webp' },
  { src: '/curs-landing/kit-shoot-4.webp', full: '/curs-landing/kit-shoot-4-full.webp' },
];
const KIT_SHOOT_SRCS = KIT_SHOOT_PHOTOS.map((p) => p.src);

/* viteza „de croazieră" a benzii (px/s) — echivalentul ritmului vechii
   animații CSS (o copie de ~1360px parcursă în ~34s). */
const KIT_CRUISE_SPEED = 40;
/* cât de lin revine viteza CURENTĂ spre croazieră (secunde). Aceeași
   constantă stinge și avântul de după o aruncare cu degetul: viteza
   tinde EXPONENȚIAL spre croazieră, deci nu există niciun prag/salt
   („robotizat") între „momentum" și „merge iar singur" — e o singură
   curbă continuă. */
const KIT_SPEED_TAU = 0.5;
const KIT_MAX_FLING = 2600; // px/s, plafon pt. o aruncare foarte violentă

/* 2026-09-20 — lightbox-ul nu mai e local benzii: orice poză din secțiune
   (cele 2 statice din KitFlow + cele 5 de-aici) se deschide în ACELAȘI
   lightbox, navigabil între toate 7, nu doar în trenuleț. Owner-ul stării
   (`openIndex`) a urcat în `KitFlow` — banda doar RAPORTEAZĂ indexul local
   apăsat prin `onOpen`, iar `open` îi spune când să stea pe loc (lightbox-ul
   deschis, indiferent care poză a fost apăsată). */
/* 2026-09-28 — motorul a devenit COMUN (`DragMarquee`): folosit de trenulețul
   din Trusa (`cls="cl-kit-marquee"`) ȘI de banda din Bonus
   (`cls="cl-practice-marquee"`), cerut explicit „aceleași principii ca la
   trenulețul de sus". Bonus-ul era o animație CSS `@keyframes` de 40s —
   pe lângă că nu se putea trage, resetarea buclei (-50% → 0) la capătul
   fiecărei iterații e suspectul principal al licăririi periodice raportate
   (banda din Trusa, pe rAF, nu a avut-o niciodată). */
const DragMarquee = ({
  srcs,
  cls,
  onOpen,
  open,
}: {
  srcs: string[];
  cls: 'cl-kit-marquee' | 'cl-practice-marquee';
  onOpen: (index: number) => void;
  open: boolean;
}) => {
  /* Bandă care merge SINGURĂ (ca trenulețul din „Cum lucrăm"), dar care se
     oprește instant sub deget și se poate trage/arunca — cerut explicit
     2026-09-18. Diferă de varianta anterioară (drag pur, `scrollLeft`):
     poziția e o valoare PROPRIE (`offsetRef`), aplicată ca `translateX` pe
     track la fiecare cadru, iar viteza e integrată în timp. De-aici vin
     cele 3 cerințe deodată:
       • merge singur  → viteza tinde spre KIT_CRUISE_SPEED;
       • se oprește sub deget → `pointerdown` pune viteza pe 0;
       • aruncare fluidă → viteza de la ultimele cadre de tragere devine
         viteza inițială, care se stinge lin spre croazieră (fără „frână"
         bruscă la ridicarea degetului, exact reclamația „robotizat").
     translateX 2D (NU translate3d) — regula documentată a benzilor din
     proiect: varianta 3D dădea wobble vertical prin re-eșantionare
     sub-pixel. Transformarea se scrie direct în DOM din rAF, fără state
     React, deci zero re-randări la 60fps. */
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const offsetRef = useRef(0);
  const speedRef = useRef(0);
  const oneWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const pausedRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const sampleRef = useRef({ x: 0, t: 0 });

  /* cât timp lightbox-ul e deschis, banda din spate stă pe loc (altfel, la
     închidere, pozele „au fugit" față de cea pe care tocmai ai privit-o). */
  useEffect(() => {
    pausedRef.current = open;
  }, [open]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    /* lățimea UNEI copii = distanța dintre prima poză și prima poză a
       copiei a doua. Măsurată din DOM (nu calculată din constante CSS),
       deci rămâne corectă și după schimbarea de breakpoint (260→168px). */
    const measure = () => {
      const kids = track.children;
      const n = srcs.length;
      if (kids.length > n) {
        oneWidthRef.current = (kids[n] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft;
      }
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(track);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cruise = reduce ? 0 : KIT_CRUISE_SPEED;

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      /* dt plafonat: la revenirea în tab după un minut, un dt uriaș ar
         teleporta banda (și ar sări peste wrap). */
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const one = oneWidthRef.current;
      if (one > 0) {
        if (!draggingRef.current && !pausedRef.current) {
          speedRef.current += (cruise - speedRef.current) * (1 - Math.exp(-dt / KIT_SPEED_TAU));
          offsetRef.current += speedRef.current * dt;
        }
        /* buclă infinită: conținutul e dublat, iar offsetul trăiește
           mereu în [0, one) — saltul e invizibil, cadrul de la `one` e
           identic cu cel de la 0. Modulo cu corecție de semn ⇒ merge la
           fel și când banda e trasă înapoi (offset negativ). */
        offsetRef.current = ((offsetRef.current % one) + one) % one;
        track.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [srcs.length]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    speedRef.current = 0; // se oprește INSTANT sub deget
    sampleRef.current = { x: e.clientX, t: performance.now() };
    /* NU capturăm pointerul aici — vezi onPointerMove. Capturat DIN start
       (la orice apăsare, inclusiv un simplu tap fără nicio mișcare),
       `setPointerCapture` redirecționează evenimentul `click` de la final
       spre elementul care a capturat (`.cl-kit-marquee`), NU spre butonul
       apăsat efectiv — confirmat prin debug: `click.target` ajungea
       `cl-kit-marquee`, niciodată `cl-kit-marquee-item`, deci onClick-ul
       de pe buton nu se declanșa NICIODATĂ, indiferent de `movedRef`. */
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4 && !movedRef.current) {
      /* abia ACUM, la primul semn real de tragere (nu la apăsare), captăm
         pointerul — un tap curat nu ajunge niciodată aici, deci `click`-ul
         lui rămâne pe butonul apăsat, netulburat. */
      movedRef.current = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    if (!movedRef.current) return;

    offsetRef.current = startOffsetRef.current - dx; // banda urmează degetul 1:1
    /* viteza pt. aruncare — din ultimele ~2 cadre, nu din tot gestul:
       contează cât de repede mergea degetul CÂND l-ai ridicat, nu media
       de la început (altfel o tragere lentă urmată de un bobârnac scurt
       ar porni aproape din loc). */
    const now = performance.now();
    const dt = (now - sampleRef.current.t) / 1000;
    if (dt > 0.008) {
      speedRef.current = -(e.clientX - sampleRef.current.x) / dt;
      sampleRef.current = { x: e.clientX, t: now };
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (viewportRef.current?.hasPointerCapture(e.pointerId)) {
      viewportRef.current.releasePointerCapture(e.pointerId);
    }
    /* degetul a stat nemișcat înainte de ridicare ⇒ ultima „viteză"
       măsurată e veche și banda ar zvâcni; o anulăm, croaziera o repornește
       oricum lin. */
    if (performance.now() - sampleRef.current.t > 90) speedRef.current = 0;
    speedRef.current = Math.max(-KIT_MAX_FLING, Math.min(KIT_MAX_FLING, speedRef.current));
  };

  const openImage = (index: number) => {
    if (movedRef.current) return; // a fost tras, nu apăsat — nu deschide
    onOpen(index);
  };

  return (
    <div
      className={cls}
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className={`${cls}-track`} ref={trackRef}>
        {/* conținut DUBLAT — a doua copie e doar continuarea vizuală a
            buclei (ascunsă pt. cititoarele de ecran, scoasă din ordinea
            de tabulare), pozele ei rămân totuși clicabile cu degetul. */}
        {[0, 1].map((copy) =>
          srcs.map((src, i) => (
            <button
              key={`${copy}-${src}`}
              type="button"
              className={`${cls}-item`}
              onClick={() => openImage(i)}
              aria-hidden={copy === 1 || undefined}
              tabIndex={copy === 1 ? -1 : undefined}
              aria-label="Vezi poza mai aproape"
            >
              <img
                src={src}
                alt=""
                className={`${cls}-img`}
                loading="eager"
                decoding="async"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/* ── Secțiunea „Trusa" — text + 2 poze + trenuleț, legate prin săgeți ──
   2026-09-19, cerut: textul „mai oficial", să menționeze vizitele la
   showroomuri și analiza șantierului pe etaje, cele 2 poze LUATE din „Cum
   lucrăm" (aceleași fișiere, nu altele noi), poziționate una stânga / una
   dreapta DEASUPRA trenulețului (ierarhia deja formată rămâne), iar de la
   cuvintele-cheie să plece săgeți ondulate spre poza corespunzătoare și
   spre trenuleț („trenulețul ar trebui să fie de la «primele tale
   măsurători»").
   Cele 3 ancore se leagă natural cu conținutul care exista deja:
   măsurători → trenulețul de poze de la ziua de măsurători; șantier și
   showroom → aceleași 2 fișiere foto folosite și în „Cum lucrăm". */
const KIT_FLOW_PHOTOS = {
  /* 2026-09-20, raportat: „când le deschid, aceste 2 imagini au alte
     dimensiuni — totul trebuie tăiat la aceleași dimensiuni". Cele 5 poze
     din trenuleț (`KIT_SHOOT_PHOTOS[*].full`) sunt TOATE 1400×1867 (raport
     3/4 = 0.75, măsurat) — o familie de crop deja consecventă. Cele 2 poze
     statice erau fișiere brute, cu alt raport (0.56-0.565): în lightbox
     (`object-fit:contain`) apăreau vizibil mai înguste/mai înalte decât
     restul galeriei, ruptură de formă la swipe. `full` = variantă tăiată
     la ACELAȘI raport 3/4 (centrat pe conținutul relevant — nu doar
     eliminat barele negre de video de la showroom, ci recadrat identic cu
     familia), STRICT pt. lightbox; `src` (cardul mic, alt aspect-ratio,
     cover) rămâne fișierul original, neatins. */
  santier: {
    src: '/curs-landing/practice-santier.webp',
    full: '/curs-landing/practice-santier-full.webp',
    alt: 'Analiză de șantier cu cursantele, pe mai multe etaje',
  },
  showroom: {
    src: '/curs-landing/practice-showroom.webp',
    full: '/curs-landing/practice-showroom-full.webp',
    alt: 'Vizită de studiu într-un showroom de finisaje',
  },
};

/* 2026-09-20, cerut explicit: „orice poză din secțiune" trebuie să se
   deschidă în lightbox și de-acolo să pot naviga la TOATE pozele secțiunii
   (nu doar cele din trenuleț). Galeria unificată — cele 2 poze statice +
   cele 5 din trenuleț — în ORDINEA de citire deja formată pe pagină
   (showroom → șantier → măsurători), ca swipe-ul/tap-ul din lightbox să
   urmeze aceeași ierarhie, nu ordinea arbitrară de montare în DOM. */
/* 2026-09-24 — poza „showroom" MUTATĂ în secțiunea nouă „Practica la
   showroomuri" (SHOWROOM_PRACTICE_GALLERY, mai jos în fișier) — scoasă de
   AICI, ca să nu apară de 2 ori pe pagină. Galeria unificată începe acum
   cu șantierul. */
const KIT_GALLERY_PHOTOS: { full: string; alt: string }[] = [
  { full: KIT_FLOW_PHOTOS.santier.full, alt: KIT_FLOW_PHOTOS.santier.alt },
  ...KIT_SHOOT_PHOTOS.map((p) => ({ full: p.full, alt: '' })),
];
const KIT_GALLERY_MARQUEE_OFFSET = 1;

/* Săgețile sunt DESENATE DIN MĂSURĂTORI REALE, nu din coordonate fixe:
   unde cade fiecare cuvânt-cheie în paragraf depinde de lățimea ecranului
   și de ruperea rândurilor, deci orice valoare hardcodată ar fi greșită la
   primul breakpoint. La montare (și la orice resize / schimbare de font),
   se măsoară cutia fiecărui `<em data-kit-from>` și a fiecărei ținte
   `data-kit-to`, iar path-urile se recalculează.
   Forma: o cubică cu punctele de control împinse LATERAL (spre marginea
   spre care merge săgeata) — asta dă unda cerută („ondulate frumos") ȘI,
   important, scoate curba în afara blocului de text, ca să nu treacă peste
   rândurile de dedesubt. */
const KitFlow = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  /* ⚠️ 2026-09-20 — raportat: „când ajung la secțiune, săgețile își
     schimbă poziția" — chiar recompute-ul din fix-ul de mai jos (legat de
     IntersectionObserver, ~1s după vizibilitate) producea o SĂRITURĂ
     vizibilă: userul apuca să vadă săgeata în poziția greșită (calculată
     în timp ce textul era încă translatat de `Reveal`), apoi, o secundă
     mai târziu, sărea în poziția corectă. Fix: stratul de săgeți rămâne
     INVIZIBIL (opacity 0) până la PRIMUL compute de încredere — userul nu
     mai vede niciodată poziția greșită, doar apariția (fade) celei bune. */
  const [ready, setReady] = useState(false);

  /* lightbox UNIFICAT al secțiunii (2026-09-20, cerut explicit): orice poză
     — cele 2 statice de mai jos + cele 5 din trenuleț — se deschide aici și
     navighează prin TOATE. Owner-ul stării stă în părinte, nu în bandă, ca
     ambele surse să scrie în același index. Restul (scroll-lock, Escape,
     theme-color, gesturile) trăiește în `PhotoLightbox`, reutilizat și de
     Bonus/Fondatorii — nu mai e local aici. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const showNext = () => setOpenIndex((i) => (i === null ? i : (i + 1) % KIT_GALLERY_PHOTOS.length));
  const showPrev = () => setOpenIndex((i) => (i === null ? i : (i - 1 + KIT_GALLERY_PHOTOS.length) % KIT_GALLERY_PHOTOS.length));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const compute = () => {
      const rootRect = root.getBoundingClientRect();
      if (!rootRect.width) return;
      const next: string[] = [];

      const para = root.querySelector<HTMLElement>('.cl-kit-lead');
      const paraRect = para?.getBoundingClientRect();

      root.querySelectorAll<HTMLElement>('[data-kit-from]').forEach((from) => {
        const to = root.querySelector<HTMLElement>(`[data-kit-to="${from.dataset.kitFrom}"]`);
        if (!to) return;
        /* ULTIMUL fragment, nu cutia totală: un accent rupt pe 2 rânduri are
           un `getBoundingClientRect` lat cât tot paragraful, deci săgeata ar
           pleca din mijlocul blocului, nu de sub cuvânt. `getClientRects()`
           dă câte un dreptunghi per rând — ultimul e cel de jos, exact de
           unde trebuie să plece. */
        const rects = from.getClientRects();
        const f = rects.length ? rects[rects.length - 1] : from.getBoundingClientRect();
        const t = to.getBoundingClientRect();

        const x2 = t.left + t.width / 2 - rootRect.left;
        const y2 = t.top - rootRect.top - 12;

        /* ⚠️ 2026-09-19, corectat — raportat: „săgețile nu încep chiar de la
           cuvântul-cheie, la câțiva pixeli de «măsurători»". Cauza: varianta
           anterioară, pt. un cuvânt care NU e pe ultimul rând, muta punctul
           de START la baza ÎNTREGULUI paragraf (ca să evite tăierea peste
           rândurile de dedesubt) — asta lăsa un gol vizibil, vizual pare că
           săgeata „plutește" sub cuvânt, nu pleacă din el.
           Fix: pornirea rămâne MEREU chiar sub cuvânt (x1/y1 = centrul/baza
           fragmentului lui). Dacă mai sunt rânduri dedesubt, curba iese
           lateral RAPID (primul punct de control împins până la marginea
           paragrafului, pe aproape aceeași înălțime ca startul) — ocolește
           textul prin lateral, nu prin coborâre — abia apoi se apleacă spre
           țintă. Pe ultimul rând, forma rămâne S-ul simplu de dinainte. */
        const onLastLine = !paraRect || f.bottom >= paraRect.bottom - 4;
        const x1 = f.left + f.width / 2 - rootRect.left;
        /* 2026-09-19, RESPINS „26px stub" — „nu chiar așa, doar câțiva pixeli
           acolo drepți, și tot așa fluid să înceapă ondularea, și linia mai
           aproape de cuvântul-cheie". Gap-ul dintre cuvânt și linie a fost
           el însuși prea mare (era +5). Coborât la +2. */
        const y1 = f.bottom - rootRect.top + 2;
        if (y2 <= y1 + 12) return;   // prea puțin loc pe verticală — nu desena decât aiurea

        /* 2026-09-20, RESPINS din nou — „tot arată ciudat, trebuie acolo 2
           pixeli mai drepți și după așa lin să înceapă ondularea". Coborât
           de la 8px la un stub minim, aproape simbolic — „drept" înseamnă
           acum 2-3px reali, nu o distanță proprie de parcurs. */
        const straightStub = Math.min(3, (y2 - y1) * 0.3);
        const sx = x1, sy = y1 + straightStub;

        /* ⚠️ 2026-09-20 — raportat „vin zigzag, nu ondulate": corecția
           precedentă (2 curbe) elimina cotul de tangentă, dar înghesuia
           TOATĂ deviația laterală (uneori 300-400px) într-un tronson
           vertical minuscul (doar până sub ultimul rând de text, ~11% din
           traseu) — matematic fără cot, dar vizual un cot oricum: o
           diagonală prea abruptă comprimată pe puțină înălțime arată exact
           ca un zigzag, nu ca o undă.
           Fix: aceleași 2 curbe, aceeași tangentă verticală la joncțiune
           (0 discontinuitate), dar tronsonul A primește ACUM spațiu generos
           pe verticală (minim 45% din traseu, nu doar cât sub text) — DOAR
           pragul de siguranță (să treacă strict sub ultimul rând) rămâne
           obligatoriu, restul e spațiu de respirat pt. o curbă lină. Ambele
           tronsoane folosesc ACUM aceeași proporție 0.45/0.45 ca varianta
           „lină" de pe ultimul rând — o singură „familie" de curbă, nu 2
           formule diferite cusute — deci arată la fel de ondulat peste tot,
           doar mai lung. Asta rezolvă și triunghiul „nelipit de mijlocul
           liniei": un tronson final (B) scurt și abrupt rotea vârful
           săgeții (orient=auto urmărește tangenta REALĂ la capăt) vizibil
           diferit de direcția generală a liniei — cu mai mult spațiu, B
           soseste tot cu tangentă verticală, curată, vârful rămâne aliniat. */
        const dy = y2 - sy;
        /* 2026-09-20 — raportat „triunghiul trebuie să fie ușor înclinat
           după flow-ul săgeții, nu chiar atât de drept": tangenta de sosire
           era mereu STRICT verticală (`c2x = x2`, corecțiile 7-8, gândită
           să elimine un cot lângă text) — corect acolo, dar înseamnă că
           vârful săgeții (`orient=auto`, urmărește tangenta reală) arată
           mereu în jos perfect drept, indiferent cât de mult s-a „aplecat"
           curba ca să ajungă acolo — rupt vizual de restul liniei, „lipit
           strâmb". Fix: ultimul punct de control rămâne aproape de verticala
           țintei, dar păstrează un firicel din direcția de sosire (15%) —
           destul cât vârful să urmeze vizual unda, prea puțin ca să
           reintroducă cotul de lângă text (acolo unde tangenta la START
           tot trebuie să rămână exact verticală). */
        const lean = (fromX: number, toX: number) => toX + (fromX - toX) * 0.15;
        /* ⚠️ 2026-09-20 — raportat „la showroomuri săgeata tot are un pic de
           zigzag, nu e fină ondularea". Cauza: C1 și C2 (punctele de control)
           stăteau la 45%/55% din înălțime — DOAR 10% distanță una de alta.
           Pe o curbă LUNGĂ (măsurători, 500+px), 10% din dy tot înseamnă
           zeci de px, deci tranziția rămânea lină. Pe o curbă SCURTĂ (~85px,
           showroom/șantier), 10% din dy sunt doar ~8px — control-point-urile
           aproape SUPRAPUSE pe verticală, dar depărtate mult pe orizontală
           (de la capătul de start la capătul de sosire) — asta produce un
           „brâu" strâns exact la mijloc, care pe o curbă scurtă se vede ca
           un cot, nu ca o undă lentă. Fix: 35%/65% (30% distanță, nu 10%) —
           tranziția se întinde pe o porțiune mai mare din curbă, indiferent
           de lungimea ei absolută. */
        const simpleCurve = (fx: number, fy: number, sx2: number, sy2: number, tx: number, ty: number, dyLocal: number) =>
          `M ${fx.toFixed(1)} ${fy.toFixed(1)} L ${sx2.toFixed(1)} ${sy2.toFixed(1)} ` +
          `C ${sx2.toFixed(1)} ${(sy2 + dyLocal * 0.35).toFixed(1)}, ${lean(sx2, tx).toFixed(1)} ${(ty - dyLocal * 0.35).toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`;
        let path: string;
        if (!onLastLine && paraRect) {
          /* rândurile REALE de sub cuvânt — `Range`, nu `Element`, pe un
             `<p>` de bloc (vezi nota veche, păstrată mai jos în fișier la
             prima apariție a acestei tehnici). */
          const range = document.createRange();
          range.selectNodeContents(para!);
          const lineRects = [...range.getClientRects()];
          const linesBelow = lineRects.filter((r) => r.top > f.bottom - 2);

          if (linesBelow.length) {
            const clearLeft = Math.min(...linesBelow.map((r) => r.left));
            const clearRight = Math.max(...linesBelow.map((r) => r.right));
            const lastLineBottom = Math.max(...linesBelow.map((r) => r.bottom));
            const margin = 16;
            /* ⚠️ 2026-09-20 — raportat „liniile par încurcate, nu se
               înțelege care-i-care": pentru un cuvânt de pe rândul 1-2 (nu
               ultimul), ocolirea alegea partea după DIRECȚIA țintei
               (`x2 < sx`), nu după care parte era mai APROAPE de ocolit —
               dacă rândul de dedesubt era foarte lat (paragraf centrat,
               ultimul rând aproape cât toată lățimea), clearance-ul spre
               direcția „corectă" (spre țintă) putea fi de 2-3x mai lung
               decât celălalt, producând o buclă mare care trecea PE LÂNGĂ/
               PE DUPĂ o poză — vizual, exact „încurcat". Fix: alege partea
               cu clearance-ul mai SCURT (mai ieftină de parcurs), nu partea
               „spre țintă" — segmentul B tot ajunge la țintă din oricare
               parte am pleca. */
            const distLeft = sx - (clearLeft - rootRect.left - margin);
            const distRight = (clearRight - rootRect.left + margin) - sx;
            const towardsLeft = distLeft < distRight;
            const edgeX = towardsLeft ? clearLeft - rootRect.left - margin : clearRight - rootRect.left + margin;
            const textClearY = lastLineBottom - rootRect.top + 10;       // prag STRICT — sub el încă mai e text
            const clearY = Math.min(y2 - 40, Math.max(textClearY, sy + dy * 0.45));

            /* ⚠️ 2026-09-20 — ocolirea explicită a pozelor (adăugată, apoi
               RETRASĂ aceeași zi): împingea `edgeX` atât de departe pe
               ecranele late încât linia ieșea complet din viewport, vizibil
               „ruptă"/zigzag — mai rău decât simpla suprapunere cu poza.
               Cerut explicit: las-o să treacă PESTE poza din stânga, ajunge
               mai simplu și mai curat la trenuleț așa. Revenit la ocolirea
               STRICT de text (ca la celelalte 2 săgeți) — nicio verificare
               de poză aici. */
            if (clearY > sy + 20) {
              const dyA = clearY - sy;
              const a1x = sx, a1y = sy + dyA * 0.35;          // ACEEAȘI proporție lărgită ca varianta lină (35/65, nu 45/55)
              const a2x = edgeX, a2y = clearY - dyA * 0.35;

              const dyB = y2 - clearY;
              const b1x = edgeX, b1y = clearY + dyB * 0.35;
              const b2x = lean(edgeX, x2), b2y = y2 - dyB * 0.35;

              path =
                `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${sx.toFixed(1)} ${sy.toFixed(1)} ` +
                `C ${a1x.toFixed(1)} ${a1y.toFixed(1)}, ${a2x.toFixed(1)} ${a2y.toFixed(1)}, ${edgeX.toFixed(1)} ${clearY.toFixed(1)} ` +
                `C ${b1x.toFixed(1)} ${b1y.toFixed(1)}, ${b2x.toFixed(1)} ${b2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
            } else {
              path = simpleCurve(x1, y1, sx, sy, x2, y2, dy);
            }
          } else {
            path = simpleCurve(x1, y1, sx, sy, x2, y2, dy);
          }
        } else {
          path = simpleCurve(x1, y1, sx, sy, x2, y2, dy);
        }
        next.push(path);
      });

      setPaths((prev) => (prev.join('|') === next.join('|') ? prev : next));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(root);
    /* observăm ȘI capetele: dacă o poză își schimbă mărimea/decalajul sau
       paragraful se rupe altfel, root-ul poate rămâne la aceeași cutie —
       atunci observatorul de pe el singur nu s-ar declanșa. Cuvintele-cheie
       (`data-kit-from`) intră și ele — o ruptură de rând le schimbă propria
       cutie (mai îngustă/mai înaltă) fără să schimbe neapărat pe cea a
       paragrafului. */
    root.querySelectorAll('[data-kit-to], [data-kit-from], .cl-kit-lead').forEach((el) => ro.observe(el));
    window.addEventListener('resize', compute);
    /* fonturile schimbă ruperea rândurilor ⇒ și poziția cuvintelor-cheie */
    document.fonts?.ready?.then(compute).catch(() => {});
    const t = setTimeout(compute, 1200);   // plasă de siguranță (poze încărcate târziu)

    /* ⚠️ 2026-09-20 — raportat: „la refresh săgețile stau într-o poziție
       proastă, după ce revin la secțiune stau bine". Cauza: paragraful și
       pozele intră fiecare prin propriul `Reveal` (translateY → 0, o
       SINGURĂ dată, `useInView({once:true})`) chiar în clipa în care
       secțiunea ajunge în viewport — dar un `transform` NU declanșează
       `ResizeObserver` (doar schimbări de DIMENSIUNE, nu de poziție).
       `compute()` de la montare/`fonts.ready`/timeout-ul de 1200ms rulează
       de la ÎNCĂRCAREA paginii, nu de la momentul când userul chiar
       ajunge cu scroll-ul la secțiune — dacă acel moment vine mai târziu
       (foarte probabil, secțiunea e jos pe pagină), `compute()` prinde
       elementele ÎNCĂ translatate (poziția „hidden"), calculează săgețile
       pe coordonate greșite, iar apoi animația se termină FĂRĂ niciun
       recompute care s-o corecteze — rămân „înghețate" greșit până la
       următorul resize real. La reintrare în secțiune (SPA remount),
       timing-ul iese din nou corect din întâmplare, de-aia „stă bine".
       Fix: un recompute legat de vizibilitatea REALĂ a secțiunii, nu de un
       timer fix de la montare — la prima intrare în viewport, mai
       programăm un `compute()` peste ~1s (durata Reveal: 0.8s tranziție +
       până la 0.16s delay + rezervă), exact cât să prindă poziția FINALĂ,
       după ce animația s-a așezat. */
    let revealTimeout: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        io.disconnect();
        revealTimeout = setTimeout(() => {
          compute();
          setReady(true);
        }, 1000);
      },
      { threshold: 0.1 }
    );
    io.observe(root);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      clearTimeout(t);
      io.disconnect();
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, []);

  return (
    <div className="cl-kit-flow" ref={rootRef}>
      <Reveal className="cl-kit-lead-wrap" delay={0.1}>
        <p className="cl-kit-lead">
          {/* 2026-09-24 — text scurtat (cerut explicit: „ne oprim la șantier
             de 6 etaje, de restul nu avem nevoie"). Ancorele săgeților
             ("santier"/"showroom", vezi `data-kit-from`/`data-kit-to` mai
             sus în fișier) au dispărut odată cu propozițiile — cele 2 poze
             corespunzătoare (`data-kit-to="santier"`/`"showroom"`, mai jos)
             rămân pe pagină, doar fără săgeată spre ele; „masuratori" e
             singura ancoră rămasă, spre trenulețul de poze. */}
          Din prima zi primești propriul carnet NOMA și un metru rulant, cu care faci{' '}
          <em data-kit-from="masuratori">primele tale măsurători</em> pe un șantier real de 6
          etaje.
        </p>
      </Reveal>

      {/* săgețile stau ÎNTRE text și poze ca strat propriu: `pointer-events:none`
          (nu prind click-uri) și `aria-hidden` (decor, informația e în text).
          `is-ready` = apar abia după primul compute de încredere (vezi nota
          de la `ready`, mai sus) — un fade propriu, nu săritura vizibilă de
          dinainte. */}
      <svg className={`cl-kit-arrows${ready ? ' is-ready' : ''}`} aria-hidden="true" focusable="false">
        <defs>
          <marker id="cl-kit-arrowhead" markerWidth="7" markerHeight="7" refX="5.2" refY="3.5" orient="auto">
            {/* 2026-09-20, raportat: „triunghiul trebuie să fie opac, să nu
                se vadă linia prin el" — `currentColor` moștenea `color`
                de pe `.cl-kit-arrows` (rgba cu alpha 0.62, gândit pt.
                linie), deci vârful era el însuși semi-transparent și lăsa
                să se vadă coada liniei de dedesubt, chiar sub triunghi
                (refX nu cade exact pe vârf, o parte din bază se suprapune
                peste capătul liniei). Fix: culoare FIXĂ, opacă, aceeași
                nuanță ca linia — nu `currentColor`. */}
            <path d="M0.6,0.9 L5.8,3.5 L0.6,6.1 Z" fill="#f0bcc4" />
          </marker>
        </defs>
        {paths.map((d, i) => (
          <path key={i} d={d} markerEnd="url(#cl-kit-arrowhead)" />
        ))}
      </svg>

      {/* ORDINEA pozelor urmează ordinea cuvintelor din text: „showroomuri"
          apare primul în frază ⇒ poza lui e STÂNGA, „șantier" al doilea ⇒
          DREAPTA. Invers, cele 2 săgeți se încrucișează în X peste mijlocul
          secțiunii (verificat vizual, prima variantă) — dezordonat și greu
          de urmărit. Regula: ordinea vizuală a țintelor = ordinea în care
          sunt pomenite în text. */}
      {/* `noFilter`: pilulele de mai jos plutesc (animație CSS infinită) —
          regula documentată a proiectului: NICIUN nod cu animație infinită
          sub un `filter` rezidual (chiar `blur(0px)` tot creează context de
          filtru, re-rasterizat pe iOS). `Reveal` normal lasă `filter` activ
          pe termen lung (SHOW_YB, nu SHOW_YB_CLEAR) — `noFilter` scoate
          proprietatea complet, sigur pt. copiii cu plutire de mai jos. */}
      <Reveal className="cl-kit-photos" delay={0.16} noFilter>
        {/* 2026-09-20 (corectat — raportat: „de ce nu sunt în colțuri, ușor
            înclinate, ca pilulele NOMA"): principiul deja documentat pt.
            insignă/pilulă înclinată peste o poză — dacă pilula e COPIL al
            cardului cu `overflow:hidden` (obligatoriu pt. colțurile
            rotunjite), colțul ridicat de `rotate()` e RETEZAT. Scoasă ca
            FRATE, într-un wrapper propriu (`.cl-kit-photo-wrap`,
            `position:relative`, FĂRĂ overflow) — `.cl-kit-photo` (cu
            overflow:hidden) rămâne doar pt. poză. */}
        {/* 2026-09-24 — poza „showroom" (fostul prim `.cl-kit-photo-wrap`)
            MUTATĂ în secțiunea nouă „Practica la showroomuri" (cerut
            explicit). Rămâne DOAR poza de șantier. */}
        <div className="cl-kit-photo-wrap">
          <button
            type="button"
            className="cl-kit-photo-btn"
            onClick={() => setOpenIndex(0)}
            aria-label="Vezi poza mai aproape"
          >
            <figure className="cl-kit-photo" data-kit-to="santier">
              <img src={KIT_FLOW_PHOTOS.santier.src} alt={KIT_FLOW_PHOTOS.santier.alt} loading="lazy" decoding="async" />
            </figure>
          </button>
          <span className="cl-kit-photo-badge" style={{ '--tilt': '-6deg' } as React.CSSProperties}>
            <span className="cl-check-dot"><Check size={7} strokeWidth={3.5} /></span>
            Șantierul
          </span>
        </div>
      </Reveal>

      {/* pilula trenulețului — corectată din nou (cerut explicit: centrată,
          NEÎNCLINATĂ, plutitoare). Rămâne călare pe muchia de sus a benzii
          (`top`, vezi CSS) — doar orizontal s-a schimbat, dreapta → centru. */}
      <div data-kit-to="masuratori" className="cl-kit-marquee-wrap">
        <span className="cl-kit-marquee-badge" style={{ animationDelay: '0.6s' } as React.CSSProperties}>
          <span className="cl-check-dot"><Check size={7} strokeWidth={3.5} /></span>
          Măsurătorile
        </span>
        <DragMarquee
          srcs={KIT_SHOOT_SRCS}
          cls="cl-kit-marquee"
          open={openIndex !== null}
          onOpen={(i) => setOpenIndex(KIT_GALLERY_MARQUEE_OFFSET + i)}
        />
      </div>

      <PhotoLightbox
        photos={KIT_GALLERY_PHOTOS}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onNext={showNext}
        onPrev={showPrev}
        ariaLabel="Poză din secțiunea Practica"
      />
    </div>
  );
};

/* Cardul-dovadă din secțiunea „Fondatorii" — ÎNLOCUIEȘTE grila de 6 proiecte
   placeholder (2026-09-17, cerut explicit: „scoatem acele proiecte").
   Titlul-arc (ArcWord, chiar mai jos) rămâne EXACT aceeași rețetă „card foto
   premium" (ramă+glow) + titlu plutitor 3D peste muchia de sus, doar cardul
   de dedesubt nu mai e o grilă de poze placeholder, ci UN singur proiect
   REAL: „Pegas" (magazin de delicatese, design + iluminat NOMA), dovedit cu
   poză + clip, nu doar o poză statică. 2026-09-17, a doua corecție (reper
   trimis de Vlad: navarro.ro, un card mare cu elemente mici DISTINCTE în
   interior): poza și clipul NU mai sunt alăturate edge-to-edge (prima
   variantă, cu seam de 2px) — sunt 2 cărticele SEPARATE (ramă+umbră proprii,
   colțuri rotunjite), cu gap real între ele, în interiorul aceluiași cadru
   mare .cl-founder-card, care acum are padding propriu — rozul lui de fundal
   (#e3a5ae) rămâne vizibil ca un „paspartu" în jur ȘI între cele 2 cărticele,
   nu doar un fir subțire. Titlul-arc „PEGAS" rămâne deasupra, neschimbat.
   Stânga = ultima poză reală din secțiunea „Programa" (zigzag-5.webp,
   reciclată — cerut explicit „ultima poza din secțiunea programa").
   Dreapta = clipul „ultima secțiune.MP4" trimis de Vlad (footage propriu
   Pegas, cu textele „Iluminatul", „Mărește percepția" — confirmat cu userul
   că e proiect NOMA real, NU placeholder). Interacțiunea (autoplay mut la
   intrarea în viewport + lightbox cu sunet la click, Escape, scroll-lock)
   e identică cu CursVideoCard (rețetă deja stabilită, nu reinventată) —
   fișiere separate în `public/cursuri/` (`ultima-sectiune*`), ca să nu se
   cupleze cu clipul „Nicu". */
/* Cuvântul-pilulă — NOU (2026-09-15, a doua corecție: prima variantă era o
   singură pastilă cu text drept, respinsă explicit: „vreau ca fiecare
   literă să fie ca o pilulă... și cand formează cuvântul, ele să nu fie
   amplasate fix drepte, dar așa sferic"). Fiecare literă = propriul cerc
   (cafeniu translucid + ramă roz, ACEEAȘI paletă „cristal" ca butonul
   „Solicită ofertă" de pe /servicii — vezi reference_curs_color_palette),
   așezate pe un ARC real (nu decor aleatoriu): unghiul de la margine e FIX
   (±26°) indiferent de lungimea cuvântului, iar pasul per literă se
   recalculează din numărul de litere — un cuvânt scurt curbează mai
   abrupt PE literă, unul lung mai lin, dar arcul final (înălțimea la
   margine) arată la fel de „sferic" la orice lungime. `rotate` + `rise`
   vin din trigonometria reală a unui cerc de rază R=90px, nu dintr-o
   formulă aproximativă (offset²) — un pătrat ar da un arc parabolic, nu
   circular. Spațiile rămân goale (fără cerc propriu). */
const ArcWord = ({
  text,
  index,
  sweepDeg = 34,
  minRadius = 340,
}: {
  text: string;
  index: number;
  /* curbura titlului — 34°/340 e rețeta ORIGINALĂ (Fondatorii). O instanță
     nouă poate cere „mai drept": unghi mai mic + rază minimă mai mare (ex.
     Format: „Locuri limitate", 2026-09-27, cerut explicit „nu chiar atât de
     sferic"), fără să schimbe forma implicită pt. restul titlurilor-arc. */
  sweepDeg?: number;
  minRadius?: number;
}) => {
  /* Geometrie în unități de viewBox (SVG-ul scalează la lățimea cardului,
     ~1:1 real px). Literele stau pe un ARC SVG real (`textPath`), NU pe
     span-uri rotite manual: browserul face singur kerningul și distribuția
     pe curbă, deci nu mai iese „haotic" (spațiere inegală) cum ieșea cu un
     pas unghiular fix peste litere de lățimi diferite. */
  const VB_W = 320;
  const VB_H = 50;
  const TEXT_SWEEP = (sweepDeg * Math.PI) / 180; // unghiul pe care-l ocupă TEXTUL
  const TRACKING = 1.2;
  const label = text.toUpperCase();
  const n = label.length;

  /* FORMA SE ADAPTEAZĂ LA LUNGIMEA TEXTULUI (cerut explicit): raza se
     calculează din lățimea textului, ca fiecare titlu să curbeze la ACELAȘI
     unghi (34°) indiferent câte litere are — un cuvânt scurt primește un
     cerc mic, unul lung un cerc mare, deci toate cele 6 titluri arată ca
     aceeași familie, nu ca 6 curburi diferite.
     Mărimea scade DOAR cât e nevoie ca textul să încapă pe lățimea
     disponibilă (înainte: 300/n, care făcea „Pegas · 3 proiecte" de 2x mai
     mic decât „Case"; acum diferența e de ~10%). */
  const estWidth = (fs: number) => n * (fs * 0.6 + TRACKING);
  const MAX_TEXT_W = 296;
  let fontSize = 28;
  if (estWidth(fontSize) > MAX_TEXT_W) {
    fontSize = Math.max(17, (MAX_TEXT_W / n - TRACKING) / 0.6);
  }
  const wText = estWidth(fontSize);
  /* PLAFON MINIM pe rază — cerut explicit 2026-09-16 („Case", „Birou NOMA",
     „IKrystal", „Oficii" ieșeau prea rotunjite/parcă plutind deasupra
     cardului). Cauza reală: raza calculată STRICT din lățimea textului
     (wText/TEXT_SWEEP) dă un cerc FOARTE mic pentru cuvinte scurte (Case,
     121px) — un cerc mic e vizibil mai „rotund" (curbură = 1/rază) decât
     unul mare (Apartamente, 334px), chiar dacă ambele ocupă același unghi
     de 34°. Cu un plafon minim, cuvintele scurte primesc ACELAȘI cerc mare
     ca cele lungi — ocupă un unghi mai mic din el (arc mai plat), nu mai
     mic din unul strâns. Valoarea (340) = raza „bună" deja văzută la
     „Apartamente"/„Pegas · 3 proiecte", nu inventată. */
  const MIN_RADIUS = minRadius;
  const radius = Math.max(MIN_RADIUS, wText / TEXT_SWEEP);

  /* APEXUL SE COBOARĂ PENTRU CUVINTELE SCURTE (raportat 2026-09-16:
     „Case"/„Oficii" trebuie coborâte). De ce era nevoie, deși măsurasem
     aceeași distanță (31px) de la marginea cardului la TOP-ul textului:
     măsurasem marginea de SUS a cutiei de text, care e mereu litera din
     mijloc (apexul) — identică la toate. Ce diferă e cât de mult „cad"
     capetele cuvântului pe arc: un cuvânt lung ocupă un unghi mare, deci
     literele lui de la capete coboară ~22px sub apex, iar masa vizuală a
     cuvântului stă jos; unul scurt stă îngrămădit în apex (cade ~3px),
     deci pare SUSPENDAT mult mai sus, chiar dacă litera din mijloc e la
     aceeași înălțime. Fix: nu mai fixez apexul, ci MIJLOCUL benzii de
     text — apexul coboară cu jumătate din cădere, deci toate cuvintele au
     aceeași masă vizuală la aceeași înălțime, indiferent de lungime. */
  const textHalfAngle = wText / (2 * radius);
  const textDrop = radius * (1 - Math.cos(textHalfAngle));
  const Y_MID = 33; // înălțimea la care stă MIJLOCUL benzii de text
  const yApex = Y_MID - textDrop / 2;

  /* arcul desenat e mai lung decât textul (×1.5), ca textul centrat pe el
     să nu atingă niciodată capetele (unde ar fi tăiat) — limitat de coarda
     care trebuie să încapă în viewBox. */
  const maxChord = VB_W - 10;
  let sweep = TEXT_SWEEP * 1.5;
  if (2 * radius * Math.sin(sweep / 2) > maxChord) {
    sweep = 2 * Math.asin(Math.min(1, maxChord / (2 * radius)));
  }
  const chord = 2 * radius * Math.sin(sweep / 2);
  const sagitta = radius * (1 - Math.cos(sweep / 2));
  const yEnds = yApex + sagitta;
  const pathD = `M ${(VB_W - chord) / 2} ${yEnds} A ${radius} ${radius} 0 0 1 ${(VB_W + chord) / 2} ${yEnds}`;

  /* ID-uri UNICE per instanță — două filtre/căi SVG cu același id în
     documentul curent nu garantează care se aplică (regulă deja plătită pe
     proiect, vezi filigranul „N" de pe cardul video). */
  const pathId = `cl-founder-arc-${index}`;
  const fillId = `cl-founder-fill-${index}`;

  return (
    <svg
      className="cl-founder-arc"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={text}
      focusable="false"
    >
      <defs>
        <path id={pathId} d={pathD} fill="none" />
        {/* umplerea literei = ACEEAȘI combinație ca rama cardului
            „Designeri activi..." (.cl-founders-intro-frame): glow roz în
            partea de SUS care se stinge în jos, totul translucid.
            2026-09-15: varianta anterioară (inel `feMorphology`, ca
            filigranul „N") lăsa litera COMPLET goală pe interior — arăta
            bine dar nu se citea; acum interiorul are culoare, iar conturul
            vine din `stroke` + `paint-order:stroke` (stroke desenat SUB
            umplere ⇒ se vede doar jumătatea lui exterioară, deci contur
            curat, cu grosime constantă, fără să „mănânce" din literă). */}
        {/* 2026-09-15, a doua rundă pe umplere („mai închisă și mai
            strălucită"): nuanțele coboară spre bordo/vișiniu (#c9576d,
            #8e3346 — tonurile închise deja din paleta paginii, Programa și
            Testimoniale), iar strălucirea vine din DOUĂ benzi de lumină —
            una specular sus, alta de „rimă" jos — nu dintr-o simplă
            creștere de opacitate. Ăsta e tiparul de bijuterie/metal
            lustruit: lumină, corp închis, lumină. */}
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe6ea" stopOpacity="0.62" />
          <stop offset="20%" stopColor="#e2a3ac" stopOpacity="0.44" />
          <stop offset="52%" stopColor="#8e3346" stopOpacity="0.66" />
          <stop offset="80%" stopColor="#b0475d" stopOpacity="0.54" />
          <stop offset="100%" stopColor="#f0bcc4" stopOpacity="0.44" />
        </linearGradient>
      </defs>
      <text fill={`url(#${fillId})`} fontSize={fontSize} letterSpacing={TRACKING}>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
    </svg>
  );
};

/* 2026-09-18 — DECUPLATĂ de Programa: poza asta era `zigzag-5.webp`,
   RECICLATĂ din secțiunea „Programa" (decizie din 2026-09-17, documentată în
   memoria proiectului). Când zigzag-5.webp a fost înlocuit azi, în cadrul
   unei cereri separate despre Programa, poza fondatorilor pe scări s-a
   schimbat „pe furiș" odată cu ea — Vlad n-a aprobat asta pentru secțiunea
   asta, doar n-a observat legătura ascunsă între cele două. Fix: fișier
   PROPRIU (`founders-pegas.webp`, recuperat din git — era încă în HEAD,
   neschimbat de nicio comitere anterioară), ca schimbările viitoare la
   Programa să nu mai afecteze niciodată Fondatorii, și invers. */
const FOUNDER_SHOWCASE_PHOTO = { src: '/curs-landing/founders-pegas.webp', alt: 'Mihaela și Nicolae, discutând planul pe șantierul unui proiect real' };

const FounderShowcaseCard = () => {
  /* ref-ul stă pe WRAPPER, nu pe card: titlul-arc și cardul sunt FRAȚI care
     intră din ACELAȘI trigger — regulă generală a paginii, neschimbată
     față de FounderProjectCard (vezi rețeta de intrare „ca beneficii"). */
  const ref = useRef(null);
  const inView = useRevealActive(ref, 0.06);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  const enter = { duration: 1, ease: [0.16, 1, 0.3, 1] };

  /* 2026-09-25, a doua corecție — REVENIT complet: „nu clipul cela, faceți
     să fie fix cum era secțiunea Fondatorii NOMA" — perechea text+clip
     RESTAURATĂ exact cum era (clipul rămâne AICI, în Fondatorii; cardul nou
     „Un cuvânt de la Mihaela" are nevoie de un clip DIFERIT, de clarificat). */
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxReady, setLightboxReady] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const draggingScrubRef = useRef(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [scrubActive, setScrubActive] = useState(false);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!modalOpen || !video) return;
    let raf = 0;
    const tick = () => {
      if (!draggingScrubRef.current && video.duration) {
        setScrubProgress(video.currentTime / video.duration);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [modalOpen]);

  const seekFromClientX = (clientX: number) => {
    const track = scrubTrackRef.current;
    const video = modalVideoRef.current;
    if (!track || !video || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setScrubProgress(ratio);
  };
  const onScrubPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = true;
    setScrubActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onScrubPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingScrubRef.current) return;
    seekFromClientX(e.clientX);
  };
  const endScrub = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = false;
    setScrubActive(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = true;
    const el = cardRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setLightboxReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '250px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useScrollLock(modalOpen);
  useResumeAmbientVideo(videoRef, cardRef, modalOpen);
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const startModalVideo = () => { modalVideoRef.current?.play().catch(() => {}); };
  useEffect(() => {
    if (!modalOpen) return;
    const video = modalVideoRef.current;
    if (!video) return;
    if (video.readyState >= 2) startModalVideo();
    else {
      video.addEventListener('canplay', startModalVideo, { once: true });
      video.addEventListener('loadeddata', startModalVideo, { once: true });
    }
    const t = setTimeout(startModalVideo, 700);
    return () => {
      video.removeEventListener('canplay', startModalVideo);
      video.removeEventListener('loadeddata', startModalVideo);
      clearTimeout(t);
      video.pause();   // vezi nota din CursVideoCard — eliberează decodorul
    };
  }, [modalOpen]);

  usePauseBackgroundVideos(modalOpen, modalVideoRef);

  useEffect(() => {
    if (!modalOpen) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#100b09';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, [modalOpen]);

  const openModal = () => { videoRef.current?.pause(); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); videoRef.current?.play().catch(() => {}); };

  return (
    <div className="cl-founder-item cl-founder-item--showcase" ref={ref}>
      <motion.div
        className="cl-founder-card cl-founder-showcase"
        initial={hidden}
        animate={inView ? SHOW_YB : hidden}
        transition={enter}
        ref={cardRef}
      >
        <div className="cl-founder-showcase-stack">
          <div className="cl-founder-showcase-pair">
          <div className="cl-founder-showcase-info">
            <p className="cl-founders-intro">
              Designeri activi, cu <strong>proiecte și imple&shy;mentări premium</strong>.
            </p>
          </div>

          <button
            type="button"
            className="cl-founder-showcase-media"
            onClick={() => setPhotoOpen(true)}
            aria-label="Vezi poza mai aproape"
          >
            <img src={FOUNDER_SHOWCASE_PHOTO.src} alt={FOUNDER_SHOWCASE_PHOTO.alt} className="cl-founder-showcase-img" loading="lazy" decoding="async" />
          </button>
          </div>

          <div className="cl-founder-showcase-pair">
          <div className="cl-founder-showcase-info">
            <p className="cl-founders-intro">
              Cursul e construit din expertiza reală în proiectare și imple&shy;mentare. Astfel, fiecare cursant studiază <em>proiectarea reală</em>.
            </p>
          </div>

          <button
            type="button"
            className="cl-founder-showcase-video"
            onClick={openModal}
            aria-label="Deschide clipul proiectului Pegas"
          >
            <video
              ref={videoRef}
              className="cl-founder-showcase-video-el"
              poster="/cursuri/ultima-sectiune-poster.jpg"
              muted
              loop
              playsInline
              preload="none"
            >
              <source src="/cursuri/ultima-sectiune.webm" type="video/webm" />
              <source src="/cursuri/ultima-sectiune.mp4" type="video/mp4" />
            </video>
            <span className="cl-video-play-badge" aria-hidden="true">
              <Play size={15} strokeWidth={0} fill="currentColor" />
            </span>
          </button>
          </div>
        </div>

        {/* montat ascuns din timp + animat prin CSS — vezi nota din `CursVideoCard` */}
        {lightboxReady && createPortal(
              <div
                className={`cl-video-lightbox${modalOpen ? ' is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Clip video proiect Pegas"
                aria-hidden={!modalOpen}
                {...(!modalOpen ? { inert: '' } : {})}
              >
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--top" aria-hidden="true" />
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--bottom" aria-hidden="true" />
                <div className="cl-video-lightbox-backdrop" onClick={closeModal} />
                <button
                  type="button"
                  className="cl-video-lightbox-close"
                  onClick={closeModal}
                  aria-label="Închide"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
                <div className="cl-video-lightbox-frame cl-founder-video-frame">
                  <video
                    ref={modalVideoRef}
                    className="cl-video-lightbox-el cl-founder-video-lightbox-el"
                    loop
                    playsInline
                    preload="auto"
                    poster="/cursuri/ultima-sectiune-poster.jpg"
                  >
                    <source src="/cursuri/ultima-sectiune-sound.webm" type="video/webm" />
                    <source src="/cursuri/ultima-sectiune-sound.mp4" type="video/mp4" />
                  </video>

                  <div
                    className={`cl-video-scrub${scrubActive ? ' cl-video-scrub--active' : ''}`}
                    onPointerDown={onScrubPointerDown}
                    onPointerMove={onScrubPointerMove}
                    onPointerUp={endScrub}
                    onPointerCancel={endScrub}
                  >
                    <div className="cl-video-scrub-track" ref={scrubTrackRef}>
                      <div className="cl-video-scrub-fill" style={{ width: `${scrubProgress * 100}%` }} />
                      <div className="cl-video-scrub-thumb" style={{ left: `${scrubProgress * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>,
          document.body
        )}

        <PhotoLightbox
          photos={[{ full: FOUNDER_SHOWCASE_PHOTO.src, alt: FOUNDER_SHOWCASE_PHOTO.alt }]}
          openIndex={photoOpen ? 0 : null}
          onClose={() => setPhotoOpen(false)}
          onNext={() => {}}
          onPrev={() => {}}
          ariaLabel={FOUNDER_SHOWCASE_PHOTO.alt}
        />
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

      <div className="cl-support-note cl-support-note--warm">
        Acest curs este potrivit pentru începători, dar și pentru persoanele care au mai studiat. Cursul este <em>atât de avansat</em>, încât și pentru persoanele cu experiență totul este nou.
      </div>
    </motion.div>
  );
};

/* Cardul „Beneficiile" — exact aceeași rețetă ca la PainCard, cerut explicit:
   cardul ÎNTREG (cadru + rânduri) apare ca o singură unitate aburită, nu
   textul separat de un cadru deja static.
   2026-09-25 — clipul ambiental din fundal (`gains-bg.*`) SCOS complet,
   cerut explicit. Rămâne fundalul solid al `.cl-gains-frame`
   (`--noma-overlay-panel-2`, era deja acolo ca plasă de siguranță înainte
   ca videoclipul să pornească) — cardul arată identic cu ProcessCard/
   AfterCard, doar text, fără niciun strat vizual în plus. */
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
      <div className="cl-gains-frame-inner">
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
        {AFTER_COURSE.map((group) => (
          <div key={group.title} className="cl-after-card">
            <Arrow />
            <div>
              <p>{group.title}</p>
              <ul className="cl-after-sublist">
                {group.items.map((it) => (
                  <li key={it}>
                    <span className="cl-check-dot"><Check size={9} strokeWidth={3.5} /></span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
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

/* Cardul „Organizare curs" — NOUĂ secțiune (2026-09-11, cerut explicit),
   logistica zilnică (instalare softuri, Telegram, Zoom, lecții de sâmbătă).
   Rețetă IDENTICĂ cu ProcessCard de mai sus (deja a doua reciclare a
   .cl-pain-frame/.cl-pain-grid/.cl-pain-row/.cl-pain-num pe pagina asta —
   clase generice, numele vine din secțiunea unde au apărut prima dată, nu
   din conținut). */
const OrganizareCard = () => {
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
        {ORGANIZARE_STEPS.map((s, i) => (
          <div key={i} className="cl-pain-row">
            <span className="cl-pain-num"><span>{i + 1}</span></span>
            <p>{s}</p>
          </div>
        ))}
      </div>

      {/* „Avem lecții live și sâmbăta..." scoasă din pașii numerotați (cerut
          explicit 2026-09-18: „e mai generală, trebuie pusă ca chenar") —
          e o notă suplimentară, nu un pas din fluxul logistic. Rețetă
          IDENTICĂ notei-callout de la ExecutionCard/AfterCard
          (.cl-support-note, deja generică). */}
      <div className="cl-support-note cl-support-note--warm">
        Avem lecții live <em>și sâmbăta</em>, pentru verificarea temelor sau prezentarea unor subiecte, anunțate pe parcurs.
      </div>
    </motion.div>
  );
};

/* Cardul „Cum decurge proiectul" — NOUĂ secțiune (2026-09-15, cerută
   explicit), între Organizare curs și Absolvire: bucla lecție→temă→feedback,
   nu logistica zilnică (aia rămâne în Organizare curs, vecina ei directă).
   Rețetă IDENTICĂ ca ProcessCard/OrganizareCard (.cl-pain-frame/-grid/-row/
   -num), plus nota-callout de jos, exact ca la AfterCard (.cl-support-note,
   deja generică — clasa nu e scoped pe .cl-after-section). */
const ExecutionCard = () => {
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
        {EXECUTION_STEPS.map((s, i) => (
          <div key={i} className="cl-pain-row">
            <span className="cl-pain-num"><span>{i + 1}</span></span>
            <p>{s}</p>
          </div>
        ))}
      </div>

      <div className="cl-support-note cl-support-note--warm">
        Temele pentru acasă sunt <em>obligatorii</em> și trebuie să respecte termenul de trimitere la profesor.
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
            <div key={g.title} className={`cl-graduation-row${g.highlight ? ' cl-graduation-row--highlight' : ''}`}>
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
  const enter = { duration: 1, ease: [0.16, 1, 0.3, 1] as const };
  return (
    <div className="cl-format-card-wrap" ref={ref}>
      <div className="cl-format-arc-pos">
        <motion.div
          initial={hidden}
          animate={inView ? SHOW_YB : hidden}
          transition={enter}
        >
          <ArcWord text="Locuri limitate" index={90} sweepDeg={14} minRadius={900} />
        </motion.div>
      </div>

      <motion.div
        className="cl-format-frame"
        initial={hidden}
        animate={inView ? SHOW_YB : hidden}
        transition={enter}
      >
      <div className="cl-format-list">
        {FORMAT_ROWS.map((r) => (
          <div key={r.label} className={`cl-format-row${r.accent ? ' cl-format-row--accent' : ''}`}>
            <span className="cl-format-label">{r.label}</span>
            <span className="cl-format-value">
              {r.value}
              {r.note && (
                <span className="cl-format-note-inline">
                  {r.note.split('\n').map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      </motion.div>
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
  'Trebuie să avem ambiția de a *crește*, de a *cunoaște*, de a ne *dezvolta* și de a *ști tot*.';

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
  /* lightbox-ul e MONTAT (ascuns) de când cardul intră în ecran, nu creat la
     click — vezi nota din IntersectionObserver. `modalOpen` doar îl arată. */
  const [lightboxReady, setLightboxReady] = useState(false);

  /* bară de progres proprie, stil NOMA — 2026-09-19, cerut explicit: „aceeași
     ierarhie" ca la clipul din Fondatorii (rețetă generică, cod IDENTIC,
     doar clasele CSS partajate `.cl-video-scrub*`/`.cl-video-lightbox-frame`
     — vezi [[reference_component_recipes]] pt. explicația completă). */
  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const draggingScrubRef = useRef(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [scrubActive, setScrubActive] = useState(false);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!modalOpen || !video) return;
    let raf = 0;
    const tick = () => {
      if (!draggingScrubRef.current && video.duration) {
        setScrubProgress(video.currentTime / video.duration);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [modalOpen]);

  const seekFromClientX = (clientX: number) => {
    const track = scrubTrackRef.current;
    const video = modalVideoRef.current;
    if (!track || !video || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setScrubProgress(ratio);
  };
  const onScrubPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = true;
    setScrubActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onScrubPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingScrubRef.current) return;
    seekFromClientX(e.clientX);
  };
  const endScrub = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = false;
    setScrubActive(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

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
          /* ⚠️ 2026-09-19 — `<link rel="prefetch">` a fost ÎNLOCUIT cu
             montarea REALĂ a lightbox-ului (ascuns), vezi `lightboxReady`.
             Motivul, raportat de 5 ori la rând („stă o secundă pe un cadru
             și după începe clipul", pe telefon): prefetch-ul aduce doar
             OCTEȚII în cache — nu parsează containerul, nu decodează primul
             cadru, nu pregătește un element de redare. Elementul `<video>`
             se năștea abia la click, deci TOT lanțul (citire din cache →
             parsare MP4 de ~10MB → decodare primul cadru → compunere) se
             întâmpla după apăsare. Pe desktop e ~30ms și nu se vede; pe
             telefon e aproape o secundă — exact blocajul raportat.
             Acum elementul e montat din timp (aici, la intrarea cardului în
             ecran) cu `preload="auto"` ⇒ la click e deja `readyState 4` și
             `play()` pornește instant. Bandă consumată: ACEEAȘI ca înainte
             (prefetch-ul descărca oricum tot fișierul), doar că acum
             descărcarea chiar pregătește redarea. */
          setLightboxReady(true);
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
  useResumeAmbientVideo(videoRef, cardRef, modalOpen);
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  /* clipul din lightbox se aude (sursă separată, cu audio) — `.play()` explicit
     imediat după click-ul care a deschis modalul ⇒ browserul îl consideră
     pornit dintr-un gest real (permite autoplay CU sunet).
     ⚠️ 2026-09-19, DOUĂ runde de reglaj, ambele pe măsurători:
     (1) Cu `play()` la montare, decodarea primului cadru cădea în mijlocul
         animației de 0.5s (buclă rAF: un cadru de 35.5ms la ~280ms, pe un
         mediu care altfel ținea 16.7ms). L-am mutat la FINALUL animației.
     (2) Dar atunci clipul stătea vizibil pe poster tot timpul animației —
         raportat imediat: „stă o fracțiune de secundă pe un cadru și după
         începe". Măsurat din nou, de data asta `readyState`-ul elementului:
         la 32ms după click era DEJA 4 (`HAVE_ENOUGH_DATA`) — fișierul e
         prefetch-uit de la intrarea cardului în viewport, deci nu exista
         nicio decodare de care să ne ferim; îl țineam pe loc degeaba.
     Varianta finală: pornește exact CÂND E GATA, nu după un timp fix —
     instant în cazul normal (cache cald), iar dacă elementul chiar nu e
     încă redabil, așteaptă `canplay` (nu un timeout ghicit). `setTimeout`
     rămâne doar ca plasă de siguranță, dacă `canplay` nu vine deloc. */
  const startModalVideo = () => { modalVideoRef.current?.play().catch(() => {}); };
  useEffect(() => {
    if (!modalOpen) return;
    const video = modalVideoRef.current;
    if (!video) return;
    /* prag `>= 2` (`HAVE_CURRENT_DATA` — cadrul curent e decodat), nu `>= 3`:
       între montare și acest efect, `canplay` poate fi DEJA emis, iar dacă
       cerem `>= 3` rămânem și fără ramura instant, și fără eveniment (deja
       trecut) ⇒ am cădea degeaba pe timeout-ul de siguranță. */
    if (video.readyState >= 2) startModalVideo();
    else {
      video.addEventListener('canplay', startModalVideo, { once: true });
      video.addEventListener('loadeddata', startModalVideo, { once: true });
    }
    /* plasă de siguranță — reîncearcă DOAR dacă chiar n-a pornit (altfel ar
       fi un apel inutil pe un clip care rulează deja). */
    const t = setTimeout(() => { if (video.paused) startModalVideo(); }, 700);
    return () => {
      video.removeEventListener('canplay', startModalVideo);
      video.removeEventListener('loadeddata', startModalVideo);
      clearTimeout(t);
      /* ⚠️ OPRIT EXPLICIT la închidere — nu te baza pe demontare (acum
         elementul nici nu se mai demontează: lightbox-ul rămâne montat,
         doar ascuns). Măsurat: clipul continua să ruleze invizibil după
         închidere (`currentTime` avansa), ținând ocupat un decodor video.
         Cleanup-ul efectului prinde TOATE căile de închidere (X, backdrop,
         Escape), spre deosebire de `closeModal`, pe care Escape îl ocolește. */
      video.pause();
    };
  }, [modalOpen]);

  usePauseBackgroundVideos(modalOpen, modalVideoRef);

  /* 2026-09-14 (cerut explicit): barele browserului in-app din Instagram
     (sus + jos) să preia culoarea fundalului clipului, nu cremul paginii.
     index.html NU are `theme-color` static, INTENȚIONAT — Safari normal
     eșantionează singur pagina, un meta static ar strica asta (vezi nota
     din index.html). Dar Instagram/TikTok in-app NU eșantionează — au
     nevoie explicit de `theme-color` ca să-și coloreze barele. Fix: meta-ul
     se adaugă DOAR cât e deschis lightbox-ul (JS, tranzitoriu) și se scoate
     la închidere — restul site-ului rămâne exact ca înainte, fără el. */
  useEffect(() => {
    if (!modalOpen) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    // aproximarea solidă a gradientului radial al lightbox-ului
    // (rgba(28,20,16)→rgba(14,9,7)) — capătul mai închis, cel vizibil la margini
    meta.content = '#100b09';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
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

        {/* ⚠️ 2026-09-19 — lightbox-ul NU mai e creat la click (`AnimatePresence` +
            montare condiționată), ci montat ASCUNS de când cardul intră în ecran
            (`lightboxReady`) și doar ARĂTAT la click (clasa `is-open`).
            Două câștiguri, ambele cerute după 5 raportări de „se blochează pe un
            cadru": (1) elementul `<video>` există din timp cu `preload="auto"`,
            deci la click e deja decodat — redarea pornește instant, fără lanțul
            parsare→decodare care pe telefon dura ~1s; (2) animația trece de pe
            framer (JS, fir principal) pe TRANZIȚII CSS de `opacity`/`transform`,
            care rulează pe compozitor — nu mai concurează cu decodarea video.
            `inert` + `aria-hidden` cât e închis: invizibil ȘI inaccesibil pt.
            tastatură/cititoare de ecran, deși rămâne în DOM. */}
        {lightboxReady && createPortal(
              <div
                className={`cl-video-lightbox${modalOpen ? ' is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Clip video NOMA School"
                aria-hidden={!modalOpen}
                {...(!modalOpen ? { inert: '' } : {})}
              >
                {/* 2026-09-14 (raportat: „barele de la Instagram/browser au altă
                    nuanță decât fundalul, se vede pe screenshot"): Safari (și
                    majoritatea browserelor in-app) NU citesc `theme-color` —
                    își colorează bara după fundalul PAGINII de dedesubt, nu
                    după un overlay `position:fixed` de deasupra. Fundalul de
                    /curs e #1c1410 (mai deschis, maro), lightbox-ul e mult mai
                    închis — de-acolo diferența vizibilă din screenshot. Fix
                    identic cu rețeta deja folosită pe paginile întunecate ale
                    site-ului (`.safe-scrim-top`): o bandă SOLIDĂ, opacă, în
                    culoarea lightbox-ului, care acoperă exact safe-area-ul —
                    Safari eșantionează ATUNCI culoarea corectă. */}
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--top" aria-hidden="true" />
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--bottom" aria-hidden="true" />
                <div className="cl-video-lightbox-backdrop" onClick={closeModal} />
                <button
                  type="button"
                  className="cl-video-lightbox-close"
                  onClick={closeModal}
                  aria-label="Închide"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
                {/* 2026-09-14 (raportat: „se deschide în 2 etape, urât"): animația
                    stătea pe fostul wrapper `display:contents`, care n-avea cutie
                    proprie, deci `opacity`/`transform` nu se aplicau deloc.
                    2026-09-19 — wrapper-ul a REVENIT, de data asta cu cutie reală
                    (`.cl-video-lightbox-frame`, comun cu Fondatorii — „aceeași
                    ierarhie", cerut explicit): animația stă pe wrapper, ramă +
                    bară de scrub intră ca parte din ACEEAȘI unitate. Detalii
                    complete (de ce, ce bug-uri au apărut, cum s-au verificat) →
                    comentariile de la `.cl-video-lightbox-frame` în CSS. */}
                <div className="cl-video-lightbox-frame">
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

                  <div
                    className={`cl-video-scrub${scrubActive ? ' cl-video-scrub--active' : ''}`}
                    onPointerDown={onScrubPointerDown}
                    onPointerMove={onScrubPointerMove}
                    onPointerUp={endScrub}
                    onPointerCancel={endScrub}
                  >
                    <div className="cl-video-scrub-track" ref={scrubTrackRef}>
                      <div className="cl-video-scrub-fill" style={{ width: `${scrubProgress * 100}%` }} />
                      <div className="cl-video-scrub-thumb" style={{ left: `${scrubProgress * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>,
          document.body
        )}
      </div>
    </motion.div>
  );
};

/* Cardul cu clipul video „Mihaela" — 2026-09-25, cerut explicit: card în
   stilul lui „Nicu" (ACEEAȘI rețetă, copiată 1:1 din CursVideoCard —
   autoplay ambiental mut + lightbox fullscreen + bară de scrub proprie),
   doar cu conținut propriu: avatar/nume/rol Mihaela, „M" în loc de „N".
   ⚠️ Clipul e `gains-bg` (cel din fundalul secțiunii Beneficii, cerut
   explicit — prima încercare cu `ultima-sectiune` a fost RESPINSĂ: acela
   rămâne AL LUI, în Fondatorii). Fișierele `gains-bg.*` din fundalul
   Beneficiilor n-au coloană audio (tăiată la encodare), deci lightbox-ul
   folosește `gains-bg-sound.*` — variante generate 2026-09-25 din sursa
   originală (`copy_3A50E2D2…mov`, identificată prin durată identică
   25.2667s + cadru verificat vizual): fluxul VIDEO e copiat bit-cu-bit din
   fișierele deja aprobate (`-c:v copy`, zero re-encodare, imagine identică
   pe pagină), doar audio-ul e adăugat (AAC/Opus 48kHz stereo, aceeași
   convenție ca `curs-video-sound.*`). ID-uri proprii (filtru SVG, ref-uri)
   — instanță independentă de CursVideoCard, ca ambele să coexiste pe
   pagină fără conflict. */
const MIHAELA_VIDEO_QUOTE =
  'Designul nu este pentru oricine. Designul nu este despre muncă ușoară și rezultate obținute peste noapte. Designul este despre *ambiție*, despre *perseverență*, despre *nopți nedormite*.';

const MihaelaVideoCard = () => {
  const revealRef = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(revealRef);
  const hidden = useMemo(() => ({ opacity: 0, y: 40 * clScrollDir }), [clScrollDir]);

  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxReady, setLightboxReady] = useState(false);

  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const draggingScrubRef = useRef(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [scrubActive, setScrubActive] = useState(false);

  useEffect(() => {
    const video = modalVideoRef.current;
    if (!modalOpen || !video) return;
    let raf = 0;
    const tick = () => {
      if (!draggingScrubRef.current && video.duration) {
        setScrubProgress(video.currentTime / video.duration);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [modalOpen]);

  const seekFromClientX = (clientX: number) => {
    const track = scrubTrackRef.current;
    const video = modalVideoRef.current;
    if (!track || !video || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setScrubProgress(ratio);
  };
  const onScrubPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = true;
    setScrubActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX);
  };
  const onScrubPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingScrubRef.current) return;
    seekFromClientX(e.clientX);
  };
  const endScrub = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingScrubRef.current = false;
    setScrubActive(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = true;
    const el = cardRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setLightboxReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '250px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useScrollLock(modalOpen);
  useResumeAmbientVideo(videoRef, cardRef, modalOpen);
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const startModalVideo = () => { modalVideoRef.current?.play().catch(() => {}); };
  useEffect(() => {
    if (!modalOpen) return;
    const video = modalVideoRef.current;
    if (!video) return;
    if (video.readyState >= 2) startModalVideo();
    else {
      video.addEventListener('canplay', startModalVideo, { once: true });
      video.addEventListener('loadeddata', startModalVideo, { once: true });
    }
    const t = setTimeout(() => { if (video.paused) startModalVideo(); }, 700);
    return () => {
      video.removeEventListener('canplay', startModalVideo);
      video.removeEventListener('loadeddata', startModalVideo);
      clearTimeout(t);
      video.pause();
    };
  }, [modalOpen]);

  usePauseBackgroundVideos(modalOpen, modalVideoRef);

  useEffect(() => {
    if (!modalOpen) return;
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#100b09';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
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
        <svg className="cl-video-mark" aria-hidden="true" focusable="false">
          <defs>
            <filter id="noma-cl-video-mark-outline-mihaela" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feMorphology in="SourceAlpha" operator="dilate" radius="1" result="grown" />
              <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
              <feFlood floodColor="currentColor" result="ink" />
              <feComposite in="ink" in2="ring" operator="in" />
            </filter>
          </defs>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" filter="url(#noma-cl-video-mark-outline-mihaela)">M</text>
        </svg>

        <div className="cl-video-author">
          <img src="/cursuri/mihaela-avatar.jpg" alt="Mihaela" className="cl-video-author-avatar" loading="lazy" />
          <div className="cl-video-author-info">
            <span className="cl-video-author-name">Mihaela</span>
            <span className="cl-video-author-role">Fondator NOMA · Designer de interior</span>
          </div>
        </div>

        <div className="cl-video-text">
          <p>{renderClVideoQuote(MIHAELA_VIDEO_QUOTE)}</p>
        </div>

        <div className="cl-video-visual">
          <button
            type="button"
            className="cl-video-frame"
            onClick={openModal}
            aria-label="Deschide clipul video Mihaela"
          >
            <video
              ref={videoRef}
              className="cl-video-el"
              poster="/curs-landing/gains-bg-poster.jpg"
              muted
              loop
              playsInline
              preload="none"
            >
              <source src="/curs-landing/gains-bg.webm" type="video/webm" />
              <source src="/curs-landing/gains-bg.mp4" type="video/mp4" />
            </video>
            <span className="cl-video-play-badge" aria-hidden="true">
              <Play size={15} strokeWidth={0} fill="currentColor" />
            </span>
          </button>
        </div>

        {lightboxReady && createPortal(
              <div
                className={`cl-video-lightbox${modalOpen ? ' is-open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Clip video Mihaela"
                aria-hidden={!modalOpen}
                {...(!modalOpen ? { inert: '' } : {})}
              >
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--top" aria-hidden="true" />
                <div className="cl-video-lightbox-scrim cl-video-lightbox-scrim--bottom" aria-hidden="true" />
                <div className="cl-video-lightbox-backdrop" onClick={closeModal} />
                <button
                  type="button"
                  className="cl-video-lightbox-close"
                  onClick={closeModal}
                  aria-label="Închide"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
                <div className="cl-video-lightbox-frame cl-founder-video-frame">
                  <video
                    ref={modalVideoRef}
                    className="cl-video-lightbox-el cl-founder-video-lightbox-el"
                    loop
                    playsInline
                    preload="auto"
                    poster="/curs-landing/gains-bg-poster.jpg"
                  >
                    {/* surse SEPARATE, CU sunet (cele din card sunt mute) —
                        aceeași convenție ca la `curs-video-sound.*`. */}
                    <source src="/curs-landing/gains-bg-sound.webm" type="video/webm" />
                    <source src="/curs-landing/gains-bg-sound.mp4" type="video/mp4" />
                  </video>

                  <div
                    className={`cl-video-scrub${scrubActive ? ' cl-video-scrub--active' : ''}`}
                    onPointerDown={onScrubPointerDown}
                    onPointerMove={onScrubPointerMove}
                    onPointerUp={endScrub}
                    onPointerCancel={endScrub}
                  >
                    <div className="cl-video-scrub-track" ref={scrubTrackRef}>
                      <div className="cl-video-scrub-fill" style={{ width: `${scrubProgress * 100}%` }} />
                      <div className="cl-video-scrub-thumb" style={{ left: `${scrubProgress * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>,
          document.body
        )}
      </div>
    </motion.div>
  );
};

/* „Bonus" — ședința foto profesională + trenulețul de poze. Mutat (2026-09-10,
   cerut explicit) din „Cum lucrăm": e un perk separat, nu ține de cum decurg
   lecțiile. Așezat chiar înainte de „Când începe și cât costă". Aceeași
   rețetă de intrare/anti-licărire ca restul cardurilor cu animație CSS
   infinită (trenulețul de-aici ⇒ filtrul framer trebuie curățat la `entered`).
   2026-09-10 (cerut explicit, după ce prima variantă cu card cu ramă a fost
   respinsă — „nu trebuie să fie într-un card trenulețul"): banda rămâne
   liberă (edge-to-edge, ca înainte). Cuvântul-cheie din titlu primește
   accentul roz + glow al paginii (.cl-bonus-section în lista .cl-h2 em,
   vezi CSS). 2026-09-25 — pastila-etichetă („Ședință foto pentru social
   media") SCOASĂ, redundantă cu titlul secțiunii („Ședință foto
   profesională"). */
const BonusShootBlock = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!inView) setEntered(false); }, [inView]);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const showNext = () => setOpenIndex((i) => (i === null ? i : (i + 1) % PRACTICE_GALLERY_PHOTOS.length));
  const showPrev = () =>
    setOpenIndex((i) => (i === null ? i : (i - 1 + PRACTICE_GALLERY_PHOTOS.length) % PRACTICE_GALLERY_PHOTOS.length));

  return (
    <div ref={ref} className="cl-practice cl-bonus-shoot">
      <motion.div
        initial={hidden}
        animate={inView ? (entered ? SHOW_YB_CLEAR : SHOW_YB) : hidden}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => { if (inView) setEntered(true); }}
      >
        <DragMarquee
          srcs={PRACTICE_SHOOT_PHOTOS}
          cls="cl-practice-marquee"
          open={openIndex !== null}
          onOpen={setOpenIndex}
        />
      </motion.div>

      <PhotoLightbox
        photos={PRACTICE_GALLERY_PHOTOS}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onNext={showNext}
        onPrev={showPrev}
        ariaLabel="Poză din ședința foto"
      />
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
   recalculează.

   2026-09-10 — CORECŢIE la nota de mai sus („zero muncă per-cadru"): partea
   de canvas chiar e ieftină (0.64ms măsurat), dar `elementsFromPoint` × 3
   costă ~5ms per eşantion (hit-test + flush de layout). La un buget de cadru
   de 16.7ms şi cu Lenis care mişcă scroll-ul pe FIRUL PRINCIPAL, asta scapă
   un cadru la fiecare ~7 ⇒ „se mişcă greu" (raportat de Vlad pe desktop).
   Fix: hit-testul rulează DOAR când sub pastilă chiar poate fi ceva deschis.
   Singurele suprafeţe deschise de pe pagină sunt POZELE (restul e espresso
   închis) — ţinem setul de <img> aflate în banda pastilei printr-un
   IntersectionObserver (asincron, fără layout forţat) şi, dacă e gol, sărim
   complet peste hit-test. Rămâne generic (orice <img>, inclusiv poze
   adăugate în viitor), nu o listă manuală de selectoare. */
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

    /* pozele aflate ACUM în banda orizontală a pastilei. Actualizat de un
       IntersectionObserver al cărui root e decupat (rootMargin negativ) exact
       la acea bandă — deci callback-ul spune „e/nu e o poză sub buton" fără
       niciun getBoundingClientRect pe scroll. */
    const imgsInBand = new Set<Element>();
    let bandObserver: IntersectionObserver | null = null;

    const buildBandObserver = () => {
      bandObserver?.disconnect();
      imgsInBand.clear();
      const r = btn.getBoundingClientRect();
      const top = Math.max(0, Math.round(r.top));
      const bottom = Math.max(0, Math.round(window.innerHeight - r.bottom));
      bandObserver = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) imgsInBand.add(e.target);
            else imgsInBand.delete(e.target);
          }
        },
        { rootMargin: `${-top}px 0px ${-bottom}px 0px`, threshold: 0 }
      );
      document.querySelectorAll('img').forEach((el) => bandObserver!.observe(el));
    };

    /* pozele montate MAI TÂRZIU (ex. proiectul cursantei selectate din
       Testimoniale, care se remontează la fiecare click) nu erau prinse de
       observer ⇒ pastila rămânea pe varianta închisă peste ele. Bug găsit la
       verificare, nu raportat. MutationObserver le înscrie automat, deci
       regula „merge şi pentru poze adăugate în viitor" rămâne valabilă. */
    const watchNewImages = () => {
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          for (const n of m.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (n.tagName === 'IMG') bandObserver?.observe(n);
            else n.querySelectorAll('img').forEach((el) => bandObserver?.observe(el));
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      return mo;
    };
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
      /* nicio poză în banda pastilei ⇒ dedesubt e sigur fundalul închis al
         paginii. Ieşim ÎNAINTE de `elementsFromPoint` (partea scumpă). */
      if (imgsInBand.size === 0) {
        if (lastKey !== 'dark') {
          lastKey = 'dark';
          btn.classList.remove('cl-float-cta--light');
        }
        return;
      }

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

    const onResize = () => {
      buildBandObserver();
      onScroll();
    };

    buildBandObserver();
    const imgWatcher = watchNewImages();
    sample();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (pending !== null) clearTimeout(pending);
      bandObserver?.disconnect();
      imgWatcher.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);
};

/* montat ÎNTREG abia pe client (vezi useIsClient) — efectele de mai jos își
   caută butonul în DOM la montare, deci nu pot rula înaintea portalului. */
const FloatingCTA = () => (useIsClient() ? <FloatingCTAPortal /> : null);

const FloatingCTAPortal = () => {
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
          <span className="cl-float-cta-label">
            <span className="cl-float-cta-label-main">Rezervă-ți locul la curs</span>
            {/* a doua linie — DOAR desktop (CSS), unde pastila are loc să
                fie mai lungă: 2026-09-14, cerut explicit („prea scurt, text
                cu impact ca la X"), dată reală din FORMAT_ROWS (Start), nu
                o urgență inventată. */}
            <span className="cl-float-cta-label-sub">Seria începe pe 4 februarie. Scrie-ne pe WhatsApp.</span>
          </span>
          <span className="cl-float-cta-icon"><WhatsAppIcon /></span>
        </a>
      </Magnetic>
    </div>,
    document.body
  );
};

const PAIN_POINTS = [
  // 2026-09-24 — text nou (dat de Vlad, corectat gramatical): lista merge
  // de la începător spre avansat, 5 puncte (vechile 2-6 înlocuite).
  'Ești începător și nu știi absolut nimic despre această profesie.',
  'Ai mai studiat, dar nu știi ce trebuie să conțină un album tehnic și cum să corespundă acesta cu vizualizările.',
  'Cunoști softurile, dar nu știi cum să comunici proiectul clientului.',
  'Ai experiență în proiectare, dar până la urmă proiectele tale nu ajung să fie implementate.',
  'Lucrezi în domeniu, dar ești total lipsit de încredere, ești confuz și simți că ceva nu funcționează bine.',
];

/* poze reale de pe șantier/consultanță, împerecheate cu primele 6 topice
   din Programa, într-o bandă zig-zag (baner↔poză alternând stânga/dreapta) */
/* pos = object-position — ține subiectul (față/mâini/document) în cadru
   după ce coloana devine îngustă/lungită (raport 2/3 pe mobil); tăiem doar
   spațiul irelevant din jur (perete, fundal gol), nu subiectul. */
const ZIGZAG_PHOTOS = [
  /* 2026-09-24 — primele 2 poze înlocuite (cerut explicit), fișiere din
     Downloads/noile modificari.zip: image00006 → plan de amenajare cotat,
     image00011 → randare 3D dormitor. Alt text + `pos` rescrise pt.
     conținutul nou (vechile poze arătau altceva). */
  { src: '/curs-landing/curriculum-plan-cotat.webp', alt: 'Plan de amenajare cotat, dintr-un proiect real NOMA', pos: '50% 45%' },
  { src: '/curs-landing/zigzag-2-randare-dormitor.webp', alt: 'Randare 3D a unui dormitor, din portofoliul NOMA', pos: '30% 45%' },
  { src: '/curs-landing/zigzag-3.webp', alt: 'Prezentarea documentației tehnice pe șantier', pos: '42% 30%' },
  { src: '/curs-landing/zigzag-4.webp', alt: 'Verificarea randării, comparată cu execuția reală', pos: '58% 35%' },
  { src: '/curs-landing/santier-consultanta.webp', alt: 'Consultanță pe șantier, cu planul tehnic în mână', pos: '65% 48%' },
  /* ULTIMELE 2 poze — interschimbate la cerere explicită 2026-09-18 (locul
     6 și locul 7 din bandă). „locul 6" (a 6-a poză din secvență, index 5,
     ne-ultima) e acum zigzag-6 (șantierul cu instalații expuse); „locul 7"
     (ULTIMA poză din coloana stângă, cea care umple „locul liber" de la
     finalul coloanei — vezi useEffect-ul zigzagPad) e acum zigzag-5
     (finisajul de perete). */
  { src: '/curs-landing/zigzag-6.webp', alt: 'Șantierul, cu tot cu instalațiile expuse, înainte de finisaje', pos: '55% 42%' },
  /* 2026-09-24 — ULTIMA poză a benzii înlocuită (cerut explicit), fișier
     image00005 din Downloads/noile modificari.zip: clienta primind albumul
     de design finalizat — potrivire tematică cu „Prezentarea finală",
     topicul care închide coloana. `zigzag-5.webp` e DECUPLAT de Fondatorii
     NOMA (vezi FOUNDER_SHOWCASE_PHOTO, fișier propriu) — sigur de înlocuit. */
  /* 2026-09-24, a doua trecere — „mai apropiată, accentul pe album" — poza
     PRE-decupată (nu doar `object-position`), centrată pe album+mâini, ~3/4
     nativ, ca CSS-ul (cover) să n-o mai îndepărteze cu crop suplimentar. */
  { src: '/curs-landing/zigzag-album-close2.webp', alt: 'Albumul de design finalizat, „Proiect de design", predat clientei', pos: '50% 68%' },
];

/* galeria pt. `PhotoLightbox` — 2026-09-26, cerut explicit („acum și de la
   programă să pot să deschid pozele"), aceeași rețetă generică deja
   folosită la Fondatorii/Showroom/Trusa/Testimoniale. Ordinea urmează
   ARRAY-UL (0-6), nu ordinea vizuală stânga/dreapta din bandă — la fel ca
   restul galeriilor de pe pagină, navigarea e pe indexul de date, nu pe
   poziția pe ecran. */
const CURRICULUM_GALLERY: { full: string; alt: string }[] = ZIGZAG_PHOTOS.map((p) => ({ full: p.src, alt: p.alt }));

/* 2026-09-13, titluri scurtate din nou (cerut explicit — „Prezentarea
   finală" dat ca exemplu de model: scurt, un rând, fără „Cum...", fără
   cuvinte de umplutură). Fără `\n` — la 2-3 cuvinte încap deja pe un rând,
   nu mai e nevoie de rupere manuală (era necesară doar cât titlurile aveau
   4-5 cuvinte). Itemele din interior NU s-au schimbat, doar titlul-eyebrow
   al cardului. */
const CURRICULUM = [
  {
    title: 'Softul AutoCAD',
    items: ['Releveu și instalații existente', 'Demolare și montare construcții', 'Amplasare mobilier, cotat și explicat', 'Prize, întrerupătoare și iluminat', 'Conexiuni electrice și circuite', 'Tavan și pardoseală', 'Apeduct și canalizare', 'Desfășurare pereți', 'Borderouri (cantități de materiale și alte obiecte din proiect)'],
  },
  {
    title: 'Softul 3Ds Max',
    items: ['Modelarea', 'Integrarea corectă a iluminatului', 'Materiale și texturi realiste', 'Perspective geometrice și cadre de detaliu', 'Randări la nivel de portofoliu, cu texturi și lumină de proiect real', 'Tur virtual 360°'],
  },
  {
    title: 'Lucrări de șantier',
    items: ['Electricitate', 'Apeduct și canalizare'],
  },
  {
    title: 'Psihologia clientului',
    items: ['Cum înțelegem ce își dorește clientul', 'Cum comunicăm cu diferite tipuri de clienți', 'Cum gestionăm așteptările și obiecțiile'],
  },
  {
    title: 'Metoda de lucru',
    items: ['Câte convorbiri avem cu clientul', 'Cum desfășurăm convorbirile', 'Ce volum de informație oferim clientului', 'De unde începem un proiect și cum ajungem la rezultatul final', 'Etapele corecte de lucru într-un proiect'],
  },
  {
    title: 'Relații profesionale',
    items: ['Relația cu furnizorii', 'Relația cu clienții', 'Relația cu meșterii'],
  },
  {
    title: 'Implementare',
    items: ['Cum proiectăm un proiect real, ca să poată fi implementat', 'Produse și coduri reale, folosite direct în proiect', 'Secrete din renovări: draperii, stofe, culori, îmbinarea materialelor, finisaje, densitate și alte detalii practice de șantier'],
  },
  {
    title: 'Moodboard',
    items: ['Produse reale, cu coduri și referințe', 'Stilul potrivit clientului', 'Gama coloristică'],
  },
  {
    title: 'Poziționarea ta',
    items: ['Cum ne construim imaginea și poziționarea pe piață'],
  },
  {
    title: 'Primii clienți',
    items: ['Metode de promovare', 'Cum ajungem la primii clienți', 'Cum comunicăm valoarea serviciilor noastre'],
  },
  {
    title: 'Prezentarea finală',
    items: ['Cum pregătim toată documentația proiectului', 'Cum prezentăm proiectul final clientului', 'Ce trebuie să conțină predarea finală'],
  },
];

/* Secțiunea „Format" (după Programa) — datele concrete de logistică, trimise
   de client. Rânduri etichetă → valoare (fișă), rândul de preț evidențiat,
   plus o notă-callout pentru sâmbete (orar flexibil). */
const FORMAT_ROWS = [
  { label: 'Start', value: '4 februarie 2027', note: null as string | null, accent: false },
  { label: 'Final', value: '4 iunie 2027', note: null as string | null, accent: false },
  { label: 'Durată', value: '4 luni', note: null as string | null, accent: false },
  { label: 'Lecții live', value: '17:30–19:30', note: 'luni și vineri', accent: false },
  { label: 'Preț', value: '1500 €', note: 'poți plăti în 2\nsau mai multe tranșe', accent: true },
  { label: 'Rezervare', value: '200 €', note: 'inclusă în preț,\nnu e o sumă adițională', accent: false },
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

const renderZigzagPhoto = (i: number, onOpen: (index: number) => void, frameClass?: string) => {
  const p = ZIGZAG_PHOTOS[i];
  return <ZigzagPhoto key={p.src} src={p.src} alt={p.alt} pos={p.pos} onOpen={() => onOpen(i)} frameClass={frameClass} />;
};

/* 2026-09-13 — ÎNCERCARE RESPINSĂ EXPLICIT („nu la asta m-am referit, era
   bun cum era"): am restructurat toată banda pe sloturi explicite ca să pot
   lipi bannere fără poză între ele oriunde. Userul voia altceva, mult mai
   restrâns — vezi nota de la JSX-ul secțiunii CURRICULUM mai jos. Revenit
   la alternanța simplă (`i % 2 === 0`) + coada de bannere „pure"; rămâne
   DOAR o singură pereche lipită explicit, la cardul cu prea puțină
   informație (nu peste tot, cum am făcut prima dată). */

/* 6 poze (câte una per persoană) din ședința foto profesionistă — setul
   brut are 11 poze/6 persoane (5 apar de 2 ori), curatoriate aici la fel ca
   pe homepage (SplineDesignSection.tsx, același set de poze): optimizate
   (orientare EXIF corectată, redimensionate, webp) — bandă continuă
   separată, fără legendă (documentare vizuală, nu topic-uri individuale) */
const PRACTICE_SHOOT_PHOTOS = [
  '/curs-landing/practice-shoot-1.webp',
  '/curs-landing/practice-shoot-2.webp',
  '/curs-landing/practice-shoot-4.webp',
  '/curs-landing/practice-shoot-6.webp',
  '/curs-landing/practice-shoot-8.webp',
  '/curs-landing/practice-shoot-10.webp',
];
/* 2026-09-20 — galeria pt. `PhotoLightbox`, cerut explicit („vreau așa să
   facem și la bonus"). Toate 6 la ACELAȘI raport 2/3 (700×1050, măsurat) —
   deja o familie consecventă, spre deosebire de Practica, deci nu au nevoie
   de crop suplimentar pt. dimensiuni identice în lightbox. */
const PRACTICE_GALLERY_PHOTOS: { full: string; alt: string }[] = PRACTICE_SHOOT_PHOTOS.map((src) => ({
  full: src,
  alt: '',
}));

/* 2026-09-24 — secțiune NOUĂ „Practica la showroomuri" (cerută explicit),
   între „Practica de pe șantier" și „Ce câștigi". Card cu text (rețeta
   generică `.cl-pain-frame`, reutilizată — nu o clasă nouă) + bandă de
   poze (rețeta `.cl-practice-marquee`, aceeași ca la Bonus). Primele 3
   poze din Downloads/noile modificari.zip (image00009/010/008 — cabinet
   showroom, cutie eșantioane ceramice, showroom mobilier), a 4-a e poza
   „showroom" MUTATĂ din „Practica de pe șantier" (`KIT_FLOW_PHOTOS.
   showroom` — decupată de-acolo, scoasă din `KIT_GALLERY_PHOTOS` și din
   JSX-ul `KitFlow`, ca să nu apară de 2 ori pe pagină). */
const SHOWROOM_PRACTICE_PHOTOS = [
  '/curs-landing/showroom-1.webp',
  '/curs-landing/showroom-2.webp',
  '/curs-landing/showroom-3.webp',
  KIT_FLOW_PHOTOS.showroom.src,
];
const SHOWROOM_PRACTICE_GALLERY: { full: string; alt: string }[] = SHOWROOM_PRACTICE_PHOTOS.map((src) => ({
  full: src,
  alt: '',
}));

/* 2026-09-24, a doua corecție — banda auto-scroll ÎNLOCUITĂ pe mobil
   (cerut explicit: „vreau tot așa cu bara jos și să pot muta pozele, un
   pic mai mari") — nu mai e `.cl-practice-marquee` (rulează singură, nu
   se trage cu degetul), ci `scroll-snap` orizontal NATIV (drag-ul e
   gratuit, browser-ul îl dă din construcție — nu s-a reinventat un sistem
   de fizică proprie, ca la trenulețul din Trusa) + ACEEAȘI bară de
   paginare stil NOMA ca pe desktop, sincronizată live cu poziția de scroll
   (`onScroll` + `Math.round(scrollLeft / itemWidth)`, nu un timer). */
const ShowroomPracticeScroller = ({ onOpen }: { onOpen: (index: number) => void }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    const item = track?.children[i] as HTMLElement | undefined;
    if (!track || !item) return;
    track.scrollTo({ left: item.offsetLeft - (track.clientWidth - item.clientWidth) / 2, behavior: 'smooth' });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const item = track.children[0] as HTMLElement | undefined;
        if (!item) return;
        const step = item.offsetWidth + 12; /* lățime item + gap, vezi CSS */
        const center = track.scrollLeft + track.clientWidth / 2;
        const i = Math.min(
          SHOWROOM_PRACTICE_PHOTOS.length - 1,
          Math.max(0, Math.round((center - item.clientWidth / 2) / step))
        );
        setActive(i);
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => { track.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="cl-showroom-scroller">
      <div className="cl-showroom-scroll-track" ref={trackRef}>
        {SHOWROOM_PRACTICE_PHOTOS.map((src, i) => (
          <button
            key={src}
            type="button"
            className="cl-showroom-scroll-item"
            onClick={() => onOpen(i)}
            aria-label="Vezi poza mai aproape"
          >
            <img src={src} alt="" className="cl-showroom-scroll-img" loading="eager" decoding="async" />
          </button>
        ))}
      </div>

      {/* 2026-09-24 — cerut explicit: săgețile „<" ">" una lângă alta, nu
          de-o parte și de alta a punctelor. Ordine nouă: puncte → grup
          compact de 2 săgeți (`.cl-showroom-arrows`). */}
      <div className="cl-showroom-pagination">
        <div className="cl-showroom-dots">
          {SHOWROOM_PRACTICE_PHOTOS.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`cl-showroom-dot${i === active ? ' cl-showroom-dot--active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Sari la poza ${i + 1}`}
            />
          ))}
        </div>

        <div className="cl-showroom-arrows">
          <button
            type="button"
            className="cl-showroom-arrow"
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            disabled={active === 0}
            aria-label="Poza anterioară"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="cl-showroom-arrow"
            onClick={() => scrollToIndex(Math.min(SHOWROOM_PRACTICE_PHOTOS.length - 1, active + 1))}
            disabled={active === SHOWROOM_PRACTICE_PHOTOS.length - 1}
            aria-label="Poza următoare"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* 2026-09-25 — REFĂCUT, cerut explicit: „comportament premium, efecte
   waw": (1) poza care nu se vede în întregime (a 4-a, „la coadă") stă
   aburită (blur), nu tăiată brut; (2) schimbarea între poze e o tranziție
   reală (layout animation Framer Motion), nu un swap instant de DOM;
   (3) săgeata răspunde la click-uri rapide repetate — bucla e INFINITĂ
   (index modulo lungime, fără `disabled`), fiindcă fereastra de 3 dintr-un
   set de 4 avea DOAR 2 poziții valide (0/1): 3 click-uri rapide loveau
   limita după a doua, a treia „se pierdea". Cu buclă, orice număr de
   click-uri rapide avansează de fiecare dată — nu mai există limită de
   lovit. `activeIndex` e sursa de-adevăr; sloturile vizibile (3 nete + 1
   aburit) se calculează din el, modulo lungime — `key={src}` (identitatea
   pozei, nu poziția) e ce permite `layout` să anime tranziția „glisare",
   nu un fade brut. */
const ShowroomPracticeCarousel = ({ onOpen }: { onOpen: (index: number) => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = SHOWROOM_PRACTICE_PHOTOS.length;
  const goNext = () => setActiveIndex((i) => (i + 1) % total);
  const goPrev = () => setActiveIndex((i) => (i - 1 + total) % total);
  const slots = Array.from({ length: total }, (_, slot) => (activeIndex + slot) % total);

  return (
    <div className="cl-showroom-carousel">
      <div className="cl-showroom-cards">
        <AnimatePresence initial={false}>
          {slots.map((photoIndex, slot) => (
            <motion.button
              key={SHOWROOM_PRACTICE_PHOTOS[photoIndex]}
              layout
              type="button"
              className={`cl-showroom-card${slot >= 3 ? ' cl-showroom-card--peek' : ''}`}
              onClick={() => onOpen(photoIndex)}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Vezi poza mai aproape"
            >
              <img src={SHOWROOM_PRACTICE_PHOTOS[photoIndex]} alt="" className="cl-showroom-card-img" loading="lazy" decoding="async" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="cl-showroom-pagination">
        <div className="cl-showroom-dots">
          {SHOWROOM_PRACTICE_PHOTOS.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`cl-showroom-dot${i === activeIndex ? ' cl-showroom-dot--active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={`Sari la poza ${i + 1}`}
            />
          ))}
        </div>

        <div className="cl-showroom-arrows">
          <button
            type="button"
            className="cl-showroom-arrow"
            onClick={goPrev}
            aria-label="Pozele anterioare"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="cl-showroom-arrow"
            onClick={goNext}
            aria-label="Pozele următoare"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ShowroomPracticeBlock = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const showNext = () => setOpenIndex((i) => (i === null ? i : (i + 1) % SHOWROOM_PRACTICE_GALLERY.length));
  const showPrev = () =>
    setOpenIndex((i) => (i === null ? i : (i - 1 + SHOWROOM_PRACTICE_GALLERY.length) % SHOWROOM_PRACTICE_GALLERY.length));

  return (
    <div ref={ref} className="cl-practice">
      <motion.div
        initial={hidden}
        animate={inView ? SHOW_YB : hidden}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* 2026-09-24 — cerut explicit „textul fără card, la fel ca la
            secțiunea de mai sus" (Practica de pe șantier/KitFlow) —
            `.cl-kit-lead` reutilizat DIRECT, nu o clasă nouă. */}
        <p className="cl-kit-lead">
          Mergem la showroomuri ca să știi cu ce <em>furnizori</em> să lucrezi. Totodată, aceștia te pot ajuta cu detalii tehnice personalizate pentru proiectul tău. Adițional, faci cunoștință cu materialele și piesele pe care le pui în proiect.
        </p>
        <ShowroomPracticeScroller onOpen={setOpenIndex} />
        <ShowroomPracticeCarousel onOpen={setOpenIndex} />
      </motion.div>

      <PhotoLightbox
        photos={SHOWROOM_PRACTICE_GALLERY}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
        onNext={showNext}
        onPrev={showPrev}
        ariaLabel="Poză din showroom"
        variant="showroom"
      />
    </div>
  );
};

const GAINS = [
  { title: 'Softul AutoCAD și 3Ds Max', text: 'Vei lucra cu încredere în AutoCAD, pentru planuri tehnice, și în 3Ds Max, pentru vizualizări 3D și tur virtual.' },
  { title: 'Moodboard complex, în Canva', text: 'Vei executa un moodboard complex, cu stilul potrivit clientului tău, direct în Canva.' },
  { title: 'Măsurători pe șantier', text: 'Vei ști cum se măsoară corect un spațiu și ce instrumente îți trebuie la șantiere.' },
  { title: 'Noțiuni în construcții și design', text: 'Vei cunoaște termenii indispensabili folosiți în designul de interior și întreg procesul de construcție.' },
  { title: 'Procesul de lucru al unui proiect', text: 'Vei cunoaște fiecare etapă, de la măsurători până la predarea proiectului către client.' },
  { title: 'Etapele complicate ale unui șantier', text: 'Vei cunoaște toate detaliile tehnice necesare unui album 2D: zidărie, electricitate, apeduct, canalizare, ventilare, uși, pardoseală.' },
  { title: 'Comunicarea cu clientul', text: 'Vei ști câte convorbiri ai nevoie cu un client și în ce format se desfășoară fiecare.' },
  { title: 'Proiectul final, printat', text: 'Vei executa un proiect implementabil, gata de predat unui potențial client.' },
];

/* Grila de 6 proiecte placeholder a fost SCOASĂ (2026-09-17, cerut explicit)
   — înlocuită de FounderShowcaseCard (mai sus), un singur proiect real
   (Pegas), dovedit cu poză + clip, nu 6 poze reciclate din portofoliul
   general. Dacă vine cerere să se adauge mai multe proiecte reale pe viitor,
   ArcWord (titlul-arc) rămâne rețeta de refolosit — vezi
   reference_component_recipes. */

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
  {
    title: 'Poți lucra pe cont propriu și să prestezi servicii de design:',
    items: ['Pachet full de design', 'Doar volum 2D sau doar 3D', 'Doar moodboard', 'Consultanță online sau pe șantier'],
  },
  {
    title: 'Poți să te angajezi într-o companie:',
    items: ['Vizualizator 3D', 'Proiectant 2D', 'Designer interior'],
  },
];

/* Secțiunea „Procesul de înregistrare" — cerută explicit de clientă
   (Mihaela), 2026-09-01: pașii de la primul mesaj până la prima lecție,
   reformulați la persoana a II-a (ca restul paginii). Aceeași rețetă
   vizuală ca PainCard (rânduri numerotate într-un singur cadru). */
/* 2026-09-11, restrâns explicit („Doar aceste puncte la cum te
   înregistrezi") — 8 → 4 pași. Restul conținutului vechi (instalare softuri,
   grup Telegram, măsurători, lecții înregistrate) a devenit propria
   secțiune, ORGANIZARE_STEPS mai jos — logistica cursului, nu procesul de
   înscriere. */
const REGISTRATION_STEPS = [
  'Ne scrii pe WhatsApp sau Instagram că vrei să te înregistrezi.',
  'Discutăm toate detaliile despre curs și plată.',
  'Achiți avansul de 200€ și ești automat înregistrat la curs.',
  'Semnăm contractul.',
];

/* Secțiunea „Organizare curs" — logistica zilnică a cursului (nu procesul de
   înscriere, vezi nota de la REGISTRATION_STEPS mai sus). Refolosește exact
   rețeta ProcessCard (.cl-pain-frame/.cl-pain-grid/.cl-pain-row/.cl-pain-num
   — deja generică, reciclată de 2 ori pe pagină), vezi OrganizareCard. */
const ORGANIZARE_STEPS = [
  'Stabilim o zi și o oră pentru instalarea softurilor 3Ds Max + Corona și AutoCAD, cu control de la distanță pe calculatorul tău.',
  'La fiecare lecție primești, pe Telegram, linkul de conectare la lecția live de pe Zoom.',
  'Îți trimitem lecția înregistrată imediat ce se termină cea live, ca să revii la ea oricând ai nevoie.',
  'Toată informația și materialele (măsurători, lecții extra, fișiere DWG) sunt organizate în grupul de Telegram al cursului.',
  'Adițional grupului de lucru se crează un grup de discuții libere, unde tu și restul cursanților veți comunica și ajuta reciproc. La necesitate, primești ajutor și feedback din partea profesorilor.',
];

/* Secțiunea „Cum decurge proiectul" — NOUĂ (2026-09-15, cerută explicit),
   bucla lecție→temă→feedback, vezi ExecutionCard mai sus. */
const EXECUTION_STEPS = [
  'Profesorul își partajează ecranul și îți prezintă fiecare pas de proiectare în 2D și 3D.',
  'La finalul lecției avem sesiunea de întrebări și răspunsuri.',
  'Primești înregistrarea lecției și faci tema pentru acasă cu ajutorul ei.',
  'Trimiți tema profesorului, care deschide fișierul și îți scrie feedback la fiecare temă.',
  'Corectezi proiectul și îl retrimiți profesorului. Unele teme sunt verificate live, sâmbăta, cu control de la distanță pe calculatorul tău.',
];

/* Secțiunea „Ce ai nevoie la curs" — NOUĂ (2026-09-11, cerut explicit),
   lista de echipament. 2026-09-14: mutată pe rețeta PainCard (aceeași ca
   ProcessCard/OrganizareCard, vecinele ei directe în pagină — .cl-pain-
   frame/.cl-pain-grid/.cl-pain-row/.cl-pain-num), NU rețeta „Cum lucrăm"
   (.cl-how-modal-list) folosită inițial. Măsurat: cu rețeta veche, cardul
   ieșea la 375px lățime pe mobil (FĂRĂ gutter-ul standard de 24px, lipit de
   margini) și text de 11.5-14px, în timp ce Process/Organizare (imediat
   înainte/după ea) au 327px + 15-18px — secțiunea „Pregătire" ieșea vizibil
   mai mică și dezaliniată față de arhitectura restului paginii. Rețeta
   „Cum lucrăm" rămâne corectă ACOLO (scară redusă, gândită pt. o listă pe
   jumătate de card, lângă un carusel foto — context diferit). */
const NEEDS = [
  'Laptop sau PC cu Windows. Dacă nu ai unul, te ajutăm cu recomandări de specificații',
  'Mouse',
  'Cameră și microfon, ca să vorbim și să ne vedem la curs',
  'Softurile 3Ds Max (multitexture, floorgenerator, Corona, V-Ray) și AutoCAD, pe care le instalăm noi',
];

const NeedsCard = () => {
  const ref = useRef(null);
  const inView = useRevealActive(ref);
  const hidden = useMemo(() => ({ opacity: 0, y: 56 * clScrollDir, filter: 'blur(10px)' }), [clScrollDir]);
  /* wrapper NEUTRU (fără fundal/ramă proprii) — .cl-needs-section e
     `cl-section--tint`, unde gutter-ul de 24px de pe margini nu stă pe
     secțiune (fundalul e full-bleed), ci pe copilul direct
     (`.cl-section--tint > *`). Cardul vizibil (cl-pain-frame) trebuie să fie
     NEPOTUL secțiunii, nu copilul direct — altfel padding-ul propriu al
     cardului câștigă cascada față de padding-ul de gutter (aceeași
     specificitate, dar mai jos în fișier) și rama/fundalul lui tot ajung
     lipite de marginile ecranului. Exact tiparul deja funcțional
     cl-graduation-frame-wrap → cl-graduation-frame, din aceeași familie de
     secțiuni tint. */
  return (
    <div className="cl-needs-frame-wrap">
      <motion.div
        ref={ref}
        className="cl-pain-frame"
        initial={hidden}
        animate={inView ? SHOW_YB : hidden}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="cl-pain-grid">
          {NEEDS.map((text, i) => (
            <div key={text} className="cl-pain-row">
              <span className="cl-pain-num"><span>{i + 1}</span></span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

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

/* planșă de prezentare (ramă + o poză mică + rânduri de text) — „portofoliu
   final", 2026-09-11, înlocuiește IconStory (conceptul vechi, „povești din
   culisele meseriei", a fost scos din listă). */
const IconPortfolio = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.4" y="4" width="17.2" height="16" rx="1.6" stroke="currentColor" strokeWidth="1.5" />
    <rect x="6" y="6.6" width="6.4" height="5.2" rx="0.8" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    <path d="M6 15.2H18M6 17.6H14.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/* reper de locație (pin) cu o stea în interior — „un loc frumos", pentru
   evenimentul de absolvire. */
const IconEvent = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 21C12 21 18.5 14.8 18.5 9.8C18.5 5.9 15.6 3 12 3C8.4 3 5.5 5.9 5.5 9.8C5.5 14.8 12 21 12 21Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M12 7.3L13 9.4L15.2 9.7L13.6 11.3L14 13.6L12 12.5L10 13.6L10.4 11.3L8.8 9.7L11 9.4L12 7.3Z" fill="currentColor" opacity="0.85" />
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
   fundal pt. cardul de Absolvire. 2026-09-28, a doua corecție: revenit la
   forma ORIGINALĂ (contur simplu, nu „bijuterie" plină) — cerut explicit
   „fix cum era" — dar cu conturul mai SUBȚIRE și cu lumina din rama
   cardului (`.cl-graduation-frame`, `rgba(226,163,172,…)`), nu culoarea
   aurie generică de dinainte. Glow-ul vine din CSS (`.cl-graduation-mark`
   filter), nu dintr-un gradient nou pe formă. */
const IconMedal = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="9.4" r="6" stroke="currentColor" strokeWidth="0.6" />
    <circle cx="12" cy="9.4" r="3.5" stroke="currentColor" strokeWidth="0.4" opacity="0.6" />
    <path d="M8.3 14.4L6.5 22L12 18.9L17.5 22L15.7 14.4" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" />
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
/* 2026-09-11, rescris (cerut explicit) — 3 → 4 puncte: „Portofoliu final" e
   nou, „Povești din culisele meseriei" a fost scos, iar ultimul e acum
   evidențiat vizual (`highlight: true` — vezi .cl-graduation-row--highlight
   în CSS). E și punctul care leagă direct de secțiunea „Bonus" de imediat
   după (ședința foto chiar acolo arată pozele — n-am mai dublat un strip de
   poze aici, ar fi fost redundant la un scroll distanță). */
const GRADUATION = [
  { Icon: IconPortfolio, title: 'Portofoliu final', text: 'Finalizezi cursul cu un portofoliu final bine dezvoltat, gata de arătat oricărui client.' },
  { Icon: IconCertificate, title: 'Certificat, cu feedback individual', text: 'La ultima întâlnire primești certificatul de absolvire și treci, punct cu punct, prin tot parcursul tău: ce ai făcut bine, unde mai ai de lucrat.' },
  { Icon: IconEvent, title: 'Absolvire într-un loc frumos', text: 'O absolvire inspirațională, unde fiecare își prezintă proiectul final într-un album, exact ca la un client real.' },
  { Icon: IconSocialBonus, title: 'Ședință foto + social media', text: 'O mini ședință foto pentru prima ta postare pe Instagram, plus un specialist în social media care ne dezvăluie secretele de promovare: cum să-ți prezinți munca și să-ți atragi primii clienți.', highlight: true },
];

/* trenulețul de cursante — poze + poveste + o poză din proiectul lor real
   (2D/3D). Fără citate puse în ghilimele — doar povestea, la toate trei. */
const TESTIMONIALS = [
  {
    name: 'Inesa',
    age: 22,
    photo: '/curs-landing/testimonial-inesa.webp',
    photoPos: '50% 0%',
    story: 'A făcut 2 cursuri NOMA, apoi practică NOMA, apoi a devenit proiectant 2D principal în echipă. De un an lucrează intens la proiecte reale, iar acum face și proiect 3D, full cu tot cu moodboard.',
    project: '/curs-landing/testimonial-inesa-proiect.webp',
    projectRatio: 1000 / 827,
    projectLabel: 'Proiect 2D',
  },
  {
    name: 'Andreea',
    age: 21,
    photo: '/curs-landing/testimonial-andreea.webp',
    photoPos: '50% 15%',
    story: 'A renunțat la jobul de barber ca să învețe design interior la cursul NOMA. A câștigat stagiul de practică în compania noastră și deja execută primul ei proiect: participă la discuțiile cu clientul, a luat măsurători și îl va duce cap-coadă, cu verificarea noastră amănunțită.',
    project: '/curs-landing/testimonial-andreea-proiect.webp',
    projectRatio: 1000 / 915,
    projectLabel: 'Proiect 2D',
  },
  {
    name: 'Ana Maria',
    age: 17,
    photo: '/curs-landing/testimonial-ana.webp',
    photoPos: '50% 15%',
    story: 'Încă elevă la liceu, după finalizarea cursului NOMA lucrează deja la primul ei proiect de design interior: amenajarea unui salon de frumusețe.',
    project: '/curs-landing/testimonial-ana-proiect.webp',
    projectRatio: 1170 / 709,
    projectLabel: 'Proiect full',
  },
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

  /* Echivalentul de hover pe telefon pentru liniile-glow dintre rânduri
     (.cl-pain-row/.cl-format-row/.cl-graduation-row/.cl-gain-row/
     .cl-after-card). `:active` (folosit inițial) se
     aprinde DOAR la un tap static, fără mișcare — dar utilizatorul dă cu
     degetul (swipe/drag) peste rânduri exact cum ar trece mouse-ul peste
     ele pe desktop, iar acolo `:active` nu apucă să se aprindă (gestul e
     recunoscut ca scroll înainte să apuce). Fix: urmărim degetul cu
     `touchmove` + `elementFromPoint`, și punem manual o clasă
     (`.cl-touch-glow`) pe rândul de sub deget — mimează `:hover` continuu,
     ca la mouse. Lenis e DEZACTIVAT pe mobil (vezi mai jos, „window.__lenis
     e undefined"), deci scroll-ul e nativ și coordonatele de viewport din
     `elementFromPoint` rămân corecte în timpul gestului.
     Același listener de `touchstart` mai rezolvă și o hibă separată a
     Safari-ului: fără NICIUN listener de touchstart pe pagină, `:active`
     nu se aplică deloc pe un <div> simplu (fără onClick/href) — a rămas
     util pentru alte elemente cu `:active` propriu (ex. `.cl-video-frame`). */
  useEffect(() => {
    const ROW_SELECTOR =
      '.cl-pain-row, .cl-format-row, .cl-graduation-row, .cl-gains-section .cl-gain-row, .cl-after-card';
    let current: Element | null = null;
    const clear = () => {
      if (current) {
        current.classList.remove('cl-touch-glow');
        current = null;
      }
    };
    const track = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = el ? el.closest(ROW_SELECTOR) : null;
      if (row !== current) {
        clear();
        if (row) {
          row.classList.add('cl-touch-glow');
          current = row;
        }
      }
    };
    document.addEventListener('touchstart', track, { passive: true });
    document.addEventListener('touchmove', track, { passive: true });
    document.addEventListener('touchend', clear, { passive: true });
    document.addEventListener('touchcancel', clear, { passive: true });
    return () => {
      document.removeEventListener('touchstart', track);
      document.removeEventListener('touchmove', track);
      document.removeEventListener('touchend', clear);
      document.removeEventListener('touchcancel', clear);
    };
  }, []);

  const [activeStudent, setActiveStudent] = useState(0);
  /* 2026-09-14 (raportat pe telefon — „tot întârziat"): varianta veche
     ținea un setTimeout de 180ms ÎNAINTE să schimbe activeStudent — cursanta
     activă din trenuleț (glow-ul de sub avatar) rămânea pe cea veche tot
     timpul ăsta, deci un tap nu schimba NIMIC vizual până la 180ms. Acum
     starea se schimbă INSTANT, pe tap — glow-ul de sub avatar și conținutul
     de dedesubt (remount pe key={activeStudent}, vezi mai jos) pornesc
     amândouă din același cadru. Fade-in-ul de 0.18s rămâne (tranziție lină
     la apariție), dar nu mai există nicio pauză înainte de el. */
  const selectStudent = (i: number) => {
    if (i === activeStudent) return;
    setActiveStudent(i);
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

  // lightbox pentru poza de proiect a cursantei — click = vezi mai de-aproape.
  // 2026-09-25 — RE-FĂCUT pe `PhotoLightbox`, componenta GENERICĂ deja
  // folosită la Fondatorii/Showroom/Trusa (cerut explicit: „fix aceleași
  // principii ca la celelalte secțiuni"). Fostul `cl-project-lightbox`
  // bespoke avea un backdrop roz aproape opac (rgba(217,135,147,0.94+),
  // vizibil greșit față de fundalul închis, premium, al tuturor celorlalte
  // lightbox-uri de pe pagină) — scos complet, nu doar recolorat.
  const [projectLightboxOpen, setProjectLightboxOpen] = useState(false);

  // 2026-09-26 — la fel, pentru pozele din bandă Programa (zigzag), cerut
  // explicit: „acum și de la programă să pot să deschid pozele". Galerie
  // navigabilă (nu o singură poză, ca la proiectul cursantei), pe ordinea
  // din CURRICULUM_GALLERY.
  const [curriculumLightboxIndex, setCurriculumLightboxIndex] = useState<number | null>(null);

  /* egalizare coloane Programa (zigzag) — 2026-09-26, ÎNLOCUIT complet cu
     CSS nativ (`align-items:stretch` pe `.cl-zigzag-2col` + `flex:1` pe
     ultimul banner, vezi CursLanding.css). Istoric (de ce a existat cod JS
     aici): trei runde de plafon de scurtare pe ultima poză (55% → scos
     complet → 65% cu raport absolut 4:3) tratau SIMPTOMUL (poza nu se
     alinia cu bannerele) fără să atace CAUZA (bannerele sunt mult mai
     scunde pe ecrane late, deci diferența dintre coloane creștea de 4-5×
     pe desktop față de mobil — 393px vs 116px, măsurat). `align-items:
     stretch` rezolvă cauza nativ, fără nicio măsurătoare — coloana mai
     scurtă primește automat înălțimea celeilalte, iar bannerul ei de
     închidere (`:last-child`) crește el însuși ca s-o umple, în loc de un
     gol invizibil după el. Poza rămâne mereu la raportul ei natural. */
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
            <ClipLine delay={0.32} as="em"><span className="cl-hero-mark">primul client.</span></ClipLine>
          </h1>

          {/* „trenuleț" — bandă în mișcare continuă, nu reveal o singură
              dată: textul intră dintr-o parte, iese pe cealaltă, în buclă.
              Conținutul dublat + translateX(-50%) = buclă perfect continuă
              (fără salt vizibil la capăt). Mască orizontală = fade la
              margini, „apare"/„dispare" lin, nu tăiat brusc. */}
          <div className="cl-hero-sub" aria-hidden="true">
            <div className="cl-hero-sub-track">
              <span className="cl-hero-sub-item">{HERO_SUB_LOOP}</span>
              <span className="cl-hero-sub-item">{HERO_SUB_LOOP}</span>
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

          {/* bandă zig-zag — primele 6 topice (0-5), fiecare împerecheat cu o
              poză reală, alternând baner/poză — DOUĂ coloane independente
              (nu „rânduri"), ca gap-ul dintre elementele consecutive de pe
              ACEEAȘI coloană să fie mereu egal, indiferent cât de înalt e
              elementul de pe coloana alăturată. Parallax pe fiecare poză
              (ZigzagPhoto), independent.
              7-10 continuă banda ca bannere „pure" (fără poză pereche),
              alternând stânga/dreapta. „Prezentarea finală" (10, ULTIMUL)
              închide coloana din DREAPTA.
              2026-09-13 — ÎNCERCARE RESPINSĂ EXPLICIT: am restructurat toată
              banda pe sloturi libere ca să pot lipi bannere fără poză peste
              tot. Userul a corectat: „era bun cum era" — alternanța simplă
              rămâne regula. SINGURA excepție cerută explicit: „Lucrări de
              șantier" (indice 2, doar 2 iteme) arăta prea scurt lângă poza
              lui — acolo, și DOAR acolo, îi punem o pereche de lungime
              CONTRASTANTĂ (nu identică): „Primii clienți" (indice 9, 3
              iteme — deja unul din bannerele „pure" ale cozii din STÂNGA,
              doar mutat mai devreme), lipită direct sub el, fără poză între
              ele. Restul benzii rămâne alternanța standard. */}
          <div className="cl-zigzag cl-zigzag-2col">
            <div className="cl-zigzag-col">
              {renderZigzagBanner(0)}
              {renderZigzagPhoto(1, setCurriculumLightboxIndex)}
              {renderZigzagBanner(2)}
              {renderZigzagBanner(9)}
              {renderZigzagPhoto(3, setCurriculumLightboxIndex)}
              {renderZigzagBanner(4)}
              {renderZigzagPhoto(5, setCurriculumLightboxIndex, 'cl-zigzag-photo--tail2')}
              {renderZigzagBanner(7)}
              {renderZigzagPhoto(6, setCurriculumLightboxIndex, 'cl-zigzag-photo--tail1')}
            </div>
            {/* coloana dreaptă are un item în plus (8 vs 7) → nivelul de jos
                diferă de stânga; alinierea vine nativ din CSS
                (`align-items:stretch` + `flex:1` pe ultimul banner, vezi
                CursLanding.css), nu mai e nevoie de nimic aici. */}
            <div className="cl-zigzag-col cl-zigzag-col--right">
              {/* 2026-09-15, aceeași tehnică (a treia excepție de la alternanța
                  standard — vezi comentariul de mai sus, la coloana stângă):
                  cerut explicit „Poziționarea ta" (8) direct sub „Softul 3Ds
                  Max" (1), fără poză între ele. Poza 2 (care ar fi picat
                  normal după bannerul 1) nu dispare, doar e amânată — apare
                  imediat DUPĂ pereche, înainte de „Psihologia clientului" (3).
                  „Relații profesionale" (5) rămâne direct sub „Psihologia
                  clientului" (3), fără poză — excepția cerută anterior. */}
              {renderZigzagPhoto(0, setCurriculumLightboxIndex)}
              {renderZigzagBanner(1)}
              {renderZigzagBanner(8)}
              {renderZigzagPhoto(2, setCurriculumLightboxIndex)}
              {renderZigzagBanner(3)}
              {renderZigzagBanner(5)}
              {renderZigzagPhoto(4, setCurriculumLightboxIndex)}
              {[6, 10].map((i) => renderZigzagBanner(i))}
            </div>
          </div>

          <PhotoLightbox
            photos={CURRICULUM_GALLERY}
            openIndex={curriculumLightboxIndex}
            onClose={() => setCurriculumLightboxIndex(null)}
            onNext={() => setCurriculumLightboxIndex((i) => (i === null ? i : (i + 1) % CURRICULUM_GALLERY.length))}
            onPrev={() => setCurriculumLightboxIndex((i) => (i === null ? i : (i - 1 + CURRICULUM_GALLERY.length) % CURRICULUM_GALLERY.length))}
            ariaLabel="Poză din programa cursului"
          />
        </section>

        <ClDivider />

        {/* ── CUM LUCRĂM ── */}
        <section className="cl-section cl-section--tint cl-how-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Cum <em>lucrăm</em></h2>
          </Reveal>

          <CursVideoCard />
        </section>

        <ClDivider />

        {/* ── CARNETUL & METRUL ── */}
        <section className="cl-section cl-kit-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Practica de pe <em>șantier</em></h2>
          </Reveal>

          <KitFlow />
        </section>

        <ClDivider />

        {/* ── PRACTICA LA SHOWROOMURI (2026-09-24, secțiune nouă) ── */}
        <section className="cl-section cl-showroom-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Practica la <em>showroomuri</em></h2>
          </Reveal>

          <ShowroomPracticeBlock />
        </section>

        <ClDivider />

        {/* ── CE CÂȘTIGI ── */}
        <section className="cl-section cl-gains-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Beneficiile</span>
            <h2 className="cl-h2">Competențele pe care le obții la <em>curs</em></h2>
          </Reveal>

          <GainsCard />
        </section>

        <ClDivider />

        {/* ── CU CE PLECI ── */}
        <section className="cl-section cl-section--tint cl-deliverables-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Ce rezultat poți<br /><em>obține</em></h2>
          </Reveal>

          <div className="cl-result-pdfs">
            {RESULT_PDFS.map((p, i) => (
              <ResultPdfCard key={p.file} p={p} index={i} />
            ))}
            <ResultTourCard index={RESULT_PDFS.length} />
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
            <h2 className="cl-h2"><span className="cl-h2-line">Evoluția <em>cursanților</em></span> <span className="cl-h2-white">noștri</span></h2>
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
                    {/* montat permanent, ascuns prin opacitate — demontarea la tap
                        făcea inelul să „pocnească" și reseta animația (licărire) */}
                    <span className={`cl-student-tap-hint${isActive ? ' is-hidden' : ''}`} aria-hidden="true" />
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
              permanent. Fără exit aici (simplu remount, instant — vezi
              selectStudent mai sus), doar intrarea are un fade+scale scurt
              (0.18s). 2026-09-14: o variantă anterioară amâna schimbarea
              cu 180ms printr-un wrapper de crossfade — scos, se simțea
              întârziat la tap (vezi comentariul de la selectStudent).
              drag="x" + onDragEnd = swipe cu degetul între cursante;
              dragConstraints 0/0 „arcuiește" ușor cardul (dragElastic) și îl
              trage mereu înapoi la centru — nu se deplasează efectiv, doar
              dă senzația tactilă, schimbarea reală o face selectStudent. */}
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
                    <strong><em>{s.name}, {s.age} ani</em></strong> <span className="cl-testimonial-dash">—</span> {s.story}
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
            style={{ minHeight: testimonialMinH || undefined }}
          >
            <motion.div
              key={activeStudent}
              className="cl-testimonial"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
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
                  <strong><em>{student.name}, {student.age} ani</em></strong> <span className="cl-testimonial-dash">—</span> {student.story}
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
                  </button>
                  <span className="cl-testimonial-project-label">{student.projectLabel}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <ClDivider />

        {/* ── LIGHTBOX poză proiect — click pe poza de mai sus. 2026-09-25:
            componenta GENERICĂ `PhotoLightbox`, aceeași ca la Fondatorii/
            Showroom/Trusa — nu mai un fundal bespoke propriu. Eticheta
            (`projectLabel`) rămâne vizibilă sub poza mică din card
            (`.cl-testimonial-project-label`), deci nu se pierde informația,
            doar caption-ul DIN lightbox — exact ca la celelalte galerii,
            care nici ele n-au caption în lightbox. ── */}
        <PhotoLightbox
          photos={[{ full: student.project, alt: student.projectLabel }]}
          openIndex={projectLightboxOpen ? 0 : null}
          onClose={() => setProjectLightboxOpen(false)}
          onNext={() => {}}
          onPrev={() => {}}
          ariaLabel={student.projectLabel}
        />

        {/* ── PROCESUL DE ÎNREGISTRARE — cerut explicit de clientă,
            2026-09-01: pașii de la primul mesaj până la prima lecție. ── */}
        <section className="cl-section cl-process-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Pas cu pas</span>
            <h2 className="cl-h2">Cum decurge <em>înregistrarea</em></h2>
          </Reveal>

          <ProcessCard />
        </section>

        <ClDivider />

        {/* ── CE AI NEVOIE LA CURS — NOUĂ secțiune (2026-09-11, cerut
            explicit): echipamentul minim, înainte de logistica zilnică
            (Organizare curs, imediat după). TINT — alternează cu vecinele
            ei (Process non-tint, Organizare non-tint), ca restul paginii. ── */}
        <section className="cl-section cl-section--tint cl-needs-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Pregătire</span>
            <h2 className="cl-h2">Ce ai <em>nevoie</em> la curs</h2>
          </Reveal>

          <NeedsCard />
        </section>

        <ClDivider />

        {/* ── ORGANIZARE CURS — NOUĂ secțiune (2026-09-11, cerut explicit):
            logistica zilnică (instalare softuri, Telegram, Zoom, lecții de
            sâmbătă), scoasă din vechiul REGISTRATION_STEPS (acela rămâne
            strict procesul de înscriere, vezi secțiunea de mai sus). ── */}
        <section className="cl-section cl-process-section cl-organizare-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Cum funcționează</span>
            <h2 className="cl-h2">Organizare <em>curs</em></h2>
          </Reveal>

          <OrganizareCard />
        </section>

        <ClDivider />

        {/* ── CUM DECURGE PROIECTUL — NOUĂ secțiune (2026-09-15, cerută
            explicit): bucla lecție→temă→feedback, între Organizare curs
            (logistică zilnică) și Absolvire. ── */}
        <section className="cl-section cl-process-section cl-execution-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Practic</span>
            <h2 className="cl-h2">Cum <em>lucrezi</em> la proiect</h2>
          </Reveal>

          <ExecutionCard />
        </section>

        <ClDivider />

        {/* ── UN CUVÂNT DE LA MIHAELA — 2026-09-25, cerută explicit: clipul
            „ultima-sectiune" (fostul clip din Fondatorii) devine propriul
            card, stil „Nicu" (MihaelaVideoCard), așezat aici, chiar înainte
            de Absolvire. ── */}
        <section className="cl-section cl-section--tint cl-mihaela-video-section">
          <MihaelaVideoCard />
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

        {/* ── BONUS — ședința foto profesională + trenulețul de poze. Mutat
            aici (2026-09-10, cerut explicit) din „Cum lucrăm": e un perk
            separat, nu ține de cum decurg lecțiile. Chiar înainte de „Când
            începe și cât costă". Banda de poze NU stă într-un card (respins
            explicit) — rămâne edge-to-edge. Vezi BonusShootBlock. ── */}
        <section className="cl-section cl-section--tint cl-bonus-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Bonus</span>
            <h2 className="cl-h2">Ședință <span className="cl-h2-line"><em>foto</em> profesională</span></h2>
          </Reveal>

          <BonusShootBlock />
        </section>

        <ClDivider />

        {/* ── FORMAT — logistica cursului (date trimise de client). Mutată
            aici (2026-09-01, cerut explicit de clientă): rubrica de preț nu
            mai apare devreme pe pagină, ca prețul să nu sperie „dintr-o
            dată" înainte ca vizitatorul să vadă tot ce oferă cursul. ── */}
        <section className="cl-section cl-format-section">
          <Reveal className="cl-section-head">
            <h2 className="cl-h2">Formatul acestui <em>curs</em></h2>
          </Reveal>

          <FormatCard />
        </section>

        <ClDivider />

        {/* ── FONDATORII — NOUĂ secțiune (2026-09-15, cerută explicit): dovada
            din spatele cursului. ULTIMA secțiune din pagină (2026-09-18:
            FAQ, care era după ea, a fost ștearsă la cerere — rețeta
            acordeonului rămâne salvată transferabil în memorie). TINT —
            alternează cu vecina (Format non-tint), ca restul paginii.
            Grilă de carduri foto STANDALONE (fiecare cu propria ramă), deci
            NU are nevoie de wrapper-ul „nepot" — aceeași excepție ca la
            Rezultatul final (.cl-result-pdfs). ── */}
        <section className="cl-section cl-section--tint cl-founders-section">
          <Reveal className="cl-section-head">
            <span className="cl-tag">Fondatorii NOMA</span>
            <h2 className="cl-h2"><em>Mihaela</em> și <em>Nicolae</em></h2>
          </Reveal>

          <div className="cl-founders-grid cl-founders-grid--single">
            <FounderShowcaseCard />
          </div>
        </section>

      </main>

      <FloatingCTA />
    </>
  );
};

export default CursLanding;
