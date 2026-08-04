create function public.create_mapbox_trip_place(
  target_trip_id uuid,
  source_provider_place_id text,
  place_name text,
  place_address text,
  place_country_code text,
  place_city text,
  place_latitude double precision,
  place_longitude double precision,
  place_provider_category text,
  place_category public.place_category
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  existing_id uuid;
  new_id uuid := gen_random_uuid();
begin
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create places' using errcode = '42501';
  end if;

  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then
    raise exception 'Active trip not found' using errcode = '42501';
  end if;

  select id into existing_id
  from public.trip_places
  where trip_id = target_trip_id
    and provider = 'mapbox'
    and provider_place_id = trim(source_provider_place_id);

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.trip_places (
    id, trip_id, provider, provider_place_id, name, address, country_code, city,
    latitude, longitude, provider_category, category, category_overridden, created_by
  ) values (
    new_id, target_trip_id, 'mapbox', trim(source_provider_place_id), trim(place_name),
    nullif(trim(place_address), ''), nullif(upper(trim(place_country_code)), ''),
    nullif(trim(place_city), ''), place_latitude, place_longitude,
    nullif(trim(place_provider_category), ''), place_category, false, auth.uid()
  );

  return new_id;
end;
$$;

revoke execute on function public.create_mapbox_trip_place(
  uuid,text,text,text,text,text,double precision,double precision,text,public.place_category
) from public, anon;
grant execute on function public.create_mapbox_trip_place(
  uuid,text,text,text,text,text,double precision,double precision,text,public.place_category
) to authenticated;
