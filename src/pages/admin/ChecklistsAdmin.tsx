import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  CircleDot,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  adminListChecklists,
  adminCreateChecklist,
  adminUpdateNote,
  adminDeleteChecklist,
  checklistPublicUrl,
  type AdminChecklistRow,
} from '../../lib/checklistApi';
import { hasSupabase } from '../../lib/portfolioApi';
import { buildSummary } from '../../data/checklist/summary';
import type { Lang } from '../../data/checklist/types';
import './AdminSections.css';
import './PortfolioManager.css';
import './ChecklistsAdmin.css';

const STATUS_LABEL: Record<AdminChecklistRow['status'], string> = {
  new: 'Nedeschis',
  in_progress: 'În completare',
  submitted: 'Trimis',
};

function errMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ro-MD', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('ro-MD', { hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: AdminChecklistRow['status'] }) {
  const Icon = status === 'submitted' ? CheckCircle2 : status === 'in_progress' ? CircleDot : Clock;
  return (
    <span className={`ca-badge ca-badge--${status}`}>
      <Icon size={12} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ca-btn-ghost"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(checklistPublicUrl(token));
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // clipboard indisponibil (ex. context non-secure) — link-ul tot apare afișat
        }
      }}
      title="Copiază link-ul"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copiat' : 'Copiază link'}
    </button>
  );
}

// ── Formularul de creare ("Checklist nou") ──────────────────────────────────

function CreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: (row: AdminChecklistRow) => void;
  onCancel: () => void;
}) {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [lang, setLang] = useState<Lang>('ro');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!clientName.trim()) {
      setError('Numele clientului e obligatoriu.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const row = await adminCreateChecklist({
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        lang,
      });
      onCreated(row);
    } catch (err) {
      setError(errMessage(err, 'Nu am putut crea checklistul.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-section ca-create">
      <h2 className="admin-section-title" style={{ margin: 0 }}>
        Checklist nou
      </h2>
      <div className="admin-form">
        <input
          placeholder="Nume client *"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          autoFocus
        />
        <input
          placeholder="Proiect (ex: Apartament 3 camere, Botanica)"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <input
          placeholder="Telefon (opțional)"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
        />
        <input
          placeholder="Email (opțional)"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
        />
        <div className="ca-lang-pick">
          <span>Limbă implicită:</span>
          {(['ro', 'ru'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`ca-lang-pick-btn${lang === l ? ' active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="admin-error">{error}</div>}
      <div className="ca-create-actions">
        <button className="pm-btn-ghost" onClick={onCancel} disabled={busy} type="button">
          Renunță
        </button>
        <button className="admin-btn-submit" style={{ margin: 0 }} onClick={submit} disabled={busy} type="button">
          <Plus size={16} /> {busy ? 'Se creează…' : 'Creează link'}
        </button>
      </div>
    </div>
  );
}

// ── Vizualizarea detaliată a unui checklist ─────────────────────────────────

function ChecklistDetail({
  row,
  onBack,
  onDeleted,
  onNoteSaved,
}: {
  row: AdminChecklistRow;
  onBack: () => void;
  onDeleted: () => void;
  onNoteSaved: (note: string) => void;
}) {
  const [note, setNote] = useState(row.internal_note || '');
  const [noteSaving, setNoteSaving] = useState(false);
  const sections = useMemo(() => buildSummary(row.answers || {}, row.lang), [row.answers, row.lang]);

  const saveNote = async () => {
    if (note === row.internal_note) return;
    setNoteSaving(true);
    try {
      await adminUpdateNote(row.id, note);
      onNoteSaved(note);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Ștergi definitiv checklistul lui „${row.client_name}"? Link-ul devine invalid.`)) return;
    await adminDeleteChecklist(row.id);
    onDeleted();
  };

  return (
    <div className="admin-section">
      <button className="pm-back-btn" onClick={onBack} type="button">
        <ArrowLeft size={16} /> Înapoi la listă
      </button>

      <div className="ca-detail-head">
        <div>
          <h2 className="admin-section-title" style={{ margin: 0 }}>
            {row.client_name}
          </h2>
          {row.project_name && <p className="ca-detail-project">{row.project_name}</p>}
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="ca-detail-meta">
        {row.client_phone && <span>{row.client_phone}</span>}
        {row.client_email && <span>{row.client_email}</span>}
        <span>Limbă: {row.lang.toUpperCase()}</span>
        <span>Creat: {formatDate(row.created_at)}</span>
        <span>Deschis: {formatDate(row.opened_at)}</span>
        <span>Trimis: {formatDate(row.submitted_at)}</span>
      </div>

      <div className="ca-detail-linkrow">
        <code className="ca-detail-link">{checklistPublicUrl(row.token)}</code>
        <CopyLinkButton token={row.token} />
        <a
          className="ca-btn-ghost"
          href={checklistPublicUrl(row.token)}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={14} /> Deschide
        </a>
      </div>

      <div className="ca-note-block">
        <label className="ca-note-label">Notițe interne (nu sunt vizibile clientului)</label>
        <textarea
          className="ca-note-textarea"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          placeholder="Ex: preferă întâlnire sâmbătă, buget discutat separat…"
        />
        {noteSaving && <span className="ca-note-saving">Se salvează…</span>}
      </div>

      <div className="ca-summary">
        {sections.length === 0 ? (
          <p className="ca-empty">Clientul nu a completat încă nimic.</p>
        ) : (
          sections.map((s) => (
            <div key={s.id} className="ca-summary-card">
              <div className="ca-summary-card-head">
                <span className="ca-summary-num">{s.num}</span>
                <h3>{s.title}</h3>
              </div>
              {s.skipped ? (
                <p className="ca-skipped">Nu are această încăpere.</p>
              ) : (
                <dl className="ca-summary-lines">
                  {s.lines.map((l, i) => (
                    <div key={i} className="ca-summary-line">
                      {l.label && <dt>{l.label}</dt>}
                      <dd>{l.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))
        )}
      </div>

      <button className="admin-btn-delete ca-delete-btn" onClick={handleDelete} type="button">
        <Trash2 size={14} /> Șterge checklistul
      </button>
    </div>
  );
}

// ── Lista ────────────────────────────────────────────────────────────────────

export default function ChecklistsAdmin() {
  const [rows, setRows] = useState<AdminChecklistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await adminListChecklists());
    } catch (err) {
      setError(errMessage(err, 'Eroare la încărcarea checklistelor.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSupabase) load();
    else setLoading(false);
  }, []);

  if (!hasSupabase) {
    return (
      <div className="admin-section">
        <h2 className="admin-section-title">Checklist proiecte</h2>
        <div className="pm-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Supabase nu este configurat.</strong>
            <p>Rulează migrarea din <code>supabase/migrations/0002_checklist.sql</code> ca să activezi checklistul.</p>
          </div>
        </div>
      </div>
    );
  }

  const selected = rows.find((r) => r.id === selectedId) || null;

  if (selected) {
    return (
      <ChecklistDetail
        row={selected}
        onBack={() => setSelectedId(null)}
        onDeleted={() => {
          setSelectedId(null);
          load();
        }}
        onNoteSaved={(note) =>
          setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, internal_note: note } : r)))
        }
      />
    );
  }

  if (creating) {
    return (
      <CreateForm
        onCancel={() => setCreating(false)}
        onCreated={async (row) => {
          setCreating(false);
          setJustCreatedToken(row.token);
          await load();
          setSelectedId(row.id);
        }}
      />
    );
  }

  return (
    <div className="admin-section">
      <div className="pm-header">
        <h2 className="admin-section-title" style={{ margin: 0 }}>
          Checklist proiecte
        </h2>
        <div className="pm-header-actions">
          <button className="pm-btn-ghost" onClick={load} disabled={loading} title="Reîncarcă" type="button">
            <RefreshCw size={16} />
          </button>
          <button className="admin-btn-submit" style={{ margin: 0 }} onClick={() => setCreating(true)} type="button">
            <Plus size={16} /> Checklist nou
          </button>
        </div>
      </div>

      {justCreatedToken && (
        <div className="ca-just-created">
          Link creat — <code>{checklistPublicUrl(justCreatedToken)}</code>
        </div>
      )}

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--admin-text-secondary)' }}>Se încarcă…</p>
      ) : rows.length === 0 ? (
        <div className="pm-empty">
          <p>Niciun checklist trimis încă.</p>
          <p style={{ fontSize: 14, color: 'var(--admin-text-secondary)' }}>
            Apasă „Checklist nou" ca să generezi primul link pentru un client.
          </p>
        </div>
      ) : (
        <div className="ca-list">
          {rows.map((r) => (
            <button key={r.id} type="button" className="ca-row" onClick={() => setSelectedId(r.id)}>
              <div className="ca-row-main">
                <span className="ca-row-name">{r.client_name}</span>
                {r.project_name && <span className="ca-row-project">{r.project_name}</span>}
              </div>
              <span className="ca-row-date">{formatDate(r.updated_at)}</span>
              <StatusBadge status={r.status} />
              <CopyLinkButton token={r.token} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
