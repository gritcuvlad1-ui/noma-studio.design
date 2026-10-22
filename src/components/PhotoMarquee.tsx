import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m as motion } from 'framer-motion';
import { X } from 'lucide-react';
import ResponsivePicture from './ResponsivePicture';
import './PhotoMarquee.css';

/* ═══════════════════════════════════════════════════════════════
   Trenuleț de poze + lightbox — COPIE 1:1 a rețetei de pe /curs
   (CursLanding.tsx: DragMarquee, PhotoLightbox, useScrollLock), mutată aici
   ca s-o poată folosi homepage-ul (cerut 2026-10-19: „fix ca pe /curs, să
   pot deschide pozele, să dau scroll singur, iar cât e deschisă o poză să
   nu se mai poată derula pagina"). Valorile (viteze, praguri, durate) sunt
   identice cu /curs; /curs NU a fost atins.
═══════════════════════════════════════════════════════════════ */

/* blochează derularea paginii cât e deschis un strat (ca pe /curs):
   body overflow:hidden (tastatură, desktop fără Lenis) + Lenis oprit pe
   desktop; pe telefon stratul are touch-action:none în CSS. */
export const useScrollLock = (active: boolean) => {
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

/* homepage e pregenerată: portalul se montează abia pe client */
const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient;
};

/* ── motorul benzii: merge singură, se oprește sub deget, se trage și se
   aruncă cu inerție; stă pe loc cât e deschis lightbox-ul ── */
const CRUISE_SPEED = 40; // px/s
const SPEED_TAU = 0.5; // s, revenirea lină spre croazieră
const MAX_FLING = 2600; // px/s

export const DragMarquee = ({
  srcs,
  cls,
  sizes,
  onOpen,
  open,
  openLabel,
}: {
  srcs: string[];
  cls: string;
  sizes: string;
  onOpen: (index: number) => void;
  open: boolean;
  openLabel: string;
}) => {
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

  useEffect(() => {
    pausedRef.current = open;
  }, [open]);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

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
    const cruise = reduce ? 0 : CRUISE_SPEED;

    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const one = oneWidthRef.current;
      if (one > 0) {
        if (!draggingRef.current && !pausedRef.current) {
          speedRef.current += (cruise - speedRef.current) * (1 - Math.exp(-dt / SPEED_TAU));
          offsetRef.current += speedRef.current * dt;
        }
        offsetRef.current = ((offsetRef.current % one) + one) % one;
        track.style.transform = `translateX(${-offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(frame);
    };
    /* rulează doar cât banda e pe ecran (ca vechea bandă a homepage-ului) */
    const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(viewport);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, [srcs.length]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    speedRef.current = 0;
    sampleRef.current = { x: e.clientX, t: performance.now() };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4 && !movedRef.current) {
      movedRef.current = true;
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    if (!movedRef.current) return;
    offsetRef.current = startOffsetRef.current - dx;
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
    if (performance.now() - sampleRef.current.t > 90) speedRef.current = 0;
    speedRef.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, speedRef.current));
  };

  const openImage = (index: number) => {
    if (movedRef.current) return;
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
        {[0, 1].map((copy) =>
          srcs.map((src, i) => (
            <button
              key={`${copy}-${src}`}
              type="button"
              className={`${cls}-item`}
              onClick={() => openImage(i)}
              aria-hidden={copy === 1 || undefined}
              tabIndex={copy === 1 ? -1 : undefined}
              aria-label={openLabel}
            >
              <ResponsivePicture
                src={src}
                sizes={sizes}
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

/* ── lightbox: swipe stânga/dreapta între poze, tap pe jumătatea stângă/
   dreaptă a ecranului, swipe în jos = închide, Escape, scroll blocat,
   barele browserului în culoarea lui (#100b09) ── */
const OVERLAY_EASE = [0.33, 1, 0.68, 1] as const;
const OVERLAY_EASE_OUT = [0.4, 0, 1, 1] as const;

export const PhotoLightbox = ({
  photos,
  openIndex,
  onClose,
  onNext,
  onPrev,
  ariaLabel,
  closeLabel,
}: {
  photos: { full: string; alt: string }[];
  openIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  ariaLabel: string;
  closeLabel: string;
}) => {
  const isClient = useIsClient();
  useScrollLock(openIndex !== null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, onClose, onNext, onPrev]);

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
      if (canNav) {
        if (e.clientX < window.innerWidth / 2) onPrev();
        else onNext();
      }
      return;
    }
    if (Math.abs(d.dy) > Math.abs(d.dx)) {
      if (d.dy > 80) onClose();
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
          key="nm-photo-lightbox"
          className="nm-photo-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: OVERLAY_EASE_OUT } }}
          transition={{ duration: 0.5, ease: OVERLAY_EASE }}
        >
          <div className="nm-photo-lightbox-scrim nm-photo-lightbox-scrim--top" aria-hidden="true" />
          <div className="nm-photo-lightbox-scrim nm-photo-lightbox-scrim--bottom" aria-hidden="true" />
          <div className="nm-photo-lightbox-backdrop" aria-hidden="true" />
          <button type="button" className="nm-photo-lightbox-close" onClick={onClose} aria-label={closeLabel}>
            <X size={20} strokeWidth={1.5} />
          </button>
          <motion.div
            key={openIndex}
            className="nm-photo-lightbox-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onPointerDown={onContentPointerDown}
            onPointerMove={onContentPointerMove}
            onPointerUp={onContentPointerUp}
            onPointerCancel={onContentPointerUp}
          >
            <img src={current.full} alt={current.alt} className="nm-photo-lightbox-img" draggable={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
