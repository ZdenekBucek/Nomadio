create function public.create_map_selected_manual_place(
  target_trip_id uuid,
  target_day_id uuid,
  add_to_day boolean,
  place_name text,
  place_category public.place_category,
  place_notes text,
  place_latitude double precision,
  place_longitude double precision,
  place_address text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  new_place_id uuid := gen_random_uuid();
  new_item_id uuid := gen_random_uuid();
  next_sort integer;
begin
  if char_length(trim(place_name)) not between 1 and 160
    or place_latitude is null or place_latitude not between -90 and 90
    or place_longitude is null or place_longitude not between -180 and 180
    or (nullif(trim(place_notes), '') is not null and char_length(trim(place_notes)) > 1200)
    or (nullif(trim(place_address), '') is not null and char_length(trim(place_address)) > 300) then
    raise exception 'Invalid map-selected place data' using errcode = '22023';
  end if;
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create places' using errcode = '42501';
  end if;

  perform 1 from public.trips
  where id = target_trip_id and status <> 'archived'
  for update;
  if not found then
    raise exception 'Active trip not found' using errcode = '42501';
  end if;

  if add_to_day then
    if target_day_id is null then
      raise exception 'Target itinerary day is required' using errcode = '22023';
    end if;
    perform 1 from public.itinerary_days
    where id = target_day_id and trip_id = target_trip_id
    for update;
    if not found then
      raise exception 'Itinerary day must belong to the target trip' using errcode = '22023';
    end if;
  elsif target_day_id is not null then
    raise exception 'Target day is only allowed when adding to a day' using errcode = '22023';
  end if;

  insert into public.trip_places (
    id, trip_id, provider, provider_place_id, name, address, latitude, longitude, notes,
    category, category_overridden, created_by
  ) values (
    new_place_id, target_trip_id, 'manual', null, trim(place_name), nullif(trim(place_address), ''),
    place_latitude, place_longitude, nullif(trim(place_notes), ''),
    place_category, true, auth.uid()
  );

  if add_to_day then
    select coalesce(max(item.sort_order), -1) + 1 into next_sort
    from public.itinerary_items as item
    where item.day_id = target_day_id;

    insert into public.itinerary_items (
      id, day_id, item_type, title, notes, place_id, sort_order, created_by
    ) values (
      new_item_id, target_day_id, 'activity', trim(place_name),
      nullif(trim(place_notes), ''), new_place_id, next_sort, auth.uid()
    );
  end if;

  return new_place_id;
end;
$$;

revoke execute on function public.create_map_selected_manual_place(
  uuid,uuid,boolean,text,public.place_category,text,double precision,double precision,text
) from public, anon;
grant execute on function public.create_map_selected_manual_place(
  uuid,uuid,boolean,text,public.place_category,text,double precision,double precision,text
) to authenticated;
