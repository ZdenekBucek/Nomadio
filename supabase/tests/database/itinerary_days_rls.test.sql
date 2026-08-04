begin;

create extension if not exists pgtap with schema extensions;
select plan(33);

select ok(not (select prosecdef from pg_proc where oid = 'public.create_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean)'::regprocedure), 'create uses caller permissions');
select ok(not has_function_privilege('anon', 'public.create_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean)', 'execute'), 'anon cannot execute create');

insert into auth.users (id, email) values
  ('11111111-aaaa-4111-8111-111111111111', 'itinerary-owner@nomadio.test'),
  ('22222222-aaaa-4222-8222-222222222222', 'itinerary-editor@nomadio.test'),
  ('33333333-aaaa-4333-8333-333333333333', 'itinerary-viewer@nomadio.test'),
  ('44444444-aaaa-4444-8444-444444444444', 'itinerary-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-aaaa-4111-8111-111111111111';

select lives_ok($$ select public.create_private_trip(
  trip_name => 'Island 2027',
  destination_country_code => 'IS',
  destination_country_name => 'Island',
  destination_city => 'Reykjavík',
  destination_continent => 'europe'
) $$, 'owner creates trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Island 2027'), 'itinerary-editor@nomadio.test', 'editor'), 'added', 'editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Island 2027'), 'itinerary-viewer@nomadio.test', 'viewer'), 'added', 'viewer added');

select isnt(public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Přílet', '2027-06-01', 'Reykjavík', 'confirmed', false), null::uuid, 'owner creates dated day');
select isnt(public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Zlatý okruh', null, 'Selfoss', 'plan', false), null::uuid, 'owner creates undated plan');
select isnt(public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Deštivý den', null, null, 'plan', true), null::uuid, 'owner creates reserve plan');
select is((select count(*) from public.itinerary_days), 3::bigint, 'three itinerary days exist');
select results_eq($$ select sort_order from public.itinerary_days where day_date is null order by sort_order $$, array[0,1], 'undated order is contiguous');
select throws_ok($$ select public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Duplicitní datum', '2027-06-01', null, 'plan', false) $$, '23505', null, 'duplicate date rejected');

select is(public.move_undated_itinerary_day((select id from public.itinerary_days where name='Deštivý den'), -1::smallint), 'moved', 'undated plan moves up');
select is((select sort_order from public.itinerary_days where name='Deštivý den'), 0, 'move swaps order');
select is(public.move_undated_itinerary_day((select id from public.itinerary_days where name='Deštivý den'), -1::smallint), 'boundary', 'boundary is safe');
select is(public.move_undated_itinerary_day((select id from public.itinerary_days where name='Přílet'), 1::smallint), 'dated', 'dated day is not manually moved');

select is(public.update_itinerary_day((select id from public.itinerary_days where name='Zlatý okruh'), 'Zlatý okruh', '2027-06-02', 'Selfoss', 'confirmed', false), 'updated', 'undated plan gets a date');
select is((select count(*) from public.itinerary_days where day_date is null), 1::bigint, 'assignment leaves one undated plan');
select is((select sort_order from public.itinerary_days where name='Deštivý den'), 0, 'assignment normalizes undated order');
select is(public.update_itinerary_day((select id from public.itinerary_days where name='Přílet'), 'Přílet', null, 'Reykjavík', 'completed', false), 'updated', 'dated day returns to undated');
select is((select sort_order from public.itinerary_days where name='Přílet'), 1, 'returned day appends to undated plans');
select is(public.remove_itinerary_day((select id from public.itinerary_days where name='Deštivý den')), 'removed', 'owner removes plan');
select is((select sort_order from public.itinerary_days where name='Přílet'), 0, 'removal normalizes order');

set local "request.jwt.claim.sub" = '22222222-aaaa-4222-8222-222222222222';
select isnt(public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Editorův den', '2027-06-03', null, 'plan', false), null::uuid, 'editor can create');
select is(public.update_itinerary_day((select id from public.itinerary_days where name='Editorův den'), 'Editorův upravený den', '2027-06-03', 'Vík', 'confirmed', false), 'updated', 'editor can update');

set local "request.jwt.claim.sub" = '33333333-aaaa-4333-8333-333333333333';
select is((select count(*) from public.itinerary_days), 3::bigint, 'viewer can read');
select throws_ok($$ select public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Zakázáno', null, null, 'plan', false) $$, '42501', null, 'viewer cannot create');
select throws_ok($$ select public.remove_itinerary_day((select id from public.itinerary_days limit 1)) $$, '42501', null, 'viewer cannot remove');

set local "request.jwt.claim.sub" = '44444444-aaaa-4444-8444-444444444444';
select is((select count(*) from public.itinerary_days), 0::bigint, 'unrelated user cannot read');

set local "request.jwt.claim.sub" = '11111111-aaaa-4111-8111-111111111111';
select throws_ok($$ update public.itinerary_days set sort_order=8 where day_date is null; set constraints all immediate $$, '23514', null, 'direct invalid order rejected');
select throws_ok($$ update public.itinerary_days set trip_id=gen_random_uuid() where name='Přílet' $$, '42501', null, 'system fields protected');
select is(public.archive_trip((select id from public.trips where name='Island 2027')), 'archived', 'trip archived');
select throws_ok($$ select public.create_itinerary_day((select id from public.trips where name='Island 2027'), 'Archiv', null, null, 'plan', false) $$, '42501', null, 'archived trip is read-only');
select is((select count(*) from public.itinerary_days), 3::bigint, 'archived content remains readable');

select * from finish();
rollback;
