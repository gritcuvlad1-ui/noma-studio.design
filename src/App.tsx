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

import Home from './pages/Home';
const Portofoliu = lazy(() => import('./pages/Portofoliu'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Servicii   = lazy(() => import('./pages/Servicii'));
const Despre     = lazy(() => import('./pages/Despre'));
const Contact    = lazy(() => import('./pages/Contact'));
const Cursuri  = lazy(() => import('./pages/Cursuri'));
const Blog     = lazy(() => import('./pages/Blog'));

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

function ScrollToTop({ onRouteChange }: { onRouteChange: () => void }) {
  const { pathname } = useLocation();
  const isFirst = useRef(true);

  // Perform scroll reset instantly before paint
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Handle route change animations in separate useEffect hook
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
  const { pathname } = useLocation();

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

  return (
    <>
      <ScrollToTop onRouteChange={initAnimations} />
      <AnimatePresence mode="wait">
        <div className="app">
          <Navbar />
          <main key={pathname}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"           element={<Home />} />
                <Route path="/portofoliu" element={<Portofoliu />} />
                <Route path="/portofoliu/:id" element={<ProjectDetails />} />
                <Route path="/servicii"   element={<Servicii />} />
                <Route path="/despre"     element={<Despre />} />
                <Route path="/cursuri"    element={<Cursuri />} />
                <Route path="/blog"       element={<Blog />} />
                <Route path="/contact"    element={<Contact />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </AnimatePresence>
      <MessengerWidget />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </HelmetProvider>
  );
}
