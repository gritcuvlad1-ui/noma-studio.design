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
import Silk3DBackground from './components/Silk3DBackground';
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

import Home from './pages/Home';
const Portofoliu = lazy(() => import('./pages/Portofoliu'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Servicii   = lazy(() => import('./pages/Servicii'));
const Despre     = lazy(() => import('./pages/Despre'));
const Contact    = lazy(() => import('./pages/Contact'));
const Cursuri  = lazy(() => import('./pages/Cursuri'));
const Blog     = lazy(() => import('./pages/Blog'));
// Landing dedicat, DOAR pentru link-ul din bio Instagram — intenționat NU e
// listat în navLinks (Navbar.tsx) și nu e linkuit din nicio altă pagină.
const CursLanding = lazy(() => import('./pages/CursLanding'));

// Admin Pages
const AdminLogin     = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f1e9',
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
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

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
      () => import('./pages/Despre'),
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
  const isHome = pathname === '/';
  const isChromeless = isAdmin || isCursLanding;

  return (
    <>
      {/* .safe-scrim-top (bara de STATUS de sus) rămâne pe toate paginile,
          în afară de /curs — bara de sus nu a fost niciodată problematică.
          .ios-bar-backdrop (banda din spatele barei URL de JOS) — DOAR pe
          homepage. Pe homepage, în spatele barei e fundalul 3D închis, deci
          banda maro solidă se topește perfect. Pe restul paginilor, în spate
          e conținut alb/crem — banda maro care „urmărește" bara la scroll
          lăsa mereu o fracțiune de întârziere = „linie albă" + lag. Fix, la
          cererea userului: pe paginile ne-home NU mai pictăm nimic acolo —
          zona rămâne transparentă și Safari colorează bara singur după
          pagină (exact ca pe /curs). Fără element care să urmărească bara =
          fără lag, fără linie. */}
      {!isCursLanding && <div className="safe-scrim-top" aria-hidden="true" />}
      {isHome && <div className="ios-bar-backdrop" aria-hidden="true" />}
      <ScrollToTop onRouteChange={initAnimations} lenisRef={lenisRef} />
      <AnimatePresence mode="wait">
        <div className="app">
          {!isChromeless && <Navbar />}
          {pathname === '/' && <Silk3DBackground />}
          <main key={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"           element={<Home />} />
                <Route path="/portofoliu" element={<Portofoliu />} />
                <Route path="/portofoliu/:id" element={<ProjectDetails />} />
                <Route path="/servicii"   element={<Servicii />} />
                <Route path="/despre"     element={<Despre />} />
                <Route path="/cursuri"    element={<Cursuri />} />
                <Route path="/curs"       element={<CursLanding />} />
                <Route path="/blog"       element={<Blog />} />
                <Route path="/contact"    element={<Contact />} />

                {/* Admin Routes */}
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
      <LanguageProvider>
        <AuthProvider>
          <PortfolioProvider>
            <Router>
              <AppContent />
            </Router>
          </PortfolioProvider>
        </AuthProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}
