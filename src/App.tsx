import { useEffect, useRef, lazy, Suspense, useCallback, useLayoutEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MessengerWidget from './components/MessengerWidget';
import { initScrollAnimations } from './utils/scrollAnimations';
import { AuthProvider } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/* Home era import STATIC — singurul din tot fișierul, în timp ce fiecare
   altă pagină e deja lazy(). Rezultat măsurat: bundle-ul principal (JS
   care se descarcă la ORICE primă vizită, pe ORICE rută) ajunge la 1.37MB
   — tot ce importă Home (slider, formular cu react-hook-form/zod ș.a.m.d.)
   intră direct în el, chiar și pe pagini care nu ating niciodată homepage-ul.
   Lazy la fel ca restul — Home devine propriul chunk (Suspense-ul de mai
   jos, deja existent, îl acoperă). */
/* fetch-ul chunk-ului homepage pornește IMEDIAT (la evaluarea modulului),
   în paralel cu restul boot-ului — nu abia când React ajunge să randeze
   ruta (lazy singur = cascadă: parse main → render → fetch chunk → render
   Home, simțită ca „nu sunt încărcate toate elementele" la prima vizită).
   Split-ul rămâne intact: pe /servicii etc. promisiunea asta nu pornește. */
const importHome = () => import('./pages/Home');
if (
  typeof window !== 'undefined' &&
  ['/', '/ru', '/ru/', '/en', '/en/'].includes(window.location.pathname)
) {
  importHome();
}
const Home = lazy(importHome);
const Portofoliu = lazy(() => import('./pages/Portofoliu'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Servicii   = lazy(() => import('./pages/Servicii'));
const Contact    = lazy(() => import('./pages/Contact'));
const Cursuri  = lazy(() => import('./pages/Cursuri'));
const Blog     = lazy(() => import('./pages/Blog'));
// Landing dedicat, DOAR pentru link-ul din bio Instagram — intenționat NU e
// listat în navLinks (Navbar.tsx) și nu e linkuit din nicio altă pagină.
const CursLanding = lazy(() => import('./pages/CursLanding'));

// Admin Pages
const AdminLogin     = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

/* Paginile publice, indexabile — fiecare există la rădăcină (ro) ȘI sub
   /ru și /en (vezi <Routes> mai jos). UN singur loc de adăugat o pagină
   nouă; nu se mai scriu 3 seturi de <Route> de mână. */
const indexableRoutes = [
  { path: '/', element: <Home /> },
  { path: '/portofoliu', element: <Portofoliu /> },
  { path: '/portofoliu/:id', element: <ProjectDetails /> },
  { path: '/servicii', element: <Servicii /> },
  { path: '/cursuri', element: <Cursuri /> },
  { path: '/blog', element: <Blog /> },
  { path: '/contact', element: <Contact /> },
];

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e8dcc0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '2px solid rgba(184,149,106,0.25)',
          borderTop: '2px solid #b8956a',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScrollToTop({ onRouteChange, lenisRef }: { onRouteChange: () => void; lenisRef: React.RefObject<Lenis | null> }) {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    /* Un singur `scrollTo(0,0)` sincron NU e suficient în unele browsere
       in-app (confirmat: Telegram) — raportat explicit: „schimb pagina și
       pagina la care ajung e deja scrolluită", exact simptomul unei
       restaurări de scroll care sosește DUPĂ acest efect (fie din bfcache-ul
       propriu al WebView-ului, fie din Lenis, care mai are un cadru de
       inerție/velocitate de scurs chiar și cu `immediate:true`). Fix:
       resetăm de mai multe ori, eșalonat — imediat, apoi la următorul cadru
       de randare, apoi puțin mai târziu — ca orice restaurare întârziată să
       fie suprascrisă, nu doar prima încercare. */
    const reset = () => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const rafIds: number[] = [];
    reset();
    rafIds.push(
      requestAnimationFrame(() => {
        reset();
        rafIds.push(requestAnimationFrame(reset));
      })
    );
    const t1 = setTimeout(reset, 60);
    const t2 = setTimeout(reset, 200);

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, lenisRef]);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const timer = setTimeout(onRouteChange, 120);
    return () => clearTimeout(timer);
  }, [pathname, onRouteChange]);

  return null;
}

function AppContent() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  // Lenis smooth scroll — dezactivat pe mobil (interferă cu scroll nativ)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    // Expunem instanța global ca modalele/overlay-urile să poată opri scroll-ul
    // smooth (overflow:hidden NU oprește Lenis, pentru că Lenis derulează programatic).
    window.__lenis = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      window.__lenis = undefined;
    };
  }, []);

  /* Lock manual pt. unitatea de viewport (--app-vh), NU vh/svh/dvh nativ din
     CSS — în browsere in-app (confirmat: cel din Telegram, la fel ca WKWebView-ul
     Instagram) chiar și svh/dvh se recalculează LIVE la fiecare apariție/
     dispariție a barei de jos a browserului, exact ca vechiul vh buggy dinainte
     să existe aceste unități — asta făcea desenul din secțiunea „Ai nevoie de
     un proiect?" să se micșoreze și pagina să „sară" la scroll. Fix robust
     (identic cu --cl-vh de pe /curs, mutat aici la nivel global ca orice
     pagină să-l poată folosi): măsurăm noi 1% din window.innerHeight O SINGURĂ
     dată la mount, punem valoarea într-o variabilă CSS în px, și recalculăm
     DOAR dacă lățimea s-a schimbat cu adevărat (rotire telefon) — niciodată
     doar pt. că înălțimea a fluctuat (bara care apare/dispare). Folosire în
     CSS: `calc(var(--app-vh, 1svh) * 100)` în loc de `100svh`. */
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const setAppVh = () => {
      document.documentElement.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
    };
    setAppVh();
    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setAppVh();
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', setAppVh);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', setAppVh);
    };
  }, []);

  const initAnimations = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = initScrollAnimations() ?? null;
  }, []);

  useEffect(() => {
    initAnimations();
    return () => cleanupRef.current?.();
  }, [initAnimations]);

  useEffect(() => {
    const preloads = [
      () => import('./pages/Servicii'),
      () => import('./pages/Contact'),
      () => import('./pages/Portofoliu'),
      () => import('./pages/ProjectDetails'),
      () => import('./pages/Cursuri'),
      () => import('./pages/Blog'),
    ];
    const timer = setTimeout(() => preloads.forEach(p => p()), 2000);
    return () => clearTimeout(timer);
  }, []);

  const isAdmin = pathname.startsWith('/admin');
  // Landing dedicat cursului: fără Navbar/Footer/widget de mesagerie —
  // pagină cu un singur scop (WhatsApp), fără ieșiri spre restul site-ului.
  const isCursLanding = pathname === '/curs';
  const isChromeless = isAdmin || isCursLanding;

  return (
    <>
      {/* .safe-scrim-top (bara de STATUS de sus) rămâne pe toate paginile,
          în afară de /curs — bara de sus nu a fost niciodată problematică.
          Homepage-ul folosește același fundal crem ca restul paginilor, deci
          nu mai are nevoie de bandă separată în spatele barei URL de jos —
          zona rămâne transparentă și Safari colorează bara singur după
          pagină, la fel ca pe orice altă rută. */}
      {!isCursLanding && <div className="safe-scrim-top" aria-hidden="true" />}
      <ScrollToTop onRouteChange={initAnimations} lenisRef={lenisRef} />
      <AnimatePresence mode="wait">
        <div className="app">
          {!isChromeless && <Navbar />}
          <main key={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Paginile indexabile există în 3 variante: rădăcină (ro,
                    canonică — nu se atinge, ca să nu pierdem indexarea deja
                    făcută de Google) + /ru/* + /en/*, toate randând ACELEAȘI
                    componente (limba se ia din URL, în LanguageContext).
                    Generate din indexableRoutes (mai jos), nu scrise de 3 ori
                    de mână — un singur loc de adăugat o pagină nouă. */}
                {(['', '/ru', '/en'] as const).flatMap((prefix) =>
                  indexableRoutes.map(({ path, element }) => {
                    // rădăcina limbii, FĂRĂ slash final (/ru, nu /ru/) — trebuie
                    // să fie identică cu ce generează withLang()/canonicalUrl()
                    // în i18n/LanguageContext.tsx și utils/seo.tsx, altfel un
                    // link generat de ei nu se potrivește cu nicio rută de aici.
                    const fullPath = path === '/' ? (prefix || '/') : prefix + path;
                    return <Route key={prefix + path} path={fullPath} element={element} />;
                  })
                )}

                {/* Landing dedicat Instagram — NU se dublează pe limbi
                    (noindex, o singură adresă, cerut explicit). */}
                <Route path="/curs" element={<CursLanding />} />

                {/* Admin Routes — private, fără variante de limbă */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </main>
          {!isChromeless && <Footer />}
        </div>
      </AnimatePresence>
      {!isChromeless && <MessengerWidget />}
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <PortfolioProvider>
          {/* Router ÎNAINTE de LanguageProvider — limba se derivă acum din
              URL (useLocation), deci LanguageProvider are nevoie de router
              context. Era invers (LanguageProvider afară), rupea orice
              hook de router folosit acolo. */}
          <Router>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </Router>
        </PortfolioProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
