begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has Row Level Security enabled'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'user-one@nomadio.test',
    '{"full_name":"User One"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'user-two@nomadio.test',
    '{"full_name":"User Two"}'::jsonb
  );

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'auth trigger creates one profile per user'
);

select is(
  (
    select default_currency
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  'CZK',
  'profile defaults are applied'
);

select is(
  (select quick_expense_fab_enabled from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  false,
  'quick expense FAB defaults to disabled'
);

delete from public.profiles;

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    insert into public.profiles (id, email)
    values ('11111111-1111-4111-8111-111111111111', 'user-one@nomadio.test')
  $$,
  'an authenticated user can create their own profile'
);

select throws_ok(
  $$
    insert into public.profiles (id, email)
    values ('22222222-2222-4222-8222-222222222222', 'user-two@nomadio.test')
  $$,
  '42501',
  null,
  'an authenticated user cannot create another user profile'
);

reset role;

insert into public.profiles (id, email)
values ('22222222-2222-4222-8222-222222222222', 'user-two@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$ select id from public.profiles order by id $$,
  array['11111111-1111-4111-8111-111111111111'::uuid],
  'an authenticated user can read only their own profile'
);

select results_eq(
  $$
    update public.profiles
    set display_name = 'Not allowed'
    where id = '22222222-2222-4222-8222-222222222222'
    returning id
  $$,
  array[]::uuid[],
  'an authenticated user cannot update another user profile'
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Updated User One', quick_expense_fab_enabled = true
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  'an authenticated user can update their own profile'
);

select is(
  (select quick_expense_fab_enabled from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  true,
  'a user can update their own quick expense FAB preference'
);

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501',
  null,
  'anonymous users cannot read profiles'
);

select * from finish();

rollback;
