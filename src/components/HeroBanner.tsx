import { motion } from 'framer-motion';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <section className="hb-hero-section" aria-label="NOMA Studio Hero">
      <div className="hb-hero-container">
        
        {/* ── Giant Editorial Title (Outside/Behind the Banner) ── */}
        <div className="hb-title-wrapper-outside">
          <motion.h1 
            className="hb-hero-title-outside"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hb-title-line-1">PURE</span>
            <span className="hb-title-line-2">DESIGN.</span>
          </motion.h1>
        </div>

        {/* ── Clean 3D Floating Image Banner (No dark card background!) ── */}
        <div className="hb-clean-banner-container">
          <motion.div
            className="hb-clean-image-wrapper-3d"
            initial={{ opacity: 0, scale: 0.96, y: 40, rotateX: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 2 }}
            transition={{ delay: 0.2, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ 
              y: -12, 
              rotateX: 4,
              rotateY: -1,
              scale: 1.015,
              transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            }}
          >
            <img
              src="/hero-villa.webp"
              alt="NOMA Premium Architecture and Interior Design"
              className="hb-clean-hero-img"
              draggable={false}
              loading="eager"
            />
            <div className="hb-clean-img-overlay" />
            
            {/* Minimalist Corner Labels directly on the image banner! */}
            <div className="hb-image-labels">
              <span className="hb-img-label-left">NOMA STUDIO / 2026</span>
              <span className="hb-img-label-right">CHISINAU, MD</span>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default HeroBanner;
