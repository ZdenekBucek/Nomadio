alter table public.trip_places
  add column attribution text,
  add constraint trip_places_provider_allowed
    check (provider in ('manual', 'mapbox', 'geoapify')),
  add constraint trip_places_attribution_length
    check (attribution is null or char_length(trim(attribution)) between 1 and 300);

create or replace function public.protect_trip_place_system_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.trip_id is distinct from old.trip_id
    or new.provider is distinct from old.provider or new.provider_place_id is distinct from old.provider_place_id
    or new.provider_category is distinct from old.provider_category
    or new.attribution is distinct from old.attribution
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Place system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.protect_trip_place_system_fields() from public, anon, authenticated;

create function public.create_external_trip_place(
  target_trip_id uuid,
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
  place_attribution text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  existing_id uuid;
  new_id uuid := gen_random_uuid();
  normalized_provider text := lower(trim(source_provider));
  normalized_provider_place_id text := trim(source_provider_place_id);
begin
  if normalized_provider not in ('mapbox', 'geoapify') then
    raise exception 'Unsupported external place provider' using errcode = '22023';
  end if;
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
    and provider = normalized_provider
    and provider_place_id = normalized_provider_place_id;
  if existing_id is not null then return existing_id; end if;

  insert into public.trip_places (
    id, trip_id, provider, provider_place_id, name, address, country_code, city,
    latitude, longitude, provider_category, category, category_overridden,
    attribution, created_by
  ) values (
    new_id, target_trip_id, normalized_provider, normalized_provider_place_id,
    trim(place_name), nullif(trim(place_address), ''),
    nullif(upper(trim(place_country_code)), ''), nullif(trim(place_city), ''),
    place_latitude, place_longitude, nullif(trim(place_provider_category), ''),
    place_category, place_category is distinct from suggested_place_category,
    nullif(trim(place_attribution), ''), auth.uid()
  );

  return new_id;
end;
$$;

revoke execute on function public.create_external_trip_place(
  uuid,text,text,text,text,text,text,double precision,double precision,text,
  public.place_category,public.place_category,text
) from public, anon;
grant execute on function public.create_external_trip_place(
  uuid,text,text,text,text,text,text,double precision,double precision,text,
  public.place_category,public.place_category,text
) to authenticated;
