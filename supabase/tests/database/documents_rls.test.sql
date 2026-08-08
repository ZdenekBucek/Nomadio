begin;
create extension if not exists pgtap with schema extensions;
select plan(55);

select ok((select relrowsecurity from pg_class where oid = 'public.documents'::regclass), 'documents have RLS enabled');
select has_type('public', 'document_category', 'document category enum exists');
select has_type('public', 'document_linked_entity_type', 'document linked entity enum exists');
select ok(not has_table_privilege('anon', 'public.documents', 'select'), 'anon cannot read documents');
select is((select public from storage.buckets where id = 'trip-documents'), false, 'document bucket is private');
select is((select file_size_limit from storage.buckets where id = 'trip-documents'), 10485760::bigint, 'bucket has ten megabyte limit');
select results_eq(
  $$select unnest(allowed_mime_types) from storage.buckets where id = 'trip-documents'$$,
  $$values ('application/pdf'), ('image/jpeg'), ('image/png')$$,
  'bucket allows only PDF, JPG and PNG'
);
select is(public.trip_document_storage_trip_id('unsafe/path'), null::uuid, 'unsafe storage path has no trip id');

insert into auth.users(id,email) values
  ('d1111111-1111-4111-8111-111111111111','documents-owner@nomadio.test'),
  ('d2222222-2222-4222-8222-222222222222','documents-editor@nomadio.test'),
  ('d3333333-3333-4333-8333-333333333333','documents-viewer@nomadio.test'),
  ('d4444444-4444-4444-8444-444444444444','documents-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub"='d1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_private_trip(trip_name=>'Dokumentová cesta',destination_country_code=>'NO',destination_country_name=>'Norsko',destination_city=>'Oslo',destination_continent=>'europe')$$, 'owner creates document trip');
select lives_ok($$select public.create_private_trip(trip_name=>'Cizí dokumentová cesta',destination_country_code=>'SE',destination_country_name=>'Švédsko',destination_city=>'Stockholm',destination_continent=>'europe')$$, 'owner creates second trip');
select is(public.add_trip_member_by_email((select id from public.trips where name='Dokumentová cesta'),'documents-editor@nomadio.test','editor'),'added','editor added');
select is(public.add_trip_member_by_email((select id from public.trips where name='Dokumentová cesta'),'documents-viewer@nomadio.test','viewer'),'added','viewer added');

select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Dokumentová cesta'),'Hotel dokument','2027-05-01','2027-05-02','d1111111-1111-4111-8111-111111111111')$$, 'owner creates linked accommodation');
select lives_ok($$insert into public.accommodations(trip_id,name,check_in_date,check_out_date,created_by) values ((select id from public.trips where name='Cizí dokumentová cesta'),'Cizí hotel','2027-05-01','2027-05-02','d1111111-1111-4111-8111-111111111111')$$, 'owner creates accommodation in another trip');
select lives_ok($$insert into public.transport_bookings(trip_id,title,created_by) values ((select id from public.trips where name='Dokumentová cesta'),'Let do Osla','d1111111-1111-4111-8111-111111111111')$$, 'owner creates linked transport');
select lives_ok($$select public.create_itinerary_day((select id from public.trips where name='Dokumentová cesta'),'Program','2027-05-01','Oslo','plan',false)$$, 'owner creates itinerary day');
select lives_ok($$select public.create_itinerary_item((select id from public.itinerary_days where name='Program'),'activity','Muzeum',null,null,null,null)$$, 'owner creates linked activity');

select lives_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes,is_important,offline_enabled,linked_entity_type,linked_entity_id)
  values (
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.trips where name='Dokumentová cesta'),
    'd1111111-1111-4111-8111-111111111111',
    'Hotelový voucher',
    'accommodation',
    'trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/voucher.pdf',
    'application/pdf',2048,true,true,'accommodation',
    (select id from public.accommodations where name='Hotel dokument')
  )
$$, 'owner creates important offline accommodation document');
select is((select count(*) from public.documents),1::bigint,'owner reads own document');
select is((select is_important from public.documents where name='Hotelový voucher'),true,'important flag stored');
select is((select offline_enabled from public.documents where name='Hotelový voucher'),true,'offline flag stored');
select is((select linked_entity_type::text from public.documents where name='Hotelový voucher'),'accommodation','accommodation link type stored');
select is((select public.trip_document_storage_trip_id(storage_path) from public.documents where name='Hotelový voucher'),(select id from public.trips where name='Dokumentová cesta'),'canonical storage path resolves to trip');
select lives_ok($$
  insert into storage.objects(bucket_id,name,owner_id)
  values ('trip-documents',(select storage_path from public.documents where name='Hotelový voucher'),'d1111111-1111-4111-8111-111111111111')
$$, 'owner can create storage object');

select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes)
  values ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Špatná cesta','other','wrong/path.pdf','application/pdf',10)
$$,'23514',null,'invalid storage path denied');
select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes)
  values ('dccccccc-cccc-4ccc-8ccc-cccccccccccc',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Nebezpečný typ','other','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/dccccccc-cccc-4ccc-8ccc-cccccccccccc/file.html','text/html',10)
$$,'23514',null,'unsafe mime type denied');
select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Příliš velký','other','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/dddddddd-dddd-4ddd-8ddd-dddddddddddd/large.pdf','application/pdf',10485761)
$$,'23514',null,'oversized document denied');
select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes,linked_entity_type,linked_entity_id)
  values ('deeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Cizí hotel','accommodation','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/deeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/voucher.pdf','application/pdf',10,'accommodation',(select id from public.accommodations where name='Cizí hotel'))
$$,'23503',null,'accommodation from another trip denied');

select lives_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes,linked_entity_type,linked_entity_id)
  values ('dfffffff-ffff-4fff-8fff-ffffffffffff',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Vstupenka','activity','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/dfffffff-ffff-4fff-8fff-ffffffffffff/ticket.png','image/png',100,'itinerary_item',(select id from public.itinerary_items where title='Muzeum'))
$$,'activity document can link to itinerary item');
select is((select linked_entity_type::text from public.documents where name='Vstupenka'),'itinerary_item','activity link stored');

set local "request.jwt.claim.sub"='d2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.documents),2::bigint,'editor reads documents');
select lives_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes,linked_entity_type,linked_entity_id)
  values ('d1212121-1212-4121-8121-121212121212',(select id from public.trips where name='Dokumentová cesta'),'d2222222-2222-4222-8222-222222222222','Letenka','transport','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/d1212121-1212-4121-8121-121212121212/ticket.jpg','image/jpeg',300,'transport',(select id from public.transport_bookings where title='Let do Osla'))
$$,'editor creates transport document');
select is((select linked_entity_type::text from public.documents where name='Letenka'),'transport','transport link stored');
select lives_ok($$
  insert into storage.objects(bucket_id,name,owner_id)
  values ('trip-documents',(select storage_path from public.documents where name='Letenka'),'d2222222-2222-4222-8222-222222222222')
$$, 'editor can create storage object');
select lives_ok($$update public.documents set name='Upravená letenka' where name='Letenka'$$,'editor updates metadata');
select is((select name from public.documents where id='d1212121-1212-4121-8121-121212121212'),'Upravená letenka','editor update persisted');
select lives_ok($$delete from public.documents where id='d1212121-1212-4121-8121-121212121212'$$,'editor deletes metadata');
select is((select count(*) from public.documents where id='d1212121-1212-4121-8121-121212121212'),0::bigint,'editor deletion persisted');
select throws_ok($$update public.documents set storage_path='changed' where name='Hotelový voucher'$$,'42501',null,'storage path cannot change');

set local "request.jwt.claim.sub"='d3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.documents),2::bigint,'viewer reads documents');
select is((select count(*) from storage.objects where bucket_id='trip-documents'),2::bigint,'viewer reads document objects');
select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes)
  values ('d1313131-1313-4131-8131-131313131313',(select id from public.trips where name='Dokumentová cesta'),'d3333333-3333-4333-8333-333333333333','Zakázaný','other','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/d1313131-1313-4131-8131-131313131313/file.pdf','application/pdf',10)
$$,'42501',null,'viewer cannot add metadata');
select is_empty($$update public.documents set name='Zakázáno' returning id$$,'viewer cannot update metadata');
select is_empty($$delete from public.documents returning id$$,'viewer cannot delete metadata');
select throws_ok($$
  insert into storage.objects(bucket_id,name,owner_id)
  values ('trip-documents','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/d1414141-1414-4141-8141-141414141414/file.pdf','d3333333-3333-4333-8333-333333333333')
$$,'42501',null,'viewer cannot upload object');
select ok((
  select qual like '%owner%editor%'
  from pg_policies
  where schemaname='storage' and tablename='objects' and cmd='DELETE'
    and policyname='Editors can remove document objects'
    and roles='{authenticated}'
), 'viewer is excluded from the object delete policy');

set local "request.jwt.claim.sub"='d4444444-4444-4444-8444-444444444444';
select is((select count(*) from public.documents),0::bigint,'unrelated user cannot read metadata');
select is((select count(*) from storage.objects where bucket_id='trip-documents'),0::bigint,'unrelated user cannot read objects');

set local "request.jwt.claim.sub"='d1111111-1111-4111-8111-111111111111';
select is(public.archive_trip((select id from public.trips where name='Dokumentová cesta')),'archived','trip archived');
select is((select count(*) from public.documents),2::bigint,'archived documents remain readable');
select throws_ok($$
  insert into public.documents(id,trip_id,uploaded_by,name,category,storage_path,mime_type,size_bytes)
  values ('d1515151-1515-4151-8151-151515151515',(select id from public.trips where name='Dokumentová cesta'),'d1111111-1111-4111-8111-111111111111','Archivní zápis','other','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/d1515151-1515-4151-8151-151515151515/file.pdf','application/pdf',10)
$$,'42501',null,'archived trip blocks metadata insert');
select is_empty($$update public.documents set name='Archiv update' returning id$$,'archived trip blocks metadata update');
select is_empty($$delete from public.documents returning id$$,'archived trip blocks metadata delete');
select throws_ok($$
  insert into storage.objects(bucket_id,name,owner_id)
  values ('trip-documents','trips/' || (select id from public.trips where name='Dokumentová cesta') || '/documents/d1616161-1616-4161-8161-161616161616/file.pdf','d1111111-1111-4111-8111-111111111111')
$$,'42501',null,'archived trip blocks object upload');
select ok((
  select qual like '%archived%'
  from pg_policies
  where schemaname='storage' and tablename='objects' and cmd='DELETE'
    and policyname='Editors can remove document objects'
), 'object delete policy checks archived trip state');

select * from finish();
rollback;
