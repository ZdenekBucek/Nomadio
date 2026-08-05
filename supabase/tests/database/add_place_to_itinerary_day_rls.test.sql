begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

select ok(not (select prosecdef from pg_proc where oid='public.add_place_to_itinerary_day(uuid,uuid,text,text,text,text,text,text,double precision,double precision,text,public.place_category,public.place_category,text,time,time,text)'::regprocedure), 'add place to day uses caller permissions');
select ok(not has_function_privilege('anon','public.add_place_to_itinerary_day(uuid,uuid,text,text,text,text,text,text,double precision,double precision,text,public.place_category,public.place_category,text,time,time,text)','execute'), 'anon cannot add place to day');

insert into auth.users(id,email) values
('71717171-7171-4171-8171-717171717171','day-place-owner@nomadio.test'),
('72727272-7272-4272-8272-727272727272','day-place-editor@nomadio.test'),
('73737373-7373-4373-8373-737373737373','day-place-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='71717171-7171-4171-8171-717171717171';
select lives_ok($$ select public.create_private_trip(trip_name=>'Atomická cesta',destination_country_code=>'CZ',destination_country_name=>'Česko',destination_city=>'Praha',destination_continent=>'europe') $$,'owner creates target trip');
select lives_ok($$ select public.create_private_trip(trip_name=>'Jiná cesta',destination_country_code=>'DE',destination_country_name=>'Německo',destination_city=>'Berlín',destination_continent=>'europe') $$,'owner creates other trip');
select isnt(public.create_itinerary_day((select id from public.trips where name='Atomická cesta'),'První den','2027-07-01','Praha','plan',false),null::uuid,'first day created');
select isnt(public.create_itinerary_day((select id from public.trips where name='Atomická cesta'),'Druhý den','2027-07-02','Praha','plan',false),null::uuid,'second day created');
select isnt(public.create_itinerary_day((select id from public.trips where name='Jiná cesta'),'Cizí den','2027-07-03','Berlín','plan',false),null::uuid,'other trip day created');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='První den'),'note','Začátek dne',null,null,null,null),null::uuid,'existing timeline item created');
select is(public.add_trip_member_by_email((select id from public.trips where name='Atomická cesta'),'day-place-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Atomická cesta'),'day-place-viewer@nomadio.test','viewer'),'added','viewer added');

select isnt(public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='První den'),
  'geoapify','geo-hotel-1','Hotel Praha','Václavské náměstí, Praha, Česko','CZ','Praha',50.081,14.426,
  'accommodation.hotel','food','accommodation','Powered by Geoapify · © OpenStreetMap contributors','09:30','10:45','Snídaně v ceně'
),null::uuid,'owner atomically adds Geoapify place to day');
select is((select count(*) from public.trip_places where provider_place_id='geo-hotel-1'),1::bigint,'one external place created');
select is((select count(*) from public.itinerary_items where place_id=(select id from public.trip_places where provider_place_id='geo-hotel-1')),1::bigint,'linked timeline item created');
select is((select sort_order from public.itinerary_items where place_id=(select id from public.trip_places where provider_place_id='geo-hotel-1')),1,'new item appended to day');
select is((select start_time from public.itinerary_items where place_id=(select id from public.trip_places where provider_place_id='geo-hotel-1')),'09:30'::time,'start time stored');
select is((select notes from public.itinerary_items where place_id=(select id from public.trip_places where provider_place_id='geo-hotel-1')),'Snídaně v ceně','notes stored');
select ok((select category_overridden from public.trip_places where provider_place_id='geo-hotel-1'),'category override stored');

select isnt(public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='Druhý den'),
  'geoapify','geo-hotel-1','Hotel Praha','Václavské náměstí, Praha, Česko','CZ','Praha',50.081,14.426,
  'accommodation.hotel','accommodation','accommodation','Powered by Geoapify · © OpenStreetMap contributors',null,null,null
),null::uuid,'same POI added to another day');
select is((select count(*) from public.trip_places where provider_place_id='geo-hotel-1'),1::bigint,'same POI reuses one trip place');
select is((select count(*) from public.itinerary_items where place_id=(select id from public.trip_places where provider_place_id='geo-hotel-1')),2::bigint,'same place links two timeline items');

select throws_ok($$ select public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='Cizí den'),
  'geoapify','cross-trip','Zakázáno','Zakázáno','CZ','Praha',50,14,'unknown','custom','custom','Powered by Geoapify · © OpenStreetMap contributors',null,null,null
) $$,'22023',null,'cross-trip day rejected');

select throws_ok($$ select public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='První den'),
  'geoapify','rollback-place','Rollback','Rollback','CZ','Praha',50,14,'unknown','custom','custom','Powered by Geoapify · © OpenStreetMap contributors',null,null,repeat('x',1201)
) $$,'23514',null,'item failure aborts atomic operation');
select is((select count(*) from public.trip_places where provider_place_id='rollback-place'),0::bigint,'failed item leaves no place behind');

set local "request.jwt.claim.sub"='72727272-7272-4272-8272-727272727272';
select isnt(public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='První den'),
  'manual',null,'Vlastní bod',null,null,null,null,null,null,'custom','custom',null,'14:00',null,'Bez souřadnic'
),null::uuid,'editor adds manual place without coordinates');
select is((select count(*) from public.trip_places where name='Vlastní bod' and latitude is null),1::bigint,'manual fallback stored without coordinates');

set local "request.jwt.claim.sub"='73737373-7373-4373-8373-737373737373';
select throws_ok($$ select public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='První den'),
  'manual',null,'Zakázáno',null,null,null,null,null,null,'custom','custom',null,null,null,null
) $$,'42501',null,'viewer cannot add place to day');

set local "request.jwt.claim.sub"='71717171-7171-4171-8171-717171717171';
select is(public.archive_trip((select id from public.trips where name='Atomická cesta')),'archived','trip archived');
select throws_ok($$ select public.add_place_to_itinerary_day(
  (select id from public.trips where name='Atomická cesta'),
  (select id from public.itinerary_days where name='První den'),
  'manual',null,'Archiv',null,null,null,null,null,null,'custom','custom',null,null,null,null
) $$,'42501',null,'archived trip blocks add place to day');

select * from finish();
rollback;
