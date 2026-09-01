import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';
import './index.css';

/* Era `createRoot(document.getElementById('root')!).render(<App />)` — adică
   randare exclusiv în browser. Acum entry-ul e comun: la build, vite-react-ssg
   îl încarcă în Node și randează fiecare rută în HTML static; în browser,
   ACELAȘI fișier hidratează HTML-ul deja livrat.

   `createRoot` trebuie EXPORTAT cu numele ăsta — e contractul pe care îl caută
   generatorul (`m.createRoot`, din ssrLoadModule). Redenumit, build-ul nu mai
   găsește aplicația.

   Providerele și routerul NU se mai montează aici: routerul și HelmetProvider
   vin de la vite-react-ssg, restul stau în elementul rutei rădăcină (Layout,
   în App.tsx) — vezi nota lungă de acolo. */
export const createRoot = ViteReactSSG({ routes });
