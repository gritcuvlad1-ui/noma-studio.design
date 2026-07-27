import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const WRAP_STYLE = {
  width: '100%',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative' as const,
  zIndex: 2,
  margin: '20px 0',
};

const LINE_GRADIENT =
  'linear-gradient(90deg, transparent, rgba(184, 149, 106, 0.3) 15%, rgba(184, 149, 106, 0.9) 50%, rgba(184, 149, 106, 0.3) 85%, transparent)';

const LINE_BASE = {
  width: '100%',
  maxWidth: '1240px',
  height: '2px',
  background: LINE_GRADIENT,
  clipPath: 'polygon(0 50%, 50% 0, 100% 50%, 50% 100%)',
};

// Versiunea animată legată de scroll — montată DOAR pe desktop, ca hook-urile
// useScroll/useTransform să nu ruleze deloc pe mobil (acolo provoacă scroll janky).
const AnimatedDivider = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scaleX = useTransform(scrollYProgress, [0.3, 0.55, 0.85, 1], [0, 1, 1, 0]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.85, 1], [0, 0.8, 0.8, 0]);
  const shineX = useTransform(scrollYProgress, [0, 1], ['-600px', '600px']);
  const shineOpacity = useTransform(scrollYProgress, [0.3, 0.6, 0.9], [0, 0.6, 0]);

  return (
    <div ref={ref} className="nc-divider-luxury-wrap" style={WRAP_STYLE}>
      <motion.div
        className="nc-divider-luxury-line"
        style={{ ...LINE_BASE, scaleX, opacity, transformOrigin: 'center' }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '150px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
          y: '-50%',
          x: shineX,
          opacity: shineOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const ScrollDivider = () => {
  // Pe mobil: linie statică, fără niciun hook de scroll (scroll fluid).
  const [isMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  if (isMobile) {
    return (
      <div className="nc-divider-luxury-wrap" style={WRAP_STYLE}>
        <div className="nc-divider-luxury-line" style={{ ...LINE_BASE, opacity: 0.8 }} />
      </div>
    );
  }

  return <AnimatedDivider />;
};

export default ScrollDivider;
