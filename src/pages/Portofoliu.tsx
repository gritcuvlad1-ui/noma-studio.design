import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import ImageSlider from '../components/ImageSlider';
import SectionHeader from '../components/SectionHeader';
import { projects } from '../data/projects';
import './Portofoliu.css';

const Portofoliu = () => {
  const location = useLocation();
  const { t } = useLanguage();

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

  // IntersectionObserver for Staggered Reveal Animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Unobserve after trigger for constant state
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.noma-reveal, .blur-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="portofoliu">
      <section className="portofoliu-hero">
        <div className="container">
          <SectionHeader 
            title={t.portfolio.pageTitle}
            subtitle={t.portfolio.pageSubtitle}
            className="portfolio-header"
          />
        </div>
      </section>

      <section className="projects-section">
        <div className="container">
          <div className="projects-grid">
            {projects.map((project, index) => (
              <Link
                key={project.id}
                id={`project-${project.id}`}
                to={`/portofoliu/${project.id}`}
                className="project-card noma-reveal"
                style={{ 
                  '--delay': `${Math.min(index * 0.15, 0.6)}s`,
                  textDecoration: 'none',
                  display: 'block'
                } as React.CSSProperties}
              >
                <div className="project-slider">
                  <ImageSlider images={project.images} />
                </div>

                <div className="project-info">
                  <div className="project-header">
                    <h3 className="project-name">{project.name}</h3>
                    <span className="project-tag">{project.tag}</span>
                  </div>
                  
                  <div className="project-meta">
                    <span>{project.location}</span>
                    <span className="meta-dot"></span>
                    <span>{project.year}</span>
                  </div>

                  <p className="project-description">{project.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portofoliu;
