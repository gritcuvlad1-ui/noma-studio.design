-- ============================================================================
--  NOMA Studio · Checklist de proiect (link privat per client)
--  Rulează acest fișier în Supabase → SQL Editor (o singură dată).
--
--  MODEL DE SECURITATE — de ce arată fișierul așa:
--  Clientul deschide /checklist/<token> fără cont și fără parolă. Singurul lui
--  secret e tokenul din URL. Dacă am da tabelei o politică de citire pentru
--  `anon`, oricine cu cheia publică a site-ului (care e în bundle-ul JS, deci
--  publică prin definiție) ar putea lista TOATE checklistele tuturor clienților.
--  De aceea tabela NU are nicio politică pentru `anon`: e complet inaccesibilă
--  direct. Clientul ajunge la datele lui exclusiv prin cele două funcții
--  `security definer` de mai jos, care primesc tokenul ca argument și întorc
--  strict rândul care se potrivește. Adminul (`authenticated`) vede tot.
-- ============================================================================

-- ── 1. Tabela ───────────────────────────────────────────────────────────────
create table if not exists public.checklists (
  id            uuid primary key default gen_random_uuid(),
  token         text unique not null,          -- secretul din URL: /checklist/<token>
  client_name   text not null,
  project_name  text default '',               -- ex. „Apartament 3 camere, Botanica"
  client_phone  text default '',
  client_email  text default '',
  lang          text default 'ro' check (lang in ('ro','ru')),
  status        text default 'new' check (status in ('new','in_progress','submitted')),
  current_step  integer default 0,             -- pasul din wizard, ca să reia de unde a rămas
  answers       jsonb default '{}'::jsonb,     -- { "field_id": ["opt_a","opt_b"] | "text liber" }
  internal_note text default '',               -- notițele designerului, invizibile clientului
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  opened_at     timestamptz,                   -- prima deschidere a linkului
  submitted_at  timestamptz
);

create index if not exists checklists_status_idx on public.checklists (status, updated_at desc);

-- ── 2. Trigger updated_at (funcția există deja din 0001, o recreăm defensiv) ─
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists checklists_updated_at on public.checklists;
create trigger checklists_updated_at
  before update on public.checklists
  for each row execute function public.set_updated_at();

-- ── 3. RLS: tabela e închisă pentru anon, deschisă pentru admin ─────────────
alter table public.checklists enable row level security;

drop policy if exists "checklists admin all" on public.checklists;
create policy "checklists admin all"
  on public.checklists for all to authenticated
  using (true) with check (true);

-- ── 4. Funcțiile prin care ajunge clientul la rândul lui ────────────────────

-- Încarcă checklistul după token. Marchează prima deschidere.
-- NU întoarce `internal_note` — aceea e strict pentru designer.
create or replace function public.checklist_load(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data public.checklists;
begin
  select * into row_data from public.checklists where token = p_token;

  if not found then
    return null;
  end if;

  if row_data.opened_at is null then
    update public.checklists set opened_at = now() where id = row_data.id;
  end if;

  return jsonb_build_object(
    'client_name',  row_data.client_name,
    'project_name', row_data.project_name,
    'lang',         row_data.lang,
    'status',       row_data.status,
    'current_step', row_data.current_step,
    'answers',      row_data.answers,
    'submitted_at', row_data.submitted_at
  );
end; $$;

-- Autosave. Refuză scrierea peste un checklist deja trimis, ca să nu se poată
-- rescrie răspunsurile după ce designerul le-a citit și a început proiectul.
create or replace function public.checklist_save(
  p_token   text,
  p_answers jsonb,
  p_step    integer,
  p_lang    text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  select status into current_status from public.checklists where token = p_token;

  if not found or current_status = 'submitted' then
    return false;
  end if;

  update public.checklists
     set answers      = p_answers,
         current_step = p_step,
         lang         = coalesce(p_lang, lang),
         status       = 'in_progress'
   where token = p_token;

  return true;
end; $$;

-- Rândul e închis definitiv de edge function-ul `checklist-submit` (rulează cu
-- service_role și trimite și emailul), nu de client — de aceea aici nu există
-- un `checklist_submit` expus lui `anon`.

revoke all on function public.checklist_load(text)                    from public;
revoke all on function public.checklist_save(text, jsonb, integer, text) from public;

grant execute on function public.checklist_load(text)                    to anon, authenticated;
grant execute on function public.checklist_save(text, jsonb, integer, text) to anon, authenticated;
