create type public.itinerary_day_status as enum ('plan', 'confirmed', 'completed');

create table public.itinerary_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_date date,
  name text not null,
  city text,
  status public.itinerary_day_status not null default 'plan',
  is_reserve boolean not null default false,
  sort_order integer,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_days_name_length check (char_length(trim(name)) between 1 and 120),
  constraint itinerary_days_city_length check (city is null or char_length(trim(city)) between 1 and 120),
  constraint itinerary_days_sort_order_nonnegative check (sort_order is null or sort_order >= 0),
  constraint itinerary_days_undated_order check ((day_date is null) = (sort_order is not null)),
  constraint itinerary_days_trip_sort_unique unique (trip_id, sort_order) deferrable initially immediate
);

create unique index itinerary_days_trip_date_unique
on public.itinerary_days (trip_id, day_date)
where day_date is not null;

create index itinerary_days_trip_id_idx on public.itinerary_days (trip_id);

alter table public.itinerary_days enable row level security;

grant select, insert, update, delete on table public.itinerary_days to authenticated;

create policy "Trip members can read itinerary days"
on public.itinerary_days for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add active itinerary days"
on public.itinerary_days for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (select 1 from public.trips as trip where trip.id = trip_id and trip.status <> 'archived')
);

create policy "Editors can update active itinerary days"
on public.itinerary_days for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = trip_id and trip.status <> 'archived')
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = trip_id and trip.status <> 'archived')
);

create policy "Editors can remove active itinerary days"
on public.itinerary_days for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (select 1 from public.trips as trip where trip.id = trip_id and trip.status <> 'archived')
);

create function public.protect_itinerary_day_system_fields()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Itinerary day system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_itinerary_day_system_fields() from public, anon, authenticated;

create trigger protect_itinerary_day_system_fields
before update on public.itinerary_days for each row
execute function public.protect_itinerary_day_system_fields();

create trigger protect_archived_itinerary_days
before insert or update or delete on public.itinerary_days for each row
execute function public.protect_archived_trip_content();

create function public.check_undated_itinerary_order()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  affected_trip_id uuid := case when tg_op = 'DELETE' then old.trip_id else new.trip_id end;
  item_count integer;
  minimum_sort integer;
  maximum_sort integer;
begin
  if not exists (select 1 from public.trips where id = affected_trip_id) then return null; end if;
  select count(*)::integer, min(sort_order), max(sort_order)
    into item_count, minimum_sort, maximum_sort
  from public.itinerary_days where trip_id = affected_trip_id and day_date is null;
  if item_count > 0 and (minimum_sort <> 0 or maximum_sort <> item_count - 1) then
    raise exception 'Undated itinerary order must be contiguous from zero' using errcode = '23514';
  end if;
  return null;
end;
$$;

revoke execute on function public.check_undated_itinerary_order() from public, anon, authenticated;

create constraint trigger check_undated_itinerary_order
after insert or update or delete on public.itinerary_days
deferrable initially deferred for each row execute function public.check_undated_itinerary_order();

create function public.create_itinerary_day(
  target_trip_id uuid, day_name text, assigned_date date, day_city text,
  day_status public.itinerary_day_status, reserve_day boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  new_id uuid := gen_random_uuid();
  next_sort integer;
begin
  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can create itinerary days' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  if assigned_date is null then
    select coalesce(max(sort_order), -1) + 1 into next_sort
    from public.itinerary_days where trip_id = target_trip_id and day_date is null;
  end if;
  insert into public.itinerary_days (id, trip_id, day_date, name, city, status, is_reserve, sort_order, created_by)
  values (new_id, target_trip_id, assigned_date, trim(day_name), nullif(trim(day_city), ''), day_status, reserve_day, next_sort, auth.uid());
  return new_id;
exception when unique_violation then
  raise exception 'This trip already has a plan for the selected date' using errcode = '23505';
end;
$$;

revoke execute on function public.create_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean) from public, anon;
grant execute on function public.create_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean) to authenticated;

create function public.update_itinerary_day(
  target_day_id uuid, day_name text, assigned_date date, day_city text,
  day_status public.itinerary_day_status, reserve_day boolean
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_trip_id uuid;
  old_date date;
  old_sort integer;
  next_sort integer;
begin
  select trip_id, day_date, sort_order into target_trip_id, old_date, old_sort
  from public.itinerary_days where id = target_day_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update itinerary days' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  set constraints public.itinerary_days_trip_sort_unique deferred;
  if old_date is null and assigned_date is not null then
    update public.itinerary_days set sort_order = sort_order - 1
    where trip_id = target_trip_id and day_date is null and sort_order > old_sort;
    next_sort := null;
  elsif old_date is not null and assigned_date is null then
    select coalesce(max(sort_order), -1) + 1 into next_sort
    from public.itinerary_days where trip_id = target_trip_id and day_date is null;
  else
    next_sort := old_sort;
  end if;
  update public.itinerary_days set day_date = assigned_date, name = trim(day_name),
    city = nullif(trim(day_city), ''), status = day_status, is_reserve = reserve_day,
    sort_order = next_sort where id = target_day_id;
  return 'updated';
exception when unique_violation then
  raise exception 'This trip already has a plan for the selected date' using errcode = '23505';
end;
$$;

revoke execute on function public.update_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean) from public, anon;
grant execute on function public.update_itinerary_day(uuid,text,date,text,public.itinerary_day_status,boolean) to authenticated;

create function public.move_undated_itinerary_day(target_day_id uuid, direction smallint)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_trip_id uuid;
  current_sort integer;
  neighbour_id uuid;
begin
  if direction not in (-1, 1) then raise exception 'Direction must be -1 or 1' using errcode = '22023'; end if;
  select trip_id, sort_order into target_trip_id, current_sort from public.itinerary_days where id = target_day_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can reorder itinerary days' using errcode = '42501';
  end if;
  if current_sort is null then return 'dated'; end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  select id into neighbour_id from public.itinerary_days
  where trip_id = target_trip_id and day_date is null and sort_order = current_sort + direction;
  if neighbour_id is null then return 'boundary'; end if;
  set constraints public.itinerary_days_trip_sort_unique deferred;
  update public.itinerary_days set sort_order = current_sort + direction where id = target_day_id;
  update public.itinerary_days set sort_order = current_sort where id = neighbour_id;
  return 'moved';
end;
$$;

revoke execute on function public.move_undated_itinerary_day(uuid,smallint) from public, anon;
grant execute on function public.move_undated_itinerary_day(uuid,smallint) to authenticated;

create function public.remove_itinerary_day(target_day_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target_trip_id uuid;
  old_sort integer;
begin
  select trip_id, sort_order into target_trip_id, old_sort from public.itinerary_days where id = target_day_id;
  if target_trip_id is null or (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can remove itinerary days' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id and status <> 'archived' for update;
  if not found then raise exception 'Active trip not found' using errcode = '42501'; end if;
  set constraints public.itinerary_days_trip_sort_unique deferred;
  delete from public.itinerary_days where id = target_day_id;
  if old_sort is not null then
    update public.itinerary_days set sort_order = sort_order - 1
    where trip_id = target_trip_id and day_date is null and sort_order > old_sort;
  end if;
  return 'removed';
end;
$$;

revoke execute on function public.remove_itinerary_day(uuid) from public, anon;
grant execute on function public.remove_itinerary_day(uuid) to authenticated;
