import React, { useRef } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { PLAN_VB, PLAN_DARK, PLAN_RED, PLAN_SOLID, PLAN_LABELS } from './planTehnicPaths';

/* ────────────────────────────────────────────────────────────
   Plan tehnic — geometrie 1:1 extrasă din PDF, redată ca line-art
   care se „desenează" LEGAT DE SCROLL (nu de timp). Astfel:
     • derulezi repede → desenul apare instant, FĂRĂ lag/coadă;
     • derulezi lin    → liniile cresc fluid odată cu scroll-ul (smooth).
   Logica desenului (cum ar gândi un arhitect):
     FAZA 1  – întâi se conturează TOATĂ forma apartamentului (pereții, w 1.3);
     FAZA 2  – pe la mijloc începe să apară MOBILIERUL (w 0.6);
     FAZA 3  – săgeți, linii indicatoare, apoi etichetele text.
   Date în planTehnicPaths.ts (simplificat & ușor pentru perf).
──────────────────────────────────────────────────────────── */
const INK = '#1d1611';   // negru cald — linii & numere camere
const RED = '#9c3222';   // roșu-cărămiziu, saturat — etichete mobilier (lizibil, nu pal)

// Centroid aproximativ al unui path (media perechilor x,y) — îl folosim ca să
// ordonăm apariția „de la perete spre interior", nu de sus în jos.
const [VBW, VBH] = PLAN_VB;
function centroid(d: string): { x: number; y: number } {
  const nums = d.match(/-?\d*\.?\d+/g);
  if (!nums) return { x: VBW / 2, y: VBH / 2 };
  let sx = 0, sy = 0, n = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    sx += parseFloat(nums[i]);
    sy += parseFloat(nums[i + 1]);
    n++;
  }
  return n ? { x: sx / n, y: sy / n } : { x: VBW / 2, y: VBH / 2 };
}
type PlanGroupC = { w: number; d: string; cx: number; cy: number };
const withC = (g: { w: number; d: string }): PlanGroupC => {
  const c = centroid(g.d);
  return { w: g.w, d: g.d, cx: c.x, cy: c.y };
};

// Pereți = liniile groase (structura/forma). Se construiesc pornind dintr-un
// colț al planului și „înconjoară" conturul — nu o mătură de sus în jos.
const WALLS: PlanGroupC[] = PLAN_DARK.filter((g) => g.w >= 1)
  .map(withC)
  .sort((a, b) => Math.hypot(a.cx, a.cy) - Math.hypot(b.cx, b.cy));

// Mobilier = liniile fine (detalii). Apar element cu element DE LA PERETE spre
// interior: piesele lipite de pereți (aproape de margini) ies primele, apoi
// cele din centru. → senzația că mobilierul „crește" din pereți.
const distEdge = (cx: number, cy: number) => Math.min(cx, cy, VBW - cx, VBH - cy);
const FURNITURE: PlanGroupC[] = PLAN_DARK.filter((g) => g.w < 1)
  .map(withC)
  .sort((a, b) => distEdge(a.cx, a.cy) - distEdge(b.cx, b.cy));

// Fereastra de progres (0→1) alocată fiecărei faze. Se suprapun puțin ca
// trecerea pereți→mobilier să fie continuă, fără pauză moartă.
const WALL_FROM = 0.02, WALL_TO = 0.50, WALL_WIN = 0.16;
// Fereastră mai îngustă pe mobilier → fiecare piesă se desenează mai distinct,
// „cate un element", nu un front continuu unic.
const FURN_FROM = 0.46, FURN_TO = 0.92, FURN_WIN = 0.10;
// Etichete: fereastră îngustă per element → val succesiv de apariții, nu tot
// blocul de text deodată (mult mai multe „valuri" suprapuse => senzație lină).
// PORNESC MAI DEVREME (0.72, nu 0.84): „pat", „canapea" etc. apăreau prea
// târziu (trebuia scroll mai jos ca să le vezi) — acum vin odată cu mobilierul.
const LABEL_FROM = 0.72, LABEL_TO = 0.98, LABEL_WIN = 0.06;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Intervalul [start, end] de progres în care se desenează elementul `i` din `n`.
// `win` = cât „durează" o linie pe axa de scroll; suprapunerea dă front continuu.
function rangeFor(i: number, n: number, from: number, to: number, win: number): [number, number] {
  const start = n <= 1 ? from : lerp(from, Math.max(from, to - win), i / (n - 1));
  return [start, Math.min(start + win, to)];
}

/* O linie care se desenează: pathLength legat de progresul scroll-ului.
   opacity sare la 1 chiar înainte de start ca să nu rămână un punct (linecap
   round) vizibil pe pathLength 0. */
const DrawLine: React.FC<{
  p: MotionValue<number>;
  d: string;
  w: number;
  start: number;
  end: number;
}> = ({ p, d, w, start, end }) => {
  const pathLength = useTransform(p, [start, end], [0, 1], { clamp: true });
  const opacity = useTransform(p, [Math.max(0, start - 0.004), start], [0, 1], { clamp: true });
  return <motion.path d={d} strokeWidth={w} style={{ pathLength, opacity }} />;
};

/* Variantă FĂRĂ pathLength — doar fade pe opacity. Grupurile de mobilier sunt
   hașuri/texturi extrase 1:1 din PDF (sute de sub-trasee M/L într-un singur
   `d`); animarea stroke-dasharray/pathLength pe un path atât de complex e
   foarte costisitoare de randat pe fiecare cadru de scroll (asta cauza lag-ul
   la scroll pe homepage). Fade-ul pe opacity e compositor-only → ieftin. */
const FadeLine: React.FC<{
  p: MotionValue<number>;
  d: string;
  w: number;
  start: number;
  end: number;
}> = ({ p, d, w, start, end }) => {
  const opacity = useTransform(p, [start, end], [0, 1], { clamp: true });
  return <motion.path d={d} strokeWidth={w} style={{ opacity }} />;
};

/* O etichetă text care apare succesiv, cu un mic „pop" (fade + urcare scurtă),
   legată tot de scroll — nu de timp, deci nu se dezacordează la scroll rapid. */
const LabelReveal: React.FC<{
  p: MotionValue<number>;
  start: number;
  end: number;
  children: React.ReactNode;
}> = ({ p, start, end, children }) => {
  const opacity = useTransform(p, [start, end], [0, 1], { clamp: true });
  const dy = useTransform(p, [start, end], [3, 0], { clamp: true });
  return (
    <motion.g style={{ opacity, y: dy }}>
      {children}
    </motion.g>
  );
};

/* Element care doar apare (fill: săgeți, etichete) — fade legat de scroll. */
const FadeIn: React.FC<{
  p: MotionValue<number>;
  from: number;
  to: number;
  children: React.ReactNode;
  asGroup?: boolean;
  groupProps?: React.SVGProps<SVGGElement>;
  pathProps?: React.SVGProps<SVGPathElement> & { d: string };
}> = ({ p, from, to, children, asGroup, groupProps, pathProps }) => {
  const opacity = useTransform(p, [from, to], [0, 1], { clamp: true });
  if (asGroup) {
    return (
      <motion.g style={{ opacity }} {...groupProps}>
        {children}
      </motion.g>
    );
  }
  return <motion.path style={{ opacity }} {...pathProps} />;
};

const ProjectInquirySketch: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);

  /* Progresul brut: 0 când planul intră de jos în cadru, 1 când iese pe sus.
     (offset cu margini numite = robust; remapăm noi intervalul util mai jos.) */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  /* Remap: desenul începe cum intră în cadru și se TERMINĂ mai DEVREME
     (progres brut ~0.4, planul încă puțin peste centru) — astfel când
     secțiunea e complet vizibilă, TOATE elementele (pereți+mobilier+etichete)
     sunt deja desenate, nu prinzi ultimele linii încă în lucru. */
  const draw = useTransform(scrollYProgress, [0.06, 0.4], [0, 1]);

  // Spring rigid & supraamortizat: netezește micro-sacadările (smooth), dar se
  // aliniază aproape instant la poziția de scroll — la derulare rapidă desenul
  // NU rămâne în urmă (fără lag/coadă).
  const p = useSpring(draw, { stiffness: 500, damping: 50, mass: 0.2 });

  return (
    <svg
      ref={ref}
      viewBox={`-6 -6 ${PLAN_VB[0] + 12} ${PLAN_VB[1] + 12}`}
      className="inquiry-arch-svg"
      fill="none"
      stroke={INK}
      strokeLinejoin="round"
      strokeLinecap="round"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NOMA Studio — plan tehnic de amenajare al apartamentului"
      role="img"
    >
      <g>
        {/* FAZA 1 — pereții: se conturează întâi toată forma apartamentului */}
        {WALLS.map((g, i) => {
          const [start, end] = rangeFor(i, WALLS.length, WALL_FROM, WALL_TO, WALL_WIN);
          return <DrawLine key={`w${i}`} p={p} d={g.d} w={g.w} start={start} end={end} />;
        })}

        {/* FAZA 2 — mobilierul: apare pe la mijloc (fade, nu draw — sunt
            hașuri complexe, vezi comentariul de la FadeLine) */}
        {FURNITURE.map((g, i) => {
          const [start, end] = rangeFor(i, FURNITURE.length, FURN_FROM, FURN_TO, FURN_WIN);
          return <FadeLine key={`f${i}`} p={p} d={g.d} w={g.w} start={start} end={end} />;
        })}

        {/* săgeți intrare / ieșire balcon (umplute) */}
        <FadeIn p={p} from={0.82} to={0.92} pathProps={{ d: PLAN_SOLID, fill: INK, stroke: 'none' }} />

        {/* linii de indicație spre mobilier (subtile) */}
        <FadeIn
          p={p}
          from={0.86}
          to={0.97}
          pathProps={{ d: PLAN_RED, stroke: RED, strokeWidth: 0.4, strokeOpacity: 0.7 }}
        />

        {/* etichete text — numere cameră + mobilier, toate subțiri (weight 400,
            nu mai gros — numerele camerelor la 500 arătau prea groase).
            Apar succesiv („în val"), nu tot blocul deodată — mai creativ. */}
        <g fontFamily="'Inter', system-ui, sans-serif">
          {PLAN_LABELS.map((l, i) => {
            const isRoom = l.c === 'ink';
            const [start, end] = rangeFor(i, PLAN_LABELS.length, LABEL_FROM, LABEL_TO, LABEL_WIN);
            return (
              <LabelReveal key={i} p={p} start={start} end={end}>
                <text
                  x={l.x}
                  y={l.y}
                  fontSize={isRoom ? l.s : Math.max(l.s, 9)}
                  fill={isRoom ? INK : RED}
                  fillOpacity={isRoom ? 0.85 : 1}
                  stroke="none"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={l.a ? `rotate(${l.a} ${l.x} ${l.y})` : undefined}
                  style={{ fontWeight: 400, letterSpacing: isRoom ? '0.03em' : '0.005em' }}
                >
                  {l.t}
                </text>
              </LabelReveal>
            );
          })}
        </g>
      </g>
    </svg>
  );
};

export default ProjectInquirySketch;
