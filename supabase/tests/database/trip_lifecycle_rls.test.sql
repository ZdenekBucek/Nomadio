begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

select ok(
  not (select prosecdef from pg_proc where oid = 'public.archive_trip(uuid)'::regprocedure),
  'archive_trip uses caller permissions'
);
select ok(
  not (select prosecdef from pg_proc where oid = 'public.restore_trip(uuid)'::regprocedure),
  'restore_trip uses caller permissions'
);
select ok(
  not (select prosecdef from pg_proc where oid = 'public.delete_trip(uuid,text)'::regprocedure),
  'delete_trip uses caller permissions'
);

select ok(
  not has_function_privilege('anon', 'public.archive_trip(uuid)', 'execute'),
  'anonymous users cannot execute archive_trip'
);
select ok(
  not has_function_privilege('anon', 'public.restore_trip(uuid)', 'execute'),
  'anonymous users cannot execute restore_trip'
);
select ok(
  not has_function_privilege('anon', 'public.delete_trip(uuid,text)', 'execute'),
  'anonymous users cannot execute delete_trip'
);

insert into auth.users (id, email)
values
  ('10101010-1010-4010-8010-101010101010', 'lifecycle-owner@nomadio.test'),
  ('20202020-2020-4020-8020-202020202020', 'lifecycle-editor@nomadio.test'),
  ('30303030-3030-4030-8030-303030303030', 'lifecycle-viewer@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '10101010-1010-4010-8010-101010101010';

select lives_ok(
  $$
    select public.create_private_trip(
      trip_name => 'Norsko 2027',
      destination_country_code => 'NO',
      destination_country_name => 'Norsko',
      destination_city => 'Bodø',
      destination_continent => 'europe',
      trip_status => 'planning'
    )
  $$,
  'owner can create the lifecycle test trip'
);

select lives_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    select id, '20202020-2020-4020-8020-202020202020', 'editor'
    from public.trips where name = 'Norsko 2027';

    insert into public.trip_members (trip_id, user_id, role)
    select id, '30303030-3030-4030-8030-303030303030', 'viewer'
    from public.trips where name = 'Norsko 2027';
  $$,
  'owner can add editor and viewer before archival'
);

select lives_ok(
  $$
    insert into public.trip_destinations (
      trip_id, country_code, country_name, city, continent, is_primary, sort_order
    )
    select id, 'SE', 'Švédsko', 'Abisko', 'europe', false, 1
    from public.trips where name = 'Norsko 2027';

    insert into public.trip_travelers (trip_id, display_name, sort_order, created_by)
    select id, 'Další cestovatel', 1, '10101010-1010-4010-8010-101010101010'
    from public.trips where name = 'Norsko 2027';
  $$,
  'owner can add related content before archival'
);

set local "request.jwt.claim.sub" = '20202020-2020-4020-8020-202020202020';

select throws_ok(
  $$
    update public.trips
    set status = 'archived'
    where name = 'Norsko 2027'
  $$,
  '42501',
  null,
  'editor cannot archive through direct table access'
);

select throws_ok(
  $$
    select public.archive_trip(
      (select id from public.trips where name = 'Norsko 2027')
    )
  $$,
  '42501',
  null,
  'editor cannot call archive_trip'
);

set local "request.jwt.claim.sub" = '10101010-1010-4010-8010-101010101010';

select is(
  public.archive_trip((select id from public.trips where name = 'Norsko 2027')),
  'archived',
  'owner can archive the trip'
);

select is(
  (select status::text from public.trips where name = 'Norsko 2027'),
  'archived',
  'archive_trip changes the explicit status'
);

select is(
  (select status_before_archive::text from public.trips where name = 'Norsko 2027'),
  'planning',
  'archive_trip preserves the previous explicit status'
);

select isnt(
  (select archived_at from public.trips where name = 'Norsko 2027'),
  null::timestamptz,
  'archive_trip records the archive timestamp'
);

select throws_ok(
  $$
    update public.trips
    set name = 'Nepovolená změna archivu'
    where name = 'Norsko 2027'
  $$,
  '42501',
  null,
  'even the owner cannot edit trip content while archived'
);

select is_empty(
  $$
    update public.trip_destinations
    set city = 'Narvik'
    where trip_id = (select id from public.trips where name = 'Norsko 2027')
    returning id
  $$,
  'owner cannot edit destinations while archived'
);

select throws_ok(
  $$
    select public.update_trip_member_role(
      (select id from public.trips where name = 'Norsko 2027'),
      '30303030-3030-4030-8030-303030303030',
      'editor'
    )
  $$,
  '42501',
  null,
  'privileged membership functions cannot mutate archived trips'
);

set local "request.jwt.claim.sub" = '30303030-3030-4030-8030-303030303030';

select is(
  (select count(*) from public.trips where name = 'Norsko 2027'),
  1::bigint,
  'viewer keeps read access to an archived trip'
);

select throws_ok(
  $$
    select public.restore_trip(
      (select id from public.trips where name = 'Norsko 2027')
    )
  $$,
  '42501',
  null,
  'viewer cannot restore an archived trip'
);

set local "request.jwt.claim.sub" = '10101010-1010-4010-8010-101010101010';

select is(
  public.restore_trip((select id from public.trips where name = 'Norsko 2027')),
  'restored',
  'owner can restore an archived trip'
);

select is(
  (select status::text from public.trips where name = 'Norsko 2027'),
  'planning',
  'restore_trip returns the trip to its previous status'
);

select is(
  (select status_before_archive from public.trips where name = 'Norsko 2027'),
  null::public.trip_status,
  'restoring clears the preserved status'
);

select is(
  (select archived_at from public.trips where name = 'Norsko 2027'),
  null::timestamptz,
  'restoring clears the archive timestamp'
);

select is(
  public.archive_trip((select id from public.trips where name = 'Norsko 2027')),
  'archived',
  'owner can archive the restored trip again'
);

select is(
  public.delete_trip(
    (select id from public.trips where name = 'Norsko 2027'),
    'Špatný název'
  ),
  'name_mismatch',
  'delete_trip rejects a mismatched confirmation name'
);

select is(
  (select count(*) from public.trips where name = 'Norsko 2027'),
  1::bigint,
  'a failed confirmation leaves the trip intact'
);

set local "request.jwt.claim.sub" = '20202020-2020-4020-8020-202020202020';

select throws_ok(
  $$
    select public.delete_trip(
      (select id from public.trips where name = 'Norsko 2027'),
      'Norsko 2027'
    )
  $$,
  '42501',
  null,
  'editor cannot delete a trip'
);

set local "request.jwt.claim.sub" = '10101010-1010-4010-8010-101010101010';

select is(
  public.delete_trip(
    (select id from public.trips where name = 'Norsko 2027'),
    'Norsko 2027'
  ),
  'deleted',
  'owner can delete after exact name confirmation'
);

select is((select count(*) from public.trips), 0::bigint, 'trip row is deleted');
select is((select count(*) from public.trip_destinations), 0::bigint, 'destinations are deleted by cascade');
select is((select count(*) from public.trip_travelers), 0::bigint, 'travelers are deleted by cascade');
select is((select count(*) from public.trip_members), 0::bigint, 'memberships are deleted by cascade');

reset role;
set local role anon;

select throws_ok(
  $$ select public.archive_trip('40404040-4040-4040-8040-404040404040') $$,
  '42501',
  null,
  'anonymous users cannot call lifecycle functions'
);

select * from finish();

rollback;
