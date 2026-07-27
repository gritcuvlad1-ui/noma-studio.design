import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Project } from '../data/projects';
import { getProjectCoverImage } from '../utils/projectCover';
import { IconChevronRight } from './PremiumIcons';
import s from './HeroProjectShowcase.module.css';

/* ────────────────────────────────────────────────────────────────
   Showcase desktop pentru banerul de proiecte (stil galerie editorială):
   bandă orizontală cu poze pe „piramidă" — cea din centru mai SUS și mai
   mare, vecinele mai jos; în spatele pozei centrale, un dreptunghi cald
   nisipiu mai mare decât poza (ramă passe-partout, culoare fixă per
   proiect). Fără săgeți-butoane: cursorul devine ‹ / › după jumătatea
   secțiunii în care e mouse-ul, iar click-ul mută caruselul cu un pas.
   Doar desktop — pe mobil rămâne HeroProjectSlider (noma1 clasic).
──────────────────────────────────────────────────────────────── */

/* pasul dintre centrele sloturilor + scara pozelor laterale — aceleași
   valori și în CSS (lățimea .item), nu le modifica separat */
const SPACING = 396;
const SIDE_SCALE = 0.82;
const OFFSETS = [-3, -2, -1, 0, 1, 2, 3]; // ±3 randate ca marginile să nu „pocnească" pe ecrane late

/* rame calde, nisipoase — atribuite determinist per proiect (nu chiar
   random: aceeași poză primește mereu aceeași ramă, fără licărit la re-render) */
const FRAME_COLORS = ['#d9c19c', '#c9a08a', '#cbab7f', '#dcc7a4', '#c69f74', '#d4b18e'];

const AUTOPLAY_MS = 5000;

const mod = (c: number, n: number) => ((c % n) + n) % n;

const HeroProjectShowcase = ({ projects }: { projects: Project[] }) => {
  /* poziție CONTINUĂ (poate crește oricât) — offset-ul fiecărui item față de
     ea decide slotul; la schimbare, fiecare item alunecă lin un pas, iar
     capetele intră/ies din afara ecranului (carusel infinit fără salt) */
  const [pos, setPos] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLSpanElement>(null);
  const pausedRef = useRef(false);
  const visibleRef = useRef(true);

  const n = projects.length;
  const covers = useMemo(
    () => projects.map((p, i) => getProjectCoverImage(p, i)),
    [projects]
  );

  const step = useCallback((dir: 1 | -1) => setPos(p => p + dir), []);

  /* autoplay blând — intervalul se recreează la fiecare pas (deci un click
     manual resetează implicit cronometrul) */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      if (!pausedRef.current && visibleRef.current && !document.hidden) {
        setPos(p => p + 1);
      }
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [pos]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* cursor custom: urmărește mouse-ul direct prin ref (zero re-render);
     glifa se întoarce ‹ / › după partea în care e față de centrul scenei */
  const onMove = useCallback((e: React.MouseEvent) => {
    const stage = stageRef.current, cur = cursorRef.current, glyph = glyphRef.current;
    if (!stage || !cur || !glyph) return;
    const r = stage.getBoundingClientRect();
    cur.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`;
    glyph.style.transform = e.clientX - r.left > r.width / 2 ? 'scaleX(1)' : 'scaleX(-1)';
  }, []);

  const onClick = useCallback((e: React.MouseEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    step(e.clientX - r.left > r.width / 2 ? 1 : -1);
  }, [step]);

  if (n === 0) return null;

  const active = projects[mod(pos, n)];

  return (
    <section className={s.root} role="region" aria-label="Proiecte showcase">
      <div
        ref={stageRef}
        className={s.stage}
        onMouseMove={onMove}
        onClick={onClick}
        onMouseEnter={() => { pausedRef.current = true; if (cursorRef.current) cursorRef.current.style.opacity = '1'; }}
        onMouseLeave={() => { pausedRef.current = false; if (cursorRef.current) cursorRef.current.style.opacity = '0'; }}
      >
        {OFFSETS.map((off) => {
          const c = pos + off;               // identitatea continuă a slotului
          const projIdx = mod(c, n);
          const isCenter = off === 0;
          return (
            <motion.div
              key={c}
              className={s.item}
              style={{ zIndex: 4 - Math.abs(off) }}
              initial={{ opacity: 0, x: off * SPACING, y: 34, scale: SIDE_SCALE }}
              animate={{
                opacity: 1,
                x: off * SPACING,
                y: isCenter ? -22 : 34,      // piramidă: centrul mai sus decât vecinii
                scale: isCenter ? 1 : SIDE_SCALE,
              }}
              transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* rama passe-partout — vizibilă doar în spatele pozei centrale */}
              <motion.div
                className={s.frame}
                style={{ background: FRAME_COLORS[projIdx % FRAME_COLORS.length] }}
                animate={{ opacity: isCenter ? 1 : 0, scale: isCenter ? 1 : 0.92 }}
                transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              />
              <img
                src={covers[projIdx]}
                alt={projects[projIdx].name}
                className={s.photo}
                draggable={false}
                loading={Math.abs(off) <= 1 ? 'eager' : 'lazy'}
                {...({ fetchpriority: isCenter ? 'high' : 'low' } as any)}
              />
            </motion.div>
          );
        })}

        {/* cursorul ‹ / › — poziționat direct din onMove */}
        <div ref={cursorRef} className={s.cursor} aria-hidden="true">
          <span ref={glyphRef} className={s.cursorGlyph}>
            <IconChevronRight size={30} strokeWidth={1.4} />
          </span>
        </div>
      </div>

      {/* legenda proiectului activ — sub bandă, crossfade la schimbare */}
      <div className={s.captionZone} aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            className={s.caption}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.3, ease: 'easeIn' } }}
          >
            <h2 className={s.captionTitle}>{active.name}</h2>
            <p className={s.captionText}>{active.description}</p>
            <Link to={`/portofoliu#project-${active.id}`} className={s.captionLink}>
              Vezi proiectul
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HeroProjectShowcase;
