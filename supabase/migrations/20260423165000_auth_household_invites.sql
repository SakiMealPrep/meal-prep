create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
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
  email text not null,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint household_invites_email_lowercase check (email = lower(email)),
  constraint household_invites_used_together check (
    (used_by is null and used_at is null) or (used_by is not null and used_at is not null)
  )
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists households_created_by_idx on public.households (created_by);
create index if not exists household_members_user_id_idx on public.household_members (user_id);
create index if not exists household_invites_household_id_idx on public.household_invites (household_id);
create index if not exists household_invites_email_idx on public.household_invites (email);
create index if not exists household_invites_active_idx
  on public.household_invites (household_id, email)
  where used_at is null;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = now();

  return new;
end;
$$;

create or replace function private.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function private.can_manage_household(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  );
$$;

create or replace function private.create_household_with_owner(household_name text)
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
  values (trim(household_name), auth.uid())
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner');

  return new_household_id;
end;
$$;

create or replace function private.get_household_invite(invite_token text)
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

  if auth.uid() is not null and private.is_household_member(target_invite.household_id) then
    return query select 'already_member'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
    return;
  end if;

  return query select 'valid'::text, target_invite.household_id, target_invite.target_household_name, target_invite.email, target_invite.expires_at;
end;
$$;

create or replace function private.accept_household_invite(invite_token text)
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

  if exists (
    select 1
    from public.household_members
    where household_id = target_invite.household_id
      and user_id = auth.uid()
  ) then
    return target_invite.household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_invite.household_id, auth.uid(), 'member');

  update public.household_invites
  set used_by = auth.uid(), used_at = now()
  where id = target_invite.id;

  return target_invite.household_id;
end;
$$;

create or replace function public.create_household_with_owner(household_name text)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.create_household_with_owner(household_name);
$$;

create or replace function public.get_household_invite(invite_token text)
returns table (
  status text,
  household_id uuid,
  household_name text,
  invite_email text,
  expires_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.get_household_invite(invite_token);
$$;

create or replace function public.accept_household_invite(invite_token text)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.accept_household_invite(invite_token);
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_households_updated_at on public.households;
create trigger set_households_updated_at
before update on public.households
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "Members can read households" on public.households;
create policy "Members can read households"
on public.households for select
to authenticated
using (private.is_household_member(id));

drop policy if exists "Users can create households" on public.households;
create policy "Users can create households"
on public.households for insert
to authenticated
with check ((select auth.uid()) is not null and created_by = (select auth.uid()));

drop policy if exists "Managers can update households" on public.households;
create policy "Managers can update households"
on public.households for update
to authenticated
using (private.can_manage_household(id))
with check (private.can_manage_household(id));

drop policy if exists "Members can read household memberships" on public.household_members;
create policy "Members can read household memberships"
on public.household_members for select
to authenticated
using (private.is_household_member(household_id));

drop policy if exists "Members can leave household" on public.household_members;
create policy "Members can leave household"
on public.household_members for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Managers can create invites" on public.household_invites;
create policy "Managers can create invites"
on public.household_invites for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and private.can_manage_household(household_id)
);

drop policy if exists "Managers can read household invites" on public.household_invites;
create policy "Managers can read household invites"
on public.household_invites for select
to authenticated
using (private.can_manage_household(household_id));

drop policy if exists "Managers can revoke unused invites" on public.household_invites;
create policy "Managers can revoke unused invites"
on public.household_invites for update
to authenticated
using (private.can_manage_household(household_id) and used_at is null)
with check (private.can_manage_household(household_id));

grant usage on schema private to anon, authenticated;
grant execute on function private.is_household_member(uuid) to authenticated;
grant execute on function private.can_manage_household(uuid) to authenticated;
grant execute on function private.create_household_with_owner(text) to authenticated;
grant execute on function private.get_household_invite(text) to anon, authenticated;
grant execute on function private.accept_household_invite(text) to authenticated;
grant execute on function public.create_household_with_owner(text) to authenticated;
grant execute on function public.get_household_invite(text) to anon, authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;

notify pgrst, 'reload schema';
