import { supabase } from './supabase';
import { projects as staticProjects, type RoomCategory } from '../data/projects';
import { getProjectCoverImage } from '../utils/projectCover';

/* ============================================================================
   Stratul de date al portofoliului.
   - Site-ul public citește prin `fetchPortfolioProjects()` din ./portfolioPublic (fără supabase-js).
   - Adminul folosește funcțiile de mai jos pentru CRUD + upload în Storage.
   ========================================================================== */

const BUCKET = 'portfolio';

export { hasSupabase, fetchPortfolioProjects } from './portfolioPublic';
export type { DbProject, DbImage } from './portfolioPublic';
import type { DbProject, DbImage } from './portfolioPublic';

export type AdminProject = DbProject & { images: DbImage[] };

/* ── ADMIN: listează toate proiectele (inclusiv nepublicate) cu pozele lor ── */
export async function fetchAdminProjects(): Promise<AdminProject[]> {
  const { data: rows, error } = await supabase
    .from('portfolio_projects')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.id);

  let imgs: DbImage[] = [];
  if (ids.length) {
    const { data, error: imgErr } = await supabase
      .from('portfolio_images')
      .select('*')
      .in('project_id', ids)
      .order('sort_order', { ascending: true });
    if (imgErr) throw imgErr;
    imgs = (data as DbImage[]) ?? [];
  }

  return (rows as DbProject[]).map((p) => ({
    ...p,
    images: imgs.filter((i) => i.project_id === p.id),
  }));
}

// Câmpurile editabile ale unui proiect (fără id/sort_order gestionate intern)
export type ProjectInput = Partial<Omit<DbProject, 'id'>>;

export async function createProject(input: ProjectInput): Promise<DbProject> {
  // ref/sort_order auto = max + 1, ca să apară la finalul listei cu URL unic
  const { data: maxRow } = await supabase
    .from('portfolio_projects')
    .select('ref, sort_order')
    .order('ref', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextRef = (maxRow?.ref ?? 0) + 1;

  const { data, error } = await supabase
    .from('portfolio_projects')
    .insert({
      ...input,
      ref: input.ref ?? nextRef,
      sort_order: input.sort_order ?? nextRef,
      name: input.name ?? 'Proiect nou',
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbProject;
}

export async function updateProject(id: string, fields: ProjectInput): Promise<void> {
  const { error } = await supabase.from('portfolio_projects').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  // Întâi ștergem fișierele din Storage (rândurile din portfolio_images cad în cascadă)
  const { data: imgs } = await supabase
    .from('portfolio_images')
    .select('storage_path')
    .eq('project_id', id);
  const paths = (imgs ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

  const { error } = await supabase.from('portfolio_projects').delete().eq('id', id);
  if (error) throw error;
}

// ── Imagini ──────────────────────────────────────────────────────────────────
function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-');
}

/** Urcă un fișier în Storage și întoarce URL-ul public + calea internă. */
export async function uploadImageFile(
  projectId: string,
  file: File
): Promise<{ url: string; storage_path: string }> {
  const path = `${projectId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, storage_path: path };
}

export async function fetchProjectImages(projectId: string): Promise<DbImage[]> {
  const { data, error } = await supabase
    .from('portfolio_images')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as DbImage[]) ?? [];
}

export async function addImage(
  projectId: string,
  img: { url: string; storage_path?: string | null; room?: RoomCategory | null; is_hero?: boolean; is_cover?: boolean; sort_order?: number }
): Promise<DbImage> {
  const { data, error } = await supabase
    .from('portfolio_images')
    .insert({ project_id: projectId, ...img })
    .select()
    .single();
  if (error) throw error;
  return data as DbImage;
}

export async function updateImage(id: string, fields: Partial<DbImage>): Promise<void> {
  const { error } = await supabase.from('portfolio_images').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteImage(img: Pick<DbImage, 'id' | 'storage_path'>): Promise<void> {
  if (img.storage_path) await supabase.storage.from(BUCKET).remove([img.storage_path]);
  const { error } = await supabase.from('portfolio_images').delete().eq('id', img.id);
  if (error) throw error;
}

/** Setează o poză drept copertă (dezactivează coperta celorlalte din proiect). */
export async function setCoverImage(projectId: string, imageId: string): Promise<void> {
  await supabase.from('portfolio_images').update({ is_cover: false }).eq('project_id', projectId);
  const { error } = await supabase.from('portfolio_images').update({ is_cover: true }).eq('id', imageId);
  if (error) throw error;
}

/** Persistă ordinea pozelor după un array de id-uri. */
export async function reorderImages(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('portfolio_images').update({ sort_order: idx }).eq('id', id)
    )
  );
}

/* ── Migrare: importă cele 7 proiecte statice în Supabase (idempotent) ────────
   Pozele rămân referite din /public (storage_path = null), deci nu reurcăm
   nimic. Sare peste proiectele al căror `ref` există deja.                     */
export async function importStaticProjects(): Promise<{ imported: number; skipped: number }> {
  const { data: existing } = await supabase.from('portfolio_projects').select('ref');
  const existingRefs = new Set((existing ?? []).map((r) => r.ref));

  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < staticProjects.length; i++) {
    const sp = staticProjects[i];
    if (existingRefs.has(sp.id)) {
      skipped++;
      continue;
    }

    const { data: proj, error } = await supabase
      .from('portfolio_projects')
      .insert({
        ref: sp.id,
        sort_order: i,
        name: sp.name,
        description: sp.description,
        location: sp.location,
        year: sp.year,
        tag: sp.tag,
        area: sp.area ?? '',
        client: sp.client ?? '',
        concept_quote: sp.conceptQuote ?? '',
        concept_quote_author: sp.conceptQuoteAuthor ?? '',
        challenge: sp.challenge ?? '',
        solution: sp.solution ?? '',
        materials: sp.materials ?? [],
        published: true,
      })
      .select()
      .single();
    if (error) throw error;

    const all = sp.allImages ?? sp.images;
    const heroSet = new Set(sp.images);
    const coverUrl = getProjectCoverImage(sp, i);

    const rows = all.map((url, idx) => ({
      project_id: (proj as DbProject).id,
      url,
      storage_path: null,
      room: sp.roomMap?.[idx] ?? null,
      is_hero: heroSet.has(url),
      is_cover: url === coverUrl,
      sort_order: idx,
    }));
    if (rows.length) {
      const { error: imgErr } = await supabase.from('portfolio_images').insert(rows);
      if (imgErr) throw imgErr;
    }
    imported++;
  }

  return { imported, skipped };
}
