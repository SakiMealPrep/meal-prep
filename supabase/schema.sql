create extension if not exists pgcrypto;

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  meal text not null check (meal in ('dorucak', 'doručak', 'rucak', 'ručak', 'vecera', 'večera')),
  goal text not null check (goal in ('gubitak', 'odrzavanje', 'održavanje')),
  description text not null default '',
  ingredients text[] not null default '{}',
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

alter table public.recipes enable row level security;

drop policy if exists "Allow public recipe reads" on public.recipes;
create policy "Allow public recipe reads"
on public.recipes
for select
to anon, authenticated
using (true);

drop policy if exists "Allow public recipe inserts" on public.recipes;
create policy "Allow public recipe inserts"
on public.recipes
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow public recipe updates" on public.recipes;
create policy "Allow public recipe updates"
on public.recipes
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Allow public recipe deletes" on public.recipes;
create policy "Allow public recipe deletes"
on public.recipes
for delete
to anon, authenticated
using (true);
