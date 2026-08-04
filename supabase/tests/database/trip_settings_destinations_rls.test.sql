begin;

create extension if not exists pgtap with schema extensions;

select plan(39);

insert into auth.users (id, email)
values
  ('71717171-7171-4171-8171-717171717171', 'settings-owner@nomadio.test'),
  ('72727272-7272-4272-8272-727272727272', 'settings-editor@nomadio.test'),
  ('73737373-7373-4373-8373-737373737373', 'settings-viewer@nomadio.test'),
  ('74747474-7474-4474-8474-747474747474', 'settings-other@nomadio.test');

set local role authenticated;
set local "request.jwt.claim.sub" = '71717171-7171-4171-8171-717171717171';

select lives_ok(
  $$
    select public.create_private_trip(
      trip_name => 'Nastavitelná cesta',
      destination_country_code => 'NO',
      destination_country_name => 'Norsko',
      destination_city => 'Bodø',
      destination_continent => 'europe'
    )
  $$,
  'the owner can create a trip for settings tests'
);

select is(
  public.add_trip_member_by_email(
    (select id from public.trips where name = 'Nastavitelná cesta'),
    'settings-editor@nomadio.test',
    'editor'
  ),
  'added',
  'the editor is added for settings tests'
);

select is(
  public.add_trip_member_by_email(
    (select id from public.trips where name = 'Nastavitelná cesta'),
    'settings-viewer@nomadio.test',
    'viewer'
  ),
  'added',
  'the viewer is added for settings tests'
);

select is(
  public.trip_role((select id from public.trips where name = 'Nastavitelná cesta'))::text,
  'owner',
  'the settings caller retains the owner role'
);

select is(
  public.update_trip_settings(
    (select id from public.trips where name = 'Nastavitelná cesta'),
    'Norsko a Švédsko',
    'Severská cesta',
    '2027-06-01',
    '2027-06-14',
    'nok',
    'Europe/Oslo',
    'ready',
    'ocean'
  ),
  'updated',
  'the owner can update basic trip settings'
);

select is(
  (select name from public.trips where name = 'Norsko a Švédsko'),
  'Norsko a Švédsko',
  'the updated trip name is stored'
);

select is(
  (select currency from public.trips where name = 'Norsko a Švédsko'),
  'NOK',
  'the updated currency is normalized'
);

select is(
  (select status::text from public.trips where name = 'Norsko a Švédsko'),
  'ready',
  'the selected planning status is stored'
);

select throws_ok(
  $$
    select public.update_trip_settings(
      (select id from public.trips where name = 'Norsko a Švédsko'),
      'Norsko a Švédsko',
      '',
      '2027-06-01',
      '2027-06-14',
      'NOK',
      'Europe/Oslo',
      'archived',
      'ocean'
    )
  $$,
  '22023',
  null,
  'basic settings cannot archive a trip'
);

select isnt(
  public.add_trip_destination(
    (select id from public.trips where name = 'Norsko a Švédsko'),
    'SE',
    'Švédsko',
    'Kiruna',
    'europe',
    false
  ),
  null::uuid,
  'the owner can add a second destination'
);

select is(
  (select count(*) from public.trip_destinations where trip_id = (select id from public.trips where name = 'Norsko a Švédsko')),
  2::bigint,
  'adding creates exactly one additional destination'
);

select is(
  (select sort_order from public.trip_destinations where country_code = 'SE'),
  1,
  'a new destination is appended to the order'
);

select is(
  public.update_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE'),
    'SE',
    'Švédsko',
    'Abisko',
    'europe',
    false
  ),
  'updated',
  'the owner can edit a destination'
);

select is(
  (select city from public.trip_destinations where country_code = 'SE'),
  'Abisko',
  'the edited destination value is stored'
);

select is(
  public.set_primary_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE')
  ),
  'updated',
  'the owner can select a different primary destination'
);

select is(
  (select count(*) from public.trip_destinations where is_primary),
  1::bigint,
  'selecting a primary keeps exactly one primary destination'
);

select is(
  (select country_code from public.trip_destinations where is_primary),
  'SE',
  'the requested destination becomes primary'
);

select is(
  public.set_primary_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE')
  ),
  'no_change',
  'selecting the current primary is idempotent'
);

select is(
  public.move_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE'),
    -1::smallint
  ),
  'moved',
  'the owner can move a destination up'
);

select is(
  (select sort_order from public.trip_destinations where country_code = 'SE'),
  0,
  'moving up swaps the destination order'
);

select is(
  public.move_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE'),
    -1::smallint
  ),
  'boundary',
  'moving beyond the first position is safely ignored'
);

select is(
  public.remove_trip_destination(
    (select id from public.trip_destinations where country_code = 'NO')
  ),
  'removed',
  'the owner can remove a non-primary destination'
);

select is(
  (select count(*) from public.trip_destinations),
  1::bigint,
  'removal keeps one destination'
);

select is(
  (select sort_order from public.trip_destinations),
  0,
  'removal normalizes the remaining order'
);

select is(
  public.remove_trip_destination((select id from public.trip_destinations)),
  'last_destination',
  'the final destination cannot be removed'
);

set local "request.jwt.claim.sub" = '72727272-7272-4272-8272-727272727272';

select is(
  public.update_trip_settings(
    (select id from public.trips where name = 'Norsko a Švédsko'),
    'Cesta editora',
    'Editor upravil cestu',
    '2027-06-02',
    '2027-06-15',
    'SEK',
    'Europe/Stockholm',
    'planning',
    'forest'
  ),
  'updated',
  'an editor can update basic settings'
);

select isnt(
  public.add_trip_destination(
    (select id from public.trips where name = 'Cesta editora'),
    'FI',
    'Finsko',
    'Rovaniemi',
    'europe',
    false
  ),
  null::uuid,
  'an editor can add a destination'
);

select is(
  public.remove_trip_destination(
    (select id from public.trip_destinations where country_code = 'SE')
  ),
  'primary_destination',
  'a primary destination must be replaced before removal'
);

set local "request.jwt.claim.sub" = '73737373-7373-4373-8373-737373737373';

select throws_ok(
  $$
    select public.update_trip_settings(
      (select id from public.trips where name = 'Cesta editora'),
      'Zakázaná změna', '', null, null, 'CZK', 'Europe/Prague', 'planning', 'violet'
    )
  $$,
  '42501',
  null,
  'a viewer cannot update trip settings'
);

select throws_ok(
  $$
    select public.add_trip_destination(
      (select id from public.trips where name = 'Cesta editora'),
      'DK', 'Dánsko', 'Kodaň', 'europe', false
    )
  $$,
  '42501',
  null,
  'a viewer cannot add a destination'
);

select throws_ok(
  $$
    select public.update_trip_destination(
      (select id from public.trip_destinations where country_code = 'FI'),
      'FI', 'Finsko', 'Helsinky', 'europe', false
    )
  $$,
  '42501',
  null,
  'a viewer cannot edit a destination'
);

select throws_ok(
  $$
    select public.move_trip_destination(
      (select id from public.trip_destinations where country_code = 'FI'),
      -1::smallint
    )
  $$,
  '42501',
  null,
  'a viewer cannot reorder destinations'
);

select throws_ok(
  $$
    select public.remove_trip_destination(
      (select id from public.trip_destinations where country_code = 'FI')
    )
  $$,
  '42501',
  null,
  'a viewer cannot remove destinations'
);

set local "request.jwt.claim.sub" = '74747474-7474-4474-8474-747474747474';

select is(
  (select count(*) from public.trip_destinations),
  0::bigint,
  'an unrelated user cannot read destinations'
);

select throws_ok(
  $$
    select public.update_trip_settings(
      (select id from public.trips where name = 'Cesta editora'),
      'Cizí změna', '', null, null, 'CZK', 'Europe/Prague', 'planning', 'violet'
    )
  $$,
  '42501',
  null,
  'an unrelated user cannot update settings'
);

set local "request.jwt.claim.sub" = '71717171-7171-4171-8171-717171717171';

select throws_ok(
  $$
    update public.trip_destinations
    set sort_order = 8
    where country_code = 'FI';
    set constraints all immediate
  $$,
  '23514',
  null,
  'the deferred invariant rejects a non-contiguous direct order change'
);

select throws_ok(
  $$
    update public.trip_destinations
    set is_primary = false
    where is_primary;
    set constraints all immediate
  $$,
  '23514',
  null,
  'the deferred invariant rejects removing the only primary marker'
);

select throws_ok(
  $$
    update public.trip_destinations
    set trip_id = gen_random_uuid()
    where country_code = 'FI'
  $$,
  '42501',
  null,
  'destination system fields cannot be changed directly'
);

reset role;
set local role anon;

select throws_ok(
  $$
    select public.add_trip_destination(
      gen_random_uuid(), 'DK', 'Dánsko', 'Kodaň', 'europe', false
    )
  $$,
  '42501',
  null,
  'anonymous users cannot execute destination management'
);

select * from finish();

rollback;
