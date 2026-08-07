import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../i18n/LanguageContext';
import SectionHeader from '../components/SectionHeader';
import LuxuryDivider from '../components/LuxuryDivider';
import './Blog.css';

const Blog = () => {
  const { t } = useLanguage();

  const posts = [
    { id: 1, title: t.blog.post1Title, date: t.blog.post1Date, excerpt: t.blog.post1Excerpt },
    { id: 2, title: t.blog.post2Title, date: t.blog.post2Date, excerpt: t.blog.post2Excerpt },
    { id: 3, title: t.blog.post3Title, date: t.blog.post3Date, excerpt: t.blog.post3Excerpt },
  ];

  return (
    <div className="blog-page">
      <Helmet>
        <title>Blog — Idei și Tendințe Design Interior | NOMA Studio</title>
        <meta name="description" content="Articole despre design interior, tendințe și sfaturi practice de la echipa NOMA Studio, Chișinău." />
        <link rel="canonical" href="https://noma.md/blog" />
      </Helmet>
      <div className="blog-container">
        <SectionHeader
          title={t.blog.pageTitle}
          subtitle={t.blog.intro}
          centered={true}
        />

        <div className="blog-list">
          {posts.map((post) => (
            <article key={post.id} className="blog-card">
              {/* fără <a href="/blog/N"> — rutele individuale nu există,
                  linkurile duceau în pagini goale (soft-404 pt. crawlere) */}
              <h2>{post.title}</h2>
              <p className="blog-meta">{post.date}</p>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </div>

        <LuxuryDivider delay={0.1} />
      </div>
    </div>
  );
};

export default Blog;
