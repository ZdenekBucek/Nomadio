create type public.itinerary_item_type as enum ('activity', 'transport', 'note');

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.itinerary_days(id) on delete cascade,
  item_type public.itinerary_item_type not null,
  title text not null,
  start_time time without time zone,
  end_time time without time zone,
  notes text,
  sort_order integer not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_items_title_length check (char_length(trim(title)) between 1 and 160),
  constraint itinerary_items_notes_length check (notes is null or char_length(trim(notes)) between 1 and 1200),
  constraint itinerary_items_sort_order_nonnegative check (sort_order >= 0),
  constraint itinerary_items_day_sort_unique unique (day_id, sort_order) deferrable initially immediate
);

create index itinerary_items_day_id_idx on public.itinerary_items (day_id);

alter table public.itinerary_items enable row level security;
grant select, insert, update, delete on table public.itinerary_items to authenticated;

create policy "Trip members can read itinerary items"
on public.itinerary_items for select to authenticated
using (
  exists (
    select 1 from public.itinerary_days as day
    where day.id = public.itinerary_items.day_id
      and (select public.trip_role(day.trip_id)) is not null
  )
);

create policy "Editors can add active itinerary items"
on public.itinerary_items for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.itinerary_days as day
    join public.trips as trip on trip.id = day.trip_id
    where day.id = public.itinerary_items.day_id
      and (select public.trip_role(day.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create policy "Editors can update active itinerary items"
on public.itinerary_items for update to authenticated
using (
  exists (
    select 1 from public.itinerary_days as day
    join public.trips as trip on trip.id = day.trip_id
    where day.id = public.itinerary_items.day_id
      and (select public.trip_role(day.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
)
with check (
  exists (
    select 1 from public.itinerary_days as day
    join public.trips as trip on trip.id = day.trip_id
    where day.id = public.itinerary_items.day_id
      and (select public.trip_role(day.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove active itinerary items"
on public.itinerary_items for delete to authenticated
using (
  exists (
    select 1 from public.itinerary_days as day
    join public.trips as trip on trip.id = day.trip_id
    where day.id = public.itinerary_items.day_id
      and (select public.trip_role(day.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create function public.protect_itinerary_item_system_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.day_id is distinct from old.day_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Itinerary item system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_itinerary_item_system_fields() from public, anon, authenticated;

create trigger protect_itinerary_item_system_fields
before update on public.itinerary_items for each row
execute function public.protect_itinerary_item_system_fields();

create function public.protect_archived_itinerary_item()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_day_id uuid := case when tg_op = 'DELETE' then old.day_id else new.day_id end;
begin
  if exists (
    select 1 from public.itinerary_days as day
    join public.trips as trip on trip.id = day.trip_id
    where day.id = target_day_id and trip.status = 'archived'
  ) then
    raise exception 'Archived trips are read-only' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke execute on function public.protect_archived_itinerary_item() from public, anon, authenticated;

create trigger protect_archived_itinerary_items
before insert or update or delete on public.itinerary_items for each row
execute function public.protect_archived_itinerary_item();

create function public.check_itinerary_item_order()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  affected_day_id uuid := case when tg_op = 'DELETE' then old.day_id else new.day_id end;
  item_count integer;
  minimum_sort integer;
  maximum_sort integer;
begin
  if not exists (select 1 from public.itinerary_days where id = affected_day_id) then return null; end if;
  select count(*)::integer, min(sort_order), max(sort_order)
    into item_count, minimum_sort, maximum_sort
  from public.itinerary_items where day_id = affected_day_id;
  if item_count > 0 and (minimum_sort <> 0 or maximum_sort <> item_count - 1) then
    raise exception 'Itinerary item order must be contiguous from zero' using errcode = '23514';
  end if;
  return null;
end;
$$;

revoke execute on function public.check_itinerary_item_order() from public, anon, authenticated;

create constraint trigger check_itinerary_item_order
after insert or update or delete on public.itinerary_items
deferrable initially deferred for each row execute function public.check_itinerary_item_order();

create function public.create_itinerary_item(
  target_day_id uuid, new_item_type public.itinerary_item_type, item_title text,
  item_start_time time, item_end_time time, item_notes text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  target_trip_id uuid;
  new_id uuid := gen_random_uuid();
  next_sort integer;
begin
  select trip_id into target_trip_id from public.itinerary_days where id = target_day_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  perform 1 from public.itinerary_days where id = target_day_id for update;
  select coalesce(max(sort_order), -1) + 1 into next_sort
  from public.itinerary_items where day_id = target_day_id;
  insert into public.itinerary_items (id, day_id, item_type, title, start_time, end_time, notes, sort_order, created_by)
  values (new_id, target_day_id, new_item_type, trim(item_title), item_start_time, item_end_time, nullif(trim(item_notes), ''), next_sort, auth.uid());
  return new_id;
end;
$$;

revoke execute on function public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text) from public, anon;
grant execute on function public.create_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text) to authenticated;

create function public.update_itinerary_item(
  target_item_id uuid, new_item_type public.itinerary_item_type, item_title text,
  item_start_time time, item_end_time time, item_notes text
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_trip_id uuid;
begin
  select day.trip_id into target_trip_id
  from public.itinerary_items as item join public.itinerary_days as day on day.id = item.day_id
  where item.id = target_item_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  update public.itinerary_items set item_type = new_item_type, title = trim(item_title),
    start_time = item_start_time, end_time = item_end_time, notes = nullif(trim(item_notes), '')
  where id = target_item_id;
  return 'updated';
end;
$$;

revoke execute on function public.update_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text) from public, anon;
grant execute on function public.update_itinerary_item(uuid,public.itinerary_item_type,text,time,time,text) to authenticated;

create function public.move_itinerary_item(target_item_id uuid, direction smallint)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_day_id uuid;
  target_trip_id uuid;
  current_sort integer;
  neighbour_id uuid;
begin
  if direction not in (-1, 1) then raise exception 'Direction must be -1 or 1' using errcode = '22023'; end if;
  select item.day_id, day.trip_id, item.sort_order into target_day_id, target_trip_id, current_sort
  from public.itinerary_items as item join public.itinerary_days as day on day.id = item.day_id
  where item.id = target_item_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can reorder itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  select id into neighbour_id from public.itinerary_items
  where day_id = target_day_id and sort_order = current_sort + direction;
  if neighbour_id is null then return 'boundary'; end if;
  set constraints public.itinerary_items_day_sort_unique deferred;
  update public.itinerary_items set sort_order = current_sort + direction where id = target_item_id;
  update public.itinerary_items set sort_order = current_sort where id = neighbour_id;
  return 'moved';
end;
$$;

revoke execute on function public.move_itinerary_item(uuid,smallint) from public, anon;
grant execute on function public.move_itinerary_item(uuid,smallint) to authenticated;

create function public.remove_itinerary_item(target_item_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_day_id uuid;
  target_trip_id uuid;
  old_sort integer;
begin
  select item.day_id, day.trip_id, item.sort_order into target_day_id, target_trip_id, old_sort
  from public.itinerary_items as item join public.itinerary_days as day on day.id = item.day_id
  where item.id = target_item_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can remove itinerary items' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  set constraints public.itinerary_items_day_sort_unique deferred;
  delete from public.itinerary_items where id = target_item_id;
  update public.itinerary_items set sort_order = sort_order - 1
  where day_id = target_day_id and sort_order > old_sort;
  return 'removed';
end;
$$;

revoke execute on function public.remove_itinerary_item(uuid) from public, anon;
grant execute on function public.remove_itinerary_item(uuid) to authenticated;
