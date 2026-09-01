import { part1 } from './part1';
import { part2 } from './part2';
import type { ChecklistStep } from './types';

export * from './types';

/* Sursa unică pentru ordinea wizard-ului: 6 secțiuni Partea I + 13 secțiuni
   Partea II (ultima e „Observații generale") + un ecran final de
   recapitulare/trimitere. Orice pagină care are nevoie de pași
   (ChecklistWizard, bara de progres, admin preview) citește de aici — nu
   recompune lista separat.

   Nu mai există ecrane/bannere de intro („Partea I"/„Partea II", explicații
   despre niveluri de investiție etc.) — șterse complet, cerut explicit:
   clientul intră direct pe prima întrebare reală. */
export const checklistSteps: ChecklistStep[] = [
  ...part1.map((s) => ({ type: 'section' as const, ...s })),
  ...part2.map((s) => ({ type: 'section' as const, ...s })),
  { type: 'review', id: 'review', part: 2 },
];

export const totalSteps = checklistSteps.length;

export function stepIndex(id: string): number {
  return checklistSteps.findIndex((s) => s.id === id);
}
