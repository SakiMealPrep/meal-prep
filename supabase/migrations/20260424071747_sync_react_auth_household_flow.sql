create extension if not exists pgcrypto;

alter table public.household_invites
  add column if not exists email text,
  add column if not exists token_hash text;

update public.household_invites
set token_hash = encode(digest(token, 'sha256'), 'hex')
where token is not null
  and token_hash is null;

create unique index if not exists household_invites_token_hash_idx
  on public.household_invites (token_hash)
  where token_hash is not null;

create index if not exists households_created_by_idx on public.households (created_by);
create index if not exists household_members_user_id_idx on public.household_members (user_id);
create index if not exists household_invites_household_id_idx on public.household_invites (household_id);
create index if not exists household_invites_created_by_idx on public.household_invites (created_by);
create index if not exists household_invites_used_by_idx on public.household_invites (used_by);
create index if not exists household_inventory_updated_by_idx on public.household_inventory (updated_by);
create index if not exists meal_plan_items_recipe_id_idx on public.meal_plan_items (recipe_id);
create index if not exists meal_plan_items_updated_by_idx on public.meal_plan_items (updated_by);
create index if not exists recipes_household_id_idx on public.recipes (household_id);
create index if not exists recipes_created_by_idx on public.recipes (created_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_household_with_owner(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  insert into public.households (name, created_by)
  values (nullif(trim(household_name), ''), auth.uid())
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner')
  on conflict (household_id, user_id) do update
    set role = excluded.role;

  return new_household_id;
end;
$$;

create or replace function public.get_household_invite(invite_token text)
returns table (
  status text,
  household_id uuid,
  household_name text,
  invite_email text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite record;
  token_digest text;
begin
  token_digest := encode(digest(invite_token, 'sha256'), 'hex');

  select hi.*, h.name as target_household_name
  into target_invite
  from public.household_invites hi
  join public.households h on h.id = hi.household_id
  where hi.token_hash = token_digest
  limit 1;

  if target_invite.id is null then
    return query select 'invalid'::text, null::uuid, null::text, null::text, null::timestamptz;
    return;
  end if;

  if target_invite.used_at is not null then
    return query select 'used'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
    return;
  end if;

  if target_invite.expires_at <= now() then
    return query select 'expired'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
    return;
  end if;

  if auth.uid() is not null and public.is_household_member(target_invite.household_id) then
    return query select 'already_member'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
    return;
  end if;

  return query select 'valid'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
end;
$$;

create or replace function public.accept_household_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.household_invites%rowtype;
  token_digest text;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  token_digest := encode(digest(invite_token, 'sha256'), 'hex');

  select *
  into target_invite
  from public.household_invites
  where token_hash = token_digest
  for update;

  if target_invite.id is null then
    raise exception 'invalid_invite';
  end if;

  if target_invite.used_at is not null then
    raise exception 'invite_already_used';
  end if;

  if target_invite.expires_at <= now() then
    raise exception 'invite_expired';
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

create or replace function public.claim_created_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  select h.id
  into target_household_id
  from public.households h
  where h.created_by = auth.uid()
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = h.id
        and hm.user_id = auth.uid()
    )
  order by h.created_at desc
  limit 1;

  if target_household_id is null then
    return null;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'owner')
  on conflict (household_id, user_id) do update
    set role = excluded.role;

  return target_household_id;
end;
$$;

create or replace function public.repair_my_households()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;

  insert into public.household_members (household_id, user_id, role)
  select h.id, auth.uid(), 'owner'
  from public.households h
  where h.created_by = auth.uid()
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = h.id
        and hm.user_id = auth.uid()
    )
  on conflict (household_id, user_id) do update
    set role = excluded.role;

  select h.id
  into selected_household_id
  from public.households h
  join public.household_members hm on hm.household_id = h.id
  where hm.user_id = auth.uid()
  order by h.created_at desc
  limit 1;

  return selected_household_id;
end;
$$;

alter table public.household_inventory enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.recipes enable row level security;

drop policy if exists "Members can read inventory" on public.household_inventory;
create policy "Members can read inventory"
on public.household_inventory
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can insert inventory" on public.household_inventory;
create policy "Members can insert inventory"
on public.household_inventory
for insert
to authenticated
with check (public.is_household_member(household_id));

drop policy if exists "Members can update inventory" on public.household_inventory;
create policy "Members can update inventory"
on public.household_inventory
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Members can delete inventory" on public.household_inventory;
create policy "Members can delete inventory"
on public.household_inventory
for delete
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can read meal plan" on public.meal_plan_items;
create policy "Members can read meal plan"
on public.meal_plan_items
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "Members can insert meal plan" on public.meal_plan_items;
create policy "Members can insert meal plan"
on public.meal_plan_items
for insert
to authenticated
with check (public.is_household_member(household_id));

drop policy if exists "Members can update meal plan" on public.meal_plan_items;
create policy "Members can update meal plan"
on public.meal_plan_items
for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Members can delete meal plan" on public.meal_plan_items;
create policy "Members can delete meal plan"
on public.meal_plan_items
for delete
to authenticated
using (public.is_household_member(household_id));

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
  (select auth.uid()) is not null
  and (
    (household_id is null and created_by = (select auth.uid()))
    or public.is_household_member(household_id)
  )
);

drop policy if exists "Allow public recipe updates" on public.recipes;
drop policy if exists "Household members can update recipes" on public.recipes;
create policy "Household members can update recipes"
on public.recipes
for update
to authenticated
using (
  (household_id is null and created_by = (select auth.uid()))
  or public.is_household_member(household_id)
)
with check (
  (household_id is null and created_by = (select auth.uid()))
  or public.is_household_member(household_id)
);

drop policy if exists "Allow public recipe deletes" on public.recipes;
drop policy if exists "Household members can delete recipes" on public.recipes;
create policy "Household members can delete recipes"
on public.recipes
for delete
to authenticated
using (
  (household_id is null and created_by = (select auth.uid()))
  or public.is_household_member(household_id)
);

grant execute on function public.create_household_with_owner(text) to authenticated;
grant execute on function public.get_household_invite(text) to anon, authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;
grant execute on function public.claim_created_household() to authenticated;
grant execute on function public.repair_my_households() to authenticated;

notify pgrst, 'reload schema';
