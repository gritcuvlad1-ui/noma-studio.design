import React from 'react';
import { motion, useInView, Variants } from 'framer-motion';
import { useRef } from 'react';

interface SectionHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  centered?: boolean;
  className?: string;
  delay?: number;
}

const SectionHeader = ({ 
  title, 
  subtitle, 
  eyebrow, 
  centered = true, 
  className = '', 
  delay = 0 
}: SectionHeaderProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const EASE = [0.22, 1, 0.36, 1] as const;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: (d: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: EASE, delay: d }
    })
  };

  const lineVariants: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    show: (d: number) => ({
      scaleX: 1,
      opacity: 0.6,
      transition: { duration: 1.4, ease: EASE, delay: d + 0.3 }
    })
  };

  const diamondVariants: Variants = {
    hidden: { scale: 0.001, opacity: 0, rotate: 45 },
    show: (d: number) => ({
      scale: 1,
      opacity: 0.8,
      rotate: 45,
      transition: { duration: 0.8, ease: EASE, delay: d + 0.2 }
    })
  };

  return (
    <div 
      ref={ref}
      className={`section-header-luxury ${centered ? 'text-center' : ''} ${className}`}
      style={{ marginBottom: '1.5rem' }}
    >
      <motion.div
        custom={delay}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        variants={fadeUp}
      >
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2 className="editorial-title">
          {title}
        </h2>
        
        {/* Type A Divider (Centered Diamond) */}
        <div className="divider-luxury-center" aria-hidden="true">
          <motion.span 
            className="line" 
            custom={delay}
            variants={lineVariants}
            style={{ transformOrigin: 'right center' }}
          />
          <motion.span 
            className="diamond" 
            custom={delay}
            variants={diamondVariants}
          />
          <motion.span 
            className="line" 
            custom={delay}
            variants={lineVariants}
            style={{ transformOrigin: 'left center' }}
          />
        </div>

        {subtitle && <p className="section-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>{subtitle}</p>}
      </motion.div>
    </div>
  );
};

export default SectionHeader;
