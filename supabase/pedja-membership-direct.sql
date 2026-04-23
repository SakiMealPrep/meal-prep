with target_user as (
  select id
  from auth.users
  where lower(email) = lower('jovanovicpedja676@gmail.com')
  order by created_at desc
  limit 1
),
existing_household as (
  select h.id, h.created_by
  from public.households h
  join target_user u on u.id = h.created_by
  order by h.created_at desc
  limit 1
),
created_household as (
  insert into public.households (name, created_by)
  select 'Moj household', u.id
  from target_user u
  where not exists (select 1 from existing_household)
  returning id, created_by
),
target_household as (
  select id, created_by from existing_household
  union all
  select id, created_by from created_household
)
insert into public.household_members (household_id, user_id, role)
select id, created_by, 'owner'
from target_household
on conflict (household_id, user_id)
do update set role = 'owner';
