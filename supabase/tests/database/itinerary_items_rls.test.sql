begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

select ok(not (select prosecdef from pg_proc where oid = 'public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid)'::regprocedure), 'create item uses caller permissions');
select ok(not has_function_privilege('anon', 'public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid)', 'execute'), 'anon cannot execute create item');

insert into auth.users (id, email) values
  ('51515151-5151-4151-8151-515151515151', 'timeline-owner@nomadio.test'),
  ('52525252-5252-4252-8252-525252525252', 'timeline-editor@nomadio.test'),
  ('53535353-5353-4353-8353-535353535353', 'timeline-viewer@nomadio.test'),
  ('54545454-5454-4454-8454-545454545454', 'timeline-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '51515151-5151-4151-8151-515151515151';
select lives_ok($$ select public.create_private_trip(trip_name => 'Timeline cesta', destination_country_code => 'JP', destination_country_name => 'Japonsko', destination_city => 'Tokio', destination_continent => 'asia') $$, 'owner creates trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Timeline cesta'), 'timeline-editor@nomadio.test', 'editor'), 'added', 'editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Timeline cesta'), 'timeline-viewer@nomadio.test', 'viewer'), 'added', 'viewer added');
select isnt(public.create_itinerary_day((select id from public.trips where name='Timeline cesta'), 'Tokio', '2027-05-01', 'Tokio', 'plan', false), null::uuid, 'day created');

select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'activity', 'Chrám Sensódži', '09:00', '10:30', 'Přijít dříve', null), null::uuid, 'owner creates activity');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'transport', 'Metro do Šibuji', '11:00', '11:25', null, null), null::uuid, 'owner creates transport');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'note', 'Koupit datovou SIM', null, null, null, null), null::uuid, 'owner creates note');
select is((select count(*) from public.itinerary_items), 3::bigint, 'three items exist');
select results_eq($$ select sort_order from public.itinerary_items order by sort_order $$, array[0,1,2], 'items append contiguously');
select is(public.move_itinerary_item((select id from public.itinerary_items where title='Koupit datovou SIM'), -1::smallint), 'moved', 'item moves up');
select is((select sort_order from public.itinerary_items where title='Koupit datovou SIM'), 1, 'move swaps order');
select is(public.move_itinerary_item((select id from public.itinerary_items where title='Chrám Sensódži'), -1::smallint), 'boundary', 'boundary is safe');
select is(public.update_itinerary_item((select id from public.itinerary_items where title='Chrám Sensódži'), 'activity', 'Chrám Sensódži a okolí', '08:30', '10:30', 'Bez davů', null), 'updated', 'owner updates item');
select is((select start_time from public.itinerary_items where title='Chrám Sensódži a okolí'), '08:30'::time, 'updated time stored');
select is(public.remove_itinerary_item((select id from public.itinerary_items where title='Koupit datovou SIM')), 'removed', 'owner removes item');
select results_eq($$ select sort_order from public.itinerary_items order by sort_order $$, array[0,1], 'removal normalizes order');

set local "request.jwt.claim.sub" = '52525252-5252-4252-8252-525252525252';
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'note', 'Poznámka editora', null, null, 'Text', null), null::uuid, 'editor creates item');
select is(public.update_itinerary_item((select id from public.itinerary_items where title='Poznámka editora'), 'note', 'Upravená poznámka', null, null, null, null), 'updated', 'editor updates item');
select is(public.move_itinerary_item((select id from public.itinerary_items where title='Upravená poznámka'), -1::smallint), 'moved', 'editor reorders item');

set local "request.jwt.claim.sub" = '53535353-5353-4353-8353-535353535353';
select is((select count(*) from public.itinerary_items), 3::bigint, 'viewer can read items');
select throws_ok($$ select public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'note', 'Zakázáno', null, null, null, null) $$, '42501', null, 'viewer cannot create');
select throws_ok($$ select public.update_itinerary_item((select id from public.itinerary_items limit 1), 'note', 'Zakázáno', null, null, null, null) $$, '42501', null, 'viewer cannot update');
select throws_ok($$ select public.move_itinerary_item((select id from public.itinerary_items limit 1), 1::smallint) $$, '42501', null, 'viewer cannot reorder');
select throws_ok($$ select public.remove_itinerary_item((select id from public.itinerary_items limit 1)) $$, '42501', null, 'viewer cannot remove');

set local "request.jwt.claim.sub" = '54545454-5454-4454-8454-545454545454';
select is((select count(*) from public.itinerary_items), 0::bigint, 'unrelated user cannot read items');

set local "request.jwt.claim.sub" = '51515151-5151-4151-8151-515151515151';
select throws_ok($$ update public.itinerary_items set sort_order=8 where sort_order=0; set constraints all immediate $$, '23514', null, 'direct invalid order rejected');
select throws_ok($$ update public.itinerary_items set day_id=gen_random_uuid() where sort_order=0 $$, '42501', null, 'system fields protected');
select is(public.archive_trip((select id from public.trips where name='Timeline cesta')), 'archived', 'trip archived');
select throws_ok($$ select public.create_itinerary_item((select id from public.itinerary_days where name='Tokio'), 'note', 'Archiv', null, null, null, null) $$, '42501', null, 'archived trip blocks create');
select is((select count(*) from public.itinerary_items), 3::bigint, 'archived items remain readable');
select is((select count(*) from public.itinerary_days), 1::bigint, 'parent day remains readable');

select * from finish();
rollback;
