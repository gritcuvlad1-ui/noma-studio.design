import { Link } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { usePortfolio } from '../context/PortfolioContext';
import { getProjectCoverImage } from '../utils/projectCover';
import { buildSrcSet, smallestSrc } from '../utils/images';
import { NOT_FOUND_COPY, NOT_FOUND_PHOTO_SIZES } from './notFoundCopy';
import './NotFound.css';

/* Pagina afișată pentru adresele inexistente la navigarea din INTERIORUL
   aplicației (rută `*` din App.tsx). La încărcarea directă a unei adrese
   inexistente, serverul răspunde cu 404.html (generat la build din aceleași
   texte, vezi scripts/notFoundPage.ts), nu cu această pagină.
   `noindex, follow`: Google nu indexează adresa greșită, dar urmărește
   linkurile spre paginile reale. FĂRĂ canonical și FĂRĂ hreflang, intenționat. */
const NotFound = () => {
  const { language } = useLanguage();
  const { projects } = usePortfolio();
  const c = NOT_FOUND_COPY[language] ?? NOT_FOUND_COPY.ro;

  const project = projects[0];
  const cover = project ? getProjectCoverImage(project, 0) : null;

  return (
    <div className="notfound-page">
      <Helmet>
        <html lang={language} />
        <title>{c.pageTitle} | NOMA Studio</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="notfound-container">
        <div className="notfound-copy">
          <h1 className="notfound-title">{c.title}</h1>
          <p className="notfound-text">{c.text}</p>
          <Link className="notfound-cta" to={withLang('/contact', language)}>
            {c.cta}
          </Link>
          <ul className="notfound-links">
            <li><Link to={withLang('/', language)}>{c.home}</Link></li>
            <li><Link to={withLang('/servicii', language)}>{c.services}</Link></li>
            <li><Link to={withLang('/portofoliu', language)}>{c.portfolio}</Link></li>
          </ul>
        </div>
        {project && cover && (
          <Link
            className="notfound-photo"
            to={withLang(`/portofoliu/${project.id}`, language)}
            aria-label={`${c.viewProject} ${project.name}, ${project.location}`}
          >
            <span className="notfound-photo-frame">
              <img
                className="notfound-photo-img"
                src={smallestSrc(cover)}
                srcSet={buildSrcSet(cover)}
                sizes={NOT_FOUND_PHOTO_SIZES}
                alt={project.name}
                loading="lazy"
                decoding="async"
              />
            </span>
            <span className="notfound-photo-caption">
              {project.name}, {project.location}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
