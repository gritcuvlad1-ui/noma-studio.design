import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { projects as staticProjects, type Project } from '../data/projects';
import { fetchPortfolioProjects } from '../lib/portfolioPublic';

interface PortfolioContextValue {
  projects: Project[];
  loading: boolean;
  /** true dacă datele vin din Supabase (admin), false dacă sunt cele statice */
  fromDb: boolean;
  reload: () => Promise<void>;
  /** pornește citirea din Supabase, o singură dată (apelat de usePortfolio) */
  ensureLoaded: () => void;
}

const PortfolioContext = createContext<PortfolioContextValue>({
  projects: staticProjects,
  loading: false,
  fromDb: false,
  reload: async () => {},
  ensureLoaded: () => {},
});

/* Citirea din Supabase pornește DOAR când o pagină chiar folosește portofoliul
   (Home, Portofoliu, ProjectDetails, NotFound). Înainte pornea la montarea
   provider-ului, adică pe ORICE pagină, inclusiv /curs, unde nu se afișează
   niciun proiect: o cerere în plus la fiecare vizită (și eroare în consolă cât
   timp proiectul Supabase e pe pauză). */
export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  const { ensureLoaded } = ctx;
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  return ctx;
};

export function PortfolioProvider({ children }: { children: ReactNode }) {
  // Pornim cu datele statice → prima randare are deja conținut (zero blank).
  const [projects, setProjects] = useState<Project[]>(staticProjects);
  const [loading, setLoading] = useState(true);
  const [fromDb, setFromDb] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const db = await fetchPortfolioProjects();
    if (db && db.length) {
      setProjects(db);
      setFromDb(true);
    } else {
      setProjects(staticProjects);
      setFromDb(false);
    }
    setLoading(false);
  }, []);

  const started = useRef(false);
  const ensureLoaded = useCallback(() => {
    if (started.current) return;
    started.current = true;
    reload();
  }, [reload]);

  return (
    <PortfolioContext.Provider value={{ projects, loading, fromDb, reload, ensureLoaded }}>
      {children}
    </PortfolioContext.Provider>
  );
}
