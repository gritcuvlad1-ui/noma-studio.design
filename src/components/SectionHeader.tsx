import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { m as motion, useInView, Variants } from 'framer-motion';

// useLayoutEffect pe client, useEffect la pregenerare (în Node nu există layout)
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface SectionHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  centered?: boolean;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
}

// ── Stagger framer-motion (același pattern ca galeria de la detalii) ──
const headerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0, delayChildren: 0 },
  },
};

// Clip-reveal: textul urcă din spatele unei măști. FĂRĂ opacity → fără comutare
// de antialiasing pe iOS → imposibil să flickeze. Efect premium „rise up".
const headerItem: Variants = {
  hidden: { y: '115%' },
  show: {
    y: '0%',
    transition: { duration: 1.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const SectionHeader = ({
  title,
  subtitle,
  eyebrow,
  centered = true,
  className = '',
  delay = 0,
  as = 'h2',
  id,
}: SectionHeaderProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const MotionComponent = motion[as] as any;

  /* isMobile: fals la hidratare, apoi setat în useLayoutEffect, ÎNAINTE de
     primul cadru afișat (2026-10-11). Înainte era citit direct din window la
     prima randare: HTML-ul pregenerat (build, fără ecran) are mereu structura
     desktop, iar pe telefon React găsea alta (div.sh-clip) ⇒ eroarea #418 și
     re-randarea paginii de la zero (/blog, /servicii). Comutarea rămâne fără
     licărire: se face înainte de paint, iar titlul e invizibil în ambele
     variante până pornește animația (opacity 0 / y 115% în mască). */
  const [isMobile, setIsMobile] = useState(false);
  useIsoLayoutEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches);
  }, []);

  // ── MOBIL: framer-motion stagger, exact ca pozele din galeria de detalii ──
  if (isMobile) {
    return (
      <motion.div
        ref={ref}
        className={`section-header-luxury ${centered ? 'text-center' : ''} ${className}`}
        variants={headerContainer}
        initial="hidden"
        animate="show"
      >
        {eyebrow && (
          <div className="sh-clip">
            <motion.span className="section-eyebrow" variants={headerItem} style={{ display: 'inline-block' }}>
              {eyebrow}
            </motion.span>
          </div>
        )}

        <div className="sh-clip">
          <MotionComponent className="editorial-title" variants={headerItem} id={id}>
            {title}
          </MotionComponent>
        </div>

        {subtitle && (
          <div className="sh-clip">
            <motion.p className="section-subtitle" variants={headerItem}>
              {subtitle}
            </motion.p>
          </div>
        )}
      </motion.div>
    );
  }

  // ── DESKTOP: animația framer-motion originală (neatinsă) ──
  const EASE = [0.22, 1, 0.36, 1] as const;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (d: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: EASE, delay: d },
    }),
  };

  return (
    <div
      ref={ref}
      className={`section-header-luxury ${centered ? 'text-center' : ''} ${className}`}
    >
      <motion.div custom={delay} initial="hidden" animate={isInView ? 'show' : 'hidden'} variants={fadeUp}>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <MotionComponent className="editorial-title" id={id}>{title}</MotionComponent>

        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </motion.div>
    </div>
  );
};

export default SectionHeader;
