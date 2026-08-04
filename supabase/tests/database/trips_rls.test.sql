begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.trips'::regclass),
  'trips has Row Level Security enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.trip_members'::regclass),
  'trip_members has Row Level Security enabled'
);

insert into auth.users (id, email)
values
  ('33333333-3333-4333-8333-333333333333', 'trip-owner@nomadio.test'),
  ('44444444-4444-4444-8444-444444444444', 'trip-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '33333333-3333-4333-8333-333333333333';

select lives_ok(
  $$
    insert into public.trips (id, created_by, name, currency)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '33333333-3333-4333-8333-333333333333',
      'Japonsko 2027',
      'JPY'
    )
  $$,
  'an authenticated user can create their own private trip'
);

select is(
  (
    select role::text
    from public.trip_members
    where trip_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '33333333-3333-4333-8333-333333333333'
  ),
  'owner',
  'creating a trip automatically creates its owner membership'
);

select is(
  (select count(*) from public.trips),
  1::bigint,
  'the owner can read their trip'
);

select lives_ok(
  $$
    update public.trips
    set name = 'Japonsko – jaro 2027'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  $$,
  'the owner can update their trip'
);

select throws_ok(
  $$
    insert into public.trips (created_by, name)
    values ('44444444-4444-4444-8444-444444444444', 'Cizí cesta')
  $$,
  '42501',
  null,
  'a user cannot create a trip for somebody else'
);

select lives_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '44444444-4444-4444-8444-444444444444',
      'viewer'
    )
  $$,
  'the owner can add a member'
);

set local "request.jwt.claim.sub" = '44444444-4444-4444-8444-444444444444';

select is(
  (select count(*) from public.trips),
  1::bigint,
  'a viewer can read a shared trip'
);

select is(
  (
    select count(*)
    from public.trip_members
    where trip_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  2::bigint,
  'a member can read memberships for the shared trip'
);

select is_empty(
  $$
    update public.trips
    set name = 'Nepovolená změna'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning id
  $$,
  'a viewer cannot update a trip'
);

select throws_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '33333333-3333-4333-8333-333333333333',
      'editor'
    )
  $$,
  '42501',
  null,
  'a viewer cannot manage memberships'
);

set local "request.jwt.claim.sub" = '55555555-5555-4555-8555-555555555555';

select is(
  (select count(*) from public.trips),
  0::bigint,
  'an unrelated authenticated user cannot read a trip'
);

select is(
  (select count(*) from public.trip_members),
  0::bigint,
  'an unrelated authenticated user cannot read memberships'
);

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.trips $$,
  '42501',
  null,
  'anonymous users cannot read trips'
);

select * from finish();

rollback;
