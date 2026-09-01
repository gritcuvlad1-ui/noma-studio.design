import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { motion, type Variants } from 'framer-motion';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { canonicalUrl, hreflangLinks, organizationSchema, breadcrumbSchema } from '../utils/seo';
import ImageSlider from '../components/ImageSlider';
import SectionHeader from '../components/SectionHeader';
import { buildSrcSet, smallestSrc } from '../utils/images';
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
  const { t, language } = useLanguage();
  const { projects } = usePortfolio();
  const canonical = canonicalUrl('/portofoliu', language);

  /* Preîncarcă poza hero a fiecărui proiect cât timp userul e pe portofoliu,
     ca la tap pe card poza principală să fie deja în cache (raportat: „poza
     principală apare un pic întârziată" pe telefon).

     Cheia: `imageSrcset` + `imageSizes` IDENTICE cu cele de pe <img>-ul din
     ProjectDetails. Înainte se prefetch-a `project.images[0]` gol (mereu
     originalul), dar hero-ul alege varianta după lățimea ecranului — pe
     desktop ajunge la `-lg`, pe mobil la altceva; browserul descărca deci
     una la prefetch și ALTA la afișare, adică exact dublu, iar întârzierea
     rămânea. Cu descriptorii identici, browserul preîncarcă fix varianta pe
     care o va folosi. */
  useEffect(() => {
    const added: HTMLLinkElement[] = [];
    projects.forEach((project) => {
      const hero = project.images[0];
      if (!hero) return;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = smallestSrc(hero);
      link.setAttribute('imagesrcset', buildSrcSet(hero));
      link.setAttribute('imagesizes', '100vw');
      document.head.appendChild(link);
      added.push(link);
    });
    return () => added.forEach((l) => l.remove());
  }, [projects]);

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
      {/* fără Helmet propriu, pagina moștenea titlul + canonical-ul
          homepage-ului → Google o vedea ca duplicat al paginii principale */}
      <Helmet>
        <html lang={language} />
        <title>{t.seo.portfolioTitle}</title>
        <meta name="description" content={t.seo.portfolioDescription} />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/portofoliu')}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t.seo.portfolioOgTitle} />
        <meta property="og:description" content={t.seo.portfolioOgDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://noma.md/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={t.seo.portfolioOgTitle} />
        <meta name="twitter:description" content={t.seo.portfolioOgDescription} />
        <meta name="twitter:image" content="https://noma.md/og-image.jpg" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              organizationSchema(language),
              {
                '@type': 'WebPage',
                '@id': `${canonical}#webpage`,
                url: canonical,
                name: t.seo.portfolioOgTitle,
                description: t.seo.portfolioDescription,
                breadcrumb: breadcrumbSchema(language, t.nav.home, [
                  { name: t.nav.portfolio, path: '/portofoliu' },
                ]),
              },
            ],
          })}
        </script>
      </Helmet>
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
                to={withLang(`/portofoliu/${project.id}`, language)}
                className="project-card"
                style={{ textDecoration: 'none', display: 'block' }}
                variants={cardVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: false, margin: '0px 0px -12% 0px' }}
              >
                <div className="project-slider">
                  {/* grilă de 2 coloane pe desktop, 1 pe mobil */}
                  <ImageSlider images={sliderImages} sizes="(min-width: 901px) 50vw, 100vw" />
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
