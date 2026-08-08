create or replace function public.protect_itinerary_item_system_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id
    or (
      new.day_id is distinct from old.day_id
      and current_setting('nomadio.allow_itinerary_item_day_move', true) is distinct from 'on'
    )
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Itinerary item system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.protect_itinerary_item_system_fields() from public, anon, authenticated;

create or replace function public.check_itinerary_item_order()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  affected_day_id uuid;
  item_count integer;
  minimum_sort integer;
  maximum_sort integer;
begin
  for affected_day_id in
    select distinct candidate.day_id
    from (values
      (case when tg_op = 'INSERT' then null::uuid else old.day_id end),
      (case when tg_op = 'DELETE' then null::uuid else new.day_id end)
    ) as candidate(day_id)
    where candidate.day_id is not null
  loop
    if exists (select 1 from public.itinerary_days where id = affected_day_id) then
      select count(*)::integer, min(sort_order), max(sort_order)
        into item_count, minimum_sort, maximum_sort
      from public.itinerary_items where day_id = affected_day_id;
      if item_count > 0 and (minimum_sort <> 0 or maximum_sort <> item_count - 1) then
        raise exception 'Itinerary item order must be contiguous from zero' using errcode = '23514';
      end if;
    end if;
  end loop;
  return null;
end;
$$;
revoke execute on function public.check_itinerary_item_order() from public, anon, authenticated;

create function public.move_itinerary_item_to_day(target_item_id uuid, target_day_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  source_day_id uuid;
  source_trip_id uuid;
  target_trip_id uuid;
  source_sort integer;
  target_sort integer;
begin
  select day.trip_id into target_trip_id
  from public.itinerary_days as day
  where day.id = target_day_id;
  if target_trip_id is null then
    raise exception 'Target itinerary day not found' using errcode = '22023';
  end if;
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can move itinerary items' using errcode = '42501';
  end if;

  perform 1 from public.trips
  where id = target_trip_id and status <> 'archived'
  for update;
  if not found then
    raise exception 'Active trip not found' using errcode = '42501';
  end if;

  select item.day_id, day.trip_id, item.sort_order
    into source_day_id, source_trip_id, source_sort
  from public.itinerary_items as item
  join public.itinerary_days as day on day.id = item.day_id
  where item.id = target_item_id
  for update of item;
  if source_trip_id is null then
    raise exception 'Itinerary item not found' using errcode = '22023';
  end if;
  if source_trip_id is distinct from target_trip_id then
    raise exception 'Target day must belong to the same trip' using errcode = '22023';
  end if;
  if source_day_id is not distinct from target_day_id then
    raise exception 'Target day must differ from source day' using errcode = '22023';
  end if;

  perform 1 from public.itinerary_days as day
  where day.id in (source_day_id, target_day_id)
  order by day.id
  for update;

  set constraints public.itinerary_items_day_sort_unique deferred;
  select coalesce(max(item.sort_order), -1) + 1 into target_sort
  from public.itinerary_items as item
  where item.day_id = target_day_id;

  update public.itinerary_items
  set sort_order = sort_order - 1
  where day_id = source_day_id and sort_order > source_sort;

  perform set_config('nomadio.allow_itinerary_item_day_move', 'on', true);
  update public.itinerary_items
  set day_id = target_day_id, sort_order = target_sort
  where id = target_item_id;
  perform set_config('nomadio.allow_itinerary_item_day_move', 'off', true);

  return 'moved';
end;
$$;

revoke execute on function public.move_itinerary_item_to_day(uuid, uuid) from public, anon;
grant execute on function public.move_itinerary_item_to_day(uuid, uuid) to authenticated;
