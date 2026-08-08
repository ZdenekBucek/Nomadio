begin;
create extension if not exists pgtap with schema extensions;
select plan(44);

select ok((select relrowsecurity from pg_class where oid = 'public.budget_items'::regclass), 'budget items have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.budget_subcategory_catalog'::regclass), 'subcategory catalog has RLS enabled');
select ok(not has_table_privilege('anon', 'public.budget_items', 'select'), 'anon cannot read budget items');
select ok(not has_table_privilege('authenticated', 'public.budget_subcategory_catalog', 'select'), 'catalog is not exposed to authenticated clients');
select has_type('public', 'budget_source_type', 'budget source enum exists');
select has_type('public', 'budget_category', 'budget category enum exists');
select has_type('public', 'budget_payment_status', 'budget payment status enum exists');
select results_eq(
  $$select value::text from unnest(enum_range(null::public.budget_category)) as value$$,
  $$values ('accommodation'),('transport'),('food'),('activities'),('car'),('shopping'),('travel_services'),('health'),('fees'),('other')$$,
  'main category enum contains only stable reporting categories'
);
select is((select count(*) from public.budget_subcategory_catalog),55::bigint,'all predefined category and subcategory pairs are seeded');

insert into auth.users(id,email) values
  ('c1111111-1111-4111-8111-111111111111','budget-owner@nomadio.test'),
  ('c2222222-2222-4222-8222-222222222222','budget-editor@nomadio.test'),
  ('c3333333-3333-4333-8333-333333333333','budget-viewer@nomadio.test'),
  ('c4444444-4444-4444-8444-444444444444','budget-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Rozpočtová cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe',trip_currency=>'NOK')$$, 'owner creates budget trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Cizí rozpočtová cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe',trip_currency=>'SEK')$$, 'owner creates second trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Rozpočtová cesta'),'budget-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Rozpočtová cesta'),'budget-viewer@nomadio.test','viewer'),'added','viewer added');

select lives_ok($$insert into public.budget_items(trip_id,category,name,estimated_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'food','Jídlo',1500,'NOK','unpaid','c1111111-1111-4111-8111-111111111111')$$, 'owner creates estimated manual item');
select lives_ok($$insert into public.budget_items(trip_id,category,subcategory,name,actual_amount,paid_amount,balance_due_date,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'activities','entrance_fees','Muzeum',1000,250,'2027-05-10','NOK','partially_paid','c1111111-1111-4111-8111-111111111111')$$, 'owner creates partially paid item with subcategory');
select is((select count(*) from public.budget_items),2::bigint,'owner reads own trip items');
select is((select coalesce(actual_amount,estimated_amount)-coalesce(paid_amount,0) from public.budget_items where name='Muzeum'),750::numeric,'remaining amount derives from actual and paid');
select is((select balance_due_date from public.budget_items where name='Muzeum'),'2027-05-10'::date,'due date stored');
select is((select subcategory from public.budget_items where name='Muzeum'),'entrance_fees','valid subcategory stored');
select is((select subcategory from public.budget_items where name='Jídlo'),null::text,'manual item without subcategory remains valid');
select throws_ok($$insert into public.budget_items(trip_id,category,name,actual_amount,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Záporné',100,-1,'NOK','unknown','c1111111-1111-4111-8111-111111111111')$$,'23514',null,'negative paid amount denied');
select throws_ok($$insert into public.budget_items(trip_id,category,name,actual_amount,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Přeplacené',100,101,'NOK','unknown','c1111111-1111-4111-8111-111111111111')$$,'23514',null,'paid above actual denied');
select throws_ok($$insert into public.budget_items(trip_id,category,name,actual_amount,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Chybný stav',100,20,'NOK','paid','c1111111-1111-4111-8111-111111111111')$$,'23514',null,'paid status must match base amount');
select throws_ok($$insert into public.budget_items(trip_id,source_type,source_id,category,name,actual_amount,currency,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'accommodation',gen_random_uuid(),'accommodation','Kopie hotelu',100,'NOK','c1111111-1111-4111-8111-111111111111')$$,'42501',null,'automatic source cannot be copied into budget items');
select throws_ok($$insert into public.budget_items(trip_id,category,subcategory,name,actual_amount,currency,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'food','fuel','Chybná hierarchie',100,'NOK','c1111111-1111-4111-8111-111111111111')$$,'23503',null,'subcategory from another category is denied');

set local "request.jwt.claim.sub"='c2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.budget_items),2::bigint,'editor reads budget items');
select lives_ok($$insert into public.budget_items(trip_id,category,subcategory,name,actual_amount,paid_amount,currency,payment_status,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'travel_services','insurance','Pojištění',500,500,'NOK','paid','c2222222-2222-4222-8222-222222222222')$$, 'editor creates item');
select lives_ok($$update public.budget_items set notes='Upraveno' where name='Pojištění'$$, 'editor updates item');
select is((select notes from public.budget_items where name='Pojištění'),'Upraveno','editor update persisted');
select lives_ok($$delete from public.budget_items where name='Pojištění'$$, 'editor deletes item');
select is((select count(*) from public.budget_items where name='Pojištění'),0::bigint,'editor delete persisted');
select throws_ok($$update public.budget_items set trip_id=(select id from public.trips where name='Cizí rozpočtová cesta') where name='Muzeum'$$,'42501',null,'trip id cannot change');
select throws_ok($$update public.budget_items set source_type='transport' where name='Muzeum'$$,'42501',null,'source type cannot change');

set local "request.jwt.claim.sub"='c3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.budget_items),2::bigint,'viewer reads budget items');
select throws_ok($$insert into public.budget_items(trip_id,category,name,currency,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Zakázané','NOK','c3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create item');
select is_empty($$update public.budget_items set notes='Zakázáno' returning id$$,'viewer cannot update items');
select is_empty($$delete from public.budget_items returning id$$,'viewer cannot delete items');

set local "request.jwt.claim.sub"='c4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.budget_items),0::bigint,'unrelated user cannot read items');
select throws_ok($$insert into public.budget_items(trip_id,category,name,currency,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Cizí zápis','NOK','c4444444-4444-4444-8444-444444444444')$$,'42501',null,'unrelated user cannot create item');

set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select is(public.archive_trip((select id from public.trips where name='Rozpočtová cesta')),'archived','trip archived');
select is((select count(*) from public.budget_items),2::bigint,'archived items remain readable');
select throws_ok($$insert into public.budget_items(trip_id,category,name,currency,created_by) values ((select id from public.trips where name='Rozpočtová cesta'),'other','Archiv create','NOK','c1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks create');
select is_empty($$update public.budget_items set notes='Archiv update' returning id$$,'archived trip blocks update');
select is_empty($$delete from public.budget_items returning id$$,'archived trip blocks delete');

select * from finish();
rollback;
