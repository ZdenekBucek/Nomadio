create function public.add_place_to_itinerary_day(
  target_trip_id uuid,
  target_day_id uuid,
  source_provider text,
  source_provider_place_id text,
  place_name text,
  place_address text,
  place_country_code text,
  place_city text,
  place_latitude double precision,
  place_longitude double precision,
  place_provider_category text,
  place_category public.place_category,
  suggested_place_category public.place_category,
  place_attribution text,
  item_start_time time,
  item_end_time time,
  item_notes text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  actual_trip_id uuid;
  linked_place_id uuid;
  new_place_id uuid := gen_random_uuid();
  new_item_id uuid := gen_random_uuid();
  next_sort integer;
  normalized_provider text := lower(trim(source_provider));
  normalized_provider_place_id text := nullif(trim(source_provider_place_id), '');
begin
  if normalized_provider not in ('manual', 'mapbox', 'geoapify') then
    raise exception 'Unsupported place provider' using errcode = '22023';
  end if;

  select day.trip_id into actual_trip_id
  from public.itinerary_days as day
  where day.id = target_day_id;
  if actual_trip_id is null or actual_trip_id is distinct from target_trip_id then
    raise exception 'Itinerary day must belong to the target trip' using errcode = '22023';
  end if;
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can add places to itinerary days' using errcode = '42501';
  end if;

  perform 1 from public.trips
  where id = target_trip_id and status <> 'archived'
  for update;
  if not found then
    raise exception 'Active trip not found' using errcode = '42501';
  end if;
  perform 1 from public.itinerary_days
  where id = target_day_id and trip_id = target_trip_id
  for update;
  if not found then
    raise exception 'Itinerary day must belong to the target trip' using errcode = '22023';
  end if;

  if normalized_provider = 'manual' then
    if normalized_provider_place_id is not null
      or nullif(trim(place_provider_category), '') is not null
      or nullif(trim(place_attribution), '') is not null
      or (place_latitude is null) is distinct from (place_longitude is null) then
      raise exception 'Invalid manual place data' using errcode = '22023';
    end if;
  else
    if normalized_provider_place_id is null
      or nullif(trim(place_provider_category), '') is null
      or nullif(trim(place_attribution), '') is null
      or place_latitude is null or place_longitude is null then
      raise exception 'Incomplete external place data' using errcode = '22023';
    end if;
    if normalized_provider = 'geoapify'
      and trim(place_attribution) <> 'Powered by Geoapify · © OpenStreetMap contributors' then
      raise exception 'Invalid Geoapify attribution' using errcode = '22023';
    end if;

    select place.id into linked_place_id
    from public.trip_places as place
    where place.trip_id = target_trip_id
      and place.provider = normalized_provider
      and place.provider_place_id = normalized_provider_place_id;
  end if;

  if linked_place_id is null then
    insert into public.trip_places (
      id, trip_id, provider, provider_place_id, name, address, country_code, city,
      latitude, longitude, provider_category, category, category_overridden,
      attribution, created_by
    ) values (
      new_place_id, target_trip_id, normalized_provider,
      case when normalized_provider = 'manual' then null else normalized_provider_place_id end,
      trim(place_name), nullif(trim(place_address), ''),
      nullif(upper(trim(place_country_code)), ''), nullif(trim(place_city), ''),
      place_latitude, place_longitude,
      case when normalized_provider = 'manual' then null else nullif(trim(place_provider_category), '') end,
      place_category,
      case when normalized_provider = 'manual' then true else place_category is distinct from suggested_place_category end,
      case when normalized_provider = 'manual' then null else nullif(trim(place_attribution), '') end,
      auth.uid()
    );
    linked_place_id := new_place_id;
  end if;

  select coalesce(max(item.sort_order), -1) + 1 into next_sort
  from public.itinerary_items as item
  where item.day_id = target_day_id;

  insert into public.itinerary_items (
    id, day_id, item_type, title, start_time, end_time, notes, place_id,
    sort_order, created_by
  ) values (
    new_item_id, target_day_id, 'activity', trim(place_name), item_start_time,
    item_end_time, nullif(trim(item_notes), ''), linked_place_id, next_sort,
    auth.uid()
  );

  return new_item_id;
end;
$$;

revoke execute on function public.add_place_to_itinerary_day(
  uuid,uuid,text,text,text,text,text,text,double precision,double precision,text,
  public.place_category,public.place_category,text,time,time,text
) from public, anon;
grant execute on function public.add_place_to_itinerary_day(
  uuid,uuid,text,text,text,text,text,text,double precision,double precision,text,
  public.place_category,public.place_category,text,time,time,text
) to authenticated;
