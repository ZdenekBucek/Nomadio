alter table public.trips
  add constraint trips_description_length
  check (description is null or char_length(description) <= 600);

alter table public.trip_destinations
  add constraint trip_destinations_country_name_length
  check (country_name is null or char_length(trim(country_name)) <= 120),
  add constraint trip_destinations_city_length
  check (city is null or char_length(trim(city)) <= 120),
  add constraint trip_destinations_trip_sort_unique
  unique (trip_id, sort_order)
  deferrable initially immediate;

drop index public.trip_destinations_trip_id_idx;

create function public.protect_trip_destination_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Destination system fields cannot be changed' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger protect_trip_destination_system_fields
before update on public.trip_destinations
for each row
execute function public.protect_trip_destination_system_fields();

revoke execute on function public.protect_trip_destination_system_fields() from public;
revoke execute on function public.protect_trip_destination_system_fields() from anon;
revoke execute on function public.protect_trip_destination_system_fields() from authenticated;

create function public.check_trip_destination_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_trip_id uuid;
  destination_count integer;
  primary_count integer;
  minimum_sort integer;
  maximum_sort integer;
begin
  affected_trip_id := case when tg_op = 'DELETE' then old.trip_id else new.trip_id end;

  if not exists (
    select 1
    from public.trips as trip
    where trip.id = affected_trip_id
  ) then
    return null;
  end if;

  select
    count(*)::integer,
    count(*) filter (where destination.is_primary)::integer,
    min(destination.sort_order),
    max(destination.sort_order)
  into destination_count, primary_count, minimum_sort, maximum_sort
  from public.trip_destinations as destination
  where destination.trip_id = affected_trip_id;

  if destination_count < 1 then
    raise exception 'A trip must keep at least one destination' using errcode = '23514';
  end if;

  if primary_count <> 1 then
    raise exception 'A trip must have exactly one primary destination' using errcode = '23514';
  end if;

  if minimum_sort <> 0 or maximum_sort <> destination_count - 1 then
    raise exception 'Destination order must be contiguous from zero' using errcode = '23514';
  end if;

  return null;
end;
$$;

create constraint trigger check_trip_destination_invariants
after insert or update or delete on public.trip_destinations
deferrable initially deferred
for each row
execute function public.check_trip_destination_invariants();

revoke execute on function public.check_trip_destination_invariants() from public;
revoke execute on function public.check_trip_destination_invariants() from anon;
revoke execute on function public.check_trip_destination_invariants() from authenticated;

create function public.update_trip_settings(
  target_trip_id uuid,
  trip_name text,
  trip_description text,
  trip_start_date date,
  trip_end_date date,
  trip_currency text,
  trip_timezone text,
  trip_status public.trip_status,
  trip_cover_variant text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_trip_role public.trip_member_role := (select public.trip_role(target_trip_id));
begin
  if caller_trip_role is null then
    raise exception 'Trip membership required' using errcode = '42501';
  end if;

  if caller_trip_role not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update trip settings' using errcode = '42501';
  end if;

  if trip_status not in ('idea', 'planning', 'ready') then
    raise exception 'This status cannot be selected in basic settings' using errcode = '22023';
  end if;

  update public.trips as trip
  set
    name = trim(trip_name),
    description = nullif(trim(trip_description), ''),
    start_date = trip_start_date,
    end_date = trip_end_date,
    currency = upper(trim(trip_currency)),
    timezone = trim(trip_timezone),
    status = trip_status,
    cover_kind = 'gradient',
    cover_variant = trip_cover_variant
  where trip.id = target_trip_id;

  if not found then
    return 'not_found';
  end if;

  return 'updated';
end;
$$;

revoke execute on function public.update_trip_settings(
  uuid, text, text, date, date, text, text, public.trip_status, text
) from public;
revoke execute on function public.update_trip_settings(
  uuid, text, text, date, date, text, text, public.trip_status, text
) from anon;
grant execute on function public.update_trip_settings(
  uuid, text, text, date, date, text, text, public.trip_status, text
) to authenticated;

create function public.add_trip_destination(
  target_trip_id uuid,
  destination_country_code text,
  destination_country_name text,
  destination_city text,
  destination_continent public.continent_code,
  destination_continent_overridden boolean
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_trip_role public.trip_member_role := (select public.trip_role(target_trip_id));
  new_destination_id uuid := gen_random_uuid();
  next_sort_order integer;
begin
  if caller_trip_role is null or caller_trip_role not in ('owner', 'editor') then
    raise exception 'Only owners and editors can add destinations' using errcode = '42501';
  end if;

  perform 1
  from public.trips as trip
  where trip.id = target_trip_id
  for update;

  if not found then
    raise exception 'Trip not found' using errcode = '42501';
  end if;

  select coalesce(max(destination.sort_order), -1) + 1
  into next_sort_order
  from public.trip_destinations as destination
  where destination.trip_id = target_trip_id;

  insert into public.trip_destinations (
    id,
    trip_id,
    country_code,
    country_name,
    city,
    continent,
    continent_overridden,
    is_primary,
    sort_order
  ) values (
    new_destination_id,
    target_trip_id,
    upper(trim(destination_country_code)),
    trim(destination_country_name),
    nullif(trim(destination_city), ''),
    destination_continent,
    destination_continent_overridden,
    false,
    next_sort_order
  );

  return new_destination_id;
end;
$$;

revoke execute on function public.add_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) from public;
revoke execute on function public.add_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) from anon;
grant execute on function public.add_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) to authenticated;

create function public.update_trip_destination(
  target_destination_id uuid,
  destination_country_code text,
  destination_country_name text,
  destination_city text,
  destination_continent public.continent_code,
  destination_continent_overridden boolean
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  destination_trip_id uuid;
begin
  select destination.trip_id
  into destination_trip_id
  from public.trip_destinations as destination
  where destination.id = target_destination_id;

  if destination_trip_id is null then
    raise exception 'Destination not found' using errcode = '42501';
  end if;

  if (select public.trip_role(destination_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update destinations' using errcode = '42501';
  end if;

  update public.trip_destinations as destination
  set
    country_code = upper(trim(destination_country_code)),
    country_name = trim(destination_country_name),
    city = nullif(trim(destination_city), ''),
    continent = destination_continent,
    continent_overridden = destination_continent_overridden
  where destination.id = target_destination_id;

  return 'updated';
end;
$$;

revoke execute on function public.update_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) from public;
revoke execute on function public.update_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) from anon;
grant execute on function public.update_trip_destination(
  uuid, text, text, text, public.continent_code, boolean
) to authenticated;

create function public.set_primary_trip_destination(target_destination_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  destination_trip_id uuid;
  already_primary boolean;
begin
  select destination.trip_id, destination.is_primary
  into destination_trip_id, already_primary
  from public.trip_destinations as destination
  where destination.id = target_destination_id;

  if destination_trip_id is null then
    raise exception 'Destination not found' using errcode = '42501';
  end if;

  if (select public.trip_role(destination_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can select the primary destination' using errcode = '42501';
  end if;

  if already_primary then
    return 'no_change';
  end if;

  perform 1
  from public.trips as trip
  where trip.id = destination_trip_id
  for update;

  update public.trip_destinations as destination
  set is_primary = false
  where destination.trip_id = destination_trip_id
    and destination.is_primary;

  update public.trip_destinations as destination
  set is_primary = true
  where destination.id = target_destination_id;

  return 'updated';
end;
$$;

revoke execute on function public.set_primary_trip_destination(uuid) from public;
revoke execute on function public.set_primary_trip_destination(uuid) from anon;
grant execute on function public.set_primary_trip_destination(uuid) to authenticated;

create function public.move_trip_destination(
  target_destination_id uuid,
  direction smallint
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  destination_trip_id uuid;
  current_sort_order integer;
  neighbour_id uuid;
  neighbour_sort_order integer;
begin
  if direction not in (-1, 1) then
    raise exception 'Direction must be -1 or 1' using errcode = '22023';
  end if;

  select destination.trip_id, destination.sort_order
  into destination_trip_id, current_sort_order
  from public.trip_destinations as destination
  where destination.id = target_destination_id;

  if destination_trip_id is null then
    raise exception 'Destination not found' using errcode = '42501';
  end if;

  if (select public.trip_role(destination_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can reorder destinations' using errcode = '42501';
  end if;

  perform 1
  from public.trips as trip
  where trip.id = destination_trip_id
  for update;

  select destination.id, destination.sort_order
  into neighbour_id, neighbour_sort_order
  from public.trip_destinations as destination
  where destination.trip_id = destination_trip_id
    and (
      (direction = -1 and destination.sort_order < current_sort_order)
      or (direction = 1 and destination.sort_order > current_sort_order)
    )
  order by
    case when direction = -1 then destination.sort_order end desc,
    case when direction = 1 then destination.sort_order end asc
  limit 1;

  if neighbour_id is null then
    return 'boundary';
  end if;

  set constraints public.trip_destinations_trip_sort_unique deferred;

  update public.trip_destinations as destination
  set sort_order = neighbour_sort_order
  where destination.id = target_destination_id;

  update public.trip_destinations as destination
  set sort_order = current_sort_order
  where destination.id = neighbour_id;

  return 'moved';
end;
$$;

revoke execute on function public.move_trip_destination(uuid, smallint) from public;
revoke execute on function public.move_trip_destination(uuid, smallint) from anon;
grant execute on function public.move_trip_destination(uuid, smallint) to authenticated;

create function public.remove_trip_destination(target_destination_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  destination_trip_id uuid;
  destination_is_primary boolean;
  destination_count integer;
begin
  select destination.trip_id, destination.is_primary
  into destination_trip_id, destination_is_primary
  from public.trip_destinations as destination
  where destination.id = target_destination_id;

  if destination_trip_id is null then
    raise exception 'Destination not found' using errcode = '42501';
  end if;

  if (select public.trip_role(destination_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can remove destinations' using errcode = '42501';
  end if;

  perform 1
  from public.trips as trip
  where trip.id = destination_trip_id
  for update;

  select count(*)::integer
  into destination_count
  from public.trip_destinations as destination
  where destination.trip_id = destination_trip_id;

  if destination_count <= 1 then
    return 'last_destination';
  end if;

  if destination_is_primary then
    return 'primary_destination';
  end if;

  set constraints public.trip_destinations_trip_sort_unique deferred;

  delete from public.trip_destinations as destination
  where destination.id = target_destination_id;

  with ordered as (
    select
      destination.id,
      row_number() over (order by destination.sort_order, destination.id) - 1 as new_sort_order
    from public.trip_destinations as destination
    where destination.trip_id = destination_trip_id
  )
  update public.trip_destinations as destination
  set sort_order = ordered.new_sort_order
  from ordered
  where destination.id = ordered.id;

  return 'removed';
end;
$$;

revoke execute on function public.remove_trip_destination(uuid) from public;
revoke execute on function public.remove_trip_destination(uuid) from anon;
grant execute on function public.remove_trip_destination(uuid) to authenticated;
