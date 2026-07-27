import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import ImageSlider from '../components/ImageSlider';
import SectionHeader from '../components/SectionHeader';
import { usePortfolio } from '../context/PortfolioContext';
import './Portofoliu.css';

// Link animat cu framer-motion
const MotionLink = motion.create(Link);

// Poza fixă afișată pe cardul fiecărui proiect (index card → poziție în allImages).
// Dacă nu e setat aici, cardul folosește sliderul normal (project.images).
const cardCoverImage: Record<number, number> = {
  1: 3,  // Proiect 2 → poza 4 din allImages
  2: 22, // Proiect 3 → poza 23 din allImages
  3: 21, // Proiect 4 → IMG_6026 (după ștergerea pozei IMG_6025)
  5: 26, // Proiect 6 → poza 27 din allImages
  6: 15, // Proiect 7 → poza 16 din allImages
};

// Carduri care afișează doar prima poză din project.images (fără slider)
const cardFirstImageOnly = new Set<number>([0, 4]);

// Reveal premium pentru fiecare card de proiect
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 1.2 },
    },
  },
};

const Portofoliu = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { projects } = usePortfolio();

  // Preîncarcă imaginea hero a fiecărui proiect cât timp utilizatorul e pe pagina portofoliu
  useEffect(() => {
    projects.forEach((project) => {
      if (project.images[0]) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = project.images[0];
        document.head.appendChild(link);
      }
    });
  }, []);

  // Scroll into view logic for hashes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#project-', '');
      const element = document.getElementById(`project-${id}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [location]);

  return (
    <div className="portofoliu">
      <section className="portofoliu-hero">
        <div className="container">
          <SectionHeader
            title={t.portfolio.pageTitle}
            className="portfolio-header"
          />
        </div>
      </section>

      <section className="projects-section">
        <div className="container">
          <div className="projects-grid">
            {projects.map((project, index) => {
              const coverIdx = cardCoverImage[index];
              const sliderImages =
                project.coverImage
                  ? [project.coverImage]
                  : cardFirstImageOnly.has(index)
                  ? project.images.slice(0, 1)
                  : coverIdx !== undefined && project.allImages && project.allImages[coverIdx]
                    ? [project.allImages[coverIdx]]
                    : project.images;
              return (
              <MotionLink
                key={project.id}
                id={`project-${project.id}`}
                to={`/portofoliu/${project.id}`}
                className="project-card"
                style={{ textDecoration: 'none', display: 'block' }}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, margin: '0px 0px -12% 0px' }}
              >
                <div className="project-slider">
                  <ImageSlider images={sliderImages} />
                </div>

                <div className="project-info">
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                  </div>
                  
                  <div className="project-meta">
                    <span>{project.location}</span>
                    <span className="meta-dot"></span>
                    <span>{project.year}</span>
                  </div>

                  <p className="project-description">{project.description}</p>
                </div>
              </MotionLink>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portofoliu;
