/// <reference types="vite-react-ssg" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/* Rutele care se PREGENEREAZĂ ca HTML static, la build.

   Trebuie să corespundă exact cu public/sitemap.xml — dacă cele două se
   despart, ori pregenerezi pagini pe care nu le indexezi, ori (mai rău)
   indexezi pagini care ajung înapoi la HTML gol. La orice pagină nouă se
   modifică AMBELE fișiere.

   EXCEPȚIE de la regula cu sitemap-ul: /curs se PREGENEREAZĂ, dar NU e în
   sitemap (rămâne noindex prin <meta robots> din Helmet-ul paginii, care
   ajunge acum chiar în HTML-ul static). Motiv (2026-09-26): nepregenerată,
   Vercel îi servea index.html = HTML-ul HOMEPAGE-ului, deci la prima intrare
   pe link se vedea ~1s site-ul principal înainte ca JS-ul să comute pe
   /curs (+ erori de hidratare #418/#423, HTML home vs randare curs).

   Ce NU intră aici, intenționat:
   • /admin/*   — privat, blocat și în robots.txt
   Rămâne funcțional ca SPA: Vercel îi servește shell-ul (vezi rewrite-ul
   din vercel.json) și randează în browser. */
const LANG_PREFIXES = ['', '/ru', '/en'];
const PAGES = ['', '/portofoliu', '/cursuri', '/servicii', '/contact', '/blog'];
const PROJECT_IDS = [1, 2, 3, 4, 5, 6, 7];

/* Articolele de blog, per LIMBĂ — nu toate există în toate limbile
   (traducerile din src/data/blogPosts.ts sunt opționale). Pregenerăm doar
   variantele care au conținut real; restul n-ar produce decât pagini goale
   trimise la indexare. Sursa de adevăr rămâne blogPosts.ts — la un articol
   nou se adaugă slug-ul aici ȘI în public/sitemap.xml. */
const BLOG_SLUGS_BY_LANG: Record<string, string[]> = {
  '': ['cat-costa-un-proiect-de-design-interior'],
  '/ru': [],
  '/en': [],
};

const PRERENDERED_ROUTES = LANG_PREFIXES.flatMap((prefix) => [
  // rădăcina limbii FĂRĂ slash final (/ru, nu /ru/) — identic cu ce
  // generează withLang()/canonicalUrl() în i18n și utils/seo.tsx
  ...PAGES.map((p) => `${prefix}${p}` || '/'),
  ...PROJECT_IDS.map((id) => `${prefix}/portofoliu/${id}`),
  ...(BLOG_SLUGS_BY_LANG[prefix] ?? []).map((slug) => `${prefix}/blog/${slug}`),
]).concat(['/curs']);

/* Config ca FUNCȚIE, nu obiect — `isSsrBuild` e nevoie mai jos, la
   manualChunks. `vite-react-ssg build` face DOUĂ build-uri: unul de client
   (bundle-ul care ajunge în browser) și unul SSR (folosit doar ca să
   randeze paginile în Node, la build). */
export default defineConfig(({ isSsrBuild }) => ({
  ssgOptions: {
    // entry-ul real al proiectului (implicit ar căuta src/main.ts)
    entry: 'src/main.tsx',
    /* 'nested' ⇒ /servicii/index.html, nu /servicii.html. Vercel servește
       automat index.html-ul unui folder, deci /servicii ajunge la fișierul
       pregenerat fără nicio regulă suplimentară de rutare. */
    dirStyle: 'nested',
    /* Lista de mai sus, explicit — NU auto-descoperirea rutelor. Altfel
       /admin/* și /checklist ar fi pregenerate, iar /portofoliu/:id (dinamică)
       ar fi sărită complet. */
    includedRoutes: () => PRERENDERED_ROUTES,
    /* Inline-ul de CSS critic (beasties) cere un peer opțional neinstalat;
       lăsat activ, ar putea rupe build-ul de pe Vercel la install curat. */
    beastiesOptions: false,
    /* Formatarea HTML-ului generat rupe hidratarea (spații albe în plus
       față de ce randează React în browser) — documentat în pachet. */
    formatting: 'none',
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      // Babel transform mai rapid
      babel: {
        plugins: [],
      },
    }),
  ],

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
  },

  build: {
    rollupOptions: {
      output: {
        /* DOAR pe build-ul de client. În cel SSR, react/react-dom/
           react-router-dom sunt externalizate (rulează din node_modules,
           nu se împachetează), iar Rollup respinge un modul extern pus în
           manualChunks: „react cannot be included in manualChunks because
           it is resolved as an external module". Split-ul pe client rămâne
           exact cum era. */
        manualChunks: isSsrBuild
          ? undefined
          : {
              vendor:  ['react', 'react-dom'],
              router:  ['react-router-dom'],
              lucide:  ['lucide-react'],
            },
      },
    },
    chunkSizeWarningLimit: 600,
    // Minificare agresivă în producție
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // elimină toate console.log
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
      mangle: true,
    },
    // CSS separat — se încarcă mai rapid
    cssCodeSplit: true,
    // Sourcemaps doar în dev
    sourcemap: false,
    // Asset-uri mici inline — mai puține requesturi
    assetsInlineLimit: 4096,
  },

  css: {
    devSourcemap: false,
  },

  // Server dev mai rapid
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // iOS Safari face cache agresiv pe LAN → forțăm no-store ca telefonul
    // să ia mereu CSS/JS proaspăt (altfel „nu se vede nicio schimbare pe mobil").
    headers: {
      'Cache-Control': 'no-store',
    },
    hmr: {
      overlay: false,
    },
  },
}));
