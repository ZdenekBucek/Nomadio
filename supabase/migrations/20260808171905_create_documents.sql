create type public.document_category as enum (
  'transport',
  'accommodation',
  'activity',
  'insurance',
  'visa',
  'ticket',
  'receipt',
  'other'
);

create type public.document_linked_entity_type as enum (
  'trip',
  'accommodation',
  'transport',
  'itinerary_item'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  category public.document_category not null default 'other',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  is_important boolean not null default false,
  offline_enabled boolean not null default false,
  linked_entity_type public.document_linked_entity_type,
  linked_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_name_length check (char_length(trim(name)) between 1 and 200),
  constraint documents_storage_path_length check (char_length(storage_path) between 1 and 700),
  constraint documents_mime_type_allowed check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  constraint documents_size_range check (size_bytes between 1 and 10485760),
  constraint documents_link_complete check (
    (linked_entity_type is null and linked_entity_id is null)
    or (linked_entity_type is not null and linked_entity_id is not null)
  )
);

comment on table public.documents is
  'Private trip document metadata. File bytes live in the private trip-documents Storage bucket.';
comment on column public.documents.offline_enabled is
  'User intent for a future offline package. This slice does not synchronize file bytes offline.';
comment on column public.documents.storage_path is
  'Canonical object path: trips/{trip_id}/documents/{document_id}/{safe_filename}.';

create index documents_trip_created_idx
on public.documents (trip_id, created_at desc, id);

create index documents_trip_category_idx
on public.documents (trip_id, category, created_at desc);

create index documents_link_idx
on public.documents (linked_entity_type, linked_entity_id)
where linked_entity_type is not null;

alter table public.documents enable row level security;
revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;

create policy "Trip members can read documents"
on public.documents for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add documents"
on public.documents for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.documents.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update documents"
on public.documents for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.documents.trip_id and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.documents.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove documents"
on public.documents for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.documents.trip_id and trip.status <> 'archived'
  )
);

create function public.validate_document_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_prefix text := 'trips/' || new.trip_id::text || '/documents/' || new.id::text || '/';
begin
  if new.storage_path not like expected_prefix || '%'
    or substring(new.storage_path from char_length(expected_prefix) + 1) = ''
    or substring(new.storage_path from char_length(expected_prefix) + 1) like '%/%' then
    raise exception 'Invalid document storage path' using errcode = '23514';
  end if;

  if new.linked_entity_type = 'trip' and new.linked_entity_id <> new.trip_id then
    raise exception 'Linked trip must match document trip' using errcode = '23514';
  elsif new.linked_entity_type = 'accommodation' and not exists (
    select 1 from public.accommodations as accommodation
    where accommodation.id = new.linked_entity_id and accommodation.trip_id = new.trip_id
  ) then
    raise exception 'Linked accommodation does not belong to document trip' using errcode = '23503';
  elsif new.linked_entity_type = 'transport' and not exists (
    select 1 from public.transport_bookings as booking
    where booking.id = new.linked_entity_id and booking.trip_id = new.trip_id
  ) then
    raise exception 'Linked transport does not belong to document trip' using errcode = '23503';
  elsif new.linked_entity_type = 'itinerary_item' and not exists (
    select 1
    from public.itinerary_items as item
    join public.itinerary_days as day on day.id = item.day_id
    where item.id = new.linked_entity_id
      and item.item_type = 'activity'
      and day.trip_id = new.trip_id
  ) then
    raise exception 'Linked activity does not belong to document trip' using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_document_record() from public, anon, authenticated;

create function public.protect_document_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.uploaded_by is distinct from old.uploaded_by
    or new.storage_path is distinct from old.storage_path
    or new.mime_type is distinct from old.mime_type
    or new.size_bytes is distinct from old.size_bytes
    or new.created_at is distinct from old.created_at then
    raise exception 'Document system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_document_system_fields() from public, anon, authenticated;

create trigger validate_document_record
before insert or update on public.documents
for each row execute function public.validate_document_record();

create trigger protect_document_system_fields
before update on public.documents
for each row execute function public.protect_document_system_fields();

create trigger protect_archived_documents
before insert or update or delete on public.documents
for each row execute function public.protect_archived_trip_content();

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'trip-documents',
  'trip-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
);

create function public.trip_document_storage_trip_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  folders text[] := storage.foldername(object_name);
begin
  if cardinality(folders) <> 4
    or folders[1] <> 'trips'
    or folders[3] <> 'documents'
    or folders[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or folders[4] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;
  return folders[2]::uuid;
end;
$$;

revoke execute on function public.trip_document_storage_trip_id(text) from public, anon;
grant execute on function public.trip_document_storage_trip_id(text) to authenticated;

create policy "Trip members can read document objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'trip-documents'
  and (select public.trip_role(public.trip_document_storage_trip_id(storage.objects.name))) is not null
);

create policy "Editors can upload document objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'trip-documents'
  and (select public.trip_role(public.trip_document_storage_trip_id(storage.objects.name))) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.trip_document_storage_trip_id(storage.objects.name)
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove document objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'trip-documents'
  and (select public.trip_role(public.trip_document_storage_trip_id(storage.objects.name))) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.trip_document_storage_trip_id(storage.objects.name)
      and trip.status <> 'archived'
  )
);
