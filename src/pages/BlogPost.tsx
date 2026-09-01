import { Link, useParams } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { postBySlug, type BlogBlock } from '../data/blogPosts';
import {
  canonicalUrl,
  SITE_URL,
  ORG_ID,
  organizationSchema,
  breadcrumbSchema,
} from '../utils/seo';
import './BlogPost.css';

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

function renderBlock(block: BlogBlock, i: number) {
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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();

  const post = postBySlug(slug);
  const content = post?.translations[language];

  /* Articolul există, dar nu în limba curentă (traducerile sunt opționale —
     vezi nota din data/blogPosts.ts). NU randăm conținut din altă limbă și
     NU lăsăm pagina indexabilă: `noindex` + trimitere înapoi la listă. */
  if (!post || !content) {
    return (
      <div className="post-page">
        <Helmet>
          <html lang={language} />
          <meta name="robots" content="noindex, follow" />
          <title>{t.blog.pageTitle}</title>
        </Helmet>
        <div className="post-container">
          <p className="post-missing">
            <Link to={withLang('/blog', language)}>{t.blog.pageTitle}</Link>
          </p>
        </div>
      </div>
    );
  }

  const canonical = canonicalUrl(`/blog/${post.slug}`, language);
  const dateLabel = post.dateLabel[language] ?? post.date;
  /* Doar limbile în care articolul CHIAR există — `hreflangLinks()` din
     utils/seo emite mereu toate trei, ceea ce aici ar trimite Google spre
     variante inexistente. */
  const availableLangs = Object.keys(post.translations) as Array<typeof language>;

  return (
    <div className="post-page">
      <Helmet>
        <html lang={language} />
        <title>{`${content.title} | NOMA Studio`}</title>
        <meta name="description" content={content.excerpt} />
        <link rel="canonical" href={canonical} />
        {availableLangs.map((lang) => (
          <link
            key={`hl-${lang}`}
            rel="alternate"
            hrefLang={lang}
            href={canonicalUrl(`/blog/${post.slug}`, lang)}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={canonicalUrl(`/blog/${post.slug}`, availableLangs[0])}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={content.excerpt} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.title} />
        <meta name="twitter:description" content={content.excerpt} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              organizationSchema(language),
              {
                '@type': 'BlogPosting',
                '@id': `${canonical}#article`,
                headline: content.title,
                description: content.excerpt,
                datePublished: post.date,
                dateModified: post.date,
                inLanguage: language,
                author: { '@id': ORG_ID },
                publisher: { '@id': ORG_ID },
                mainEntityOfPage: canonical,
                image: OG_IMAGE,
              },
              {
                '@type': 'WebPage',
                '@id': `${canonical}#webpage`,
                url: canonical,
                name: content.title,
                description: content.excerpt,
                breadcrumb: breadcrumbSchema(language, t.nav.home, [
                  { name: t.blog.pageTitle, path: '/blog' },
                  { name: content.title, path: `/blog/${post.slug}` },
                ]),
              },
            ],
          })}
        </script>
      </Helmet>

      <div className="post-container">
        <nav className="post-back" aria-label={t.blog.pageTitle}>
          <Link to={withLang('/blog', language)}>{t.blog.pageTitle}</Link>
        </nav>

        <article className="post-article">
          <header className="post-header">
            <h1 className="post-title">{content.title}</h1>
            <p className="post-meta">
              <time dateTime={post.date}>{dateLabel}</time>
              <span aria-hidden="true"> · </span>
              <span>{content.readingTime}</span>
            </p>
          </header>

          <div className="post-body">{content.body.map(renderBlock)}</div>
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
