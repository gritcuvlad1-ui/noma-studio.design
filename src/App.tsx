import { useEffect, useRef, Suspense, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import type { RouteRecord } from 'vite-react-ssg';
import { LanguageProvider } from './i18n/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SiteMeta from './components/SiteMeta';
import MessengerWidget from './components/MessengerWidget';
import { initScrollAnimations } from './utils/scrollAnimations';
import { PortfolioProvider } from './context/PortfolioContext';
import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/* ═══════════════════════════════════════════════════════════════
   PRERENDERING (vite-react-ssg) — de ce arată fișierul ăsta așa

   Site-ul era SPA pur: `dist/` conținea UN singur index.html, cu
   `<body><div id="root"></div></body>`. Măsurat pe live, ca GPTBot:
   toate cele 39 de rute din sitemap întorceau 0 caractere de text și
   titlul homepage-ului. Googlebot randează JS și vedea conținutul, dar
   crawlerele AI (GPTBot, ClaudeBot, PerplexityBot) NU randează — pentru
   ele site-ul era o pagină goală, iar canonical/hreflang/title per pagină
   (scrise prin react-helmet-async) nu existau deloc.

   Acum build-ul rulează prin `vite-react-ssg build`, care randează fiecare
   rută în Node și scrie HTML complet. Trei consecințe asupra structurii:

   1. NU MAI EXISTĂ <BrowserRouter> ȘI <HelmetProvider> AICI.
      Le furnizează vite-react-ssg, pe AMBELE părți (la generare, cu un
      `context` din care citește tagurile; la hidratare, în browser).
      Un HelmetProvider imbricat aici ar crea un context React NOU, iar
      <Helmet> din pagini ar scrie în el ⇒ generatorul n-ar mai găsi
      nimic și HTML-ul static ar rămâne fără meta per pagină.

   2. PAGINILE SE ÎNCARCĂ PRIN `lazy` DE RUTĂ, NU PRIN React.lazy().
      React.lazy() nesuspendat randează fallback-ul <Suspense> la
      generare ⇒ în HTML-ul static ar ajunge spinner-ul, nu pagina.
      `lazy` de rută e AȘTEPTAT de router înainte de randare, deci
      conținutul real ajunge în HTML. Code-splitting-ul rămâne intact:
      fiecare pagină e tot un chunk separat.

   3. <Routes>/<Route> au devenit config de rute + <Outlet/> în Layout.
      Toată logica delicată (ScrollToTop eșalonat, Lenis, --app-vh,
      initScrollAnimations) e NESCHIMBATĂ — doar mutată în Layout, care
      rămâne montat între navigări, exact ca vechiul AppContent.
═══════════════════════════════════════════════════════════════ */

/* fetch-ul chunk-ului homepage pornește IMEDIAT (la evaluarea modulului),
   în paralel cu restul boot-ului — nu abia când React ajunge să randeze
   ruta (lazy singur = cascadă: parse main → render → fetch chunk → render
   Home, simțită ca „nu sunt încărcate toate elementele" la prima vizită).
   Split-ul rămâne intact: pe /servicii etc. promisiunea asta nu pornește.
   Păzit cu `typeof window` — la generare rulează în Node, fără window. */
const importHome = () => import('./pages/Home');
if (
  typeof window !== 'undefined' &&
  ['/', '/ru', '/ru/', '/en', '/en/'].includes(window.location.pathname)
) {
  importHome();
}

/* React Router vrea din `lazy` un obiect cu cheia `Component`; paginile
   proiectului exportă `default`. Adaptorul ăsta face traducerea într-un
   singur loc, ca fiecare rută să rămână o linie. */
const page = (loader: () => Promise<{ default: React.ComponentType }>) => async () => {
  const { default: Component } = await loader();
  return { Component };
};

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

  /* 2026-09-14 (raportat: „homepage foarte buguit la scroll" — găsit la
     `npm run build`, nu la ochi): era `useLayoutEffect`. React avertizează
     explicit „useLayoutEffect does nothing on the server... mismatch între
     UI-ul inițial nehidratat și cel intenționat" — exact clasa de eroare
     #418/#423 confirmată în consolă pe Home/Servicii/Portofoliu (identică
     pe toate trei, deci dintr-o componentă comună — ScrollToTop e randată
     în AppShell, pe orice rută). Efectul nu întoarce alt JSX în funcție de
     server/client (componenta e `return null` mereu), deci `useEffect`
     (rulează după hidratare, nu înainte de vopsire) e sigur aici — codul
     oricum are deja resetări eșalonate (rAF + 60ms + 200ms) tocmai pentru
     că un singur reset sincron nu era suficient de robust; un cadru în plus
     până pornește nu schimbă nimic vizibil. */
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    /* Un singur `scrollTo(0,0)` sincron NU e suficient în unele browsere
       in-app (confirmat: Telegram) — raportat explicit: „schimb pagina și
       pagina la care ajung e deja scrolluită", exact simptomul unei
       restaurări de scroll care sosește DUPĂ acest efect (fie din bfcache-ul
       propriu al WebView-ului, fie din Lenis, care mai are un cadru de
       inerție/velocitate de scurs chiar și cu `immediate:true`). Fix:
       resetăm de mai multe ori, eșalonat — imediat, apoi la următorul cadru
       de randare, apoi puțin mai târziu — ca orice restaurare întârziată să
       fie suprascrisă, nu doar prima încercare.

       CONFIRMAT pe telefon (2026-08-22): la un tap pe un card din portofoliu
       imediat DUPĂ un scroll cu degetul, staggering-ul de mai sus tot nu
       era destul — momentum scroll-ul NATIV (inerția fizică a OS-ului, nu
       ceva controlat de Lenis/JS) continuă să livreze cadre de scroll pe
       orice e montat în DOM, indiferent câte ori suprascriu `scrollTop`
       între ele. Singurul mod sigur de a-l opri e să dezactiv scroll-ul
       fizic o clipă (`overflow:hidden`) — asta forțează browserul să
       anuleze animația de inerție — abia apoi resetez poziția și eliberez
       scroll-ul. Eliberat după 2 cadre de randare (impercetibil ca durată,
       sub pragul unei tranziții de pagină), NU pe `pathname` vechi la
       unmount — dacă userul navighează din nou f. rapid, cleanup-ul
       restaurează `overflow`-ul dinaintea acestei rute, nu-l lasă blocat. */
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    const releaseScrollLock = () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };

    const reset = () => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
      }
      /* CAUZA REALĂ a scroll-ului vizibil pe mobil: `html` are global
         `scroll-behavior: smooth` (index.css). `scrollTo(0, 0)` — sintaxa
         cu doi parametri, FĂRĂ `behavior` explicit — moștenește acel
         smooth și ANIMEAZĂ vizibil de la poziția veche la 0, în loc să
         sară instant. Pe desktop nu se vedea pentru că Lenis (linia de
         mai sus) prinde controlul primul, cu `immediate:true`; pe mobil
         Lenis e dezactivat (App.tsx), deci acest `scrollTo` rula singur,
         needeghizat. `behavior: 'instant'` ignoră explicit CSS-ul. */
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      html.scrollTop = 0;
      body.scrollTop = 0;
    };

    const rafIds: number[] = [];
    reset();
    rafIds.push(
      requestAnimationFrame(() => {
        reset();
        rafIds.push(
          requestAnimationFrame(() => {
            reset();
            releaseScrollLock();
          })
        );
      })
    );
    const t1 = setTimeout(reset, 60);
    const t2 = setTimeout(reset, 200);

    return () => {
      rafIds.forEach((id) => cancelAnimationFrame(id));
      clearTimeout(t1);
      clearTimeout(t2);
      releaseScrollLock();
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

/* Cadrul comun al site-ului (Navbar/Footer/widget + toată logica de scroll
   și animații). Randat ca `element` al rutei rădăcină ⇒ rămâne montat la
   navigările client-side, exact ca vechiul AppContent; paginile intră prin
   <Outlet/> în locul vechiului <Routes>. */
function AppShell() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  /* Lenis smooth scroll — dezactivat pe mobil (interferă cu scroll nativ) ȘI
     pe /curs (motivul, mai jos). */
  /* /curs — 2026-09-27, cerut explicit: „pe telefon se mișcă perfect, faceți
     și pe desktop la fel". Singura diferență dintre cele două era Lenis
     (oprit sub 768px). Pagina are clipuri ambientale, blur-uri, parallax și
     carduri cu glow — scroll-ul sub-pixel al lui Lenis (incremente de
     fracțiuni de pixel) le forța recompunerea la fiecare cadru. Scroll-ul
     nativ al browserului (neted oricum pe desktop, cu inerție de OS) = exact
     comportamentul de pe telefon. Restul site-ului rămâne pe Lenis. */
  const isCursRoute = pathname === '/curs';
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile || isCursRoute) return;

    /* `lerp`, NU `duration` + `easing` (2026-09-01 — raportat: „pe desktop
       când dau scroll parcă e lag"). Cele două moduri ale lui Lenis se
       exclud reciproc și se simt COMPLET diferit:
       - `duration: 1.4` = fiecare tick de rotiță pornește o animație eased
         de 1.4 SECUNDE spre destinație. Pagina continuă să alunece mult
         după ce ai oprit degetul ⇒ senzația de „input-ul meu și ecranul nu
         sunt legate", pe care userul o descrie ca „lag". Nu e o problemă de
         performanță (cadrele erau bune), e latență de design.
       - `lerp: 0.1` = interpolare per-cadru spre poziția reală, normalizată
         de Lenis pt. rata de cadre. Urmărește input-ul STRÂNS (răspuns
         imediat), dar tot cu inerție fină ⇒ „smooth", nu „floaty".
       0.1 e valoarea implicită Lenis; mai mic = mai lung/mai moale, mai
       mare = mai sec/mai aproape de scroll nativ.
       Toate `scrollTo` din proiect folosesc `immediate: true` (verificat:
       App.tsx ScrollToTop), deci nu depind de duration/
       easing — schimbarea afectează DOAR senzația de scroll cu rotița. */
    const lenis = new Lenis({
      lerp: 0.1,
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
    /* Dependențele sunt DOAR flagurile de rută (nu `pathname`) — altfel Lenis
       s-ar distruge și recrea la fiecare navigare de pe tot site-ul. Așa,
       se reface o singură dată, la intrarea/ieșirea din /curs. */
  }, [isCursRoute]);

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

  /* Prefetch-ul paginilor.
     Înainte: după 2s, pe ORICE pagină și pe ORICE dispozitiv, se descărcau
     toate cele 6 pagini (~119KB gzip JS+CSS, aproape cât pagina însăși) — pe
     telefon, risipă de date și de timp pe firul principal (Lighthouse: „Reduce
     unused JavaScript”).
     Acum:
     · desktop pe conexiune bună: neschimbat (aceeași prefetch la 2s, navigare
       instantanee);
     · mobil, conexiune lentă sau „economisire date": NIMIC preventiv; pagina
       se încarcă la INTENȚIE, când degetul/cursorul atinge un link către ea
       (`touchstart`/`pointerover` apar cu 100-300ms înaintea click-ului).
     Mapa e după calea fără prefixul de limbă (/ru, /en). `import()` e cache-uit
     de bundler, deci o pagină cerută o dată nu se mai descarcă a doua oară. */
  useEffect(() => {
    const pages: Record<string, Array<() => Promise<unknown>>> = {
      '/servicii': [() => import('./pages/Servicii')],
      '/contact': [() => import('./pages/Contact')],
      '/portofoliu': [() => import('./pages/Portofoliu'), () => import('./pages/ProjectDetails')],
      '/cursuri': [() => import('./pages/Cursuri')],
      '/blog': [() => import('./pages/Blog')],
    };
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const constrained =
      window.innerWidth < 768 ||
      !!conn?.saveData ||
      ['slow-2g', '2g', '3g'].includes(conn?.effectiveType ?? '');

    if (!constrained) {
      const timer = setTimeout(
        () => Object.values(pages).forEach(list => list.forEach(load => load())),
        2000
      );
      return () => clearTimeout(timer);
    }

    const warm = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.origin !== window.location.origin) return;
      const path = a.pathname.replace(/^\/(ru|en)(?=\/|$)/, '').replace(/\/$/, '') || '/';
      const key = path.startsWith('/portofoliu') ? '/portofoliu' : path;
      pages[key]?.forEach(load => load());
    };
    document.addEventListener('touchstart', warm, { passive: true, capture: true });
    document.addEventListener('pointerover', warm, { passive: true, capture: true });
    return () => {
      document.removeEventListener('touchstart', warm, true);
      document.removeEventListener('pointerover', warm, true);
    };
  }, []);

  const isAdmin = pathname.startsWith('/admin');
  // Landing dedicat cursului: fără Navbar/Footer/widget de mesagerie —
  // pagină cu un singur scop (WhatsApp), fără ieșiri spre restul site-ului.
  const isCursLanding = pathname === '/curs';
  const isChromeless = isAdmin || isCursLanding;

  /* `html` are fundal crem FIX, global (`background-color: var(--noma-page-bg)`,
     index.css) — pe paginile ÎNCHISE la culoare (/curs), acel
     crem se vede prin spatele conținutului la marginile paginii: bara de
     status a telefonului (safe-area de sus, unde nu ajunge nimic din
     conținut) și la overscroll/bounce jos („bej în spatele paginii" —
     raportat pe /curs). Fix: clasă pe `<html>`, NU stil inline (un
     `style=` direct pe html „bate" orice regulă CSS și nu apare la grep —
     exact capcana documentată când site-ul întreg forța cafeniu prin 3
     mecanisme separate, vezi memoria de proiect). Clasa se pune/scoate
     aici, o singură sursă de adevăr, curățată la schimbarea rutei. */
  useEffect(() => {
    document.documentElement.classList.toggle('noma-dark-route', isCursLanding);
    return () => {
      document.documentElement.classList.remove('noma-dark-route');
    };
  }, [isCursLanding]);

  return (
    <>
      <SiteMeta />
      {/* .safe-scrim-top (bara de STATUS de sus, maro-închis fix) rămâne pe
          paginile publice ale site-ului — dar NU pe /curs, pagină chromeless
          cu propriul header care începe chiar din vârful ecranului (banda
          maro suprapusă peste el, z-index 2999, i-ar tăia vizual headerul).
          Pe restul site-ului rămâne, e cerut explicit (bară de status mereu
          maro, brand-consistentă, indiferent de fundalul paginii). */}
      {!isCursLanding && <div className="safe-scrim-top" aria-hidden="true" />}
      <ScrollToTop onRouteChange={initAnimations} lenisRef={lenisRef} />
      <AnimatePresence mode="wait">
        <div className="app">
          {!isChromeless && <Navbar />}
          <main key={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </main>
          {!isChromeless && <Footer />}
        </div>
      </AnimatePresence>
      {!isChromeless && <MessengerWidget />}
    </>
  );
}

/* Providerele care au nevoie de context de router (LanguageProvider derivă
   limba din useLocation) stau AICI, în elementul rutei rădăcină — adică deja
   în interiorul routerului furnizat de vite-react-ssg. HelmetProvider NU mai
   apare: îl pune generatorul, vezi nota 1 de sus. */
function Layout() {
  return (
    <PortfolioProvider>
      <LanguageProvider>
        <AppShell />
      </LanguageProvider>
    </PortfolioProvider>
  );
}

/* Paginile publice, indexabile — aceleași componente pentru toate cele 3
   limbi (limba se ia din URL, în LanguageContext). UN singur loc de adăugat
   o pagină nouă; căile sunt RELATIVE, fiindcă sunt copii ai rutei '/'.
   Lista rutelor efectiv PREGENERATE nu se decide aici, ci în vite.config.ts
   (`ssgOptions.includedRoutes`), ca să rămână o singură sursă de adevăr,
   aliniată cu public/sitemap.xml. */
function indexablePages(): RouteRecord[] {
  return [
    { index: true, lazy: page(importHome), entry: 'src/pages/Home.tsx' },
    { path: 'portofoliu', lazy: page(() => import('./pages/Portofoliu')), entry: 'src/pages/Portofoliu.tsx' },
    { path: 'portofoliu/:id', lazy: page(() => import('./pages/ProjectDetails')), entry: 'src/pages/ProjectDetails.tsx' },
    { path: 'servicii', lazy: page(() => import('./pages/Servicii')), entry: 'src/pages/Servicii.tsx' },
    { path: 'cursuri', lazy: page(() => import('./pages/Cursuri')), entry: 'src/pages/Cursuri.tsx' },
    { path: 'blog', lazy: page(() => import('./pages/Blog')), entry: 'src/pages/Blog.tsx' },
    { path: 'blog/:slug', lazy: page(() => import('./pages/BlogPost')), entry: 'src/pages/BlogPost.tsx' },
    { path: 'contact', lazy: page(() => import('./pages/Contact')), entry: 'src/pages/Contact.tsx' },
    { path: 'privacy', lazy: page(() => import('./pages/Privacy')), entry: 'src/pages/Privacy.tsx' },
    { path: 'terms', lazy: page(() => import('./pages/Terms')), entry: 'src/pages/Terms.tsx' },
  ];
}

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/App.tsx',
    children: [
      // română, la rădăcină (canonică — nu se atinge, ca să nu pierdem
      // indexarea deja făcută de Google)
      ...indexablePages(),
      // /ru și /en: rută-părinte fără element ⇒ React Router randează
      // implicit <Outlet/>, deci copiii intră tot în Layout-ul de sus.
      { path: 'ru', children: indexablePages() },
      { path: 'en', children: indexablePages() },

      /* Landing dedicat Instagram — NU se dublează pe limbi (noindex, o
         singură adresă, cerut explicit). SE pregenerează (fără sitemap) —
         altfel Vercel servea HTML-ul homepage-ului la prima intrare; vezi
         vite.config.ts. */
      { path: 'curs', lazy: page(() => import('./pages/CursLanding')), entry: 'src/pages/CursLanding.tsx' },

      /* Admin — private, fără variante de limbă, excluse de la pregenerare.
         AuthProvider (și deci supabase-js) se încarcă doar aici, în ruta-părinte
         /admin, nu pe paginile publice. ProtectedRoute vine tot leneș, fiindcă
         importă AuthContext. */
      {
        path: 'admin',
        entry: 'src/pages/admin/AdminAuthShell.tsx',
        lazy: page(() => import('./pages/admin/AdminAuthShell')),
        children: [
          { path: 'login', lazy: page(() => import('./pages/admin/Login')), entry: 'src/pages/admin/Login.tsx' },
          {
            path: 'dashboard',
            entry: 'src/pages/admin/Dashboard.tsx',
            lazy: async () => {
              const [{ default: Dashboard }, { ProtectedRoute }] = await Promise.all([
                import('./pages/admin/Dashboard'),
                import('./components/ProtectedRoute'),
              ]);
              return {
                Component: () => (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                ),
              };
            },
          },
        ],
      },

      /* Orice altă adresă: pagină 404 reală a site-ului (noindex), nu eroarea
         implicită a router-ului. Rută-splat, DEASUPRA nu are ce să prindă din
         cele de mai sus (react-router alege cea mai specifică). */
      { path: '*', lazy: page(() => import('./pages/NotFound')), entry: 'src/pages/NotFound.tsx' },
    ],
  },
];

export default routes;
