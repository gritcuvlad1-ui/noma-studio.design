import type { Project, RoomCategory } from '../data/projects';

/* ============================================================================
   Partea PUBLICĂ a stratului de date al portofoliului — citire simplă.

   DE CE e separat de portfolioApi.ts: acolo se importă clientul `supabase-js`
   (~120KB minificat: auth, realtime, storage...), necesar doar în admin. Site-ul
   public doar CITEȘTE două tabele cu cheia anonimă, deci o face cu un `fetch` către
   același API REST (PostgREST), exact aceleași interogări pe care le trimitea
   clientul. Astfel supabase-js nu mai intră în pachetul principal al paginilor
   publice (Lighthouse: „Reduce unused JavaScript").
   ========================================================================== */

// Supabase e „real" doar dacă există cheile ȘI nu sunt placeholder-ele din .env
export const hasSupabase = !!(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !String(import.meta.env.VITE_SUPABASE_URL).includes('your-project-id') &&
  !String(import.meta.env.VITE_SUPABASE_ANON_KEY).includes('your-anon-key')
);

// ── Tipuri pentru rândurile din DB ──────────────────────────────────────────
export interface DbProject {
  id: string;
  ref: number | null;
  name: string;
  description: string;
  location: string;
  year: string;
  tag: string;
  area: string;
  client: string;
  concept_quote: string;
  concept_quote_author: string;
  challenge: string;
  solution: string;
  materials: string[];
  hero_focus: string;
  sort_order: number;
  published: boolean;
}

export interface DbImage {
  id: string;
  project_id: string;
  url: string;
  storage_path: string | null;
  room: RoomCategory | null;
  is_hero: boolean;
  is_cover: boolean;
  sort_order: number;
}

// ── Mapare rând DB → forma `Project` folosită de paginile publice ────────────
export function mapRowToProject(p: DbProject, imgs: DbImage[]): Project {
  const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order);
  const allImages = sorted.map((i) => i.url);
  const heroImgs = sorted.filter((i) => i.is_hero).map((i) => i.url);
  const images = heroImgs.length ? heroImgs : allImages.slice(0, 3);

  const roomMap: Record<number, RoomCategory> = {};
  sorted.forEach((img, idx) => {
    if (img.room) roomMap[idx] = img.room;
  });

  const cover = sorted.find((i) => i.is_cover)?.url;

  return {
    id: p.ref ?? 0,
    name: p.name,
    description: p.description || '',
    location: p.location || '',
    year: p.year || '',
    tag: p.tag || 'Design Interior',
    images: images.length ? images : [''],
    allImages,
    area: p.area || undefined,
    client: p.client || undefined,
    conceptQuote: p.concept_quote || undefined,
    conceptQuoteAuthor: p.concept_quote_author || undefined,
    challenge: p.challenge || undefined,
    solution: p.solution || undefined,
    materials: p.materials?.length ? p.materials : undefined,
    roomMap: Object.keys(roomMap).length ? roomMap : undefined,
    coverImage: cover,
    heroFocus: p.hero_focus || undefined,
  };
}

/* Citire prin API-ul REST (PostgREST). Header-ele sunt cele pe care le trimite
   supabase-js pentru un vizitator neautentificat. */
async function rest<T>(path: string): Promise<T> {
  const base = String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, '');
  const key = String(import.meta.env.VITE_SUPABASE_ANON_KEY);
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

/* ── PUBLIC: încarcă proiectele pentru site ──────────────────────────────────
   Întoarce `null` dacă Supabase nu e configurat sau apare o eroare → apelantul
   folosește datele statice. Un array gol e tratat tot ca „folosește static",
   ca să nu rămână site-ul fără portofoliu înainte de migrare.                  */
export async function fetchPortfolioProjects(): Promise<Project[] | null> {
  if (!hasSupabase) return null;
  try {
    const rows = await rest<DbProject[]>(
      'portfolio_projects?select=*&published=eq.true&order=sort_order.asc'
    );
    if (!rows || rows.length === 0) return null;

    const ids = rows.map((r) => r.id).join(',');
    const imgs = await rest<DbImage[]>(
      `portfolio_images?select=*&project_id=in.(${ids})&order=sort_order.asc`
    );

    return rows.map((p) => mapRowToProject(p, imgs.filter((i) => i.project_id === p.id)));
  } catch (err) {
    console.warn('[portfolio] citire eșuată, folosesc datele statice:', err);
    return null;
  }
}
