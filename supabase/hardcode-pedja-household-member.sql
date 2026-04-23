do $$
declare
  target_email text := 'jovanovicpedja676@gmail.com';
  target_user_id uuid;
  target_household_id uuid;
begin
  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = lower(target_email)
  order by u.created_at desc
  limit 1;

  if target_user_id is null then
    raise exception 'User with email % was not found in auth.users', target_email;
  end if;

  select h.id
  into target_household_id
  from public.households h
  where h.created_by = target_user_id
  order by h.created_at desc
  limit 1;

  if target_household_id is null then
    insert into public.households (name, created_by)
    values ('Saki & Peki', target_user_id)
    returning id into target_household_id;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household_id, target_user_id, 'owner')
  on conflict (household_id, user_id)
  do update set role = 'owner';

  raise notice 'User % (%) is now owner of household %', target_email, target_user_id, target_household_id;
end;
$$;

notify pgrst, 'reload schema';
