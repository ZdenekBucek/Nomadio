create type public.task_category as enum (
  'preparation',
  'booking',
  'payment',
  'document',
  'packing',
  'during_trip',
  'after_trip',
  'other'
);

create type public.task_status as enum (
  'todo',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.task_priority as enum ('low', 'normal', 'high');

create type public.task_linked_entity_type as enum (
  'accommodation',
  'transport',
  'document',
  'itinerary_item'
);

create type public.packing_category as enum (
  'documents',
  'electronics',
  'clothing',
  'hygiene',
  'medicine',
  'flight',
  'other'
);

create type public.packing_bag_type as enum (
  'cabin',
  'checked',
  'personal',
  'shared'
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  description text,
  category public.task_category not null default 'preparation',
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'normal',
  due_date date,
  assigned_traveler_id uuid references public.trip_travelers(id) on delete set null,
  linked_entity_type public.task_linked_entity_type,
  linked_entity_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(trim(title)) between 1 and 200),
  constraint tasks_description_length check (
    description is null or char_length(trim(description)) between 1 and 4000
  ),
  constraint tasks_link_complete check (
    (linked_entity_type is null and linked_entity_id is null)
    or (linked_entity_type is not null and linked_entity_id is not null)
  )
);

comment on table public.tasks is
  'Trip preparation tasks. Linked entities are stored for future automatic task generation only.';

create table public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  traveler_id uuid references public.trip_travelers(id) on delete set null,
  category public.packing_category not null default 'other',
  name text not null,
  quantity integer,
  bag_type public.packing_bag_type,
  is_packed boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packing_items_name_length check (char_length(trim(name)) between 1 and 160),
  constraint packing_items_quantity_positive check (quantity is null or quantity between 1 and 999)
);

comment on table public.packing_items is
  'Independent packing list rows scoped to one trip and optionally one trip traveler.';

create index tasks_trip_status_due_idx
on public.tasks (trip_id, status, due_date, created_at, id);

create index tasks_assigned_traveler_idx
on public.tasks (assigned_traveler_id)
where assigned_traveler_id is not null;

create index tasks_link_idx
on public.tasks (linked_entity_type, linked_entity_id)
where linked_entity_type is not null;

create index packing_items_trip_category_idx
on public.packing_items (trip_id, category, created_at, id);

create index packing_items_traveler_idx
on public.packing_items (traveler_id)
where traveler_id is not null;

alter table public.tasks enable row level security;
alter table public.packing_items enable row level security;

revoke all on table public.tasks from anon;
revoke all on table public.packing_items from anon;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.packing_items to authenticated;

create policy "Trip members can read tasks"
on public.tasks for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add tasks"
on public.tasks for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.tasks.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update tasks"
on public.tasks for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.tasks.trip_id and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.tasks.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove tasks"
on public.tasks for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.tasks.trip_id and trip.status <> 'archived'
  )
);

create policy "Trip members can read packing items"
on public.packing_items for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add packing items"
on public.packing_items for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.packing_items.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update packing items"
on public.packing_items for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.packing_items.trip_id and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.packing_items.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove packing items"
on public.packing_items for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.packing_items.trip_id and trip.status <> 'archived'
  )
);

create function public.validate_task_references()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.assigned_traveler_id is not null and not exists (
    select 1 from public.trip_travelers as traveler
    where traveler.id = new.assigned_traveler_id and traveler.trip_id = new.trip_id
  ) then
    raise exception 'Assigned traveler does not belong to task trip' using errcode = '23503';
  end if;

  if new.linked_entity_type = 'accommodation' and not exists (
    select 1 from public.accommodations as accommodation
    where accommodation.id = new.linked_entity_id and accommodation.trip_id = new.trip_id
  ) then
    raise exception 'Linked accommodation does not belong to task trip' using errcode = '23503';
  elsif new.linked_entity_type = 'transport' and not exists (
    select 1 from public.transport_bookings as booking
    where booking.id = new.linked_entity_id and booking.trip_id = new.trip_id
  ) then
    raise exception 'Linked transport does not belong to task trip' using errcode = '23503';
  elsif new.linked_entity_type = 'document' and not exists (
    select 1 from public.documents as document
    where document.id = new.linked_entity_id and document.trip_id = new.trip_id
  ) then
    raise exception 'Linked document does not belong to task trip' using errcode = '23503';
  elsif new.linked_entity_type = 'itinerary_item' and not exists (
    select 1
    from public.itinerary_items as item
    join public.itinerary_days as day on day.id = item.day_id
    where item.id = new.linked_entity_id and day.trip_id = new.trip_id
  ) then
    raise exception 'Linked itinerary item does not belong to task trip' using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_task_references() from public, anon, authenticated;

create function public.validate_packing_item_traveler()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.traveler_id is not null and not exists (
    select 1 from public.trip_travelers as traveler
    where traveler.id = new.traveler_id and traveler.trip_id = new.trip_id
  ) then
    raise exception 'Packing traveler does not belong to item trip' using errcode = '23503';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_packing_item_traveler() from public, anon, authenticated;

create function public.protect_task_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Task system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_task_system_fields() from public, anon, authenticated;

create function public.protect_packing_item_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Packing item system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_packing_item_system_fields() from public, anon, authenticated;

create trigger validate_task_references
before insert or update on public.tasks
for each row execute function public.validate_task_references();

create trigger protect_task_system_fields
before update on public.tasks
for each row execute function public.protect_task_system_fields();

create trigger protect_archived_tasks
before insert or update or delete on public.tasks
for each row execute function public.protect_archived_trip_content();

create trigger validate_packing_item_traveler
before insert or update on public.packing_items
for each row execute function public.validate_packing_item_traveler();

create trigger protect_packing_item_system_fields
before update on public.packing_items
for each row execute function public.protect_packing_item_system_fields();

create trigger protect_archived_packing_items
before insert or update or delete on public.packing_items
for each row execute function public.protect_archived_trip_content();
