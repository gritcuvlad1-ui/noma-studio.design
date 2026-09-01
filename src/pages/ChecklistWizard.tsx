import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Head as Helmet } from 'vite-react-ssg';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
} from '../components/PremiumIcons';
import {
  checklistSteps,
  SKIPPED,
  type Answers,
  type ChecklistField,
  type ChecklistSection,
  type Lang,
} from '../data/checklist';
import { investLabels, recBadgeText } from '../data/checklist/investLabels';
import { buildSummary } from '../data/checklist/summary';
import {
  loadChecklistByToken,
  saveChecklistByToken,
  submitChecklistByToken,
} from '../lib/checklistApi';
import './ChecklistWizard.css';

// `window.__lenis` e deja declarat global în App.tsx (tipat ca `Lenis`,
// setat de AppShell) — NU redeclarăm aici cu un tip îngustat: TS combină
// declarațiile globale, iar o formă diferită ("must have the same type")
// pică typecheck-ul ȘI rupe alte fișiere care apelează .stop()/.start()
// pe același obiect (Cursuri.tsx, ProjectDetails.tsx). Folosim direct
// aceeași idiomă ca ScrollToTop din App.tsx: `?.scrollTo(0, {immediate,force})`.

const UI: Record<Lang, Record<string, string>> = {
  ro: {
    loading: 'Se încarcă checklistul…',
    notFoundTitle: 'Link invalid',
    notFoundBody: 'Acest link nu mai este valabil. Vă rugăm să cereți un link nou echipei NOMA.',
    submittedTitle: 'Mulțumim!',
    submittedBody: 'Checklistul a fost trimis echipei NOMA. Revenim curând cu pașii următori.',
    submittedReview: 'Ce ați completat',
    back: 'Înapoi',
    next: 'Continuă',
    submit: 'Trimite checklistul',
    submitting: 'Se trimite…',
    skipToggle: 'Nu am această încăpere',
    skipped: 'Marcat: nu există această încăpere.',
    reviewTitle: 'Recapitulare',
    reviewLead: 'Verificați răspunsurile înainte de a trimite. Puteți reveni la orice secțiune.',
    reviewEdit: 'Editează',
    reviewEmpty: 'Nicio secțiune completată încă.',
    altcevaPlaceholder: 'Detalii…',
    submitError: 'Nu am putut trimite checklistul. Încercați din nou.',
  },
  ru: {
    loading: 'Загружаем чек-лист…',
    notFoundTitle: 'Недействительная ссылка',
    notFoundBody: 'Эта ссылка больше не активна. Пожалуйста, запросите новую ссылку у команды NOMA.',
    submittedTitle: 'Спасибо!',
    submittedBody: 'Чек-лист отправлен команде NOMA. Скоро свяжемся с дальнейшими шагами.',
    submittedReview: 'Что вы заполнили',
    back: 'Назад',
    next: 'Далее',
    submit: 'Отправить чек-лист',
    submitting: 'Отправка…',
    skipToggle: 'У меня нет этой комнаты',
    skipped: 'Отмечено: этого помещения нет.',
    reviewTitle: 'Итоги',
    reviewLead: 'Проверьте ответы перед отправкой. Можно вернуться к любому разделу.',
    reviewEdit: 'Изменить',
    reviewEmpty: 'Пока ничего не заполнено.',
    altcevaPlaceholder: 'Подробнее…',
    submitError: 'Не удалось отправить чек-лист. Попробуйте ещё раз.',
  },
};

function scrollToTop() {
  window.__lenis?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

// Butonul „Continuă" apare (mic, dreapta) DOAR când s-a răspuns la ultima
// întrebare cu opțiuni a secțiunii — câmpurile de text liber (notițe,
// „altceva") rămân opționale, nu blochează avansul. O secțiune marcată
// „Nu am această încăpere" e mereu considerată completă.
function isSectionAnswered(section: ChecklistSection, answers: Answers): boolean {
  if (section.skippable && answers[section.id] === SKIPPED) return true;
  return section.fields
    .filter((f) => f.kind !== 'text')
    .every((f) => {
      const val = answers[f.id];
      return Array.isArray(val) ? val.length > 0 : typeof val === 'string' && val.length > 0;
    });
}

// ── Un câmp de checklist (choice sau text) ──────────────────────────────────

function FieldBlock({
  field,
  lang,
  answers,
  onChange,
}: {
  field: ChecklistField;
  lang: Lang;
  answers: Answers;
  onChange: (patch: Answers) => void;
}) {
  const t = UI[lang];

  if (field.kind === 'text') {
    const value = typeof answers[field.id] === 'string' ? (answers[field.id] as string) : '';
    return (
      <div className="cw-field" data-field-id={field.id}>
        {field.note && <p className="cw-note">{field.note[lang]}</p>}
        {field.important && <p className="cw-important">{field.important[lang]}</p>}
        {field.label && <label className="cw-field-label">{field.label[lang]}</label>}
        <textarea
          className="cw-textarea"
          rows={field.rows ?? 2}
          placeholder={field.placeholder?.[lang]}
          value={value}
          onChange={(e) => onChange({ [field.id]: e.target.value })}
        />
      </div>
    );
  }

  const isMulti = field.kind === 'multi';
  const rawVal = answers[field.id];
  const selectedIds: string[] = isMulti
    ? Array.isArray(rawVal)
      ? rawVal
      : []
    : typeof rawVal === 'string'
    ? [rawVal]
    : [];

  const toggle = (optId: string) => {
    if (isMulti) {
      onChange({ [field.id]: toggleInArray(selectedIds, optId) });
    } else {
      onChange({ [field.id]: selectedIds.includes(optId) ? '' : optId });
    }
  };

  return (
    <div className="cw-field" data-field-id={field.id}>
      {field.note && <p className="cw-note">{field.note[lang]}</p>}
      {field.important && <p className="cw-important">{field.important[lang]}</p>}
      {field.label && <label className="cw-field-label">{field.label[lang]}</label>}
      <div className="cw-opts">
        {field.options.map((opt) => {
          const checked = selectedIds.includes(opt.id);
          const textKey = `${field.id}__${opt.id}_text`;
          const textVal = typeof answers[textKey] === 'string' ? (answers[textKey] as string) : '';
          return (
            <div key={opt.id} className={`cw-opt-wrap${checked ? ' checked' : ''}`}>
              <button
                type="button"
                className={`cw-opt${checked ? ' checked' : ''}`}
                onClick={() => toggle(opt.id)}
                aria-pressed={checked}
              >
                <span className={`cw-opt-mark ${isMulti ? 'is-check' : 'is-radio'}`}>
                  {checked && <IconCheck size={11} strokeWidth={3} />}
                </span>
                <span className="cw-opt-label">{opt.label[lang]}</span>
                {opt.rec && <span className="cw-opt-rec">{recBadgeText[lang]}</span>}
                {opt.invest && <span className="cw-opt-meta">{investLabels[opt.invest][lang]}</span>}
              </button>
              {opt.withText && checked && (
                <input
                  type="text"
                  className="cw-opt-text"
                  placeholder={t.altcevaPlaceholder}
                  value={textVal}
                  onChange={(e) => onChange({ [textKey]: e.target.value })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Ecranul unei secțiuni ────────────────────────────────────────────────────

function SectionScreen({
  section,
  lang,
  answers,
  onChange,
}: {
  section: ChecklistSection;
  lang: Lang;
  answers: Answers;
  onChange: (patch: Answers) => void;
}) {
  const t = UI[lang];
  const skipped = section.skippable && answers[section.id] === SKIPPED;

  return (
    <div className="cw-screen">
      <div className="cw-section-head">
        <h2 className="cw-section-title">{section.title[lang]}</h2>
        {section.lead && <p className="cw-section-lead">{section.lead[lang]}</p>}
      </div>

      {section.skippable && (
        <button
          type="button"
          className={`cw-skip-toggle${skipped ? ' active' : ''}`}
          onClick={() => onChange({ [section.id]: skipped ? '' : SKIPPED })}
        >
          <span className={`cw-opt-mark is-check${skipped ? ' checked' : ''}`}>
            {skipped && <IconCheck size={11} strokeWidth={3} />}
          </span>
          {t.skipToggle}
        </button>
      )}

      {!skipped && (
        <div className="cw-fields">
          {section.fields.map((field) => (
            <FieldBlock key={field.id} field={field} lang={lang} answers={answers} onChange={onChange} />
          ))}
        </div>
      )}

      {skipped && <p className="cw-skipped-note">{t.skipped}</p>}
    </div>
  );
}

// ── Ecranul de recapitulare ──────────────────────────────────────────────────

function ReviewScreen({
  lang,
  answers,
  onJump,
}: {
  lang: Lang;
  answers: Answers;
  onJump: (sectionId: string) => void;
}) {
  const t = UI[lang];
  const sections = useMemo(() => buildSummary(answers, lang), [answers, lang]);

  return (
    <div className="cw-screen">
      <div className="cw-section-head">
        <h2 className="cw-section-title">{t.reviewTitle}</h2>
        <p className="cw-section-lead">{t.reviewLead}</p>
      </div>

      {sections.length === 0 && <p className="cw-note">{t.reviewEmpty}</p>}

      <div className="cw-review-list">
        {sections.map((s) => (
          <div key={s.id} className="cw-review-card">
            <div className="cw-review-card-head">
              <span className="cw-review-num">{s.num}</span>
              <h3 className="cw-review-title">{s.title}</h3>
              <button type="button" className="cw-review-edit" onClick={() => onJump(s.id)}>
                {t.reviewEdit}
              </button>
            </div>
            {s.skipped ? (
              <p className="cw-skipped-note">{UI[lang].skipped}</p>
            ) : (
              <dl className="cw-review-lines">
                {s.lines.map((l, i) => (
                  <div key={i} className="cw-review-line">
                    {l.label && <dt>{l.label}</dt>}
                    <dd>{l.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pagina ────────────────────────────────────────────────────────────────

export default function ChecklistWizard() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lang, setLang] = useState<Lang>('ro');
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const hasLoadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    loadChecklistByToken(token)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          return;
        }
        setLang(data.lang ?? 'ro');
        setAnswers(data.answers ?? {});
        setStepIdx(Math.min(Math.max(data.current_step ?? 0, 0), checklistSteps.length - 1));
        setSubmitted(data.status === 'submitted');
      })
      .catch(() => setNotFound(true))
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          hasLoadedRef.current = true;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persist = useCallback(
    (nextAnswers: Answers, nextStep: number, nextLang: Lang) => {
      if (!token || !hasLoadedRef.current || submitted) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveChecklistByToken(token, nextAnswers, nextStep, nextLang).catch(() => {});
      }, 700);
    },
    [token, submitted]
  );

  const updateAnswers = useCallback(
    (patch: Answers) => {
      setAnswers((prev) => {
        const next = { ...prev, ...patch };
        persist(next, stepIdx, lang);
        return next;
      });
    },
    [persist, stepIdx, lang]
  );

  const goToStep = useCallback(
    (idx: number) => {
      const clamped = Math.min(Math.max(idx, 0), checklistSteps.length - 1);
      setStepIdx(clamped);
      persist(answers, clamped, lang);
      scrollToTop();
    },
    [answers, lang, persist]
  );

  const switchLang = useCallback(
    (next: Lang) => {
      setLang(next);
      persist(answers, stepIdx, next);
    },
    [answers, stepIdx, persist]
  );

  const handleSubmit = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      // ne asigurăm că ultima versiune e salvată ÎNAINTE de submit —
      // autosave-ul de mai sus poate fi încă în debounce (700ms).
      await saveChecklistByToken(token, answers, stepIdx, lang);
      const res = await submitChecklistByToken(token);
      if (!res.ok) throw new Error(res.error || 'submit failed');
      setSubmitted(true);
      scrollToTop();
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }, [token, answers, stepIdx, lang]);

  const t = UI[lang];
  const step = checklistSteps[stepIdx];
  const progressPct = Math.round(((stepIdx + 1) / checklistSteps.length) * 100);

  // Link privat, per client — niciodată indexabil (vezi și Disallow dedicat
  // în robots.txt; acest tag e plasa de siguranță pentru un crawler care
  // randează JS și ar vedea conținutul înainte de a citi robots.txt).
  const noIndexHead = (
    <Helmet>
      <title>Checklist proiect — NOMA Studio</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (loading) {
    return (
      <div className="cw-page cw-center">
        {noIndexHead}
        <Loader2 className="cw-spinner" size={28} />
        <p className="cw-muted">{t.loading}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="cw-page cw-center">
        {noIndexHead}
        <div className="cw-lockcard">
          <h1 className="cw-lock-title">{UI.ro.notFoundTitle}</h1>
          <p className="cw-lock-body">{UI.ro.notFoundBody}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const sections = buildSummary(answers, lang);
    return (
      <div className="cw-page">
        {noIndexHead}
        <header className="cw-header cw-header--simple">
          <span className="cw-wordmark">NOMA</span>
        </header>
        <div className="cw-scroll">
          <div className="cw-screen cw-center-narrow">
            <div className="cw-lockcard cw-lockcard--success">
              <h1 className="cw-lock-title">{t.submittedTitle}</h1>
              <p className="cw-lock-body">{t.submittedBody}</p>
            </div>
            <h2 className="cw-review-recap-title">{t.submittedReview}</h2>
            <div className="cw-review-list">
              {sections.map((s) => (
                <div key={s.id} className="cw-review-card">
                  <div className="cw-review-card-head">
                    <span className="cw-review-num">{s.num}</span>
                    <h3 className="cw-review-title">{s.title}</h3>
                  </div>
                  {s.skipped ? (
                    <p className="cw-skipped-note">{t.skipped}</p>
                  ) : (
                    <dl className="cw-review-lines">
                      {s.lines.map((l, i) => (
                        <div key={i} className="cw-review-line">
                          {l.label && <dt>{l.label}</dt>}
                          <dd>{l.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isReview = step.type === 'review';

  return (
    <div className="cw-page">
      {noIndexHead}
      <header className="cw-header">
        <span className="cw-wordmark">NOMA</span>
        <div className="cw-lang-switch">
          {(['ro', 'ru'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`cw-lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => switchLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="cw-progress-track">
        <div className="cw-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="cw-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {step.type === 'section' && (
              <SectionScreen section={step} lang={lang} answers={answers} onChange={updateAnswers} />
            )}
            {isReview && (
              <ReviewScreen
                lang={lang}
                answers={answers}
                onJump={(sectionId) => {
                  const idx = checklistSteps.findIndex((s) => s.id === sectionId);
                  if (idx >= 0) goToStep(idx);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="cw-footer">
        <div className="cw-footer-actions">
          {stepIdx > 0 && (
            <button
              type="button"
              className="cw-btn-icon"
              onClick={() => goToStep(stepIdx - 1)}
              aria-label={t.back}
            >
              <IconChevronLeft size={20} />
            </button>
          )}
          {isReview ? (
            <button type="button" className="cw-btn cw-btn-solid" onClick={handleSubmit} disabled={submitting}>
              {submitting ? t.submitting : t.submit}
              {!submitting && <IconArrowUpRight size={14} />}
            </button>
          ) : (
            step.type === 'section' &&
            isSectionAnswered(step, answers) && (
              <button
                type="button"
                className="cw-btn-icon cw-btn-icon-solid"
                onClick={() => goToStep(stepIdx + 1)}
                aria-label={t.next}
              >
                <IconChevronRight size={22} />
              </button>
            )
          )}
        </div>
        {submitError && <p className="cw-submit-error">{t.submitError}</p>}
      </footer>
    </div>
  );
}
