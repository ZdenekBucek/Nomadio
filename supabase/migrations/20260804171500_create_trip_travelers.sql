create table public.trip_travelers (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  avatar_url text,
  contact text check (contact is null or char_length(trim(contact)) between 1 and 320),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trip_travelers is
  'People participating in a trip. A traveler may exist without an application account or data access.';
comment on column public.trip_travelers.user_id is
  'Optional link to an Auth user. This does not grant access to the trip.';

create index trip_travelers_trip_id_sort_order_idx
  on public.trip_travelers (trip_id, sort_order, created_at);
create unique index trip_travelers_trip_id_user_id_key
  on public.trip_travelers (trip_id, user_id)
  where user_id is not null;

alter table public.trip_travelers enable row level security;

revoke all on table public.trip_travelers from anon;
grant select, insert, update, delete on table public.trip_travelers to authenticated;

create policy "Members can read trip travelers"
on public.trip_travelers
for select
to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add unlinked trip travelers"
on public.trip_travelers
for insert
to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and user_id is null
);

create policy "Editors can update trip travelers"
on public.trip_travelers
for update
to authenticated
using ((select public.trip_role(trip_id)) in ('owner', 'editor'))
with check ((select public.trip_role(trip_id)) in ('owner', 'editor'));

create policy "Editors can remove trip travelers"
on public.trip_travelers
for delete
to authenticated
using ((select public.trip_role(trip_id)) in ('owner', 'editor'));

create function public.protect_trip_traveler_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.trip_id is distinct from old.trip_id
    or new.user_id is distinct from old.user_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Traveler system fields cannot be changed' using errcode = '42501';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger protect_trip_traveler_system_fields
before update on public.trip_travelers
for each row
execute function public.protect_trip_traveler_system_fields();

create function public.add_trip_owner_traveler()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trip_travelers (
    trip_id,
    user_id,
    display_name,
    avatar_url,
    sort_order,
    created_by
  )
  select
    new.id,
    new.created_by,
    coalesce(
      nullif(trim(profile.display_name), ''),
      nullif(split_part(profile.email, '@', 1), ''),
      'Cestovatel'
    ),
    profile.avatar_url,
    0,
    new.created_by
  from (select 1) as source
  left join public.profiles as profile on profile.id = new.created_by;

  return new;
end;
$$;

revoke execute on function public.add_trip_owner_traveler() from public;
revoke execute on function public.add_trip_owner_traveler() from anon;
revoke execute on function public.add_trip_owner_traveler() from authenticated;

create trigger on_trip_created_add_owner_traveler
after insert on public.trips
for each row
execute function public.add_trip_owner_traveler();

insert into public.trip_travelers (
  trip_id,
  user_id,
  display_name,
  avatar_url,
  sort_order,
  created_by
)
select
  trip.id,
  trip.created_by,
  coalesce(
    nullif(trim(profile.display_name), ''),
    nullif(split_part(profile.email, '@', 1), ''),
    'Cestovatel'
  ),
  profile.avatar_url,
  0,
  trip.created_by
from public.trips as trip
left join public.profiles as profile on profile.id = trip.created_by
on conflict (trip_id, user_id) where user_id is not null do nothing;

drop function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean
);

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

  return new_trip_id;
end;
$$;

revoke execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean, text[]
) from public;
revoke execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean, text[]
) from anon;
grant execute on function public.create_private_trip(
  text, text, text, text, date, date, text, text, public.trip_status,
  text, text, public.continent_code, boolean, text[]
) to authenticated;
