begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

select ok(not (select prosecdef from pg_proc where oid='public.create_map_selected_manual_place(uuid,uuid,boolean,text,public.place_category,text,double precision,double precision)'::regprocedure),'map-selected place RPC uses caller permissions');
select ok(not has_function_privilege('anon','public.create_map_selected_manual_place(uuid,uuid,boolean,text,public.place_category,text,double precision,double precision)','execute'),'anon cannot execute map-selected place RPC');
select ok(not (select prosecdef from pg_proc where oid='public.create_map_selected_manual_place(uuid,uuid,boolean,text,public.place_category,text,double precision,double precision,text)'::regprocedure),'address-aware RPC uses caller permissions');
select ok(not has_function_privilege('anon','public.create_map_selected_manual_place(uuid,uuid,boolean,text,public.place_category,text,double precision,double precision,text)','execute'),'anon cannot execute address-aware RPC');

insert into auth.users(id,email) values
  ('91919191-9191-4191-8191-919191919191','map-owner@nomadio.test'),
  ('92929292-9292-4292-8292-929292929292','map-editor@nomadio.test'),
  ('93939393-9393-4393-8393-939393939393','map-viewer@nomadio.test');
set local role authenticated;
set local "request.jwt.claim.sub"='91919191-9191-4191-8191-919191919191';
select lives_ok($$select public.create_private_trip(trip_name=>'Map click cesta',destination_country_code=>'CZ',destination_country_name=>'Česko',destination_city=>'Praha',destination_continent=>'europe')$$,'owner creates trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Map click cesta'),'map-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Map click cesta'),'map-viewer@nomadio.test','viewer'),'added','viewer added');
select isnt(public.create_itinerary_day((select id from public.trips where name='Map click cesta'),'Praha','2027-09-01','Praha','plan',false),null::uuid,'day created');

select isnt(public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Vyhlídka','custom','Západ slunce',50.087,14.407),null::uuid,'owner creates map-selected place');
select isnt(public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Vyhlídka s adresou','custom',null,50.088,14.408,'Karlův most, Praha'),null::uuid,'owner creates map-selected place with address');
select is((select address from public.trip_places where name='Vyhlídka s adresou'),'Karlův most, Praha','reverse-geocoded address stored');
select is((select provider from public.trip_places where name='Vyhlídka'),'manual','manual provider stored');
select is((select provider_place_id from public.trip_places where name='Vyhlídka'),null::text,'no fake provider id stored');
select is((select notes from public.trip_places where name='Vyhlídka'),'Západ slunce','place note stored');
select is((select latitude from public.trip_places where name='Vyhlídka'),50.087::double precision,'latitude stored');
select is((select longitude from public.trip_places where name='Vyhlídka'),14.407::double precision,'longitude stored');

set local "request.jwt.claim.sub"='92929292-9292-4292-8292-929292929292';
select isnt(public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),(select id from public.itinerary_days where name='Praha'),true,'Místo editora','nature','Klidné místo',50.09,14.42),null::uuid,'editor atomically adds place to day');
select is((select count(*) from public.trip_places where name='Místo editora'),1::bigint,'one place row created');
select is((select count(*) from public.itinerary_items item join public.trip_places place on place.id=item.place_id where place.name='Místo editora'),1::bigint,'one linked item created');
select is((select item.notes from public.itinerary_items item join public.trip_places place on place.id=item.place_id where place.name='Místo editora'),'Klidné místo','item note stored');
select is((select sort_order from public.itinerary_items item join public.trip_places place on place.id=item.place_id where place.name='Místo editora'),0,'item appended deterministically');

set local "request.jwt.claim.sub"='93939393-9393-4393-8393-939393939393';
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Zakázáno','custom',null,50,14)$$,'42501',null,'viewer denied');
set local "request.jwt.claim.sub"='91919191-9191-4191-8191-919191919191';
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'','custom',null,50,14)$$,'22023',null,'empty name denied');
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Neplatná šířka','custom',null,91,14)$$,'22023',null,'invalid latitude denied');
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Neplatná délka','custom',null,50,181)$$,'22023',null,'invalid longitude denied');
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),(select id from public.itinerary_days where name='Praha'),false,'Neplatný den','custom',null,50,14)$$,'22023',null,'day without add flag denied');
select is(public.archive_trip((select id from public.trips where name='Map click cesta')),'archived','trip archived');
select throws_ok($$select public.create_map_selected_manual_place((select id from public.trips where name='Map click cesta'),null,false,'Archiv','custom',null,50,14)$$,'42501',null,'archived trip denied');
select is((select count(*) from public.trip_places where trip_id=(select id from public.trips where name='Map click cesta')),3::bigint,'denied writes leave existing places unchanged');

select * from finish();
rollback;
