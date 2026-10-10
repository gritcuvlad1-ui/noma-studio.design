import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { projects as staticProjects, type Project } from '../data/projects';
import { fetchPortfolioProjects } from '../lib/portfolioPublic';

interface PortfolioContextValue {
  projects: Project[];
  loading: boolean;
  /** true dacă datele vin din Supabase (admin), false dacă sunt cele statice */
  fromDb: boolean;
  reload: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue>({
  projects: staticProjects,
  loading: false,
  fromDb: false,
  reload: async () => {},
});

export const usePortfolio = () => useContext(PortfolioContext);

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

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <PortfolioContext.Provider value={{ projects, loading, fromDb, reload }}>
      {children}
    </PortfolioContext.Provider>
  );
}
