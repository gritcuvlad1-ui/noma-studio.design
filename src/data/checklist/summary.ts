import { checklistSteps } from './index';
import { SKIPPED, type Answers, type ChecklistField, type Lang } from './types';

/* Transformă `answers` brute (id-uri de opțiuni) în text lizibil, pe baza
   ACELUIAȘI catalog de secțiuni/opțiuni din `part1.ts`/`part2.ts` — o singură
   sursă de adevăr pentru etichete, folosită și de panoul admin (React), și
   de edge function-ul `checklist-submit` (Deno, fără React). De aceea acest
   fișier nu importă nimic din React/UI. */

export interface SummaryLine {
  label: string;
  value: string;
}

export interface SummarySection {
  id: string;
  num: string;
  title: string;
  skipped: boolean;
  lines: SummaryLine[];
}

function fieldLabel(field: ChecklistField, lang: Lang): string | null {
  return field.label ? field.label[lang] : null;
}

function renderField(field: ChecklistField, answers: Answers, lang: Lang): SummaryLine | null {
  const raw = answers[field.id];

  if (field.kind === 'text') {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) return null;
    return { label: fieldLabel(field, lang) ?? '', value: text };
  }

  // multi / single
  const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (ids.length === 0) return null;

  const parts = ids.map((id) => {
    const opt = field.options.find((o) => o.id === id);
    if (!opt) return id;
    const own = answers[`${field.id}__${id}_text`];
    const extra = opt.withText && typeof own === 'string' && own.trim() ? `: ${own.trim()}` : '';
    return `${opt.label[lang]}${extra}`;
  });

  return { label: fieldLabel(field, lang) ?? '', value: parts.join(', ') };
}

export function buildSummary(answers: Answers, lang: Lang): SummarySection[] {
  const out: SummarySection[] = [];

  for (const step of checklistSteps) {
    if (step.type !== 'section') continue;

    const skipped = step.skippable && answers[step.id] === SKIPPED;
    const lines: SummaryLine[] = [];

    if (!skipped) {
      for (const field of step.fields) {
        const line = renderField(field, answers, lang);
        if (line) lines.push(line);
      }
    }

    if (skipped || lines.length > 0) {
      out.push({ id: step.id, num: step.num, title: step.title[lang], skipped: !!skipped, lines });
    }
  }

  return out;
}

const NO_ROOM_TEXT: Record<Lang, string> = {
  ro: 'Nu are această încăpere.',
  ru: 'Такого помещения нет.',
};

export function summaryToPlainText(sections: SummarySection[], lang: Lang): string {
  return sections
    .map((s) => {
      const head = `${s.num}. ${s.title}`;
      if (s.skipped) return `${head}\n${NO_ROOM_TEXT[lang]}`;
      const body = s.lines.map((l) => (l.label ? `- ${l.label}: ${l.value}` : `- ${l.value}`)).join('\n');
      return `${head}\n${body}`;
    })
    .join('\n\n');
}
