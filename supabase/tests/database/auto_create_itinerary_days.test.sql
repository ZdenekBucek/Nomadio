begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'auto-days-owner@nomadio.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'auto-days-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select lives_ok($$ select public.create_private_trip(
  trip_name => 'One Day Trip',
  destination_country_code => 'CZ',
  destination_country_name => 'Česko',
  trip_start_date => '2026-02-28',
  trip_end_date => '2026-02-28'
) $$, 'one-day trip is created');

select is(
  (select count(*) from public.itinerary_days where trip_id = (select id from public.trips where name = 'One Day Trip')),
  1::bigint,
  'one-day trip gets one dated day'
);

select is(
  (select name from public.itinerary_days where trip_id = (select id from public.trips where name = 'One Day Trip')),
  'Den 1',
  'one-day trip day is named Den 1'
);

select is(
  (select day_date from public.itinerary_days where trip_id = (select id from public.trips where name = 'One Day Trip')),
  '2026-02-28'::date,
  'one-day trip keeps the date-only value'
);

select lives_ok($$ select public.create_private_trip(
  trip_name => 'Year Boundary Trip',
  destination_country_code => 'JP',
  destination_country_name => 'Japonsko',
  trip_start_date => '2026-12-30',
  trip_end_date => '2027-01-03'
) $$, 'multi-day trip crossing a year is created');

select is(
  (select count(*) from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip')),
  5::bigint,
  'five-day trip gets five dated days'
);

select results_eq(
  $$ select day_date from public.itinerary_days
     where trip_id = (select id from public.trips where name = 'Year Boundary Trip')
     order by day_date $$,
  $$ values ('2026-12-30'::date), ('2026-12-31'::date), ('2027-01-01'::date),
            ('2027-01-02'::date), ('2027-01-03'::date) $$,
  'dates are inclusive across month and year boundaries'
);

select results_eq(
  $$ select name from public.itinerary_days
     where trip_id = (select id from public.trips where name = 'Year Boundary Trip')
     order by day_date $$,
  $$ values ('Den 1'::text), ('Den 2'::text), ('Den 3'::text), ('Den 4'::text), ('Den 5'::text) $$,
  'day names follow their chronological ordinal'
);

select is(
  (select count(*) from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip')),
  (select count(distinct day_date) from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip')),
  'a trip has no duplicate dated days'
);

select is(
  (select count(*) from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip') and sort_order is null),
  5::bigint,
  'dated days keep sort_order null as required by the model'
);

select is(
  public.update_itinerary_day(
    (select id from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip') and day_date = '2026-12-30'),
    'Odjezd', '2026-12-30', null, 'confirmed', false
  ),
  'updated',
  'an automatically created day remains editable'
);

select is(
  (select name from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip') and day_date = '2026-12-30'),
  'Odjezd',
  'edited day name is persisted'
);

select lives_ok($$ select public.add_trip_member_by_email(
  (select id from public.trips where name = 'Year Boundary Trip'),
  'auto-days-viewer@nomadio.test', 'viewer'
) $$, 'owner can share the generated-day trip');

set local "request.jwt.claim.sub" = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select is(
  (select count(*) from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip')),
  5::bigint,
  'viewer can read automatically created days'
);

select throws_ok($$ select public.update_itinerary_day(
  (select id from public.itinerary_days where trip_id = (select id from public.trips where name = 'Year Boundary Trip') limit 1),
  'Zakázáno', '2026-12-30', null, 'plan', false
) $$, '42501', null, 'viewer cannot edit generated days');

set local "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
select throws_ok($$ select public.create_private_trip(
  trip_name => 'Invalid Date Trip',
  destination_country_code => 'CZ',
  destination_country_name => 'Česko',
  trip_start_date => '2027-05-02',
  trip_end_date => '2027-05-01'
) $$, '23514', null, 'invalid date range is rejected atomically');

select is(
  (select count(*) from public.trips where name = 'Invalid Date Trip'),
  0::bigint,
  'invalid date range leaves no partially created trip'
);

select * from finish();
rollback;
