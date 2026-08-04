begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email)
values
  ('51515151-5151-4151-8151-515151515151', 'share-owner@nomadio.test'),
  ('52525252-5252-4252-8252-525252525252', 'share-editor@nomadio.test'),
  ('53535353-5353-4353-8353-535353535353', 'share-viewer@nomadio.test'),
  ('54545454-5454-4454-8454-545454545454', 'share-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '51515151-5151-4151-8151-515151515151';

select lives_ok(
  $$
    insert into public.trips (
      id,
      created_by,
      name
    ) values (
      'abababab-abab-4bab-8bab-abababababab',
      '51515151-5151-4151-8151-515151515151',
      'Shared trip'
    )
  $$,
  'the owner can create a trip for sharing tests'
);

select is(
  public.add_trip_member_by_email(
    'abababab-abab-4bab-8bab-abababababab',
    'missing@nomadio.test',
    'viewer'
  ),
  'user_not_found',
  'an unknown email does not create a pending membership'
);

select is(
  (select count(*) from public.trip_members where trip_id = 'abababab-abab-4bab-8bab-abababababab'),
  1::bigint,
  'an unknown email leaves the trip private'
);

select is(
  public.add_trip_member_by_email(
    'abababab-abab-4bab-8bab-abababababab',
    '  SHARE-EDITOR@NOMADIO.TEST ',
    'editor'
  ),
  'added',
  'the owner can add an existing editor by normalized exact email'
);

select is(
  (
    select role::text
    from public.trip_members
    where trip_id = 'abababab-abab-4bab-8bab-abababababab'
      and user_id = '52525252-5252-4252-8252-525252525252'
  ),
  'editor',
  'the editor role is stored'
);

select is(
  public.add_trip_member_by_email(
    'abababab-abab-4bab-8bab-abababababab',
    'share-editor@nomadio.test',
    'viewer'
  ),
  'already_member',
  'adding the same account twice does not duplicate or silently change its role'
);

select is(
  public.add_trip_member_by_email(
    'abababab-abab-4bab-8bab-abababababab',
    'share-viewer@nomadio.test',
    'viewer'
  ),
  'added',
  'the owner can add an existing viewer'
);

select is(
  (select count(*) from public.trip_members where trip_id = 'abababab-abab-4bab-8bab-abababababab'),
  3::bigint,
  'the trip contains exactly one owner, one editor and one viewer'
);

select throws_ok(
  $$
    select public.add_trip_member_by_email(
      'abababab-abab-4bab-8bab-abababababab',
      'share-other@nomadio.test',
      'owner'
    )
  $$,
  '22023',
  null,
  'direct sharing cannot create another owner'
);

select throws_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    values (
      'abababab-abab-4bab-8bab-abababababab',
      '54545454-5454-4454-8454-545454545454',
      'owner'
    )
  $$,
  '42501',
  null,
  'RLS also prevents direct insertion of another owner'
);

select is_empty(
  $$
    update public.trip_members
    set role = 'viewer'
    where trip_id = 'abababab-abab-4bab-8bab-abababababab'
      and user_id = '51515151-5151-4151-8151-515151515151'
    returning user_id
  $$,
  'the owner membership cannot be downgraded'
);

select is_empty(
  $$
    delete from public.trip_members
    where trip_id = 'abababab-abab-4bab-8bab-abababababab'
      and user_id = '51515151-5151-4151-8151-515151515151'
    returning user_id
  $$,
  'the owner membership cannot be removed'
);

select lives_ok(
  $$
    update public.trip_members
    set role = 'viewer'
    where trip_id = 'abababab-abab-4bab-8bab-abababababab'
      and user_id = '52525252-5252-4252-8252-525252525252'
  $$,
  'the owner can change a non-owner role'
);

set local "request.jwt.claim.sub" = '52525252-5252-4252-8252-525252525252';

select is(
  (select count(*) from public.trips where id = 'abababab-abab-4bab-8bab-abababababab'),
  1::bigint,
  'a directly added member immediately sees the trip'
);

select throws_ok(
  $$
    select public.add_trip_member_by_email(
      'abababab-abab-4bab-8bab-abababababab',
      'share-other@nomadio.test',
      'viewer'
    )
  $$,
  '42501',
  null,
  'a non-owner cannot share the trip'
);

select throws_ok(
  $$
    insert into public.trip_members (trip_id, user_id, role)
    values (
      'abababab-abab-4bab-8bab-abababababab',
      '54545454-5454-4454-8454-545454545454',
      'viewer'
    )
  $$,
  '42501',
  null,
  'a non-owner cannot directly add a member'
);

set local "request.jwt.claim.sub" = '54545454-5454-4454-8454-545454545454';

select is(
  (select count(*) from public.trips where id = 'abababab-abab-4bab-8bab-abababababab'),
  0::bigint,
  'an unrelated user still cannot see the trip'
);

reset role;
set local role anon;

select throws_ok(
  $$
    select public.add_trip_member_by_email(
      'abababab-abab-4bab-8bab-abababababab',
      'share-other@nomadio.test',
      'viewer'
    )
  $$,
  '42501',
  null,
  'anonymous users cannot execute direct sharing'
);

select * from finish();

rollback;
