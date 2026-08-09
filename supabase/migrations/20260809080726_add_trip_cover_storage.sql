insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-covers',
  'trip-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.trip_cover_storage_trip_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  folders text[] := storage.foldername(object_name);
begin
  if cardinality(folders) <> 3
    or folders[1] <> 'trips'
    or folders[3] <> 'cover'
    or folders[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or object_name !~ '^trips/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/cover/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$' then
    return null;
  end if;
  return folders[2]::uuid;
end;
$$;

revoke execute on function public.trip_cover_storage_trip_id(text) from public, anon;
grant execute on function public.trip_cover_storage_trip_id(text) to authenticated;

create policy "Trip members can read cover objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'trip-covers'
  and (select public.trip_role(public.trip_cover_storage_trip_id(storage.objects.name))) is not null
);

create policy "Editors can upload cover objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'trip-covers'
  and (select public.trip_role(public.trip_cover_storage_trip_id(storage.objects.name))) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.trip_cover_storage_trip_id(storage.objects.name)
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove cover objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'trip-covers'
  and (select public.trip_role(public.trip_cover_storage_trip_id(storage.objects.name))) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.trip_cover_storage_trip_id(storage.objects.name)
      and trip.status <> 'archived'
  )
);

create function public.set_trip_cover_upload(target_trip_id uuid, target_storage_path text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update a trip cover' using errcode = '42501';
  end if;

  if public.trip_cover_storage_trip_id(target_storage_path) is distinct from target_trip_id then
    raise exception 'Invalid trip cover storage path' using errcode = '22023';
  end if;

  update public.trips as trip
  set cover_kind = 'upload', cover_storage_path = target_storage_path, cover_url = null, cover_attribution = null
  where trip.id = target_trip_id and trip.status <> 'archived';

  if not found then
    raise exception 'Archived or missing trip cannot be updated' using errcode = '42501';
  end if;
  return 'updated';
end;
$$;

create function public.remove_trip_cover(target_trip_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can remove a trip cover' using errcode = '42501';
  end if;

  update public.trips as trip
  set cover_kind = 'gradient', cover_storage_path = null, cover_url = null, cover_attribution = null
  where trip.id = target_trip_id and trip.status <> 'archived';

  if not found then
    raise exception 'Archived or missing trip cannot be updated' using errcode = '42501';
  end if;
  return 'updated';
end;
$$;

revoke execute on function public.set_trip_cover_upload(uuid, text) from public, anon;
revoke execute on function public.remove_trip_cover(uuid) from public, anon;
grant execute on function public.set_trip_cover_upload(uuid, text) to authenticated;
grant execute on function public.remove_trip_cover(uuid) to authenticated;

create or replace function public.update_trip_settings(
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
  if caller_trip_role not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update trip settings' using errcode = '42501';
  end if;
  if trip_status not in ('idea', 'planning', 'ready') then
    raise exception 'This status cannot be selected in basic settings' using errcode = '22023';
  end if;

  update public.trips as trip
  set name = trim(trip_name), description = nullif(trim(trip_description), ''),
      start_date = trip_start_date, end_date = trip_end_date, currency = upper(trim(trip_currency)),
      timezone = trim(trip_timezone), status = trip_status, cover_variant = trip_cover_variant
  where trip.id = target_trip_id and trip.status <> 'archived';
  if not found then
    raise exception 'Archived or missing trip cannot be updated' using errcode = '42501';
  end if;
  return 'updated';
end;
$$;
