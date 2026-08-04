create type public.place_category as enum (
  'accommodation', 'sight', 'activity', 'food', 'transport', 'shopping', 'nature', 'custom'
);

create table public.trip_places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  provider text not null default 'manual',
  provider_place_id text,
  name text not null,
  address text,
  country_code text,
  city text,
  latitude double precision,
  longitude double precision,
  provider_category text,
  category public.place_category not null,
  category_overridden boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_places_provider_length check (char_length(trim(provider)) between 1 and 40),
  constraint trip_places_provider_id_length check (provider_place_id is null or char_length(trim(provider_place_id)) between 1 and 240),
  constraint trip_places_name_length check (char_length(trim(name)) between 1 and 160),
  constraint trip_places_address_length check (address is null or char_length(trim(address)) between 1 and 300),
  constraint trip_places_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint trip_places_city_length check (city is null or char_length(trim(city)) between 1 and 120),
  constraint trip_places_coordinates_pair check ((latitude is null) = (longitude is null)),
  constraint trip_places_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint trip_places_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint trip_places_provider_category_length check (provider_category is null or char_length(trim(provider_category)) between 1 and 160)
);

create unique index trip_places_provider_identity_unique
on public.trip_places (trip_id, provider, provider_place_id)
where provider_place_id is not null;
create index trip_places_trip_id_idx on public.trip_places (trip_id);

alter table public.trip_places enable row level security;
grant select, insert, update, delete on table public.trip_places to authenticated;

create policy "Trip members can read places"
on public.trip_places for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add active trip places"
on public.trip_places for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (select 1 from public.trips as trip where trip.id = public.trip_places.trip_id and trip.status <> 'archived')
);

create policy "Editors can update active trip places"
on public.trip_places for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = public.trip_places.trip_id and trip.status <> 'archived')
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = public.trip_places.trip_id and trip.status <> 'archived')
);

create policy "Editors can remove active trip places"
on public.trip_places for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = public.trip_places.trip_id and trip.status <> 'archived')
);

create function public.protect_trip_place_system_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.trip_id is distinct from old.trip_id
    or new.provider is distinct from old.provider or new.provider_place_id is distinct from old.provider_place_id
    or new.provider_category is distinct from old.provider_category
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Place system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.protect_trip_place_system_fields() from public, anon, authenticated;

create trigger protect_trip_place_system_fields
before update on public.trip_places for each row execute function public.protect_trip_place_system_fields();

create trigger protect_archived_trip_places
before insert or update or delete on public.trip_places for each row
execute function public.protect_archived_trip_content();

create function public.create_manual_trip_place(
  target_trip_id uuid, place_name text, place_address text, place_country_code text,
  place_city text, place_latitude double precision, place_longitude double precision,
  place_category public.place_category
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare new_id uuid := gen_random_uuid();
begin
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create places' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  insert into public.trip_places (
    id, trip_id, provider, name, address, country_code, city, latitude, longitude,
    category, category_overridden, created_by
  ) values (
    new_id, target_trip_id, 'manual', trim(place_name), nullif(trim(place_address), ''),
    nullif(upper(trim(place_country_code)), ''), nullif(trim(place_city), ''),
    place_latitude, place_longitude, place_category, true, auth.uid()
  );
  return new_id;
end;
$$;
revoke execute on function public.create_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category) from public, anon;
grant execute on function public.create_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category) to authenticated;

create function public.update_manual_trip_place(
  target_place_id uuid, place_name text, place_address text, place_country_code text,
  place_city text, place_latitude double precision, place_longitude double precision,
  place_category public.place_category
) returns text language plpgsql security invoker set search_path = '' as $$
declare target_trip_id uuid;
begin
  select trip_id into target_trip_id from public.trip_places where id = target_place_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update places' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  update public.trip_places set name = trim(place_name), address = nullif(trim(place_address), ''),
    country_code = nullif(upper(trim(place_country_code)), ''), city = nullif(trim(place_city), ''),
    latitude = place_latitude, longitude = place_longitude, category = place_category,
    category_overridden = true where id = target_place_id;
  return 'updated';
end;
$$;
revoke execute on function public.update_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category) from public, anon;
grant execute on function public.update_manual_trip_place(uuid,text,text,text,text,double precision,double precision,public.place_category) to authenticated;

alter table public.itinerary_items
  add column place_id uuid references public.trip_places(id) on delete restrict;
create index itinerary_items_place_id_idx on public.itinerary_items (place_id) where place_id is not null;

create function public.remove_trip_place(target_place_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare target_trip_id uuid;
begin
  select trip_id into target_trip_id from public.trip_places where id = target_place_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can remove places' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  if exists (select 1 from public.itinerary_items where place_id = target_place_id) then return 'in_use'; end if;
  delete from public.trip_places where id = target_place_id;
  return 'removed';
end;
$$;
revoke execute on function public.remove_trip_place(uuid) from public, anon;
grant execute on function public.remove_trip_place(uuid) to authenticated;

create function public.ensure_itinerary_item_place_trip()
returns trigger language plpgsql security definer set search_path = '' as $$
declare day_trip_id uuid; place_trip_id uuid;
begin
  if new.place_id is null then return new; end if;
  select trip_id into day_trip_id from public.itinerary_days where id = new.day_id;
  select trip_id into place_trip_id from public.trip_places where id = new.place_id;
  if place_trip_id is null or place_trip_id is distinct from day_trip_id then
    raise exception 'Timeline place must belong to the same trip' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function public.ensure_itinerary_item_place_trip() from public, anon, authenticated;

create trigger ensure_itinerary_item_place_trip
before insert or update of place_id, day_id on public.itinerary_items for each row
execute function public.ensure_itinerary_item_place_trip();

drop function public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text);
create function public.create_itinerary_item(
  target_day_id uuid, new_item_type public.itinerary_item_type, item_title text,
  item_start_time time, item_end_time time, item_notes text, linked_place_id uuid
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare target_trip_id uuid; new_id uuid := gen_random_uuid(); next_sort integer;
begin
  select trip_id into target_trip_id from public.itinerary_days where id = target_day_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  perform 1 from public.itinerary_days where id = target_day_id for update;
  select coalesce(max(sort_order), -1) + 1 into next_sort from public.itinerary_items where day_id = target_day_id;
  insert into public.itinerary_items (id, day_id, item_type, title, start_time, end_time, notes, place_id, sort_order, created_by)
  values (new_id, target_day_id, new_item_type, trim(item_title), item_start_time, item_end_time, nullif(trim(item_notes), ''), linked_place_id, next_sort, auth.uid());
  return new_id;
end;
$$;
revoke execute on function public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid) from public, anon;
grant execute on function public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid) to authenticated;

drop function public.update_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text);
create function public.update_itinerary_item(
  target_item_id uuid, new_item_type public.itinerary_item_type, item_title text,
  item_start_time time, item_end_time time, item_notes text, linked_place_id uuid
) returns text language plpgsql security invoker set search_path = '' as $$
declare target_trip_id uuid;
begin
  select day.trip_id into target_trip_id from public.itinerary_items as item
  join public.itinerary_days as day on day.id = item.day_id where item.id = target_item_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  update public.itinerary_items set item_type = new_item_type, title = trim(item_title),
    start_time = item_start_time, end_time = item_end_time, notes = nullif(trim(item_notes), ''),
    place_id = linked_place_id where id = target_item_id;
  return 'updated';
end;
$$;
revoke execute on function public.update_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid) from public, anon;
grant execute on function public.update_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text,uuid) to authenticated;
