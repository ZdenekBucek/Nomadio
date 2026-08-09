begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select is((select public from storage.buckets where id = 'trip-covers'), false, 'cover bucket is private');
select is((select file_size_limit from storage.buckets where id = 'trip-covers'), 5242880::bigint, 'cover bucket has five megabyte limit');
select results_eq($$select unnest(allowed_mime_types) from storage.buckets where id = 'trip-covers'$$, $$values ('image/jpeg'), ('image/png'), ('image/webp')$$, 'cover bucket accepts only permitted image types');
select is(public.trip_cover_storage_trip_id('unsafe/path'), null::uuid, 'unsafe cover path is rejected');

insert into auth.users(id,email) values
  ('c1111111-1111-4111-8111-111111111111','cover-owner@nomadio.test'),
  ('c2222222-2222-4222-8222-222222222222','cover-editor@nomadio.test'),
  ('c3333333-3333-4333-8333-333333333333','cover-viewer@nomadio.test'),
  ('c4444444-4444-4444-8444-444444444444','cover-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Cover cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe')$$, 'owner creates cover trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Cover cesta'),'cover-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Cover cesta'),'cover-viewer@nomadio.test','viewer'),'added','viewer added');

select lives_ok($$
  insert into storage.objects(bucket_id,name,owner_id) values ('trip-covers','trips/' || (select id from public.trips where name='Cover cesta') || '/cover/caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp','c1111111-1111-4111-8111-111111111111')
$$, 'owner uploads canonical cover object');
select is(public.set_trip_cover_upload((select id from public.trips where name='Cover cesta'),'trips/' || (select id from public.trips where name='Cover cesta') || '/cover/caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp'),'updated','owner sets uploaded cover');
select is((select cover_kind::text from public.trips where name='Cover cesta'),'upload','uploaded cover kind stored');
select is((select public.trip_cover_storage_trip_id(cover_storage_path) from public.trips where name='Cover cesta'),(select id from public.trips where name='Cover cesta'),'cover path belongs to trip');
select throws_ok($$select public.set_trip_cover_upload((select id from public.trips where name='Cover cesta'),'trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cover/caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp')$$,'22023',null,'cross-trip cover path denied');

set local "request.jwt.claim.sub"='c2222222-2222-4222-8222-222222222222';
select lives_ok($$
  insert into storage.objects(bucket_id,name,owner_id) values ('trip-covers','trips/' || (select id from public.trips where name='Cover cesta') || '/cover/cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png','c2222222-2222-4222-8222-222222222222')
$$, 'editor uploads cover object');
select is(public.set_trip_cover_upload((select id from public.trips where name='Cover cesta'),'trips/' || (select id from public.trips where name='Cover cesta') || '/cover/cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png'),'updated','editor sets uploaded cover');

set local "request.jwt.claim.sub"='c3333333-3333-4333-8333-333333333333';
select is((select count(*) from storage.objects where bucket_id='trip-covers'),2::bigint,'viewer reads cover objects');
select throws_ok($$
  insert into storage.objects(bucket_id,name,owner_id) values ('trip-covers','trips/' || (select id from public.trips where name='Cover cesta') || '/cover/cccccccc-cccc-4ccc-8ccc-cccccccccccc.jpg','c3333333-3333-4333-8333-333333333333')
$$,'42501',null,'viewer cannot upload cover');
select throws_ok($$select public.remove_trip_cover((select id from public.trips where name='Cover cesta'))$$,'42501',null,'viewer cannot remove cover metadata');

set local "request.jwt.claim.sub"='c4444444-4444-4444-8444-444444444444';
select is((select count(*) from storage.objects where bucket_id='trip-covers'),0::bigint,'unrelated user cannot read cover objects');

set local "request.jwt.claim.sub"='c1111111-1111-4111-8111-111111111111';
select is(public.archive_trip((select id from public.trips where name='Cover cesta')),'archived','cover trip archived');
select throws_ok($$select public.remove_trip_cover((select id from public.trips where name='Cover cesta'))$$,'42501',null,'archived trip cannot remove cover');
select throws_ok($$
  insert into storage.objects(bucket_id,name,owner_id) values ('trip-covers','trips/' || (select id from public.trips where name='Cover cesta') || '/cover/cddddddd-dddd-4ddd-8ddd-dddddddddddd.jpg','c1111111-1111-4111-8111-111111111111')
$$,'42501',null,'archived trip blocks cover upload');

select * from finish();
rollback;
