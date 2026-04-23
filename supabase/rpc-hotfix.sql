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
);';

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
);';

create or replace function public.accept_household_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  target_invite public.household_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception ''User must be authenticated'';
  end if;

  select *
  into target_invite
  from public.household_invites
  where token = invite_token
    and used_at is null
    and expires_at > now()
  limit 1;

  if target_invite.id is null then
    raise exception ''Invite is not available'';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_invite.household_id, auth.uid(), ''member'')
  on conflict (household_id, user_id) do nothing;

  update public.household_invites
  set used_by = auth.uid(), used_at = now()
  where id = target_invite.id;

  return target_invite.household_id;
end;
';

create or replace function public.create_household_with_owner(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception ''User must be authenticated'';
  end if;

  insert into public.households (name, created_by)
  values (nullif(trim(household_name), ''''), auth.uid())
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), ''owner'');

  return new_household_id;
end;
';

create or replace function public.claim_created_household()
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  target_household_id uuid;
begin
  if auth.uid() is null then
    raise exception ''User must be authenticated'';
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
  values (target_household_id, auth.uid(), ''owner'')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
';

create or replace function public.repair_my_households()
returns uuid
language plpgsql
security definer
set search_path = public
as '
declare
  selected_household_id uuid;
begin
  if auth.uid() is null then
    raise exception ''User must be authenticated'';
  end if;

  insert into public.household_members (household_id, user_id, role)
  select h.id, auth.uid(), ''owner''
  from public.households h
  where h.created_by = auth.uid()
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = h.id
        and hm.user_id = auth.uid()
    )
  on conflict (household_id, user_id) do nothing;

  select h.id
  into selected_household_id
  from public.households h
  join public.household_members hm on hm.household_id = h.id
  where hm.user_id = auth.uid()
  order by h.created_at desc
  limit 1;

  return selected_household_id;
end;
';

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_creator(uuid) to authenticated;
grant execute on function public.accept_household_invite(text) to authenticated;
grant execute on function public.create_household_with_owner(text) to authenticated;
grant execute on function public.claim_created_household() to authenticated;
grant execute on function public.repair_my_households() to authenticated;

notify pgrst, 'reload schema';
