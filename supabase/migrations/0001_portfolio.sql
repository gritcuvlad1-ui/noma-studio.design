-- ============================================================================
--  NOMA Studio · Portofoliu gestionabil din Admin
--  Rulează acest fișier în Supabase → SQL Editor (o singură dată).
--  Creează: tabelele portfolio_projects + portfolio_images, RLS, bucket Storage.
-- ============================================================================

-- ── 1. Tabela proiectelor ──────────────────────────────────────────────────
create table if not exists public.portfolio_projects (
  id                   uuid primary key default gen_random_uuid(),
  ref                  integer unique,                 -- id numeric folosit în URL: /portofoliu/:ref
  name                 text not null,
  description          text default '',
  location             text default '',
  year                 text default '',
  tag                  text default 'Design Interior',
  area                 text default '',
  client               text default '',
  concept_quote        text default '',
  concept_quote_author text default '',
  challenge            text default '',
  solution             text default '',
  materials            text[] default '{}',
  hero_focus           text default 'center center',   -- object-position pentru poza hero
  sort_order           integer default 0,              -- ordinea în lista de portofoliu
  published            boolean default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ── 2. Tabela pozelor (înlocuiește images[], allImages[] și roomMap) ─────────
create table if not exists public.portfolio_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.portfolio_projects(id) on delete cascade,
  url          text not null,                          -- URL public al pozei
  storage_path text,                                   -- calea în bucket (null = fișier static legacy)
  room         text check (room in ('living','bucatarie','dormitor','baie')), -- null = ambiguu (apare doar la „Toate")
  is_hero      boolean default false,                  -- poză din sliderul hero / card
  is_cover     boolean default false,                  -- poza de copertă a cardului
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

create index if not exists portfolio_images_project_idx
  on public.portfolio_images (project_id, sort_order);

-- ── 3. Trigger updated_at ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists portfolio_projects_updated_at on public.portfolio_projects;
create trigger portfolio_projects_updated_at
  before update on public.portfolio_projects
  for each row execute function public.set_updated_at();

-- ── 4. Row Level Security ────────────────────────────────────────────────────
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_images  enable row level security;

-- Citire publică (oricine vede portofoliul pe site)
drop policy if exists "portfolio_projects public read" on public.portfolio_projects;
create policy "portfolio_projects public read"
  on public.portfolio_projects for select using (true);

drop policy if exists "portfolio_images public read" on public.portfolio_images;
create policy "portfolio_images public read"
  on public.portfolio_images for select using (true);

-- Scriere doar pentru utilizatori autentificați (adminul)
drop policy if exists "portfolio_projects auth write" on public.portfolio_projects;
create policy "portfolio_projects auth write"
  on public.portfolio_projects for all to authenticated
  using (true) with check (true);

drop policy if exists "portfolio_images auth write" on public.portfolio_images;
create policy "portfolio_images auth write"
  on public.portfolio_images for all to authenticated
  using (true) with check (true);

-- ── 5. Storage bucket pentru pozele încărcate din admin ──────────────────────
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Citire publică a pozelor din bucket
drop policy if exists "portfolio bucket public read" on storage.objects;
create policy "portfolio bucket public read"
  on storage.objects for select
  using (bucket_id = 'portfolio');

-- Upload / update / delete doar pentru admin autentificat
drop policy if exists "portfolio bucket auth write" on storage.objects;
create policy "portfolio bucket auth write"
  on storage.objects for all to authenticated
  using (bucket_id = 'portfolio') with check (bucket_id = 'portfolio');
