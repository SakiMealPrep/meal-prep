create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as 'select exists (
  select 1
  from public.household_members hm
  where hm.household_id = target_household_id
    and hm.user_id = auth.uid()
)';

create or replace function public.is_household_creator(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as 'select exists (
  select 1
  from public.households h
  where h.id = target_household_id
    and h.created_by = auth.uid()
)';

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;

drop policy if exists "Members can read households" on public.households;
create policy "Members can read households"
on public.households
for select
to authenticated
using (public.is_household_member(id) or created_by = auth.uid());

drop policy if exists "Users can create own owner membership" on public.household_members;
create policy "Users can create own owner membership"
on public.household_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and public.is_household_creator(household_id)
);

drop policy if exists "Users can join with valid invite" on public.household_members;
create policy "Users can join with valid invite"
on public.household_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1
    from public.household_invites hi
    where hi.household_id = household_members.household_id
      and hi.used_at is null
      and hi.expires_at > now()
  )
);

drop policy if exists "Members can read membership" on public.household_members;
create policy "Members can read membership"
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id) or user_id = auth.uid());

drop policy if exists "Members can create invites" on public.household_invites;
create policy "Members can create invites"
on public.household_invites
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (public.is_household_member(household_id) or public.is_household_creator(household_id))
);

drop policy if exists "Invite token can be read by authenticated users" on public.household_invites;
create policy "Invite token can be read by authenticated users"
on public.household_invites
for select
to authenticated
using (used_at is null and expires_at > now());

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_creator(uuid) to authenticated;

notify pgrst, 'reload schema';
