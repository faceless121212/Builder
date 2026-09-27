-- Figure.09 — ideas table, RLS and realtime.
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.

create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  description text,
  status      text not null default 'not_started'
              check (status in ('not_started', 'working_on_it')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ideas_user_created_idx
  on public.ideas (user_id, created_at desc);

-- Keep updated_at current on every update.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

-- Row Level Security: every user sees and changes only their own rows.
alter table public.ideas enable row level security;

drop policy if exists "ideas_select_own" on public.ideas;
create policy "ideas_select_own" on public.ideas
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "ideas_insert_own" on public.ideas;
create policy "ideas_insert_own" on public.ideas
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "ideas_update_own" on public.ideas;
create policy "ideas_update_own" on public.ideas
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "ideas_delete_own" on public.ideas;
create policy "ideas_delete_own" on public.ideas
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Realtime: broadcast row changes (RLS is applied per subscriber).
-- Full replica identity so DELETE events include user_id for filtering.
alter table public.ideas replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ideas'
  ) then
    alter publication supabase_realtime add table public.ideas;
  end if;
end $$;
