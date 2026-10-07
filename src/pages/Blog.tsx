import { Link } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage, withLang } from '../i18n/LanguageContext';
import { postsFor } from '../data/blogPosts';
import { canonicalUrl, hreflangLinks, SITE_URL, organizationSchema, breadcrumbSchema } from '../utils/seo';
import SectionHeader from '../components/SectionHeader';
import './Blog.css';

const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const Blog = () => {
  const { t, language } = useLanguage();
  const canonical = canonicalUrl('/blog', language);

  /* Articolele REALE, din src/data/blogPosts.ts — doar cele care există în
     limba curentă. Înainte aici erau trei rezumate scrise în i18n, fără
     articol în spate și fără pagină proprie: linkurile fuseseră scoase
     tocmai pentru că duceau în pagini goale, deci pentru Google rămăsese o
     pagină cu conținut subțire, iar pentru un AI nimic de citat. */
  const posts = postsFor(language);

  return (
    <div className="blog-page">
      <Helmet>
        <html lang={language} />
        <title>{t.seo.blogTitle}</title>
        <meta name="description" content={t.seo.blogDescription} />
        <link rel="canonical" href={canonical} />
        {hreflangLinks('/blog')}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t.seo.blogTitle} />
        <meta property="og:description" content={t.seo.blogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonical} />
        <meta name="twitter:title" content={t.seo.blogTitle} />
        <meta name="twitter:description" content={t.seo.blogDescription} />
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
                name: t.seo.blogTitle,
                description: t.seo.blogDescription,
                breadcrumb: breadcrumbSchema(language, t.nav.home, [
                  { name: t.blog.pageTitle, path: '/blog' },
                ]),
              },
            ],
          })}
        </script>
      </Helmet>
      <div className="blog-container">
        <SectionHeader
          as="h1"
          title={t.blog.pageTitle}
          subtitle={t.blog.intro}
          centered={true}
        />

        <div className="blog-list">
          {posts.map((post) => {
            const c = post.translations[language]!;
            return (
              <article key={post.slug} className="blog-card">
                <h2>
                  <Link to={withLang(`/blog/${post.slug}`, language)}>{c.title}</Link>
                </h2>
                <p className="blog-meta">
                  <time dateTime={post.date}>{post.dateLabel[language] ?? post.date}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{c.readingTime}</span>
                </p>
                <p>{c.excerpt}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Blog;
