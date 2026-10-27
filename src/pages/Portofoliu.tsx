import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { m as motion, type Variants } from 'framer-motion';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import type { Language } from '../i18n/types';
import { canonicalUrl, hreflangLinks, organizationSchema, breadcrumbSchema } from '../utils/seo';
import ImageSlider from '../components/ImageSlider';
import SectionHeader from '../components/SectionHeader';
import { buildSrcSet, smallestSrc, avifOf } from '../utils/images';
import { usePortfolio } from '../context/PortfolioContext';
import type { Project } from '../data/projects';
import { useRevealActive } from '../components/HomeReveal';
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

// Reveal premium pentru fiecare card de proiect.
/* FĂRĂ blur (2026-10-14, aceeași clasă ca galeria din /portofoliu/:id, raportat
   „scrolul e buguit”). Măsurat pe live, derulare cu rotița, Chrome desktop,
   2 rulări/variantă: cu `filter: blur(8px)` animat pe carduri = 11-34 cadre
   pierdute, înghețări de 117-583 ms; fără = 3 cadre, maxim 33-67 ms. Cardurile
   se reiau la fiecare intrare (useRevealActive), deci blur-ul se re-rasteriza
   la fiecare trecere. NU reintroduce. */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 1.2 },
    },
  },
};

/* Un card independent — hook-ul de reveal (useRevealActive) trebuie apelat
   o dată per instanță de componentă, deci NU poate sta direct în `.map()`
   la nivelul paginii (ar încălca regulile hook-urilor). Extras aici.
   2026-09-14 (cerut explicit — „tot situl la fel de fluid ca /curs"):
   înainte folosea `whileInView`+`viewport:{once:false, margin:'-12%'}` —
   un singur prag de declanșare, exact bug-ul documentat pe /curs („licărire
   haotică la pragul de declanșare" dacă userul se oprește cu scroll-ul
   exact acolo). Înlocuit cu HISTEREZIS (useRevealActive, deja stabilizat
   pe homepage) — apare la 25% vizibil, dispare doar la ieșire completă. */
const ProjectCard = ({
  project,
  index,
  language,
}: {
  project: Project;
  index: number;
  language: Language;
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const active = useRevealActive(ref, 0.25);
  /* Primele carduri (2026-10-24): intrarea la încărcare o face CSS-ul
     (.project-card--intro, Portofoliu.css), cu aceleași valori ca
     `cardVariants`, deci pornește odată cu HTML-ul, nu după JS. Înainte
     cardul stătea la opacity 0 până la hidratare ⇒ poza lui (elementul
     LCP pe telefon) apărea la ~5s în PageSpeed. Framer preia abia după
     prima intrare în ecran (ieșire/reintrare = reveal-ul obișnuit). */
  // primele 2: rândul de sus pe desktop; pe telefon și al doilea e în primul ecran
  const intro = index < 2;
  const [armed, setArmed] = useState(!intro);
  useEffect(() => {
    if (active) setArmed(true);
  }, [active]);
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
      ref={ref}
      id={`project-${project.id}`}
      to={withLang(`/portofoliu/${project.id}`, language)}
      className={intro ? 'project-card project-card--intro' : 'project-card'}
      style={{ textDecoration: 'none', display: 'block' }}
      variants={cardVariants}
      initial={intro ? 'show' : 'hidden'}
      animate={!armed || active ? 'show' : 'hidden'}
    >
      <div className="project-slider">
        {/* grilă de 2 coloane pe desktop, 1 pe mobil */}
        <ImageSlider images={sliderImages} sizes="(min-width: 901px) 50vw, 100vw" />
      </div>

      <div className="project-info">
        <div className="project-header">
          {/* h2 (nu h3): sub h1-ul paginii nu există niciun h2, deci h3 sărea un
              nivel (Lighthouse heading-order). Aspectul vine din .project-name. */}
          <h2 className="project-name">{project.name}</h2>
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
      /* AVIF (2026-10-27): hero-ul din ProjectDetails e <picture> cu AVIF întâi,
         deci prefetch-ul cere același set AVIF (`type` pe link: un browser fără
         AVIF îl ignoră, iar <img>-ul lui cere oricum WebP). */
      link.type = 'image/avif';
      link.href = avifOf(smallestSrc(hero));
      link.setAttribute('imagesrcset', buildSrcSet(hero, false, 'avif'));
      link.setAttribute('imagesizes', '100vw');
      document.head.appendChild(link);
      added.push(link);
    });
    return () => added.forEach((l) => l.remove());
  }, [projects]);

  /* Codul paginii de proiect (~11KB JS + ~21KB CSS), descărcat pe timp liber cât
     userul e pe portofoliu: e singura pagină în care se intră de aici. Pe telefon
     prefetch-ul general (App.tsx) pornește abia la atingerea linkului, iar tap-ul
     aștepta descărcarea (măsurat 2026-10-14: ~0.4s fără nicio reacție, apoi un
     ecran gol). Pe desktop era deja descărcat de prefetch-ul general. */
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const load = () => { void import('./ProjectDetails'); };
    if (w.requestIdleCallback) {
      const idleId = w.requestIdleCallback(load, { timeout: 3000 });
      return () => w.cancelIdleCallback?.(idleId);
    }
    const timer = setTimeout(load, 1500);
    return () => clearTimeout(timer);
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
            as="h1"
            title={t.portfolio.pageTitle}
            className="portfolio-header"
            cssIntro
          />
        </div>
      </section>

      <section className="projects-section">
        <div className="container">
          <div className="projects-grid">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} language={language} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portofoliu;
