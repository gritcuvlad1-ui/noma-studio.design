import { Head as Helmet } from 'vite-react-ssg';
import { useLanguage } from '../i18n/LanguageContext';
import { OG_LOCALE } from '../utils/seo';

/* og:site_name și og:locale, o singură dată, pentru toate paginile (înainte
   erau statice în index.html, deci duplicate pe fiecare pagină, și cu limba
   română și pe /ru și /en). react-helmet-async păstrează, pentru același
   `property`, valoarea componentei celei mai adânci, deci o pagină care își
   setează singură aceste taguri o poate suprascrie. */
const SiteMeta = () => {
  const { language } = useLanguage();
  return (
    <Helmet>
      <meta property="og:site_name" content="NOMA Studio Design" />
      <meta property="og:locale" content={OG_LOCALE[language] ?? 'ro_MD'} />
    </Helmet>
  );
};

export default SiteMeta;
