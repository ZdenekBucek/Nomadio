begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.trip_travelers'::regclass),
  'trip_travelers has Row Level Security enabled'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10101010-1010-4010-8010-101010101010',
    'traveler-owner@nomadio.test',
    '{"full_name":"Owner Traveler"}'::jsonb
  ),
  ('20202020-2020-4020-8020-202020202020', 'traveler-editor@nomadio.test', '{}'::jsonb),
  ('30303030-3030-4030-8030-303030303030', 'traveler-viewer@nomadio.test', '{}'::jsonb);

set local role authenticated;
set local "request.jwt.claim.sub" = '10101010-1010-4010-8010-101010101010';

select lives_ok(
  $$
    select public.create_private_trip(
      trip_name => 'Traveler test trip',
      destination_country_code => 'CZ',
      destination_country_name => 'Česko',
      traveler_names => array['Anna', 'Petr', ' anna ']
    )
  $$,
  'the owner can create a trip with additional travelers atomically'
);

select is(
  (select count(*) from public.trip_travelers),
  3::bigint,
  'the owner and two unique additional travelers are stored'
);

select is(
  (
    select display_name
    from public.trip_travelers
    where user_id = '10101010-1010-4010-8010-101010101010'
  ),
  'Owner Traveler',
  'the linked owner traveler uses the synchronized profile name'
);

select is(
  (
    select count(*)
    from public.trip_travelers
    where user_id is null
  ),
  2::bigint,
  'additional travelers do not require application accounts'
);

select lives_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    select id, '20202020-2020-4020-8020-202020202020', 'editor'
    from public.trips
    where name = 'Traveler test trip'
  $$,
  'the owner can add an editor for traveler permission testing'
);

select lives_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    select id, '30303030-3030-4030-8030-303030303030', 'viewer'
    from public.trips
    where name = 'Traveler test trip'
  $$,
  'the owner can add a viewer for traveler permission testing'
);

set local "request.jwt.claim.sub" = '20202020-2020-4020-8020-202020202020';

select is(
  (select count(*) from public.trip_travelers),
  3::bigint,
  'an editor can read travelers'
);

select lives_ok(
  $$
    insert into public.trip_travelers (trip_id, display_name, created_by, sort_order)
    select id, 'Editor guest', '20202020-2020-4020-8020-202020202020', 4
    from public.trips
    where name = 'Traveler test trip'
  $$,
  'an editor can add an unlinked traveler'
);

select lives_ok(
  $$
    update public.trip_travelers
    set display_name = 'Editor guest updated'
    where display_name = 'Editor guest'
  $$,
  'an editor can update a traveler'
);

select lives_ok(
  $$
    delete from public.trip_travelers
    where display_name = 'Editor guest updated'
  $$,
  'an editor can remove a traveler'
);

select throws_ok(
  $$
    update public.trip_travelers
    set user_id = '20202020-2020-4020-8020-202020202020'
    where display_name = 'Anna'
  $$,
  '42501',
  null,
  'traveler account linkage cannot be changed directly'
);

set local "request.jwt.claim.sub" = '30303030-3030-4030-8030-303030303030';

select is(
  (select count(*) from public.trip_travelers),
  3::bigint,
  'a viewer can read travelers'
);

select throws_ok(
  $$
    insert into public.trip_travelers (trip_id, display_name, created_by)
    select id, 'Viewer guest', '30303030-3030-4030-8030-303030303030'
    from public.trips
    where name = 'Traveler test trip'
  $$,
  '42501',
  null,
  'a viewer cannot add travelers'
);

select is_empty(
  $$
    update public.trip_travelers
    set display_name = 'Forbidden update'
    returning id
  $$,
  'a viewer cannot update travelers'
);

select is_empty(
  $$
    delete from public.trip_travelers
    returning id
  $$,
  'a viewer cannot remove travelers'
);

set local "request.jwt.claim.sub" = '40404040-4040-4040-8040-404040404040';

select is(
  (select count(*) from public.trip_travelers),
  0::bigint,
  'an unrelated user cannot read travelers'
);

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.trip_travelers $$,
  '42501',
  null,
  'anonymous users cannot read travelers'
);

select * from finish();

rollback;
