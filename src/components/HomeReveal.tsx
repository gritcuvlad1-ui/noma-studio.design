import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { m as motion, useInView } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   SISTEMUL DE REVEAL AL HOMEPAGE-ULUI — un singur mecanism, folosit
   de toate secțiunile, ca ritmul de apariție să fie identic peste tot.

   Principiul cerut: fiecare card/titlu urcă de jos, aburit, și se
   limpezește pe măsură ce se ridică — pe rând, unul câte unul.

   Trei reguli plătite deja cu bug-uri pe acest proiect, încorporate aici
   ca să nu mai fie reinventate la fiecare secțiune:

   1. ȚINTA FINALĂ E `filter: none`, CURĂȚAT CU `transitionEnd`.
      Framer nu poate interpola direct `blur(8px)` → `none`, deci animăm
      spre `blur(0px)`, iar `transitionEnd` scrie `none` exact când
      animația s-a terminat. Un `filter` ≠ none rămas inline (chiar și
      `blur(0px)`) ține elementul pe o suprafață de filtrare
      re-rasterizată la fiecare cadru — de acolo veneau „aburul agățat"
      și licărirea pe WebKit.
      `transitionEnd` (nu `useState` + `onAnimationComplete`) ⇒ zero
      re-render React la finalul fiecărui reveal: curățarea o face
      framer, în același ciclu de animație.

   2. `noFilter` PENTRU ORICE BLOC CU ANIMAȚIE INFINITĂ ÎNĂUNTRU
      (trenuleț, carusel, clip video care rulează, plutire idle).
      Acolo nu se pune deloc cheia `filter` — nici măcar tranzitoriu.
      Rămâne doar opacity + y, care nu creează suprafață de filtrare.

   3. OBIECTE STABILE, LA NIVEL DE MODUL. Un obiect nou la fiecare
      render (chiar cu aceleași valori) poate re-declanșa tranziția când
      părintele re-randează din alt motiv (un click oriunde în pagină) —
      exact „vibrația" raportată altădată pe carduri deja vizibile.
═══════════════════════════════════════════════════════════════ */

/* expo-out — curba standard „de lux": pornește repede, se așază lung și
   lin. Aceeași cu cea folosită deja pe /curs și pe titlurile homepage-ului. */
export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

/* 2026-10-19, cerut de Vlad („site-ul se mișcă greu pe telefon, elementele
   apar întârziat; aceleași principii ca /curs, doar puțin mai rapid”).
   Actualizat 2026-10-19 (a doua rundă): valorile sunt COPIATE de pe /curs
   (CursLanding.tsx: CARD_BLUR, cardEnter, TITLE_FOG_HIDDEN, titleFogEnter),
   ~18% mai rapide, cum a cerut Vlad: cardurile y 56px + blur 10px, titlurile
   abur pe loc (opacitate 0.35→1, blur 6px, fără alunecare), curbe identice.
   Două cauze, ambele de TIMING (nu de aspect):
   1. Declanșarea: elementele porneau abia când 20-25% din ele era deja în
      ecran, deci omul vedea gol, apoi începea animația. Acum pornesc cu
      marja pozitivă de jos (ca pe /curs: intrarea începe ÎNAINTE să intre
      în ecran, „reveal pe rânduri pornește înainte”).
   2. Durata: 1.0-1.2s pe fiecare piesă; pe /curs cardurile intră în 0.7s și
      titlurile în 0.9s. Aceeași curbă (expo-out), durate la nivelul /curs.
   Aspectul (abur, y, ordine) rămâne neschimbat. */
const REVEAL_MARGIN = '0px 0px 14% 0px' as const;
const RESET_MARGIN = '0px 0px 32% 0px' as const;
/* /curs: carduri 0.56s, titluri 0.72s ⇒ aici −18%: 0.46s și 0.6s */
const T_PIECE = 0.6;
const T_CARD = 0.46;
const T_TITLE = 0.6;
/* ca cardEnter din /curs: poziția/opacitatea pe curba semnătură, FILTRUL pe o
   curbă uniformă (easeInOutSine), deci aburul se limpezește treptat */
const CARD_TRANSITION = {
  duration: T_CARD,
  ease: REVEAL_EASE,
  filter: { duration: T_CARD, ease: [0.37, 0, 0.63, 1] as const },
};
const TITLE_FOG_HIDDEN = { opacity: 0.35, y: 0, filter: 'blur(6px)' };
const TITLE_FOG_SHOW = { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };

/* Exportate: elementele care nu pot folosi <Reveal> ca atare (au nevoie de
   `onAnimationComplete` propriu) trebuie să anime EXACT aceleași valori, din
   ACELEAȘI obiecte stabile — altfel ies din ritmul cascadei sau, mai rău,
   ratează curățarea filtrului (bug prins în test: `blur(0px)` rezidual). */
export const HIDDEN_BLUR = { opacity: 0, y: 34, filter: 'blur(8px)' };
/* `transitionEnd` = valorile scrise DUPĂ ce animația s-a terminat; aici
   curăță suprafața de filtrare (vezi regula 1). */
export const SHOW_BLUR = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
  transitionEnd: { filter: 'none' },
};

const HIDDEN_PLAIN = { opacity: 0, y: 32 };
const SHOW_PLAIN = { opacity: 1, y: 0 };

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Decalajul față de trigger. Piesele unui bloc primesc delay crescător
   *  ⇒ apar una câte una, dar TOATE pornite de același prag de scroll. */
  delay?: number;
  /** Fără `filter` deloc — obligatoriu dacă înăuntru rulează o animație
   *  infinită (marquee, carusel, clip video, plutire idle negatată). */
  noFilter?: boolean;
  /** Trigger PARTAJAT, dat de secțiune. Fără el, componenta își face
   *  singură unul (util pt. blocuri independente). Un trigger comun +
   *  delay-uri diferite = cascadă controlată; triggere separate pe fiecare
   *  piesă = apariție în trepte, la coordonate Y diferite („robotizat"). */
  active?: boolean;
  /** Cât din element trebuie să fie vizibil ca să pornească (doar când
   *  componenta își face singură trigger-ul). */
  amount?: number;
  style?: React.CSSProperties;
}

export const Reveal = ({
  children,
  className = '',
  delay = 0,
  noFilter = false,
  active,
  amount = 0.2,
  style,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  /* se REIA la fiecare trecere (cerut 2026-10-19: „de câte ori trec, mereu
     efectele prezente"), cu histerezis, nu once:true */
  const selfInView = useRevealActive(ref, amount);
  const inView = active !== undefined ? active : selfInView;

  const hidden = noFilter ? HIDDEN_PLAIN : HIDDEN_BLUR;
  const shown = noFilter ? SHOW_PLAIN : SHOW_BLUR;

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={hidden}
      animate={inView ? shown : hidden}
      transition={{ duration: T_PIECE, ease: REVEAL_EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

/* ── Titluri: CLIP-REVEAL, nu opacity+blur ──
   Textul rămâne 100% opac și urcă din spatele unei măști. Motivul e un bug
   documentat pe acest proiect: pe iOS Safari, animarea lui `opacity`/
   `filter:blur()` PE TEXT face WebKit să re-rasterizeze antialiasing-ul ⇒
   flash alb pe litere. Pe carduri/poze (au suprafață proprie) aburul e
   perfect sigur — pe text, nu.
   Mișcarea e aceeași ca la carduri (urcă de jos), doar mecanismul diferă.

   OBLIGATORIU un rând per mască: text pe mai multe rânduri într-un singur
   `overflow:hidden` + translateY = bug iOS în care titlul nu mai apare deloc. */
export const RevealLine = ({
  children,
  delay = 0,
  active,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  active: boolean;
  className?: string;
}) => (
  /* 2026-10-19, cerut: titlurile să apară ca pe /curs. Înainte: clip-reveal
     (urca din spatele unei măști). Acum: ABUR pe loc, fără alunecare (la fel
     ca titlurile /curs: opacitate 0.35→1, blur 6px, curbă uniformă). `.sh-clip`
     rămâne doar pentru geometrie (padding/margin negativ), dar fără
     overflow:hidden (ar tăia aburul): clasa --fog. */
  <div className="sh-clip sh-clip--fog">
    <motion.span
      className={className}
      style={{ display: 'block' }}
      initial={TITLE_FOG_HIDDEN}
      animate={active ? TITLE_FOG_SHOW : TITLE_FOG_HIDDEN}
      transition={{ duration: T_TITLE, ease: [0.37, 0, 0.63, 1], delay }}
    >
      {children}
    </motion.span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   RevealCard — bloc MARE (card întreg, panou), care se REPETĂ la
   fiecare trecere prin secțiune (once:false) și intră direcțional
   (de sus sau de jos, după sensul scroll-ului) — cerut explicit:
   „de câte ori trec pe lângă o secțiune, atâtea ori să apară frumos
   din spate, aburit".

   NU e o reinventare — e exact rețeta deja verificată și stabilizată
   pe /curs (CursLanding.tsx: PainCard/GainsCard/AfterCard), mutată
   aici ca s-o poată folosi și homepage-ul. Rețeta aia a trecut deja
   prin bug-ul opus (tremur/licărire) și a fost fixată cu HISTEREZIS —
   nu-l reinventăm, îl copiem 1:1.

   De ce <Reveal> de mai sus rămâne separat (NU e înlocuit): pe /curs,
   once:false aplicat pe ZECI de elemente mici simultan (titluri,
   rânduri de text) a cauzat exact tremurul documentat — de-aia acolo
   s-a revenit la once:true pentru orice NU e un card mare, unic pe
   ecran. Aceeași regulă se aplică și aici: RevealCard e rezervat
   BLOCURILOR MARI (un card întreg, un panou întreg) — titlurile
   (RevealLine) și cascadele fine rămân once:true.
═══════════════════════════════════════════════════════════════ */

/* UN SINGUR listener de scroll pentru toată pagina (nu per element —
   exact anti-pattern-ul care cauza tremurul documentat), variabilă
   simplă la nivel de modul, citită direct de RevealCard (closure, fără
   prop-drilling). +1 = derulezi în JOS (elementele intră de JOS); -1 =
   derulezi în SUS (elementele intră de SUS — „vin de unde vii tu"). */
let homeScrollDir: 1 | -1 = 1;
let homeLastScrollY = 0;

export const useScrollDirectionTracker = () => {
  useEffect(() => {
    homeLastScrollY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - homeLastScrollY) > 4) {
        homeScrollDir = y > homeLastScrollY ? 1 : -1;
        homeLastScrollY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
};

/* HISTEREZIS — cu un singur prag, un card oprit exact pe linia de
   declanșare comută inView true↔false la fiecare cadru = tremur
   haotic. Fix: DOUĂ praguri, cu o zonă moartă largă între ele.
   - APARE la 25% vizibil.
   - DISPARE (se resetează pt. următoarea intrare) DOAR când elementul
     a ieșit COMPLET din ecran (niciun pixel vizibil).
   Între cele două praguri nu se întâmplă nimic, deci nu poate oscila. */
export const useRevealActive = (ref: RefObject<Element>, amount: number = 0.25) => {
  const pastThreshold = useInView(ref, { amount, margin: REVEAL_MARGIN });
  /* RESETAREA se face la o marjă MAI MARE decât PORNIREA (zonă moartă între
     14% și 32%): cu aceeași marjă, un titlu oprit chiar la muchia zonei de
     pornire comuta activ↔inactiv la fiecare pixel de scroll și reporneau
     aburul în buclă = „vibrează” (raportat 2026-10-19). */
  const anyVisible = useInView(ref, { amount: 'some', margin: RESET_MARGIN });
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (pastThreshold) setActive(true);
    else if (!anyVisible) setActive(false);
  }, [pastThreshold, anyVisible]);

  return active;
};

/* ── LINIE DELIMITATOARE între secțiuni — copiată de pe /curs (ClDivider):
   se desenează din centru (scaleX 0→1) ȘI se limpezește din blur 6px, la
   fiecare intrare (histerezis). Culoarea = a homepage-ului (vișiniu #7d4448,
   cel din titluri), nu roz ca pe /curs. Ca la /curs, trigger pe un wrapper
   simplu (un nod cu scaleX:0 are aria 0 și n-ar intra niciodată în view). ── */
export const HomeDivider = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useRevealActive(wrapRef, 0.01);
  return (
    <div ref={wrapRef} className="home-divider-wrap" aria-hidden="true">
      <motion.div
        className="home-divider"
        style={{ originX: 0.5 }}
        initial={DIVIDER_HIDDEN}
        animate={inView ? DIVIDER_SHOW : DIVIDER_HIDDEN}
        transition={DIVIDER_TRANSITION}
      />
    </div>
  );
};

const DIVIDER_HIDDEN = { scaleX: 0, opacity: 0, filter: 'blur(6px)' };
const DIVIDER_SHOW = { scaleX: 1, opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };
/* /curs: 0.8s / filtru 0.9s ⇒ −18% */
const DIVIDER_TRANSITION = {
  duration: 0.65,
  ease: REVEAL_EASE,
  filter: { duration: 0.74, ease: [0.37, 0, 0.63, 1] as const },
};

const CARD_SHOW = {
  opacity: 1,
  y: 0,
  filter: 'blur(0px)',
  transitionEnd: { filter: 'none' },
};
const CARD_SHOW_NOFILTER = { opacity: 1, y: 0 };

interface RevealCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** cât se deplasează la intrare (px), înmulțit cu direcția scroll-ului */
  y?: number;
  /** Fără `filter` deloc — obligatoriu dacă înăuntru rulează ceva continuu
   *  (video, carusel, marquee): un blur TRANZITORIU peste conținut care
   *  oricum se re-desenează în fiecare cadru poate lăsa „abur agățat" pe
   *  WebKit (vezi regula 2 din capul fișierului). */
  noFilter?: boolean;
  /** apelat o dată, la finalul FIECĂREI intrări (nu doar prima) — pt.
   *  cazurile în care o animație idle continuă (plutire) trebuie să
   *  pornească abia DUPĂ ce filtrul a dispărut complet. */
  onEnter?: () => void;
  /** cât din element trebuie să fie vizibil ca să (re)pornească intrarea */
  amount?: number;
}

export const RevealCard = ({ children, className = '', style, y = 56, noFilter = false, onEnter, amount = 0.25 }: RevealCardProps) => {
  useScrollDirectionTracker();
  const ref = useRef<HTMLDivElement>(null);
  const active = useRevealActive(ref, amount);
  /* `entered` = intrarea s-a terminat (filtrul e deja `none`). Expus ca
     data-fog, ca pe /curs (Fog): CSS-ul poate amâna elementele sensibile
     (ex. umbra butonului CTA) până după abur. */
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (!active) setEntered(false); }, [active]);
  /* obiect stabil, NU recreat la fiecare render — vezi regula 3 de mai
     sus. `homeScrollDir` citit direct în deps: nu e reactiv (variabilă
     simplă, nu state), dar la fiecare re-render natural al componentei
     (declanșat chiar de schimbarea lui `active`) ia valoarea curentă —
     exact momentul în care avem nevoie de direcția „proaspătă". */
  const hidden = useMemo(
    () => (noFilter ? { opacity: 0, y: y * homeScrollDir } : { opacity: 0, y: y * homeScrollDir, filter: 'blur(10px)' }),
    [y, noFilter, homeScrollDir]
  );
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      data-fog={active && entered ? 'on' : 'off'}
      initial={hidden}
      animate={active ? (noFilter ? CARD_SHOW_NOFILTER : CARD_SHOW) : hidden}
      transition={CARD_TRANSITION}
      onAnimationComplete={() => { if (active) { setEntered(true); onEnter?.(); } }}
    >
      {children}
    </motion.div>
  );
};
