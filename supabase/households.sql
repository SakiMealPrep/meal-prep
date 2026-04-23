create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.household_inventory (
  household_id uuid not null references public.households(id) on delete cascade,
  ingredient_key text not null,
  label text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id, ingredient_key)
);

create table if not exists public.meal_plan_items (
  household_id uuid not null references public.households(id) on delete cascade,
  day text not null,
  meal text not null,
  recipe_id uuid references public.recipes(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id, day, meal)
);

alter table public.recipes
add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.recipes
add column if not exists created_by uuid references auth.users(id) on delete set null;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

drop trigger if exists set_households_updated_at on public.households;
create trigger set_households_updated_at
before update on public.households
for each row
execute function public.set_updated_at();

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.household_inventory enable row level security;
alter table public.meal_plan_items enable row level security;

drop policy if exists "Members can read households" on public.households;
create policy "Members can read households"
on public.households
for select
to authenticated
using (public.is_household_member(id));

drop policy if exists "Users can create households" on public.households;
create policy "Users can create households"
on public.households
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can update households" on public.households;
create policy "Members can update households"
on public.households
for update
to authenticated
using (public.is_household_member(id))
with check (public.is_household_member(id));

drop policy if exists "Members can read membership" on public.household_members;
create policy "Members can read membership"
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id) or user_id = auth.uid());

drop policy if exists "Users can create own owner membership" on public.household_members;
create policy "Users can create own owner membership"
on public.household_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from public.households h
    where h.id = household_id
      and h.created_by = auth.uid()
  )
);

drop policy if exists "Members can read invites" on public.household_invites;
create policy "Members can read invites"
on public.household_invites
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can create invites" on public.household_invites;
create policy "Members can create invites"
on public.household_invites
for insert
to authenticated
with check (created_by = auth.uid() and public.is_household_member(household_id));

drop policy if exists "Invite token can be read by authenticated users" on public.household_invites;
create policy "Invite token can be read by authenticated users"
on public.household_invites
for select
to authenticated
using (used_at is null and expires_at > now());

drop policy if exists "Invite creators can mark invites used" on public.household_invites;
create policy "Invite creators can mark invites used"
on public.household_invites
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create or replace function public.accept_household_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.household_invites%rowtype;
begin
  select *
  into target_invite
  from public.household_invites
  where token = invite_token
    and used_at is null
    and expires_at > now()
  limit 1;

  if target_invite.id is null then
    raise exception 'Invite is not available';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_invite.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update public.household_invites
  set used_by = auth.uid(), used_at = now()
  where id = target_invite.id;

  return target_invite.household_id;
end;
$$;

drop policy if exists "Members can read inventory" on public.household_inventory;
create policy "Members can read inventory"
on public.household_inventory
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can write inventory" on public.household_inventory;
create policy "Members can write inventory"
on public.household_inventory
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Members can read meal plan" on public.meal_plan_items;
create policy "Members can read meal plan"
on public.meal_plan_items
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can write meal plan" on public.meal_plan_items;
create policy "Members can write meal plan"
on public.meal_plan_items
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Allow public recipe reads" on public.recipes;
create policy "Allow public recipe reads"
on public.recipes
for select
to anon, authenticated
using (household_id is null or public.is_household_member(household_id));

drop policy if exists "Allow public recipe inserts" on public.recipes;
drop policy if exists "Household members can create recipes" on public.recipes;
create policy "Household members can create recipes"
on public.recipes
for insert
to authenticated
with check (
  (household_id is null and created_by = auth.uid())
  or public.is_household_member(household_id)
);

drop policy if exists "Allow public recipe updates" on public.recipes;
drop policy if exists "Household members can update recipes" on public.recipes;
create policy "Household members can update recipes"
on public.recipes
for update
to authenticated
using (household_id is not null and public.is_household_member(household_id))
with check (household_id is not null and public.is_household_member(household_id));

drop policy if exists "Allow public recipe deletes" on public.recipes;
drop policy if exists "Household members can delete recipes" on public.recipes;
create policy "Household members can delete recipes"
on public.recipes
for delete
to authenticated
using (household_id is not null and public.is_household_member(household_id));
