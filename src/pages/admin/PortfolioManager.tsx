import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Download, ArrowLeft, Trash2, Pencil, RefreshCw } from 'lucide-react';
import {
  hasSupabase,
  fetchAdminProjects,
  createProject,
  deleteProject,
  importStaticProjects,
  type AdminProject,
} from '../../lib/portfolioApi';
import ProjectEditor from './ProjectEditor';
import './AdminSections.css';
import './PortfolioManager.css';

export default function PortfolioManager() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchAdminProjects());
    } catch (err: any) {
      setError(err.message || 'Eroare la încărcarea proiectelor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSupabase) load();
    else setLoading(false);
  }, []);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const proj = await createProject({ name: 'Proiect nou' });
      await load();
      setEditingId(proj.id);
    } catch (err: any) {
      setError(err.message || 'Nu am putut crea proiectul.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!window.confirm('Importă cele 7 proiecte existente în baza de date? (se sare peste cele deja importate)')) return;
    setBusy(true);
    setError(null);
    try {
      const { imported, skipped } = await importStaticProjects();
      await load();
      alert(`Gata! ${imported} proiecte importate, ${skipped} deja existau.`);
    } catch (err: any) {
      setError(err.message || 'Eroare la import.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (p: AdminProject) => {
    if (!window.confirm(`Ștergi definitiv „${p.name}" și toate pozele lui?`)) return;
    setBusy(true);
    try {
      await deleteProject(p.id);
      await load();
    } catch (err: any) {
      setError(err.message || 'Eroare la ștergere.');
    } finally {
      setBusy(false);
    }
  };

  // ── Supabase neconfigurat ──────────────────────────────────────────────────
  if (!hasSupabase) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Gestionare Portofoliu</h2>
        <div className="pm-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Supabase nu este configurat.</strong>
            <p>
              Adaugă <code>VITE_SUPABASE_URL</code> și <code>VITE_SUPABASE_ANON_KEY</code> reale în fișierul
              <code> .env</code>, apoi rulează migrarea SQL din <code>supabase/migrations/0001_portfolio.sql</code>.
              După aceea poți gestiona tot portofoliul de aici.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Editor ──────────────────────────────────────────────────────────────────
  if (editingId) {
    return (
      <div className="admin-section">
        <button className="pm-back-btn" onClick={() => { setEditingId(null); load(); }}>
          <ArrowLeft size={16} /> Înapoi la listă
        </button>
        <ProjectEditor
          project={projects.find((p) => p.id === editingId)!}
          onSaved={load}
        />
      </div>
    );
  }

  // ── Lista proiectelor ─────────────────────────────────────────────────────────
  return (
    <div className="admin-section">
      <div className="pm-header">
        <h2 className="admin-section-title" style={{ margin: 0 }}>Gestionare Portofoliu</h2>
        <div className="pm-header-actions">
          <button className="pm-btn-ghost" onClick={load} disabled={busy} title="Reîncarcă">
            <RefreshCw size={16} />
          </button>
          {projects.length === 0 && (
            <button className="pm-btn-secondary" onClick={handleImport} disabled={busy}>
              <Download size={16} /> Importă cele 7 proiecte
            </button>
          )}
          <button className="admin-btn-submit" onClick={handleCreate} disabled={busy} style={{ margin: 0 }}>
            <Plus size={16} /> Proiect nou
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--admin-text-secondary)' }}>Se încarcă…</p>
      ) : projects.length === 0 ? (
        <div className="pm-empty">
          <p>Niciun proiect încă.</p>
          <p style={{ fontSize: 14, color: 'var(--admin-text-secondary)' }}>
            Importă proiectele existente sau creează unul nou.
          </p>
        </div>
      ) : (
        <div className="pm-grid">
          {projects.map((p) => {
            const cover =
              p.images.find((im) => im.is_cover)?.url ||
              p.images.find((im) => im.is_hero)?.url ||
              p.images[0]?.url;
            return (
              <div key={p.id} className="pm-card">
                <div className="pm-card-thumb">
                  {cover ? <img src={cover} alt={p.name} /> : <div className="pm-card-noimg">Fără poză</div>}
                  {!p.published && <span className="pm-badge-draft">Nepublicat</span>}
                </div>
                <div className="pm-card-body">
                  <h3>{p.name}</h3>
                  <p className="pm-card-meta">
                    {[p.location, p.year].filter(Boolean).join(' · ')}
                  </p>
                  <p className="pm-card-count">{p.images.length} poze</p>
                </div>
                <div className="pm-card-actions">
                  <button className="pm-btn-edit" onClick={() => setEditingId(p.id)}>
                    <Pencil size={14} /> Editează
                  </button>
                  <button className="admin-btn-delete" onClick={() => handleDelete(p)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
