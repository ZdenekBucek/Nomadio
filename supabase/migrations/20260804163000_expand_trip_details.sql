create type public.trip_status as enum (
  'idea',
  'planning',
  'ready',
  'active',
  'completed',
  'archived'
);

create type public.continent_code as enum (
  'africa',
  'antarctica',
  'asia',
  'europe',
  'north_america',
  'south_america',
  'oceania'
);

create type public.trip_cover_kind as enum ('gradient', 'upload', 'remote');

alter table public.trips
  add column description text,
  add column status public.trip_status not null default 'planning',
  add column timezone text not null default 'Europe/Prague'
    check (char_length(trim(timezone)) between 1 and 80),
  add column archived_at timestamptz,
  add column cover_kind public.trip_cover_kind not null default 'gradient',
  add column cover_variant text not null default 'violet'
    check (cover_variant in ('violet', 'ocean', 'sunset', 'forest')),
  add column cover_storage_path text,
  add column cover_attribution text;

comment on column public.trips.countries is
  'Deprecated compatibility field. New destinations live in trip_destinations.';
comment on column public.trips.cities is
  'Deprecated compatibility field. New destinations live in trip_destinations.';
comment on column public.trips.continent is
  'Deprecated compatibility field. New destinations live in trip_destinations.';

create table public.trip_destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  country_name text,
  city text,
  continent public.continent_code,
  continent_overridden boolean not null default false,
  is_primary boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_destinations_have_place check (
    nullif(trim(country_name), '') is not null
    or nullif(trim(city), '') is not null
  )
);

comment on table public.trip_destinations is
  'Ordered countries and cities belonging to a trip, independent of map providers.';

create index trip_destinations_trip_id_idx
on public.trip_destinations (trip_id, sort_order);

create unique index trip_destinations_one_primary_idx
on public.trip_destinations (trip_id)
where is_primary;

alter table public.trip_destinations enable row level security;
revoke all on table public.trip_destinations from anon;
grant select, insert, update, delete on table public.trip_destinations to authenticated;

create policy "Members can read trip destinations"
on public.trip_destinations
for select
to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add trip destinations"
on public.trip_destinations
for insert
to authenticated
with check ((select public.trip_role(trip_id)) in ('owner', 'editor'));

create policy "Editors can update trip destinations"
on public.trip_destinations
for update
to authenticated
using ((select public.trip_role(trip_id)) in ('owner', 'editor'))
with check ((select public.trip_role(trip_id)) in ('owner', 'editor'));

create policy "Editors can remove trip destinations"
on public.trip_destinations
for delete
to authenticated
using ((select public.trip_role(trip_id)) in ('owner', 'editor'));

insert into public.trip_destinations (
  trip_id,
  country_name,
  city,
  continent,
  is_primary,
  sort_order
)
select
  trip.id,
  trip.countries[position],
  trip.cities[position],
  case lower(trim(trip.continent))
    when 'afrika' then 'africa'::public.continent_code
    when 'africa' then 'africa'::public.continent_code
    when 'antarktida' then 'antarctica'::public.continent_code
    when 'antarctica' then 'antarctica'::public.continent_code
    when 'asie' then 'asia'::public.continent_code
    when 'asia' then 'asia'::public.continent_code
    when 'evropa' then 'europe'::public.continent_code
    when 'europe' then 'europe'::public.continent_code
    when 'severní amerika' then 'north_america'::public.continent_code
    when 'north america' then 'north_america'::public.continent_code
    when 'jižní amerika' then 'south_america'::public.continent_code
    when 'south america' then 'south_america'::public.continent_code
    when 'oceánie' then 'oceania'::public.continent_code
    when 'oceania' then 'oceania'::public.continent_code
    else null
  end,
  position = 1,
  position - 1
from public.trips as trip
cross join lateral generate_series(
  1,
  greatest(cardinality(trip.countries), cardinality(trip.cities))
) as position
where nullif(trim(trip.countries[position]), '') is not null
   or nullif(trim(trip.cities[position]), '') is not null;

create function public.set_trip_destination_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_trip_destinations_updated_at
before update on public.trip_destinations
for each row
execute function public.set_trip_destination_updated_at();

create or replace function public.protect_trip_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Trip ownership fields cannot be changed' using errcode = '42501';
  end if;

  if new.status = 'archived' and old.status <> 'archived' then
    new.archived_at = coalesce(new.archived_at, now());
  elsif new.status <> 'archived' then
    new.archived_at = null;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create function public.create_private_trip(
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
  destination_continent_overridden boolean default false
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

  return new_trip_id;
end;
$$;

revoke execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean
) from public;
revoke execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean
) from anon;
grant execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean
) to authenticated;
