import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import { IconArrowRight } from './PremiumIcons';
import './SplineDesignSection.css';

/* Secțiune „Cursuri" de pe homepage — invitație clickabilă spre /cursuri.
   (Am înlocuit scena 3D Spline, grea pe WebGL, cu un card vizual ușor.) */

// PLACEHOLDER — se poate înlocui cu poza preferată (un proiect reprezentativ)
const COURSE_IMG = '/portofoliu-studio4/IMG_1355.webp';

const SplineDesignSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -18% 0px' });

  return (
    <section className="spline-section" aria-label="Cursuri design interior NOMA School">
      <div className="spline-inner" ref={ref}>

        {/* LEFT — text */}
        <motion.div
          className="spline-text"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="spline-title">
            Învață design<br /><em>de la zero</em>
          </h2>
          {/* pe mobil, textul e înlocuit de pilulele de peste poză (mai jos) —
              vezi .spline-desc, .spline-cta în CSS, ascunse sub 900px */}
          <p className="spline-desc">
            Cursuri practice de design interior — de la concept la execuție.
            Ghidaj profesional, proiecte reale și un portofoliu gata de prezentare.
          </p>
          <Link to="/cursuri" className="spline-cta">
            <span>Vezi cursurile</span>
            <IconArrowRight size={15} strokeWidth={2} />
          </Link>
        </motion.div>

        {/* RIGHT — card vizual clickabil spre /cursuri */}
        <motion.div
          className="course-visual-wrap"
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 40, filter: 'blur(8px)' }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <Link to="/cursuri" className="course-visual" aria-label="Vezi cursurile NOMA School">
            <img
              className="course-visual-img"
              src={COURSE_IMG}
              alt="Proiect realizat la cursurile NOMA School"
              loading="lazy"
            />
            <span className="course-visual-overlay" aria-hidden="true" />
            <span className="course-visual-shimmer" aria-hidden="true" />

            {/* DOAR mobil (CSS, sub 900px) — înlocuiesc titlul mic + textul
                descriptiv de lângă card (redundante pe mobil, unde cardul
                stă direct sub titlul principal): două repere scurte, câte
                unul în fiecare colț de sus, înclinate în oglindă (stânga
                negativ/dreapta pozitiv) — ca insignele de pe /curs. */}
            <div className="course-visual-points" aria-hidden="true">
              <span
                className="course-visual-point course-visual-point--left"
                style={{ '--tilt': '-5deg' } as React.CSSProperties}
              >
                <Check size={9} strokeWidth={3.5} />
                Ghidaj profesional
              </span>
              <span
                className="course-visual-point course-visual-point--right"
                style={{ '--tilt': '5deg' } as React.CSSProperties}
              >
                <Check size={9} strokeWidth={3.5} />
                Proiecte reale
              </span>
            </div>

            <div className="course-visual-foot">
              <span className="course-visual-go">
                Vezi cursurile
              </span>
            </div>
          </Link>
        </motion.div>

      </div>
    </section>
  );
};

export default SplineDesignSection;
