begin;
create extension if not exists pgtap with schema extensions;
select plan(62);

select ok((select relrowsecurity from pg_class where oid = 'public.tasks'::regclass), 'tasks have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.packing_items'::regclass), 'packing items have RLS enabled');
select has_type('public', 'task_category', 'task category enum exists');
select ok(not has_table_privilege('anon', 'public.tasks', 'select'), 'anon cannot read tasks');
select ok(not has_table_privilege('anon', 'public.packing_items', 'select'), 'anon cannot read packing');

insert into auth.users(id,email) values
  ('c1111111-1111-4111-8111-111111111111','checklist-owner@nomadio.test'),
  ('c2222222-2222-4222-8222-222222222222','checklist-editor@nomadio.test'),
  ('c3333333-3333-4333-8333-333333333333','checklist-viewer@nomadio.test'),
  ('c4444444-4444-4444-8444-444444444444','checklist-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Checklist cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe')$$, 'owner creates checklist trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Cizí checklist cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe')$$, 'owner creates second trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Checklist cesta'),'checklist-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Checklist cesta'),'checklist-viewer@nomadio.test','viewer'),'added','viewer added');
select is((select count(*) from public.trip_travelers where trip_id=(select id from public.trips where name='Checklist cesta') and user_id='c1111111-1111-4111-8111-111111111111'),1::bigint,'owner traveler exists');
select lives_ok($$insert into public.trip_travelers(id,trip_id,display_name,created_by) values ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(select id from public.trips where name='Checklist cesta'),'Jana','c1111111-1111-4111-8111-111111111111')$$,'owner adds traveler');

select lives_ok($$
  insert into public.tasks(id,trip_id,title,description,category,status,priority,due_date,assigned_traveler_id,created_by)
  values ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',(select id from public.trips where name='Checklist cesta'),'Doplatit hotel','Zkontrolovat částku','payment','todo','high','2027-05-15','caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','c1111111-1111-4111-8111-111111111111')
$$,'owner creates assigned task');
select is((select priority::text from public.tasks where title='Doplatit hotel'),'high','task priority stored');
select is((select due_date from public.tasks where title='Doplatit hotel'),'2027-05-15'::date,'task due date stored');
select lives_ok($$insert into public.packing_items(id,trip_id,traveler_id,category,name,quantity,bag_type,created_by) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',(select id from public.trips where name='Checklist cesta'),'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','electronics','Adaptér',2,'cabin','c1111111-1111-4111-8111-111111111111')$$,'owner creates packing item');
select is((select quantity from public.packing_items where name='Adaptér'),2,'packing quantity stored');
select is((select bag_type::text from public.packing_items where name='Adaptér'),'cabin','packing bag stored');
select throws_ok($$insert into public.tasks(trip_id,title,assigned_traveler_id,created_by) values ((select id from public.trips where name='Checklist cesta'),'Neplatný cestovatel','c4444444-4444-4444-8444-444444444444','c1111111-1111-4111-8111-111111111111')$$,'23503',null,'unknown task traveler denied');
select throws_ok($$insert into public.packing_items(trip_id,traveler_id,name,created_by) values ((select id from public.trips where name='Checklist cesta'),'c4444444-4444-4444-8444-444444444444','Neplatná věc','c1111111-1111-4111-8111-111111111111')$$,'23503',null,'unknown packing traveler denied');
select throws_ok($$insert into public.tasks(trip_id,title,assigned_traveler_id,created_by) values ((select id from public.trips where name='Checklist cesta'),'Cizí traveler',(select id from public.trip_travelers where trip_id=(select id from public.trips where name='Cizí checklist cesta') limit 1),'c1111111-1111-4111-8111-111111111111')$$,'23503',null,'traveler from another trip denied');

select lives_ok($$update public.tasks set status='completed' where title='Doplatit hotel'$$,'owner completes task');
select is((select status::text from public.tasks where title='Doplatit hotel'),'completed','task completion stored');
select lives_ok($$insert into public.tasks(id,trip_id,title,created_by) values ('cddddddd-dddd-4ddd-8ddd-dddddddddddd',(select id from public.trips where name='Checklist cesta'),'Smazat úkol','c1111111-1111-4111-8111-111111111111')$$,'owner creates deletable task');
select lives_ok($$delete from public.tasks where id='cddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,'owner deletes task');
select is((select count(*) from public.tasks where id='cddddddd-dddd-4ddd-8ddd-dddddddddddd'),0::bigint,'task deletion persisted');
select lives_ok($$update public.packing_items set is_packed=true where name='Adaptér'$$,'owner packs item');
select is((select is_packed from public.packing_items where name='Adaptér'),true,'packed state stored');
select lives_ok($$insert into public.packing_items(id,trip_id,name,created_by) values ('ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',(select id from public.trips where name='Checklist cesta'),'Smazat věc','c1111111-1111-4111-8111-111111111111')$$,'owner creates deletable packing item');
select lives_ok($$delete from public.packing_items where id='ceeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,'owner deletes packing item');
select throws_ok($$update public.tasks set trip_id=(select id from public.trips where name='Cizí checklist cesta') where title='Doplatit hotel'$$,'42501',null,'task system fields protected');
select throws_ok($$update public.packing_items set created_by='c2222222-2222-4222-8222-222222222222' where name='Adaptér'$$,'42501',null,'packing system fields protected');

select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Checklist cesta'),'Checklist hotel','2027-05-01','2027-05-02','c1111111-1111-4111-8111-111111111111')$$,'owner creates linked accommodation');
select lives_ok($$insert into public.tasks(trip_id,title,linked_entity_type,linked_entity_id,created_by) values ((select id from public.trips where name='Checklist cesta'),'Hotelový úkol','accommodation',(select id from public.accommodations where name='Checklist hotel'),'c1111111-1111-4111-8111-111111111111')$$,'same-trip linked accommodation accepted');
select throws_ok($$insert into public.tasks(trip_id,title,linked_entity_type,linked_entity_id,created_by) values ((select id from public.trips where name='Cizí checklist cesta'),'Cizí link','accommodation',(select id from public.accommodations where name='Checklist hotel'),'c1111111-1111-4111-8111-111111111111')$$,'23503',null,'cross-trip linked accommodation denied');

set local "request.jwt.claim.sub"='c2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.tasks),2::bigint,'editor reads tasks');
select is((select count(*) from public.packing_items),1::bigint,'editor reads packing');
select lives_ok($$insert into public.tasks(id,trip_id,title,created_by) values ('c1212121-1212-4121-8121-121212121212',(select id from public.trips where name='Checklist cesta'),'Editor úkol','c2222222-2222-4222-8222-222222222222')$$,'editor creates task');
select lives_ok($$update public.tasks set priority='low' where id='c1212121-1212-4121-8121-121212121212'$$,'editor updates task');
select lives_ok($$delete from public.tasks where id='c1212121-1212-4121-8121-121212121212'$$,'editor deletes task');
select lives_ok($$insert into public.packing_items(id,trip_id,name,created_by) values ('c1313131-1313-4131-8131-131313131313',(select id from public.trips where name='Checklist cesta'),'Editor věc','c2222222-2222-4222-8222-222222222222')$$,'editor creates packing');
select lives_ok($$update public.packing_items set is_packed=true where id='c1313131-1313-4131-8131-131313131313'$$,'editor updates packing');
select lives_ok($$delete from public.packing_items where id='c1313131-1313-4131-8131-131313131313'$$,'editor deletes packing');

set local "request.jwt.claim.sub"='c3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.tasks),2::bigint,'viewer reads tasks');
select is((select count(*) from public.packing_items),1::bigint,'viewer reads packing');
select throws_ok($$insert into public.tasks(trip_id,title,created_by) values ((select id from public.trips where name='Checklist cesta'),'Viewer úkol','c3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create task');
select is_empty($$update public.tasks set status='todo' returning id$$,'viewer cannot update tasks');
select is_empty($$delete from public.tasks returning id$$,'viewer cannot delete tasks');
select throws_ok($$insert into public.packing_items(trip_id,name,created_by) values ((select id from public.trips where name='Checklist cesta'),'Viewer věc','c3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create packing');
select is_empty($$update public.packing_items set is_packed=false returning id$$,'viewer cannot update packing');
select is_empty($$delete from public.packing_items returning id$$,'viewer cannot delete packing');

set local "request.jwt.claim.sub"='c4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.tasks),0::bigint,'unrelated user cannot read tasks');
select is((select count(*) from public.packing_items),0::bigint,'unrelated user cannot read packing');
select throws_ok($$insert into public.tasks(trip_id,title,created_by) values ((select id from public.trips where name='Checklist cesta'),'Cizí úkol','c4444444-4444-4444-8444-444444444444')$$,'42501',null,'unrelated user cannot create task');

set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select is(public.archive_trip((select id from public.trips where name='Checklist cesta')),'archived','trip archived');
select is((select count(*) from public.tasks),2::bigint,'archived tasks remain readable');
select is((select count(*) from public.packing_items),1::bigint,'archived packing remains readable');
select throws_ok($$insert into public.tasks(trip_id,title,created_by) values ((select id from public.trips where name='Checklist cesta'),'Archivní úkol','c1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks task insert');
select is_empty($$update public.tasks set status='todo' returning id$$,'archived trip blocks task update');
select is_empty($$delete from public.tasks returning id$$,'archived trip blocks task delete');
select throws_ok($$insert into public.packing_items(trip_id,name,created_by) values ((select id from public.trips where name='Checklist cesta'),'Archivní věc','c1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks packing insert');
select is_empty($$update public.packing_items set is_packed=false returning id$$,'archived trip blocks packing update');
select is_empty($$delete from public.packing_items returning id$$,'archived trip blocks packing delete');

select * from finish();
rollback;
