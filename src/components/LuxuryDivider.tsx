import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface LuxuryDividerProps {
  className?: string;
  delay?: number;
}

const LuxuryDivider = ({ className = '', delay = 0.2 }: LuxuryDividerProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  return (
    <div 
      ref={ref} 
      className={`divider-luxury-full ${className}`}
      aria-hidden="true"
    >
      <motion.div 
        className="line-main"
        style={{ originX: 0.5 }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay }}
      />
    </div>
  );
};

export default LuxuryDivider;
