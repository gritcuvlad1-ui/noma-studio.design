import { Link } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { LEGAL_CONTENT, type LegalBlock, type LegalKind } from '../data/legalContent';
import {
  canonicalUrl,
  hreflangLinks,
  SITE_URL,
  organizationSchema,
  breadcrumbSchema,
} from '../utils/seo';
import './BlogPost.css';

/* Pagină legală (/privacy, /terms). Refolosește EXACT stilul articolelor de
   blog (clasele `post-*` din BlogPost.css: aceeași lățime de 720px, aceleași
   fonturi, culori și nota „de completat" cu margine aurie), ca să arate ca
   restul site-ului. Conținutul vine din src/data/legalContent.ts. */

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

function renderBlock(block: LegalBlock, i: number) {
  switch (block.type) {
    case 'h2':
      return <h2 key={i}>{block.text}</h2>;
    case 'ul':
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    case 'note':
      return (
        <p key={i} className="post-note">
          {block.text}
        </p>
      );
    default:
      return <p key={i}>{block.text}</p>;
  }
}

const LegalPage = ({ kind }: { kind: LegalKind }) => {
  const { t, language } = useLanguage();
  const c = LEGAL_CONTENT[kind][language] ?? LEGAL_CONTENT[kind].ro;
  const path = `/${kind}`;
  const canonical = canonicalUrl(path, language);

  return (
    <div className="post-page">
      <Helmet>
        <html lang={language} />
        <title>{c.seoTitle}</title>
        <meta name="description" content={c.seoDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />
        {hreflangLinks(path)}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={c.seoTitle} />
        <meta property="og:description" content={c.seoDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={c.seoTitle} />
        <meta name="twitter:description" content={c.seoDescription} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              organizationSchema(language),
              {
                '@type': 'WebPage',
                '@id': `${canonical}#webpage`,
                url: canonical,
                name: c.title,
                description: c.seoDescription,
                inLanguage: language,
                dateModified: c.updatedIso,
                breadcrumb: breadcrumbSchema(language, t.nav.home, [{ name: c.title, path }]),
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="post-container">
        <nav className="post-back" aria-label={t.nav.home}>
          <Link to={withLang('/', language)}>{t.nav.home}</Link>
        </nav>

        <article className="post-article">
          <header className="post-header">
            <h1 className="post-title">{c.title}</h1>
            <p className="post-meta">
              {c.updatedPrefix}: <time dateTime={c.updatedIso}>{c.updatedLabel}</time>
            </p>
          </header>

          <div className="post-body">{c.body.map(renderBlock)}</div>
        </article>
      </div>
    </div>
  );
};

export default LegalPage;
