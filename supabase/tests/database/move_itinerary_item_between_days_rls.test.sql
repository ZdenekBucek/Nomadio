begin;
create extension if not exists pgtap with schema extensions;
select plan(38);

select ok(
  not (select prosecdef from pg_proc where oid = 'public.move_itinerary_item_to_day(uuid,uuid)'::regprocedure),
  'cross-day move uses caller permissions'
);
select ok(
  not has_function_privilege('anon', 'public.move_itinerary_item_to_day(uuid,uuid)', 'execute'),
  'anon cannot execute cross-day move'
);

create function public.test_fail_selected_itinerary_move()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.title = 'Selhání přesunu' and new.day_id is distinct from old.day_id then
    raise exception 'Simulated move failure' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger zz_test_fail_selected_itinerary_move
before update on public.itinerary_items for each row
execute function public.test_fail_selected_itinerary_move();

insert into auth.users(id,email) values
  ('81818181-8181-4181-8181-818181818181','move-owner@nomadio.test'),
  ('82828282-8282-4282-8282-828282828282','move-editor@nomadio.test'),
  ('83838383-8383-4383-8383-838383838383','move-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '81818181-8181-4181-8181-818181818181';
select lives_ok($$ select public.create_private_trip(trip_name=>'Přesun cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe') $$,'owner creates target trip');
select lives_ok($$ select public.create_private_trip(trip_name=>'Cizí cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe') $$,'owner creates other trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Přesun cesta'),'move-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Přesun cesta'),'move-viewer@nomadio.test','viewer'),'added','viewer added');
select isnt(public.create_itinerary_day((select id from public.trips where name='Přesun cesta'),'Zdrojový den','2027-08-01','Oslo','plan',false),null::uuid,'source day created');
select isnt(public.create_itinerary_day((select id from public.trips where name='Přesun cesta'),'Cílový den','2027-08-02','Bergen','plan',false),null::uuid,'target day created');
select isnt(public.create_itinerary_day((select id from public.trips where name='Přesun cesta'),'Plán bez data',null,'Tromsø','plan',false),null::uuid,'undated target created');
select isnt(public.create_itinerary_day((select id from public.trips where name='Cizí cesta'),'Cizí den','2027-08-03','Stockholm','plan',false),null::uuid,'other-trip day created');
select isnt(public.create_manual_trip_place((select id from public.trips where name='Přesun cesta'),'Vyhlídka',null,'NO','Oslo',59.91,10.75,'sight'),null::uuid,'linked place created');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Zdrojový den'),'activity','Přesouvaný bod','09:00','10:00','Zachovat poznámku',(select id from public.trip_places where name='Vyhlídka')),null::uuid,'linked item created');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Zdrojový den'),'note','Zůstává ve zdroji',null,null,null,null),null::uuid,'source follower created');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Cílový den'),'note','Existující cíl',null,null,null,null),null::uuid,'target item created');

select is(public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Přesouvaný bod'),
  (select id from public.itinerary_days where name='Cílový den')
),'moved','owner moves item');
select is((select day.name from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where item.title='Přesouvaný bod'),'Cílový den','item belongs to target day');
select is((select place_id from public.itinerary_items where title='Přesouvaný bod'),(select id from public.trip_places where name='Vyhlídka'),'place id preserved');
select is((select title from public.itinerary_items where title='Přesouvaný bod'),'Přesouvaný bod','title preserved');
select is((select notes from public.itinerary_items where title='Přesouvaný bod'),'Zachovat poznámku','notes preserved');
select is((select start_time::text || '|' || end_time::text from public.itinerary_items where title='Přesouvaný bod'),'09:00:00|10:00:00','times preserved');
select is((select sort_order from public.itinerary_items where title='Přesouvaný bod'),1,'item appended after target items');
select is((select sort_order from public.itinerary_items where title='Zůstává ve zdroji'),0,'source order closed deterministically');
select is((select count(*) from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where day.name='Zdrojový den'),1::bigint,'item removed from source day');
select is((select count(*) from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where day.name='Cílový den'),2::bigint,'item present in target day');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Zdrojový den'),'transport','Přesun editora','11:00','11:30','Metadata editora',null),null::uuid,'editor candidate created');

set local "request.jwt.claim.sub" = '82828282-8282-4282-8282-828282828282';
select is(public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Přesun editora'),
  (select id from public.itinerary_days where name='Plán bez data')
),'moved','editor moves item to undated plan');
select is((select day.name from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where item.title='Přesun editora'),'Plán bez data','editor target stored');
select is((select sort_order from public.itinerary_items where title='Přesun editora'),0,'undated target starts at zero');

set local "request.jwt.claim.sub" = '83838383-8383-4383-8383-838383838383';
select throws_ok($$ select public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Zůstává ve zdroji'),
  (select id from public.itinerary_days where name='Cílový den')
) $$,'42501',null,'viewer cannot move item');

set local "request.jwt.claim.sub" = '81818181-8181-4181-8181-818181818181';
select throws_ok($$ select public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Zůstává ve zdroji'),
  (select id from public.itinerary_days where name='Cizí den')
) $$,'22023',null,'cross-trip target denied');
select throws_ok($$ select public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Přesouvaný bod'),
  (select id from public.itinerary_days where name='Cílový den')
) $$,'22023',null,'current day cannot be selected as target');
select isnt(public.create_itinerary_item((select id from public.itinerary_days where name='Zdrojový den'),'note','Selhání přesunu',null,null,'Musí zůstat',null),null::uuid,'rollback candidate created');
select throws_ok($$ select public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Selhání přesunu'),
  (select id from public.itinerary_days where name='Cílový den')
) $$,'P0001','Simulated move failure','failed move rolls back');
select is((select day.name from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where item.title='Selhání přesunu'),'Zdrojový den','failed move keeps source day');
select results_eq($$ select item.sort_order from public.itinerary_items item join public.itinerary_days day on day.id=item.day_id where day.name='Zdrojový den' order by item.sort_order $$,array[0,1],'failed move keeps contiguous source order');
select is(public.archive_trip((select id from public.trips where name='Přesun cesta')),'archived','trip archived');
select throws_ok($$ select public.move_itinerary_item_to_day(
  (select id from public.itinerary_items where title='Zůstává ve zdroji'),
  (select id from public.itinerary_days where name='Cílový den')
) $$,'42501',null,'archived trip denies move');
select is((select count(*) from public.itinerary_items where title='Zůstává ve zdroji'),1::bigint,'archived denial keeps item');

select * from finish();
rollback;
