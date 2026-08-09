begin;
create extension if not exists pgtap with schema extensions;
select plan(65);

select ok((select relrowsecurity from pg_class where oid = 'public.budget_plan_items'::regclass), 'budget plan items have RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.expenses'::regclass), 'expenses have RLS enabled');
select ok(not has_table_privilege('anon', 'public.budget_plan_items', 'select'), 'anon cannot read budget plan items');
select ok(not has_table_privilege('anon', 'public.expenses', 'select'), 'anon cannot read expenses');
select ok(has_table_privilege('authenticated', 'public.budget_plan_items', 'select'), 'authenticated role can reach budget plan items through Data API');
select ok(has_table_privilege('authenticated', 'public.expenses', 'select'), 'authenticated role can reach expenses through Data API');

insert into auth.users(id,email) values
  ('d1111111-1111-4111-8111-111111111111','finance-owner@nomadio.test'),
  ('d2222222-2222-4222-8222-222222222222','finance-editor@nomadio.test'),
  ('d3333333-3333-4333-8333-333333333333','finance-viewer@nomadio.test'),
  ('d4444444-4444-4444-8444-444444444444','finance-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='d1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Finance cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe',trip_currency=>'NOK')$$, 'owner creates finance trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Cizí finance cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe',trip_currency=>'SEK')$$, 'owner creates other finance trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Finance cesta'),'finance-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Finance cesta'),'finance-viewer@nomadio.test','viewer'),'added','viewer added');
select is((select count(*) from public.trip_travelers where trip_id=(select id from public.trips where name='Finance cesta') and user_id='d1111111-1111-4111-8111-111111111111'),1::bigint,'owner traveler exists');

select lives_ok($$
  insert into public.budget_plan_items(id,trip_id,category,subcategory,name,planned_amount,currency,created_by)
  values ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',(select id from public.trips where name='Finance cesta'),'food','restaurants','Jídlo',10000,'NOK','d1111111-1111-4111-8111-111111111111')
$$,'owner creates plan item');
select is((select planned_amount from public.budget_plan_items where id='daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),10000::numeric,'planned amount stored');
select is((select currency from public.budget_plan_items where id='daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),'NOK','plan currency stored');
select lives_ok($$update public.budget_plan_items set planned_amount=11000 where id='daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,'owner updates plan item');
select is((select planned_amount from public.budget_plan_items where id='daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),11000::numeric,'plan update persisted');
select lives_ok($$insert into public.budget_plan_items(id,trip_id,category,name,planned_amount,currency,created_by) values ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',(select id from public.trips where name='Finance cesta'),'other','Smazat plán',0,'NOK','d1111111-1111-4111-8111-111111111111')$$,'zero plan is valid');
select lives_ok($$delete from public.budget_plan_items where id='dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,'owner deletes plan item');

select lives_ok($$
  insert into public.expenses(id,trip_id,category,subcategory,title,amount,currency,occurred_at,created_by,paid_by_traveler_id)
  values ('dccccccc-cccc-4ccc-8ccc-cccccccccccc',(select id from public.trips where name='Finance cesta'),'transport','taxi_transfer','Taxi',450,'NOK','2027-06-01 09:30:00+00','d1111111-1111-4111-8111-111111111111',(select id from public.trip_travelers where trip_id=(select id from public.trips where name='Finance cesta') and user_id='d1111111-1111-4111-8111-111111111111'))
$$,'owner creates expense');
select is((select amount from public.expenses where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'),450::numeric,'expense amount stored');
select is((select occurred_at from public.expenses where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'),'2027-06-01 09:30:00+00'::timestamptz,'expense occurrence stored');
select is((select currency from public.expenses where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'),'NOK','expense currency stored');
select lives_ok($$update public.expenses set amount=500 where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,'owner updates expense');
select is((select amount from public.expenses where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'),500::numeric,'expense update persisted');
select lives_ok($$insert into public.expenses(id,trip_id,category,amount,currency,occurred_at,created_by) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',(select id from public.trips where name='Finance cesta'),'other',1,'NOK',now(),'d1111111-1111-4111-8111-111111111111')$$,'owner creates deletable expense');
select lives_ok($$delete from public.expenses where id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,'owner deletes expense');

select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'invalid','Invalid',1,'NOK','d1111111-1111-4111-8111-111111111111')$$,'22P02',null,'invalid plan category denied');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,subcategory,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'food','fuel','Invalid pair',1,'NOK','d1111111-1111-4111-8111-111111111111')$$,'23503',null,'invalid plan category and subcategory pair denied');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'other','Negative',-1,'NOK','d1111111-1111-4111-8111-111111111111')$$,'23514',null,'negative plan amount denied');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'other','Currency',1,'nok','d1111111-1111-4111-8111-111111111111')$$,'23514',null,'invalid plan currency denied');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by) values ((select id from public.trips where name='Finance cesta'),'food',0,'NOK',now(),'d1111111-1111-4111-8111-111111111111')$$,'23514',null,'nonpositive expense denied');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by) values ((select id from public.trips where name='Finance cesta'),'food',1,'nok',now(),'d1111111-1111-4111-8111-111111111111')$$,'23514',null,'invalid expense currency denied');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by,paid_by_traveler_id) values ((select id from public.trips where name='Finance cesta'),'food',1,'NOK',now(),'d1111111-1111-4111-8111-111111111111',(select id from public.trip_travelers where trip_id=(select id from public.trips where name='Cizí finance cesta') limit 1))$$,'23503',null,'traveler from another trip denied');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'food',1,'NOK','d1111111-1111-4111-8111-111111111111')$$,'23502',null,'missing occurred at denied');
select throws_ok($$update public.budget_plan_items set trip_id=(select id from public.trips where name='Cizí finance cesta') where id='daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,'42501',null,'plan system fields protected');
select throws_ok($$update public.expenses set created_by='d2222222-2222-4222-8222-222222222222' where id='dccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,'42501',null,'expense system fields protected');

set local "request.jwt.claim.sub"='d2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.budget_plan_items),1::bigint,'editor reads plan items');
select is((select count(*) from public.expenses),1::bigint,'editor reads expenses');
select lives_ok($$insert into public.budget_plan_items(id,trip_id,category,name,planned_amount,currency,created_by) values ('deeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',(select id from public.trips where name='Finance cesta'),'activities','Editor plan',500,'NOK','d2222222-2222-4222-8222-222222222222')$$,'editor creates plan item');
select lives_ok($$update public.budget_plan_items set planned_amount=600 where id='deeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,'editor updates plan item');
select lives_ok($$delete from public.budget_plan_items where id='deeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,'editor deletes plan item');
select lives_ok($$insert into public.expenses(id,trip_id,category,amount,currency,occurred_at,created_by) values ('dfffffff-ffff-4fff-8fff-ffffffffffff',(select id from public.trips where name='Finance cesta'),'activities',250,'NOK',now(),'d2222222-2222-4222-8222-222222222222')$$,'editor creates expense');
select lives_ok($$update public.expenses set amount=275 where id='dfffffff-ffff-4fff-8fff-ffffffffffff'$$,'editor updates expense');
select lives_ok($$delete from public.expenses where id='dfffffff-ffff-4fff-8fff-ffffffffffff'$$,'editor deletes expense');

set local "request.jwt.claim.sub"='d3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.budget_plan_items),1::bigint,'viewer reads plan items');
select is((select count(*) from public.expenses),1::bigint,'viewer reads expenses');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'other','Viewer plan',1,'NOK','d3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create plan item');
select is_empty($$update public.budget_plan_items set planned_amount=1 returning id$$,'viewer cannot update plan items');
select is_empty($$delete from public.budget_plan_items returning id$$,'viewer cannot delete plan items');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by) values ((select id from public.trips where name='Finance cesta'),'other',1,'NOK',now(),'d3333333-3333-4333-8333-333333333333')$$,'42501',null,'viewer cannot create expense');
select is_empty($$update public.expenses set amount=1 returning id$$,'viewer cannot update expenses');
select is_empty($$delete from public.expenses returning id$$,'viewer cannot delete expenses');

set local "request.jwt.claim.sub"='d4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.budget_plan_items),0::bigint,'unrelated user cannot read plan items');
select is((select count(*) from public.expenses),0::bigint,'unrelated user cannot read expenses');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'other','Foreign plan',1,'NOK','d4444444-4444-4444-8444-444444444444')$$,'42501',null,'unrelated user cannot create plan item');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by) values ((select id from public.trips where name='Finance cesta'),'other',1,'NOK',now(),'d4444444-4444-4444-8444-444444444444')$$,'42501',null,'unrelated user cannot create expense');

set local "request.jwt.claim.sub"='d1111111-1111-4111-8111-111111111111';
select is(public.archive_trip((select id from public.trips where name='Finance cesta')),'archived','trip archived');
select is((select count(*) from public.budget_plan_items),1::bigint,'archived plan remains readable');
select is((select count(*) from public.expenses),1::bigint,'archived expenses remain readable');
select throws_ok($$insert into public.budget_plan_items(trip_id,category,name,planned_amount,currency,created_by) values ((select id from public.trips where name='Finance cesta'),'other','Archived plan',1,'NOK','d1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks plan insert');
select is_empty($$update public.budget_plan_items set planned_amount=1 returning id$$,'archived trip blocks plan update');
select is_empty($$delete from public.budget_plan_items returning id$$,'archived trip blocks plan delete');
select throws_ok($$insert into public.expenses(trip_id,category,amount,currency,occurred_at,created_by) values ((select id from public.trips where name='Finance cesta'),'other',1,'NOK',now(),'d1111111-1111-4111-8111-111111111111')$$,'42501',null,'archived trip blocks expense insert');
select is_empty($$update public.expenses set amount=1 returning id$$,'archived trip blocks expense update');
select is_empty($$delete from public.expenses returning id$$,'archived trip blocks expense delete');

select * from finish();
rollback;
