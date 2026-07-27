import { useEffect, useState } from 'react';
import { Upload, Link2, Trash2, Star, Image as ImageIcon, ArrowUp, ArrowDown, Save } from 'lucide-react';
import {
  type AdminProject,
  type DbImage,
  type ProjectInput,
  updateProject,
  uploadImageFile,
  addImage,
  updateImage,
  deleteImage,
  setCoverImage,
  reorderImages,
  fetchProjectImages,
} from '../../lib/portfolioApi';
import type { RoomCategory } from '../../data/projects';

const ROOMS: { value: RoomCategory | ''; label: string }[] = [
  { value: '', label: '— (doar la „Toate")' },
  { value: 'living', label: 'Living' },
  { value: 'bucatarie', label: 'Bucătărie' },
  { value: 'dormitor', label: 'Dormitor' },
  { value: 'baie', label: 'Baie' },
];

export default function ProjectEditor({
  project,
  onSaved,
}: {
  project: AdminProject;
  onSaved: () => void;
}) {
  // ── Formularul de text ──────────────────────────────────────────────────────
  const [form, setForm] = useState<ProjectInput>({
    name: project.name,
    description: project.description,
    location: project.location,
    year: project.year,
    tag: project.tag,
    area: project.area,
    client: project.client,
    concept_quote: project.concept_quote,
    concept_quote_author: project.concept_quote_author,
    challenge: project.challenge,
    solution: project.solution,
    hero_focus: project.hero_focus,
    published: project.published,
  });
  const [materialsText, setMaterialsText] = useState((project.materials ?? []).join('\n'));
  const [images, setImages] = useState<DbImage[]>(project.images);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setImages(project.images);
  }, [project.images]);

  const refreshImages = async () => {
    setImages(await fetchProjectImages(project.id));
  };

  const set = (k: keyof ProjectInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Salvare detalii text ──────────────────────────────────────────────────────
  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      const materials = materialsText.split('\n').map((s) => s.trim()).filter(Boolean);
      await updateProject(project.id, { ...form, materials });
      flash('ok', 'Detaliile au fost salvate.');
      onSaved();
    } catch (err: any) {
      flash('err', err.message || 'Eroare la salvare.');
    } finally {
      setSavingDetails(false);
    }
  };

  // ── Upload poze ─────────────────────────────────────────────────────────────
  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      let order = images.length;
      for (const file of Array.from(files)) {
        const { url, storage_path } = await uploadImageFile(project.id, file);
        await addImage(project.id, { url, storage_path, sort_order: order++ });
      }
      await refreshImages();
      flash('ok', 'Pozele au fost încărcate.');
    } catch (err: any) {
      flash('err', err.message || 'Eroare la upload.');
    } finally {
      setUploading(false);
    }
  };

  const addByUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;
    try {
      await addImage(project.id, { url, storage_path: null, sort_order: images.length });
      setUrlInput('');
      await refreshImages();
    } catch (err: any) {
      flash('err', err.message || 'Eroare la adăugare URL.');
    }
  };

  const onRoomChange = async (img: DbImage, room: RoomCategory | '') => {
    setImages((arr) => arr.map((i) => (i.id === img.id ? { ...i, room: room || null } : i)));
    try {
      await updateImage(img.id, { room: room || null });
    } catch (err: any) {
      flash('err', err.message || 'Eroare.');
      refreshImages();
    }
  };

  const toggleHero = async (img: DbImage) => {
    const next = !img.is_hero;
    setImages((arr) => arr.map((i) => (i.id === img.id ? { ...i, is_hero: next } : i)));
    try {
      await updateImage(img.id, { is_hero: next });
    } catch (err: any) {
      flash('err', err.message || 'Eroare.');
      refreshImages();
    }
  };

  const makeCover = async (img: DbImage) => {
    setImages((arr) => arr.map((i) => ({ ...i, is_cover: i.id === img.id })));
    try {
      await setCoverImage(project.id, img.id);
    } catch (err: any) {
      flash('err', err.message || 'Eroare.');
      refreshImages();
    }
  };

  const removeImg = async (img: DbImage) => {
    if (!window.confirm('Ștergi această poză?')) return;
    setImages((arr) => arr.filter((i) => i.id !== img.id));
    try {
      await deleteImage({ id: img.id, storage_path: img.storage_path });
    } catch (err: any) {
      flash('err', err.message || 'Eroare la ștergere.');
      refreshImages();
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    try {
      await reorderImages(next.map((i) => i.id));
    } catch (err: any) {
      flash('err', err.message || 'Eroare la reordonare.');
      refreshImages();
    }
  };

  const heroCount = images.filter((i) => i.is_hero).length;

  return (
    <div className="pe-root">
      <h2 className="admin-section-title" style={{ marginBottom: 8 }}>
        {form.name || 'Proiect'}
      </h2>

      {msg && (
        <div className="admin-error" style={msg.type === 'ok' ? { background: 'rgba(16,185,129,0.12)', color: '#10b981' } : undefined}>
          {msg.text}
        </div>
      )}

      {/* ── DETALII TEXT ── */}
      <div className="pe-grid">
        <label className="pe-field">
          <span>Nume proiect</span>
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </label>
        <label className="pe-field">
          <span>Tag</span>
          <input value={form.tag ?? ''} onChange={(e) => set('tag', e.target.value)} placeholder="Design Interior" />
        </label>
        <label className="pe-field">
          <span>Locație</span>
          <input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="Chișinău" />
        </label>
        <label className="pe-field">
          <span>An</span>
          <input value={form.year ?? ''} onChange={(e) => set('year', e.target.value)} placeholder="2026" />
        </label>
        <label className="pe-field">
          <span>Suprafață</span>
          <input value={form.area ?? ''} onChange={(e) => set('area', e.target.value)} placeholder="185 m²" />
        </label>
        <label className="pe-field">
          <span>Client</span>
          <input value={form.client ?? ''} onChange={(e) => set('client', e.target.value)} placeholder="Privat" />
        </label>
        <label className="pe-field pe-col-2">
          <span>Descriere scurtă (apare pe card)</span>
          <textarea rows={2} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </label>
        <label className="pe-field">
          <span>Citat concept</span>
          <textarea rows={2} value={form.concept_quote ?? ''} onChange={(e) => set('concept_quote', e.target.value)} />
        </label>
        <label className="pe-field">
          <span>Autor citat</span>
          <input value={form.concept_quote_author ?? ''} onChange={(e) => set('concept_quote_author', e.target.value)} />
        </label>
        <label className="pe-field pe-col-2">
          <span>Provocarea</span>
          <textarea rows={3} value={form.challenge ?? ''} onChange={(e) => set('challenge', e.target.value)} />
        </label>
        <label className="pe-field pe-col-2">
          <span>Soluția</span>
          <textarea rows={3} value={form.solution ?? ''} onChange={(e) => set('solution', e.target.value)} />
        </label>
        <label className="pe-field">
          <span>Materiale (unul pe linie)</span>
          <textarea rows={4} value={materialsText} onChange={(e) => setMaterialsText(e.target.value)} placeholder={'Lemn de stejar\nPiatră naturală'} />
        </label>
        <label className="pe-field">
          <span>Poziție poză hero (object-position)</span>
          <input value={form.hero_focus ?? ''} onChange={(e) => set('hero_focus', e.target.value)} placeholder="center center" />
          <label className="pe-checkbox" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={!!form.published} onChange={(e) => set('published', e.target.checked)} />
            Publicat (vizibil pe site)
          </label>
        </label>
      </div>

      <button className="admin-btn-submit" onClick={saveDetails} disabled={savingDetails} style={{ marginTop: 4 }}>
        <Save size={16} /> {savingDetails ? 'Se salvează…' : 'Salvează detaliile'}
      </button>

      {/* ── POZE ── */}
      <h3 className="pe-section-title">Poze ({images.length})</h3>
      <p className="pe-hint">
        <Star size={13} style={{ verticalAlign: -2 }} /> hero = apare în slider/card · coperta = poza principală a cardului ·
        camera = filtrul (Living, Bucătărie…). Hero selectate: {heroCount}.
      </p>

      <div className="pe-upload-row">
        <label className="pe-upload-btn">
          <Upload size={16} /> {uploading ? 'Se încarcă…' : 'Încarcă poze'}
          <input type="file" accept="image/*" multiple hidden disabled={uploading}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
        </label>
        <div className="pe-url-add">
          <Link2 size={15} />
          <input placeholder="…sau lipește un URL/cale (ex: /portofoliu-studio/IMG.webp)"
            value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addByUrl()} />
          <button onClick={addByUrl}>Adaugă</button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="pe-noimg"><ImageIcon size={28} /> Nicio poză adăugată.</div>
      ) : (
        <div className="pe-img-grid">
          {images.map((img, idx) => (
            <div key={img.id} className={`pe-img-card ${img.is_cover ? 'is-cover' : ''}`}>
              <div className="pe-img-thumb">
                <img src={img.url} alt="" loading="lazy" />
                {img.is_cover && <span className="pe-tag-cover">Copertă</span>}
                {img.is_hero && <span className="pe-tag-hero"><Star size={11} /> Hero</span>}
              </div>
              <select
                className="pe-room-select"
                value={img.room ?? ''}
                onChange={(e) => onRoomChange(img, e.target.value as RoomCategory | '')}
              >
                {ROOMS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <div className="pe-img-actions">
                <button title="Mută stânga" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUp size={14} /></button>
                <button title="Mută dreapta" onClick={() => move(idx, 1)} disabled={idx === images.length - 1}><ArrowDown size={14} /></button>
                <button title="Hero" className={img.is_hero ? 'active' : ''} onClick={() => toggleHero(img)}><Star size={14} /></button>
                <button title="Setează copertă" className={img.is_cover ? 'active' : ''} onClick={() => makeCover(img)}><ImageIcon size={14} /></button>
                <button title="Șterge" className="danger" onClick={() => removeImg(img)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
