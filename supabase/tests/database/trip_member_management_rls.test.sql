begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '61616161-6161-4161-8161-616161616161',
    'manage-owner@nomadio.test',
    '{"full_name":"Manage Owner"}'::jsonb
  ),
  (
    '62626262-6262-4262-8262-626262626262',
    'manage-editor@nomadio.test',
    '{"full_name":"Manage Editor"}'::jsonb
  ),
  (
    '63636363-6363-4363-8363-636363636363',
    'manage-viewer@nomadio.test',
    '{"full_name":"Manage Viewer"}'::jsonb
  ),
  (
    '64646464-6464-4464-8464-646464646464',
    'manage-other@nomadio.test',
    '{"full_name":"Manage Other"}'::jsonb
  );

set local role authenticated;
set local "request.jwt.claim.sub" = '61616161-6161-4161-8161-616161616161';

insert into public.trips (id, created_by, name)
values (
  'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
  '61616161-6161-4161-8161-616161616161',
  'Managed trip'
);

select is(
  public.add_trip_member_by_email(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    'manage-editor@nomadio.test',
    'editor'
  ),
  'added',
  'the editor is added for management tests'
);

select is(
  public.add_trip_member_by_email(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    'manage-viewer@nomadio.test',
    'viewer'
  ),
  'added',
  'the viewer is added for management tests'
);

select is(
  (select count(*) from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')),
  3::bigint,
  'the owner can list every member profile'
);

select is(
  (
    select display_name
    from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')
    where user_id = '62626262-6262-4262-8262-626262626262'
  ),
  'Manage Editor',
  'the member list includes the synchronized display name'
);

select is(
  (
    select email
    from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')
    where user_id = '63636363-6363-4363-8363-636363636363'
  ),
  'manage-viewer@nomadio.test',
  'the member list includes the exact account email'
);

select is(
  public.update_trip_member_role(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    '63636363-6363-4363-8363-636363636363',
    'editor'
  ),
  'updated',
  'the owner can promote a viewer to editor'
);

select is(
  (
    select role::text
    from public.trip_members
    where trip_id = 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd'
      and user_id = '63636363-6363-4363-8363-636363636363'
  ),
  'editor',
  'the promoted role is persisted'
);

select is(
  public.update_trip_member_role(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    '63636363-6363-4363-8363-636363636363',
    'editor'
  ),
  'no_change',
  'setting the current role is safely idempotent'
);

select is(
  public.update_trip_member_role(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    '64646464-6464-4464-8464-646464646464',
    'viewer'
  ),
  'member_not_found',
  'updating an unrelated account does not create membership'
);

select throws_ok(
  $$
    select public.update_trip_member_role(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '61616161-6161-4161-8161-616161616161',
      'viewer'
    )
  $$,
  '42501',
  null,
  'the owner cannot downgrade their own membership'
);

select throws_ok(
  $$
    select public.remove_trip_member(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '61616161-6161-4161-8161-616161616161'
    )
  $$,
  '42501',
  null,
  'the owner cannot remove their own membership'
);

set local "request.jwt.claim.sub" = '62626262-6262-4262-8262-626262626262';

select is(
  (select count(*) from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')),
  3::bigint,
  'an editor can view the member list'
);

select throws_ok(
  $$
    select public.update_trip_member_role(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '63636363-6363-4363-8363-636363636363',
      'viewer'
    )
  $$,
  '42501',
  null,
  'an editor cannot change another member role'
);

select throws_ok(
  $$
    select public.remove_trip_member(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '63636363-6363-4363-8363-636363636363'
    )
  $$,
  '42501',
  null,
  'an editor cannot remove another member'
);

set local "request.jwt.claim.sub" = '63636363-6363-4363-8363-636363636363';

select is(
  (select count(*) from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')),
  3::bigint,
  'a viewer can view the member list'
);

select throws_ok(
  $$
    select public.update_trip_member_role(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '62626262-6262-4262-8262-626262626262',
      'viewer'
    )
  $$,
  '42501',
  null,
  'a viewer cannot change another member role'
);

set local "request.jwt.claim.sub" = '64646464-6464-4464-8464-646464646464';

select throws_ok(
  $$
    select * from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')
  $$,
  '42501',
  null,
  'an unrelated account cannot list member profiles'
);

select throws_ok(
  $$
    select public.remove_trip_member(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '63636363-6363-4363-8363-636363636363'
    )
  $$,
  '42501',
  null,
  'an unrelated account cannot remove a member'
);

set local "request.jwt.claim.sub" = '61616161-6161-4161-8161-616161616161';

select is(
  public.remove_trip_member(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    '63636363-6363-4363-8363-636363636363'
  ),
  'removed',
  'the owner can remove a non-owner member'
);

select is(
  public.remove_trip_member(
    'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
    '63636363-6363-4363-8363-636363636363'
  ),
  'member_not_found',
  'removing the same account twice is safely idempotent'
);

set local "request.jwt.claim.sub" = '63636363-6363-4363-8363-636363636363';

select is(
  (select count(*) from public.trips where id = 'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd'),
  0::bigint,
  'a removed member immediately loses access to the trip'
);

select throws_ok(
  $$
    select * from public.list_trip_members('cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd')
  $$,
  '42501',
  null,
  'a removed member immediately loses access to member profiles'
);

reset role;
set local role anon;

select throws_ok(
  $$
    select public.remove_trip_member(
      'cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd',
      '62626262-6262-4262-8262-626262626262'
    )
  $$,
  '42501',
  null,
  'anonymous users cannot execute member removal'
);

select * from finish();

rollback;
