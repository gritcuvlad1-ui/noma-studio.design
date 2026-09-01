/* Tipurile checklistului de proiect.

   O regulă structurală, respectată peste tot mai jos: TEXTUL nu trăiește
   niciodată ca `string`, ci ca `L` — perechea ro/ru. Așa nu există „varianta
   română" și „varianta rusă" ca două liste paralele care se desincronizează
   când se adaugă o opțiune; există o singură listă, iar limba e doar o cheie
   la afișare. Dacă mai târziu apare engleza, se adaugă o cheie în `L`, nu un
   fișier nou. */

export type Lang = 'ro' | 'ru';

export type L = Record<Lang, string>;

/* Nivelul orientativ de investiție, exact scara din documentul original.
   Se afișează ca indicator vizual (bare de lumină), nu ca text în paranteză —
   textul complet rămâne disponibil la atingere/hover. */
export type InvestLevel = 'low' | 'low_mid' | 'mid' | 'mid_high' | 'high' | 'varies';

export interface ChecklistOption {
  id: string;
  label: L;
  invest?: InvestLevel;
  /** „RECOMANDAREA NOASTRĂ" */
  rec?: boolean;
  /** Precizare lângă recomandare, ex. „pentru interioarele premium". */
  recNote?: L;
  /** Precizare neutră, ex. „doar la necesitate funcțională". */
  hint?: L;
  /** Opțiunea „Altceva: ____" — deschide un câmp de text propriu. */
  withText?: boolean;
}

interface FieldBase {
  id: string;
  /** Sub-titlul grupului („Finisaj principal dorit"). Lipsește când secțiunea
      are un singur grup, ca să nu repete titlul secțiunii. */
  label?: L;
  /** NOTĂ: din document — explicație, ton calm. */
  note?: L;
  /** IMPORTANT: din document — accentuat vizual, se citește altfel. */
  important?: L;
}

export interface ChoiceField extends FieldBase {
  kind: 'multi' | 'single';
  options: ChecklistOption[];
}

export interface TextField extends FieldBase {
  kind: 'text';
  label: L;
  placeholder?: L;
  rows?: number;
}

export type ChecklistField = ChoiceField | TextField;

export interface ChecklistSection {
  id: string;
  part: 1 | 2;
  /** Numărul afișat („01", „02"…) — numerotarea din document. */
  num: string;
  title: L;
  /** Frază scurtă sub titlu, care spune ce se decide aici. */
  lead?: L;
  fields: ChecklistField[];
  /** Încăpere care poate lipsi din locuință: apare „Nu am această încăpere". */
  skippable?: boolean;
}

export type ChecklistStep =
  | ({ type: 'section' } & ChecklistSection)
  | { type: 'review'; id: 'review'; part: 2 };

/** Forma răspunsurilor salvate în `checklists.answers`.
    - listă de id-uri  → bifele unui grup
    - string           → un câmp de text
    - `SKIPPED`        → secțiune marcată „nu am această încăpere" */
export type AnswerValue = string[] | string;
export type Answers = Record<string, AnswerValue>;

export const SKIPPED = '__skipped__';
