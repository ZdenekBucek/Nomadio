begin;
create extension if not exists pgtap with schema extensions;
select plan(44);

select ok(not (select prosecdef from pg_proc where oid='public.create_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category)'::regprocedure), 'place create uses caller permissions');
select ok(not has_function_privilege('anon','public.create_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category)','execute'), 'anon cannot create places');
select ok(not (select prosecdef from pg_proc where oid='public.create_mapbox_trip_place(uuid,text,text,text,text,text,double precision,double precision,text,public.place_category)'::regprocedure), 'Mapbox place create uses caller permissions');
select ok(not has_function_privilege('anon','public.create_mapbox_trip_place(uuid,text,text,text,text,text,double precision,double precision,text,public.place_category)','execute'), 'anon cannot create Mapbox places');

insert into auth.users(id,email) values
('61616161-6161-4161-8161-616161616161','places-owner@nomadio.test'),
('62626262-6262-4262-8262-626262626262','places-editor@nomadio.test'),
('63636363-6363-4363-8363-636363636363','places-viewer@nomadio.test'),
('64646464-6464-4464-8464-646464646464','places-other@nomadio.test');

set local role authenticated; set local "request.jwt.claim.sub"='61616161-6161-4161-8161-616161616161';
select lives_ok($$ select public.create_private_trip(trip_name=>'Místa cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Bodø',destination_continent=>'europe') $$,'owner creates trip');
select lives_ok($$ select public.create_private_trip(trip_name=>'Cizí cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Kiruna',destination_continent=>'europe') $$,'owner creates second trip');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Cizí cesta'),'Cizí místo',null,'SE','Kiruna',null,null,'custom'),null::uuid,'place created in second trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Místa cesta'),'places-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Místa cesta'),'places-viewer@nomadio.test','viewer'),'added','viewer added');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Saltstraumen','Saltstraumen 33','no','Bodø',67.2300,14.6170,'nature'),null::uuid,'owner creates located place');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Kavárna',null,'NO','Bodø',null,null,'food'),null::uuid,'owner creates place without coordinates');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Rychlonabíječka',null,'NO','Bodø',67.25,14.50,'charging'),null::uuid,'owner creates charging place');
select is((select category from public.trip_places where name='Rychlonabíječka'),'charging'::public.place_category,'charging category stored');
select is((select count(*) from public.trip_places where trip_id=(select id from public.trips where name='Místa cesta')),3::bigint,'three places stored');
select is((select country_code from public.trip_places where name='Saltstraumen'),'NO','country code normalized');
select is(public.update_manual_trip_place((select id from public.trip_places where name='Kavárna'),'Kavárna v přístavu','Přístav 1','NO','Bodø',67.28,14.40,'food'),'updated','owner updates place');
select is((select address from public.trip_places where name='Kavárna v přístavu'),'Přístav 1','updated address stored');
select isnt(public.create_mapbox_trip_place((select id from public.trips where name='Místa cesta'),'dXJuOm1ieGFkcjo1','Saltstraumen 33','Saltstraumen 33','NO','Bodø',67.2301,14.6171,'address','custom'),null::uuid,'owner stores Mapbox address');
select is((select provider from public.trip_places where provider_place_id='dXJuOm1ieGFkcjo1'),'mapbox','Mapbox provider stored');
select is((select provider_category from public.trip_places where provider_place_id='dXJuOm1ieGFkcjo1'),'address','provider category stored');
select ok(not (select category_overridden from public.trip_places where provider_place_id='dXJuOm1ieGFkcjo1'),'provider category starts as suggested');
select is(public.create_mapbox_trip_place((select id from public.trips where name='Místa cesta'),'dXJuOm1ieGFkcjo1','Saltstraumen 33','Saltstraumen 33','NO','Bodø',67.2301,14.6171,'address','custom'),(select id from public.trip_places where provider_place_id='dXJuOm1ieGFkcjo1'),'duplicate provider result returns existing place');
select is((select count(*) from public.trip_places where provider='mapbox'),1::bigint,'duplicate provider result is not inserted twice');
select throws_ok($$ select public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Neplatné',null,null,null,91,14,'custom') $$,'23514',null,'invalid latitude rejected');
select throws_ok($$ select public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Neúplné',null,null,null,67,null,'custom') $$,'23514',null,'incomplete coordinates rejected');

select isnt(public.create_itinerary_day((select id from public.trips where name='Místa cesta'),'Den v Bodø','2027-06-01','Bodø','plan',false),null::uuid,'day created');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Den v Bodø'),'activity','Výlet k proudu','09:00','12:00',null,(select id from public.trip_places where name='Saltstraumen')),null::uuid,'item links same-trip place');
select is((select place_id from public.itinerary_items where title='Výlet k proudu'),(select id from public.trip_places where name='Saltstraumen'),'place link stored');
select is(public.remove_trip_place((select id from public.trip_places where name='Saltstraumen')),'in_use','linked place cannot be removed');
select throws_ok($$ update public.itinerary_items set place_id=(select id from public.trip_places where trip_id=(select id from public.trips where name='Cizí cesta') limit 1) where title='Výlet k proudu' $$,'22023',null,'cross-trip place link rejected');
select is(public.update_itinerary_item((select id from public.itinerary_items where title='Výlet k proudu'),'activity','Výlet k proudu','09:00','12:00',null,null),'updated','item can unlink place');
select is(public.remove_trip_place((select id from public.trip_places where name='Saltstraumen')),'removed','unlinked place can be removed');

set local "request.jwt.claim.sub"='62626262-6262-4262-8262-626262626262';
select isnt(public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Místo editora',null,null,'Bodø',null,null,'custom'),null::uuid,'editor creates place');
select is(public.update_manual_trip_place((select id from public.trip_places where name='Místo editora'),'Upravené místo',null,null,'Bodø',null,null,'sight'),'updated','editor updates place');

set local "request.jwt.claim.sub"='63636363-6363-4363-8363-636363636363';
select is((select count(*) from public.trip_places where trip_id=(select id from public.trips where name='Místa cesta')),4::bigint,'viewer reads places');
select throws_ok($$ select public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Zakázáno',null,null,null,null,null,'custom') $$,'42501',null,'viewer cannot create');
select throws_ok($$ select public.create_mapbox_trip_place((select id from public.trips where name='Místa cesta'),'forbidden','Zakázáno',null,null,null,50,14,'address','custom') $$,'42501',null,'viewer cannot create Mapbox place');
select throws_ok($$ select public.remove_trip_place((select id from public.trip_places limit 1)) $$,'42501',null,'viewer cannot remove');

set local "request.jwt.claim.sub"='64646464-6464-4464-8464-646464646464';
select is((select count(*) from public.trip_places),0::bigint,'unrelated user cannot read places');

set local "request.jwt.claim.sub"='61616161-6161-4161-8161-616161616161';
select throws_ok($$ update public.trip_places set provider='mapbox' where name='Kavárna v přístavu' $$,'42501',null,'provider fields protected');
select is(public.archive_trip((select id from public.trips where name='Místa cesta')),'archived','trip archived');
select throws_ok($$ select public.create_manual_trip_place((select id from public.trips where name='Místa cesta'),'Archiv',null,null,null,null,null,'custom') $$,'42501',null,'archived trip blocks place create');
select throws_ok($$ select public.create_mapbox_trip_place((select id from public.trips where name='Místa cesta'),'archived','Archiv',null,null,null,50,14,'address','custom') $$,'42501',null,'archived trip blocks Mapbox place create');
select is((select count(*) from public.trip_places where trip_id=(select id from public.trips where name='Místa cesta')),4::bigint,'archived places remain readable');

select * from finish(); rollback;
