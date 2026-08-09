create or replace function public.create_private_trip(
  trip_name text,
  destination_country_code text,
  destination_country_name text,
  trip_description text default null,
  trip_start_date date default null,
  trip_end_date date default null,
  trip_currency text default 'CZK',
  trip_timezone text default 'Europe/Prague',
  trip_status public.trip_status default 'planning',
  trip_cover_variant text default 'violet',
  destination_city text default null,
  destination_continent public.continent_code default null,
  destination_continent_overridden boolean default false,
  traveler_names text[] default '{}'
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  new_trip_id uuid := gen_random_uuid();
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if coalesce(cardinality(traveler_names), 0) > 10 then
    raise exception 'At most 10 additional travelers are allowed' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(traveler_names, '{}')) as traveler(raw_name)
    where char_length(trim(traveler.raw_name)) > 120
  ) then
    raise exception 'Traveler name is too long' using errcode = '22023';
  end if;

  insert into public.trips (
    id,
    created_by,
    name,
    description,
    start_date,
    end_date,
    currency,
    timezone,
    status,
    cover_kind,
    cover_variant
  )
  values (
    new_trip_id,
    current_user_id,
    trim(trip_name),
    nullif(trim(trip_description), ''),
    trip_start_date,
    trip_end_date,
    upper(trim(trip_currency)),
    trim(trip_timezone),
    trip_status,
    'gradient',
    trip_cover_variant
  );

  insert into public.trip_destinations (
    trip_id,
    country_code,
    country_name,
    city,
    continent,
    continent_overridden,
    is_primary,
    sort_order
  )
  values (
    new_trip_id,
    upper(trim(destination_country_code)),
    trim(destination_country_name),
    nullif(trim(destination_city), ''),
    destination_continent,
    destination_continent_overridden,
    true,
    0
  );

  insert into public.trip_travelers (
    trip_id,
    display_name,
    sort_order,
    created_by
  )
  select
    new_trip_id,
    normalized.display_name,
    normalized.position::integer,
    current_user_id
  from (
    select distinct on (lower(trim(traveler.raw_name)))
      trim(traveler.raw_name) as display_name,
      traveler.position
    from unnest(coalesce(traveler_names, '{}')) with ordinality
      as traveler(raw_name, position)
    where nullif(trim(traveler.raw_name), '') is not null
    order by lower(trim(traveler.raw_name)), traveler.position
  ) as normalized;

  -- Date-only values are expanded with integer offsets, avoiding timezone
  -- conversion and creating one dated day for each inclusive trip date.
  if trip_start_date is not null and trip_end_date is not null then
    insert into public.itinerary_days (
      trip_id, day_date, name, city, status, is_reserve, sort_order, created_by
    )
    select
      new_trip_id,
      trip_start_date + day_offset,
      format('Den %s', day_offset + 1),
      null,
      'plan'::public.itinerary_day_status,
      false,
      null,
      current_user_id
    from generate_series(0, trip_end_date - trip_start_date) as day_offset;
  end if;

  return new_trip_id;
end;
$$;
