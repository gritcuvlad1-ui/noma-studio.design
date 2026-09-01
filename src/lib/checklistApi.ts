import { supabase } from './supabase';
import type { Answers, Lang } from '../data/checklist/types';

/* Stratul de date al checklistului de proiect.
   - Clientul (fără cont) vorbește STRICT prin RPC (`checklist_load`/`checklist_save`,
     funcții `security definer` din migrația 0002) — tabela `checklists` nu are
     nicio politică RLS pentru `anon`, deci un select direct pe tabelă ar
     întoarce mereu 0 rânduri pentru vizitatori.
   - Adminul (autentificat) citește/scrie direct pe tabelă — RLS îi permite
     „all" cât timp are sesiune Supabase. */

const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // fără 0/o/1/l/i — link citit cu voce tare fără ambiguitate

export function generateChecklistToken(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => TOKEN_ALPHABET[b % TOKEN_ALPHABET.length]).join('');
}

// ── Public (client, prin token) ─────────────────────────────────────────────

export interface ClientChecklist {
  client_name: string;
  project_name: string;
  lang: Lang;
  status: 'new' | 'in_progress' | 'submitted';
  current_step: number;
  answers: Answers;
  submitted_at: string | null;
}

export async function loadChecklistByToken(token: string): Promise<ClientChecklist | null> {
  const { data, error } = await supabase.rpc('checklist_load', { p_token: token });
  if (error) throw error;
  return (data as ClientChecklist | null) ?? null;
}

export async function saveChecklistByToken(
  token: string,
  answers: Answers,
  step: number,
  lang?: Lang
): Promise<boolean> {
  const { data, error } = await supabase.rpc('checklist_save', {
    p_token: token,
    p_answers: answers,
    p_step: step,
    p_lang: lang ?? null,
  });
  if (error) throw error;
  return !!data;
}

export async function submitChecklistByToken(token: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('checklist-submit', {
    body: { token },
  });
  if (error) return { ok: false, error: error.message };
  return (data as { ok: boolean; error?: string }) ?? { ok: true };
}

// ── Admin (autentificat) ─────────────────────────────────────────────────────

export interface AdminChecklistRow {
  id: string;
  token: string;
  client_name: string;
  project_name: string;
  client_phone: string;
  client_email: string;
  lang: Lang;
  status: 'new' | 'in_progress' | 'submitted';
  current_step: number;
  answers: Answers;
  internal_note: string;
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  submitted_at: string | null;
}

export async function adminListChecklists(): Promise<AdminChecklistRow[]> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as AdminChecklistRow[]) ?? [];
}

export async function adminCreateChecklist(input: {
  clientName: string;
  projectName?: string;
  clientPhone?: string;
  clientEmail?: string;
  lang?: Lang;
}): Promise<AdminChecklistRow> {
  const token = generateChecklistToken();
  const { data, error } = await supabase
    .from('checklists')
    .insert({
      token,
      client_name: input.clientName,
      project_name: input.projectName ?? '',
      client_phone: input.clientPhone ?? '',
      client_email: input.clientEmail ?? '',
      lang: input.lang ?? 'ro',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as AdminChecklistRow;
}

export async function adminUpdateNote(id: string, note: string): Promise<void> {
  const { error } = await supabase.from('checklists').update({ internal_note: note }).eq('id', id);
  if (error) throw error;
}

export async function adminDeleteChecklist(id: string): Promise<void> {
  const { error } = await supabase.from('checklists').delete().eq('id', id);
  if (error) throw error;
}

export function checklistPublicUrl(token: string): string {
  return `${window.location.origin}/checklist/${token}`;
}
