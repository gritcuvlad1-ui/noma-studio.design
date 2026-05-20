import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollDivider = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scaleX = useTransform(scrollYProgress, [0.3, 0.55, 0.85, 1], [0, 1, 1, 0]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.85, 1], [0, 0.8, 0.8, 0]);

  return (
    <div 
      ref={ref} 
      className="nc-divider-luxury-wrap"
      style={{ 
        width: '100%', 
        height: '40px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        margin: '20px 0'
      }}
    >
      <motion.div 
        className="nc-divider-luxury-line"
        style={{ 
          width: '100%',
          maxWidth: '1240px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(184, 149, 106, 0.3) 15%, rgba(184, 149, 106, 0.9) 50%, rgba(184, 149, 106, 0.3) 85%, transparent)',
          clipPath: 'polygon(0 50%, 50% 0, 100% 50%, 50% 100%)',
          scaleX,
          opacity,
          transformOrigin: 'center'
        }}
      />

      {/* Moving Shine/Glint effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '150px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
          y: '-50%',
          x: useTransform(scrollYProgress, [0, 1], ['-600px', '600px']),
          opacity: useTransform(scrollYProgress, [0.3, 0.6, 0.9], [0, 0.6, 0]),
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default ScrollDivider;
