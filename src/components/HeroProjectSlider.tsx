import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { Project } from '../data/projects';
import { getProjectCoverImage } from '../utils/projectCover';
import { buildSrcSet, smallestSrc } from '../utils/images';
import { IconChevronLeft, IconChevronRight } from './PremiumIcons';
import s from './HeroProjectSlider.module.css';

/* Lățimea REALĂ a banerului, ca browserul să aleagă varianta corectă din
   `srcSet` (oglindește exact regulile din HeroProjectSlider.module.css:
   `calc(100% - 48px)` cu plafon 760px, `- 24px` sub 768px, `- 16px` sub 480px). */
const HERO_SIZES =
  '(max-width: 480px) calc(100vw - 16px), (max-width: 768px) calc(100vw - 24px), min(760px, calc(100vw - 48px))';

interface HeroProjectSliderProps {
  projects: Project[];
  duration?: number;
  autoplay?: boolean;
}

const HeroProjectSlider = ({ 
  projects, 
  duration = 5000,
  autoplay = true 
}: HeroProjectSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  /* stare de „apăsare" pt. săgeți, controlată din JS (Pointer Events), nu
     din CSS `:active` — pe mobil, `:active` rămânea „agățat" după tap
     (bug WebKit cunoscut: click-ul care schimbă slide-ul interferează cu
     ștergerea stării active). Cu JS explicit, efectul pornește la
     pointerdown și se oprește garantat la pointerup/leave/cancel. */
  const [pressedArrow, setPressedArrow] = useState<'left' | 'right' | null>(null);
  
  const { t, language } = useLanguage();

  // Refs for animation & timer state (zero re-renders)
  const progressBarRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const savedProgressRef = useRef<number>(0);
  const isFocusedRef = useRef<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const slides = useMemo(() => projects, [projects]);

  // Aceleași poze „de cover" ca pe cardurile din Portofoliu
  const slideCovers = useMemo(
    () => slides.map((project, i) => getProjectCoverImage(project, i)),
    [slides]
  );

  /* Preîncărcare în DOUĂ etape, cu variante responsive.
     Înainte: TOATE slide-urile porneau deodată, fiecare cu ORIGINALUL (până
     la 1920px / ~480KB) — pe telefon prima poză concura pentru bandă cu încă
     șase, deci apărea vizibil târziu. Acum: `srcset`+`sizes` și pe obiectul
     `Image` (browserul alege exact varianta pe care o va cere și `<img>`-ul
     din DOM, deci descărcarea se refolosește, nu se dublează), prima poză
     singură și prioritară, restul abia după ce prima e gata. */
  const preload = useCallback((i: number, priority: 'high' | 'low') => {
    const src = slideCovers[i];
    if (!src) return;
    const img = new Image();
    (img as unknown as { fetchPriority: string }).fetchPriority = priority;
    img.sizes = HERO_SIZES;
    img.srcset = buildSrcSet(src);
    img.onload = () => {
      setLoadedImages(prev => {
        if (prev.has(src)) return prev;
        const next = new Set(prev);
        next.add(src);
        return next;
      });
      if (i === 0) setIsReady(true);
    };
    img.src = smallestSrc(src);
  }, [slideCovers]);

  useEffect(() => {
    preload(0, 'high');
  }, [preload]);

  useEffect(() => {
    if (!isReady) return;
    const t = setTimeout(() => {
      slideCovers.forEach((_, i) => {
        if (i > 0) preload(i, 'low');
      });
    }, 300);
    return () => clearTimeout(t);
  }, [isReady, slideCovers, preload]);

  // Intersection Observer to stop the RAF loop when slider is out of view
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.05 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Check constraints — prioritized user "wow" experience over strict data-saving
  const checkConstraints = useCallback(() => {
    // If user specifically requested reduced motion in system settings, we honor it
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return autoplay; 
  }, [autoplay]);

  const advanceSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const resetTimer = useCallback((newStartTime = Date.now()) => {
    startTimeRef.current = newStartTime;
    savedProgressRef.current = 0;
    if (progressBarRef.current) {
      /* `transform`, NU `width` — vezi nota din .module.css (.progressFill):
         width = layout per cadru pe firul principal, exact unde rulează
         Lenis; translateX = compus pe GPU, gratuit. */
      progressBarRef.current.style.transform = 'translateX(-100%)';
    }
  }, []);

  const tick = useCallback(() => {
    if (pausedRef.current || !isVisible) {
      rafIdRef.current = requestAnimationFrame(tick);
      return;
    }

    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `translateX(${(progress - 1) * 100}%)`;
    }

    if (progress >= 1) {
      setPrevIndex(currentIndex); // Set current as the background for the next transition
      advanceSlide();
      resetTimer(now);
    }

    rafIdRef.current = requestAnimationFrame(tick);
  }, [duration, advanceSlide, resetTimer]);

  // RESET TIMER with Date.now()
  useEffect(() => {
    const start = () => {
      startTimeRef.current = Date.now();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    // SAFETY FALLBACK for real mobile hardware (Low Power Mode/Throttling)
    // If requestAnimationFrame is paused by the system, this interval ensures slides still change
    const safetyInterval = setInterval(() => {
      if (pausedRef.current) return;
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      if (elapsed >= duration + 100) { // +100ms grace period
        advanceSlide();
        resetTimer(now);
      }
    }, 200);

    if (isReady && autoplay) start();

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      clearInterval(safetyInterval);
    };
  }, [isReady, autoplay, tick, advanceSlide, resetTimer, duration]);

  const pause = useCallback(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (pausedRef.current) return;
    pausedRef.current = true;
    savedProgressRef.current = (Date.now() - startTimeRef.current) / duration;
  }, [duration]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    startTimeRef.current = Date.now() - (savedProgressRef.current * duration);
  }, [duration]);

  // Handle Tab visibility & automatic resume on mobile scroll-away
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) pause();
      else resume();
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [pause, resume]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    resetTimer();
  }, [resetTimer]);

  const next = useCallback(() => {
    advanceSlide();
    resetTimer();
  }, [advanceSlide, resetTimer]);

  const prev = useCallback(() => {
    setCurrentIndex(p => (p - 1 + slides.length) % slides.length);
    resetTimer();
  }, [slides.length, resetTimer]);

  // Main Loop Lifecycle
  useEffect(() => {
    if (!isReady || !checkConstraints()) return;
    startTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafIdRef.current); };
  }, [isReady, tick, checkConstraints]);

  // Visibility & Focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) pause();
      else resume();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocusedRef.current) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pause, resume, next, prev]);

  // Touch Handlers — velocity-based swipe for smoother mobile feel
  useEffect(() => {
    const container = document.getElementById('hps-container');
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      pause();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX.current;
      const dy = touchEndY - touchStartY.current;
      const dt = Date.now() - touchStartTime.current;
      const velocity = Math.abs(dx) / Math.max(dt, 1);

      // Velocity-based: fast swipes need less distance
      const threshold = velocity > 0.5 ? 25 : 50;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx < 0) next();
        else prev();
      }
      
      setTimeout(resume, 250);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pause, resume, next, prev]);

  if (!isReady) {
    return (
      <div className={s.root}>
        <div className={s.skeleton}>
          <div className={s.shimmer} />
        </div>
      </div>
    );
  }

  return (
    <section 
      id="hps-container"
      ref={containerRef}
      className={s.root}
      role="region" 
      aria-label={t.hero.sliderAria}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={() => { isFocusedRef.current = true; }}
      onBlur={() => { isFocusedRef.current = false; }}
      tabIndex={0}
    >
      <div className={s.mask}>
        <div className={s.stage} aria-live="polite" aria-atomic="true">
          {slides.map((slide, i) => {
            const isActive = i === currentIndex;
            const isPrev = i === prevIndex;
            
            // Only render current and previous to save mobile memory
            if (!isActive && !isPrev) return null;

            const coverSrc = slideCovers[i];
            const isLoaded = loadedImages.has(coverSrc);
            
            return (
              <div 
                key={slide.id || i}
                className={`
                  ${s.slide} 
                  ${isActive ? s.slideActive : ''} 
                  ${isPrev ? s.slidePrev : ''}
                `}
                aria-hidden={!isActive}
              >
                {/* DIRECT la pagina proiectului, nu la `/portofoliu#project-<id>`.
                    Varianta cu hash ateriza pe lista de portofoliu și lăsa
                    ancora să se bată cu `ScrollToTop` (care forțează scroll 0
                    la fiecare schimbare de rută) — de-acolo saltul/„buguiala"
                    de pe telefon. Aceeași formă de link ca pe cardurile din
                    Portofoliu (`/portofoliu/:id`). */}
                {isLoaded && (
                  <Link
                    to={withLang(`/portofoliu/${slide.id}`, language)}
                    className={s.imgLink}
                    aria-label={`${t.hero.viewProject} ${slide.name}`}
                  >
                    <img
                      src={smallestSrc(coverSrc)}
                      srcSet={buildSrcSet(coverSrc)}
                      sizes={HERO_SIZES}
                      alt={slide.name}
                      className={s.img}
                      loading={isActive ? "eager" : "lazy"}
                      {...({ fetchpriority: isActive ? 'high' : 'low' } as any)}
                    />
                  </Link>
                )}
                
                <div className={s.overlay} aria-hidden="true" />
                
                <div className={`${s.caption} ${isActive ? s.captionVisible : ''}`}>
                  <span className={s.titleMask}>
                    <h2 className={s.title}>{slide.name}</h2>
                  </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={s.arrows}>
        <button
          className={`${s.arrow} ${s.arrowLeft} ${pressedArrow === 'left' ? s.arrowPressed : ''}`}
          onClick={prev}
          onPointerDown={() => setPressedArrow('left')}
          onPointerUp={() => setPressedArrow(null)}
          onPointerLeave={() => setPressedArrow(null)}
          onPointerCancel={() => setPressedArrow(null)}
          aria-label={t.hero.prevAria}
          type="button"
        >
          <IconChevronLeft size={24} strokeWidth={1.8} />
        </button>
        <button
          className={`${s.arrow} ${s.arrowRight} ${pressedArrow === 'right' ? s.arrowPressed : ''}`}
          onClick={next}
          onPointerDown={() => setPressedArrow('right')}
          onPointerUp={() => setPressedArrow(null)}
          onPointerLeave={() => setPressedArrow(null)}
          onPointerCancel={() => setPressedArrow(null)}
          aria-label={t.hero.nextAria}
          type="button"
        >
          <IconChevronRight size={24} strokeWidth={1.8} />
        </button>
      </div>

      {autoplay && (
        <div className={s.progressBar} aria-hidden="true">
          <div ref={progressBarRef} className={s.progressFill} />
        </div>
      )}

      <nav className={s.dots} aria-label={t.hero.dotsNavAria}>
        {slides.map((slide, i) => (
          <button
            key={`dot-${slide.id || i}`}
            className={`${s.dot} ${i === currentIndex ? s.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={t.hero.slideOfAria.replace('{current}', String(i + 1)).replace('{total}', String(slides.length))}
            aria-current={i === currentIndex ? 'true' : undefined}
            type="button"
          />
        ))}
      </nav>
      </div>
    </section>
  );
};

export default HeroProjectSlider;