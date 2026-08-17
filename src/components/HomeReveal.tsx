import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

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

const HIDDEN_PLAIN = { opacity: 0, y: 34 };
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
  const selfInView = useInView(ref, { once: true, amount });
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
      transition={{ duration: 1.1, ease: REVEAL_EASE, delay }}
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
  <div className="sh-clip">
    <motion.span
      className={className}
      style={{ display: 'block' }}
      initial={{ y: '150%' }}
      animate={active ? { y: '0%' } : { y: '150%' }}
      /* 1.2s, nu 1.4: măsurat pe browser real, la 1.4s al doilea rând de titlu
         încă urca în timp ce primul card era deja la 65% opacitate — cele două
         se suprapuneau. Acum titlul aterizează înainte să intre cardurile. */
      transition={{ duration: 1.2, ease: REVEAL_EASE, delay }}
    >
      {children}
    </motion.span>
  </div>
);
