begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

select ok((select relrowsecurity from pg_class where oid = 'public.accommodations'::regclass), 'accommodations has RLS enabled');
select ok(not has_table_privilege('anon', 'public.accommodations', 'select'), 'anon cannot read accommodations');
select ok((select prosecdef from pg_proc where oid = 'public.check_accommodation_place_trip()'::regprocedure), 'same-trip place trigger can validate independently of caller visibility');

insert into auth.users(id,email) values
  ('a1111111-1111-4111-8111-111111111111','accommodation-owner@nomadio.test'),
  ('a2222222-2222-4222-8222-222222222222','accommodation-editor@nomadio.test'),
  ('a3333333-3333-4333-8333-333333333333','accommodation-viewer@nomadio.test'),
  ('a4444444-4444-4444-8444-444444444444','accommodation-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='a1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Ubytování cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Bodø',destination_continent=>'europe',trip_start_date=>'2027-06-01',trip_end_date=>'2027-06-10')$$, 'owner creates trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Jiná ubytování cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Kiruna',destination_continent=>'europe')$$, 'owner creates another trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Ubytování cesta'),'accommodation-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Ubytování cesta'),'accommodation-viewer@nomadio.test','viewer'),'added','viewer added');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Ubytování cesta'),'Hotel Nord',null,'NO','Bodø',67.28,14.40,'accommodation'),null::uuid,'same-trip place created');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Jiná ubytování cesta'),'Cizí hotel',null,'SE','Kiruna',67.85,20.22,'accommodation'),null::uuid,'other-trip place created');

select lives_ok($$insert into public.accommodations(trip_id,place_id,name,accommodation_type,check_in_date,check_out_date,guest_count,total_price,currency,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),(select id from public.trip_places where name='Hotel Nord'),'Hotel Nord','hotel','2027-06-01','2027-06-04',2,4200,'NOK','partially_paid','a1111111-1111-4111-8111-111111111111')$$, 'owner creates accommodation');
select is((select count(*) from public.accommodations where name='Hotel Nord'),1::bigint,'owner reads accommodation');
select is((select place_id from public.accommodations where name='Hotel Nord'),(select id from public.trip_places where name='Hotel Nord'),'same-trip place link stored');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Neplatný termín','2027-06-04','2027-06-04','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'checkout must be after checkin');
select throws_ok($$insert into public.accommodations(trip_id,place_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),(select id from public.trip_places where name='Cizí hotel'),'Cizí vazba','2027-06-04','2027-06-05','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'cross-trip place denied');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,guest_count,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Bez hostů','2027-06-04','2027-06-05',0,'a1111111-1111-4111-8111-111111111111')$$,'23514',null,'nonpositive guest count denied');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Záporná cena','2027-06-04','2027-06-05',-1,'a1111111-1111-4111-8111-111111111111')$$,'23514',null,'negative price denied');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,currency,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Malá měna','2027-06-04','2027-06-05','nok','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'lowercase currency denied');
select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,currency,payment_status,balance_due_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Nezaplacený hotel','2027-06-04','2027-06-05',1000,0,'NOK','unpaid','2027-05-15','a1111111-1111-4111-8111-111111111111')$$,'zero paid amount accepted');
select is((select paid_amount from public.accommodations where name='Nezaplacený hotel'),0::numeric,'zero paid amount stored');
select is((select balance_due_date from public.accommodations where name='Nezaplacený hotel'),'2027-05-15'::date,'balance due date stored');
select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Částečně zaplacený hotel','2027-06-05','2027-06-07',2000,500,'NOK','partially_paid','a1111111-1111-4111-8111-111111111111')$$,'partial payment accepted');
select is((select total_price - paid_amount from public.accommodations where name='Částečně zaplacený hotel'),1500::numeric,'remaining amount derives from stored amounts');
select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Zaplacený hotel','2027-06-07','2027-06-09',1800,1800,'NOK','paid','a1111111-1111-4111-8111-111111111111')$$,'full payment accepted');
select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Platba na místě','2027-06-09','2027-06-10',900,0,'NOK','pay_on_site','a1111111-1111-4111-8111-111111111111')$$,'pay on site accepted without due date');
select is((select balance_due_date from public.accommodations where name='Platba na místě'),null::date,'pay on site due date remains optional');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Přeplacený hotel','2027-06-05','2027-06-06',1000,1001,'unknown','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'paid amount above total denied');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,paid_amount,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Záporná platba','2027-06-05','2027-06-06',-1,'unknown','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'negative paid amount denied');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Rozpor unpaid','2027-06-05','2027-06-06',1000,1,'unpaid','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'unpaid status rejects positive amount');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,total_price,paid_amount,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Rozpor paid','2027-06-05','2027-06-06',1000,999,'paid','a1111111-1111-4111-8111-111111111111')$$,'23514',null,'paid status rejects incomplete amount');

set local "request.jwt.claim.sub"='a2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.accommodations),5::bigint,'editor reads accommodations');
select lives_ok($$insert into public.accommodations(trip_id,name,accommodation_type,check_in_date,check_out_date,payment_status,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Hostel editora','hostel','2027-06-04','2027-06-06','unpaid','a2222222-2222-4222-8222-222222222222')$$,'editor creates accommodation');
select lives_ok($$update public.accommodations set room_type='Dvoulůžkový pokoj' where name='Hostel editora'$$,'editor updates accommodation');
select lives_ok($$delete from public.accommodations where name='Hostel editora'$$,'editor deletes accommodation');

set local "request.jwt.claim.sub"='a3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.accommodations),5::bigint,'viewer reads accommodations');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Zakázané','2027-06-06','2027-06-07','a3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create');
select is_empty($$update public.accommodations set notes='Zakázáno' returning id$$,'viewer cannot update');
select is_empty($$delete from public.accommodations returning id$$,'viewer cannot delete');

set local "request.jwt.claim.sub"='a4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.accommodations),0::bigint,'unrelated user cannot read');

set local "request.jwt.claim.sub"='a1111111-1111-4111-8111-111111111111';
select lives_ok($$delete from public.accommodations where name='Hotel Nord'$$,'owner deletes accommodation');
select is((select count(*) from public.trip_places where name='Hotel Nord'),1::bigint,'deleting accommodation preserves place');
select lives_ok($$insert into public.accommodations(trip_id,place_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),(select id from public.trip_places where name='Hotel Nord'),'Archivovaný hotel','2027-06-01','2027-06-04','a1111111-1111-4111-8111-111111111111')$$,'replacement accommodation created');
select is(public.archive_trip((select id from public.trips where name='Ubytování cesta')),'archived','trip archived');
select is((select count(*) from public.accommodations where name='Archivovaný hotel'),1::bigint,'archived accommodation remains readable');
select throws_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Ubytování cesta'),'Archiv create','2027-06-04','2027-06-05','a1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks create');
select is_empty($$update public.accommodations set notes='Archiv update' where name='Archivovaný hotel' returning id$$,'archived trip blocks update');
select is_empty($$delete from public.accommodations where name='Archivovaný hotel' returning id$$,'archived trip blocks delete');

select * from finish();
rollback;
