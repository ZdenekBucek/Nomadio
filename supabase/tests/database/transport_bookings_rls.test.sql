begin;
create extension if not exists pgtap with schema extensions;
select plan(60);

select ok((select relrowsecurity from pg_class where oid = 'public.transport_bookings'::regclass), 'transport bookings have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.transport_segments'::regclass), 'transport segments have RLS enabled');
select ok(not has_table_privilege('anon', 'public.transport_bookings', 'select'), 'anon cannot read transport bookings');
select ok(not has_table_privilege('anon', 'public.transport_segments', 'select'), 'anon cannot read transport segments');
select ok(not (select prosecdef from pg_proc where oid = 'public.save_transport_booking(uuid,uuid,public.transport_type,text,text,text,public.transport_booking_status,numeric,numeric,date,text,public.transport_payment_status,text,jsonb)'::regprocedure), 'save RPC uses caller permissions');
select ok((select prosecdef from pg_proc where oid = 'public.check_transport_segment_places()'::regprocedure), 'same-trip place trigger validates independently of caller visibility');

insert into auth.users(id,email) values
  ('b1111111-1111-4111-8111-111111111111','transport-owner@nomadio.test'),
  ('b2222222-2222-4222-8222-222222222222','transport-editor@nomadio.test'),
  ('b3333333-3333-4333-8333-333333333333','transport-viewer@nomadio.test'),
  ('b4444444-4444-4444-8444-444444444444','transport-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='b1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Dopravní cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe',trip_start_date=>'2027-06-01',trip_end_date=>'2027-06-10',trip_timezone=>'Europe/Oslo')$$, 'owner creates transport trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Jiná dopravní cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe')$$, 'owner creates another trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Dopravní cesta'),'transport-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Dopravní cesta'),'transport-viewer@nomadio.test','viewer'),'added','viewer added');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Dopravní cesta'),'Oslo S',null,'NO','Oslo',59.91,10.75,'transport'),null::uuid,'departure place created');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Dopravní cesta'),'Bergen stasjon',null,'NO','Bergen',60.39,5.33,'transport'),null::uuid,'arrival place created');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Jiná dopravní cesta'),'Stockholm C',null,'SE','Stockholm',59.33,18.06,'transport'),null::uuid,'other-trip place created');

select isnt(public.save_transport_booking(
  target_trip_id => (select id from public.trips where name='Dopravní cesta'),
  target_booking_id => null,
  booking_transport_type => 'train',
  booking_title => 'Bergensbanen',
  booking_provider => 'Vy',
  booking_reference => 'TRAIN-42',
  booking_status => 'booked',
  booking_total_price => 2500,
  booking_paid_amount => 500,
  booking_balance_due_date => '2027-05-15',
  booking_currency => 'NOK',
  booking_payment_status => 'partially_paid',
  booking_notes => 'Výhledová místa',
  booking_segments => jsonb_build_array(
    jsonb_build_object('departure_place_id',(select id from public.trip_places where name='Oslo S'),'arrival_place_id',null,'departure_at','2027-06-02T08:00','arrival_at','2027-06-02T10:00','service_number','R40'),
    jsonb_build_object('departure_place_id',null,'arrival_place_id',(select id from public.trip_places where name='Bergen stasjon'),'departure_at','2027-06-02T10:20','arrival_at','2027-06-02T15:00','service_number','F4')
  )
),null::uuid,'owner atomically creates multi-segment booking');
select is((select count(*) from public.transport_bookings where title='Bergensbanen'),1::bigint,'owner reads booking');
select is((select count(*) from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen')),2::bigint,'both segments stored');
select results_eq($$select sort_order from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen') order by sort_order$$,$$values (0),(1)$$,'segment order is deterministic');
select is((select departure_place_id from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen') and sort_order=0),(select id from public.trip_places where name='Oslo S'),'departure place link stored');
select is((select arrival_place_id from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen') and sort_order=1),(select id from public.trip_places where name='Bergen stasjon'),'arrival place link stored');
select is((select departure_at at time zone 'Europe/Oslo' from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen') and sort_order=0),'2027-06-02 08:00'::timestamp,'trip-local departure time stored correctly');
select is((select total_price-paid_amount from public.transport_bookings where title='Bergensbanen'),2000::numeric,'remaining amount derives from stored amounts');
select throws_ok($$insert into public.transport_segments(booking_id,sort_order) values ((select id from public.transport_bookings where title='Bergensbanen'),0)$$,'23505',null,'duplicate sort order denied');
select throws_ok($$insert into public.transport_segments(booking_id,departure_at,arrival_at,sort_order) values ((select id from public.transport_bookings where title='Bergensbanen'),'2027-06-03 12:00+02','2027-06-03 11:00+02',2)$$,'23514',null,'arrival before departure denied');
select throws_ok($$insert into public.transport_segments(booking_id,departure_place_id,sort_order) values ((select id from public.transport_bookings where title='Bergensbanen'),(select id from public.trip_places where name='Stockholm C'),2)$$,'23514',null,'cross-trip place denied');

select isnt(public.save_transport_booking(
  (select id from public.trips where name='Dopravní cesta'),null,'bus','Záložní autobus',null,null,'planned',null,null,null,null,'unknown',null,
  '[{"departure_at":"2027-06-03T08:00","arrival_at":"2027-06-03T09:00"}]'::jsonb
),null::uuid,'second booking created');
select throws_ok($$update public.transport_segments set booking_id=(select id from public.transport_bookings where title='Záložní autobus') where booking_id=(select id from public.transport_bookings where title='Bergensbanen') and sort_order=0$$,'42501',null,'segment cannot move to another booking by update');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'train','Záporná cena',null,null,'planned',-1,0,null,'NOK','unpaid',null,'[{}]'::jsonb)$$,'23514',null,'negative price denied');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'train','Přeplaceno',null,null,'planned',100,101,null,'NOK','unknown',null,'[{}]'::jsonb)$$,'23514',null,'paid amount above total denied');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'train','Malá měna',null,null,'planned',100,0,null,'nok','unpaid',null,'[{}]'::jsonb)$$,'23514',null,'lowercase currency denied');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'train','Bez segmentu',null,null,'planned',null,null,null,null,'unknown',null,'[]'::jsonb)$$,'22023',null,'booking without segments denied');

select is(public.save_transport_booking(
  (select id from public.trips where name='Dopravní cesta'),
  (select id from public.transport_bookings where title='Bergensbanen'),
  'train','Bergensbanen upraveno','Vy','TRAIN-42','checked_in',2500,2500,null,'NOK','paid','Připraveno',
  '[{"departure_at":"2027-06-02T08:05","arrival_at":"2027-06-02T15:05","service_number":"F4"}]'::jsonb
),(select id from public.transport_bookings where booking_reference='TRAIN-42'),'update keeps the booking identity');
select is((select count(*) from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen upraveno')),1::bigint,'update atomically replaces segments');
select is((select sort_order from public.transport_segments where booking_id=(select id from public.transport_bookings where title='Bergensbanen upraveno')),0,'updated segment order starts at zero');
select throws_ok($$select public.save_transport_booking(
  (select id from public.trips where name='Dopravní cesta'),
  (select id from public.transport_bookings where title='Bergensbanen upraveno'),
  'train','Toto se vrátí','Vy',null,'booked',2500,2500,null,'NOK','paid',null,
  jsonb_build_array(jsonb_build_object('departure_place_id',(select id from public.trip_places where name='Stockholm C'),'departure_at','2027-06-02T09:00'))
)$$,'23514',null,'invalid update rolls back atomically');
select is((select title from public.transport_bookings where booking_reference='TRAIN-42'),'Bergensbanen upraveno','failed update rolls booking back');
select is((select count(*) from public.transport_segments where booking_id=(select id from public.transport_bookings where booking_reference='TRAIN-42')),1::bigint,'failed update preserves previous segments');

set local "request.jwt.claim.sub"='b2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.transport_bookings),2::bigint,'editor reads bookings');
select isnt(public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'flight','Let editora','Norwegian','DY123','booked',3000,0,'2027-05-01','NOK','unpaid',null,'[{"departure_at":"2027-06-04T07:00","arrival_at":"2027-06-04T08:00"}]'::jsonb),null::uuid,'editor creates booking');
select is(public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),(select id from public.transport_bookings where title='Let editora'),'flight','Let editora upravený','Norwegian','DY123','checked_in',3000,3000,null,'NOK','paid',null,'[{"departure_at":"2027-06-04T07:00","arrival_at":"2027-06-04T08:00"}]'::jsonb),(select id from public.transport_bookings where booking_reference='DY123'),'editor updates booking');
select is(public.remove_transport_booking((select id from public.transport_bookings where title='Let editora upravený')),'removed','editor deletes booking');
select is((select count(*) from public.transport_segments where booking_id not in (select id from public.transport_bookings)),0::bigint,'booking delete cascades segments');

set local "request.jwt.claim.sub"='b3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.transport_bookings),2::bigint,'viewer reads bookings');
select is((select count(*) from public.transport_segments),2::bigint,'viewer reads segments');
select throws_ok($$insert into public.transport_bookings(trip_id,title,created_by) values ((select id from public.trips where name='Dopravní cesta'),'Zakázané','b3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create booking');
select is_empty($$update public.transport_bookings set notes='Zakázáno' returning id$$,'viewer cannot update booking');
select is_empty($$delete from public.transport_bookings returning id$$,'viewer cannot delete booking');
select throws_ok($$select public.remove_transport_booking((select id from public.transport_bookings limit 1))$$,'42501',null,'viewer cannot use delete RPC');

set local "request.jwt.claim.sub"='b4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.transport_bookings),0::bigint,'unrelated user cannot read bookings');
select is((select count(*) from public.transport_segments),0::bigint,'unrelated user cannot read segments');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'other','Cizí pokus',null,null,'planned',null,null,null,null,'unknown',null,'[{}]'::jsonb)$$,'42501',null,'unrelated user cannot create booking');

set local "request.jwt.claim.sub"='b1111111-1111-4111-8111-111111111111';
select is(public.remove_transport_booking((select id from public.transport_bookings where booking_reference='TRAIN-42')),'removed','owner deletes booking');
select is((select count(*) from public.trip_places where name in ('Oslo S','Bergen stasjon')),2::bigint,'deleting booking preserves places');
select isnt(public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'ferry','Archivovaný trajekt',null,null,'booked',500,0,null,'NOK','pay_on_site',null,'[{"departure_at":"2027-06-05T10:00","arrival_at":"2027-06-05T11:00"}]'::jsonb),null::uuid,'booking for archive test created');
select is(public.archive_trip((select id from public.trips where name='Dopravní cesta')),'archived','trip archived');
select is((select count(*) from public.transport_bookings),2::bigint,'archived bookings remain readable');
select is((select count(*) from public.transport_segments),2::bigint,'archived segments remain readable');
select throws_ok($$select public.save_transport_booking((select id from public.trips where name='Dopravní cesta'),null,'bus','Archiv create',null,null,'planned',null,null,null,null,'unknown',null,'[{}]'::jsonb)$$,'42501',null,'archived trip blocks create');
select is_empty($$update public.transport_bookings set notes='Archiv update' returning id$$,'archived trip blocks update');
select is_empty($$delete from public.transport_bookings returning id$$,'archived trip blocks delete');
select throws_ok($$insert into public.transport_segments(booking_id,sort_order) values ((select id from public.transport_bookings where title='Archivovaný trajekt'),1)$$,'42501',null,'archived trip blocks segment create');

select * from finish();
rollback;
