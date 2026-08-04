begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.trip_destinations'::regclass),
  'trip_destinations has Row Level Security enabled'
);

insert into auth.users (id, email)
values
  ('77777777-7777-4777-8777-777777777777', 'detail-owner@nomadio.test'),
  ('88888888-8888-4888-8888-888888888888', 'detail-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '77777777-7777-4777-8777-777777777777';

select lives_ok(
  $$
    select public.create_private_trip(
      trip_name => 'Japonsko 2027',
      destination_country_code => 'JP',
      destination_country_name => 'Japonsko',
      trip_description => 'Jarní cesta',
      trip_start_date => '2027-05-15',
      trip_end_date => '2027-05-30',
      trip_currency => 'JPY',
      destination_city => 'Tokio',
      destination_continent => 'asia'
    )
  $$,
  'the authenticated owner can create a complete private trip atomically'
);

select is(
  (select count(*) from public.trips where name = 'Japonsko 2027'),
  1::bigint,
  'create_private_trip creates one trip'
);

select is(
  (
    select role::text
    from public.trip_members
    where trip_id = (select id from public.trips where name = 'Japonsko 2027')
  ),
  'owner',
  'create_private_trip preserves automatic owner membership'
);

select is(
  (
    select country_code
    from public.trip_destinations
    where trip_id = (select id from public.trips where name = 'Japonsko 2027')
  ),
  'JP',
  'create_private_trip creates the primary destination'
);

select is(
  (
    select continent::text
    from public.trip_destinations
    where trip_id = (select id from public.trips where name = 'Japonsko 2027')
  ),
  'asia',
  'the suggested continent is stored'
);

select lives_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    select id, '88888888-8888-4888-8888-888888888888', 'viewer'
    from public.trips
    where name = 'Japonsko 2027'
  $$,
  'the owner can add a viewer to the complete trip'
);

set local "request.jwt.claim.sub" = '88888888-8888-4888-8888-888888888888';

select is(
  (select count(*) from public.trip_destinations),
  1::bigint,
  'a viewer can read destinations of a shared trip'
);

select is_empty(
  $$
    update public.trip_destinations
    set city = 'Kjóto'
    returning id
  $$,
  'a viewer cannot update destinations'
);

select throws_ok(
  $$
    insert into public.trip_destinations (trip_id, country_name)
    select id, 'Jižní Korea'
    from public.trips
    where name = 'Japonsko 2027'
  $$,
  '42501',
  null,
  'a viewer cannot add destinations'
);

set local "request.jwt.claim.sub" = '99999999-9999-4999-8999-999999999999';

select is(
  (select count(*) from public.trip_destinations),
  0::bigint,
  'an unrelated user cannot read destinations'
);

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.trip_destinations $$,
  '42501',
  null,
  'anonymous users cannot read destinations'
);

select throws_ok(
  $$
    select public.create_private_trip(
      trip_name => 'Anonymous trip',
      destination_country_code => 'CZ',
      destination_country_name => 'Česko'
    )
  $$,
  '42501',
  null,
  'anonymous users cannot execute the trip creation function'
);

reset role;

select lives_ok(
  $$
    update public.trips
    set status = 'archived'
    where name = 'Japonsko 2027'
  $$,
  'trip status can be archived by a privileged database role'
);

select isnt(
  (select archived_at from public.trips where name = 'Japonsko 2027'),
  null::timestamptz,
  'archiving a trip records archived_at'
);

select * from finish();

rollback;
