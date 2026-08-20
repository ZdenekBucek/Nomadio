begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email)
values
  ('81818181-8181-4181-8181-818181818181', 'quick-owner@nomadio.test'),
  ('82828282-8282-4282-8282-828282828282', 'quick-editor@nomadio.test'),
  ('83838383-8383-4383-8383-838383838383', 'quick-viewer@nomadio.test'),
  ('84848484-8484-4484-8484-848484848484', 'quick-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '81818181-8181-4181-8181-818181818181';

select lives_ok(
  $$ select public.create_private_trip(
    trip_name => 'Quick Expense cesta',
    destination_country_code => 'CZ',
    destination_country_name => 'Česko',
    destination_city => 'Praha',
    destination_continent => 'europe',
    trip_start_date => '2027-06-01',
    trip_end_date => '2027-06-10'
  ) $$,
  'owner creates a trip for Quick Expense settings'
);

select lives_ok(
  $$ select public.create_private_trip(
    trip_name => 'Archivovaná Quick Expense cesta',
    destination_country_code => 'SK',
    destination_country_name => 'Slovensko',
    destination_city => 'Bratislava',
    destination_continent => 'europe',
    trip_start_date => '2027-07-01',
    trip_end_date => '2027-07-03'
  ) $$,
  'owner creates a second trip for archived behavior'
);

select is(
  (select quick_expense_before_start_enabled from public.trips where name = 'Quick Expense cesta'),
  false,
  'the trip preference defaults to false'
);

select is(
  public.add_trip_member_by_email(
    (select id from public.trips where name = 'Quick Expense cesta'),
    'quick-editor@nomadio.test',
    'editor'
  ),
  'added',
  'owner adds an editor'
);

select is(
  public.add_trip_member_by_email(
    (select id from public.trips where name = 'Quick Expense cesta'),
    'quick-viewer@nomadio.test',
    'viewer'
  ),
  'added',
  'owner adds a viewer'
);

select is(
  public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Quick Expense cesta'),
    true
  ),
  'updated',
  'owner enables the preference'
);

select is(
  (select quick_expense_before_start_enabled from public.trips where name = 'Quick Expense cesta'),
  true,
  'the enabled preference is stored'
);

select is(
  (select currency from public.trips where name = 'Quick Expense cesta'),
  'CZK',
  'the narrow preference update preserves other trip settings'
);

set local "request.jwt.claim.sub" = '82828282-8282-4282-8282-828282828282';

select is(
  public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Quick Expense cesta'),
    false
  ),
  'updated',
  'editor disables the preference'
);

select is(
  (select quick_expense_before_start_enabled from public.trips where name = 'Quick Expense cesta'),
  false,
  'the disabled preference is stored'
);

select is(
  public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Quick Expense cesta'),
    true
  ),
  'updated',
  'editor can enable the preference'
);

set local "request.jwt.claim.sub" = '83838383-8383-4383-8383-838383838383';

select throws_ok(
  $$ select public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Quick Expense cesta'),
    false
  ) $$,
  '42501',
  null,
  'viewer cannot update the preference'
);

update public.trips
set quick_expense_before_start_enabled = false
where name = 'Quick Expense cesta';

select is(
  (select quick_expense_before_start_enabled from public.trips where name = 'Quick Expense cesta'),
  true,
  'trip RLS prevents a viewer from updating the preference directly'
);

set local "request.jwt.claim.sub" = '84848484-8484-4484-8484-848484848484';

select throws_ok(
  $$ select public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Quick Expense cesta'),
    false
  ) $$,
  '42501',
  null,
  'a non-member cannot update the preference'
);

set local "request.jwt.claim.sub" = '81818181-8181-4181-8181-818181818181';

select is(
  public.archive_trip((select id from public.trips where name = 'Archivovaná Quick Expense cesta')),
  'archived',
  'owner archives the second trip'
);

select throws_ok(
  $$ select public.set_trip_quick_expense_before_start(
    (select id from public.trips where name = 'Archivovaná Quick Expense cesta'),
    true
  ) $$,
  '42501',
  null,
  'an archived trip remains read-only'
);

select * from finish();
rollback;
