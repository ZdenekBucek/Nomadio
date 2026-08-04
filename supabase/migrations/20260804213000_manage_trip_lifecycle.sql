alter table public.trips
  add column status_before_archive public.trip_status,
  add constraint trips_status_before_archive_not_archived
    check (status_before_archive is null or status_before_archive <> 'archived');

comment on column public.trips.status_before_archive is
  'Last explicit status preserved while a trip is archived, used for restoration.';

drop policy "Editors can update trips" on public.trips;

create policy "Owners and active-trip editors can update trips"
on public.trips
for update
to authenticated
using (
  (select public.trip_role(id)) = 'owner'
  or (
    (select public.trip_role(id)) = 'editor'
    and status <> 'archived'
  )
)
with check (
  (select public.trip_role(id)) = 'owner'
  or (
    (select public.trip_role(id)) = 'editor'
    and status <> 'archived'
  )
);

drop policy "Editors can add trip destinations" on public.trip_destinations;
drop policy "Editors can update trip destinations" on public.trip_destinations;
drop policy "Editors can remove trip destinations" on public.trip_destinations;

create policy "Editors can add active trip destinations"
on public.trip_destinations
for insert
to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_destinations.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can update active trip destinations"
on public.trip_destinations
for update
to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_destinations.trip_id
      and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_destinations.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove active trip destinations"
on public.trip_destinations
for delete
to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_destinations.trip_id
      and trip.status <> 'archived'
  )
);

drop policy "Editors can add unlinked trip travelers" on public.trip_travelers;
drop policy "Editors can update trip travelers" on public.trip_travelers;
drop policy "Editors can remove trip travelers" on public.trip_travelers;

create policy "Editors can add active trip travelers"
on public.trip_travelers
for insert
to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and user_id is null
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_travelers.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can update active trip travelers"
on public.trip_travelers
for update
to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_travelers.trip_id
      and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_travelers.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove active trip travelers"
on public.trip_travelers
for delete
to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_travelers.trip_id
      and trip.status <> 'archived'
  )
);

drop policy "Owners can add non-owner trip memberships" on public.trip_members;
drop policy "Owners can update non-owner trip memberships" on public.trip_members;
drop policy "Owners can remove non-owner trip memberships" on public.trip_members;

create policy "Owners can add active trip memberships"
on public.trip_members
for insert
to authenticated
with check (
  (select public.trip_role(trip_id)) = 'owner'
  and role in ('editor', 'viewer')
  and user_id <> (
    select trip.created_by
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
  )
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Owners can update active trip memberships"
on public.trip_members
for update
to authenticated
using (
  (select public.trip_role(trip_id)) = 'owner'
  and role <> 'owner'
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
      and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) = 'owner'
  and role in ('editor', 'viewer')
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Owners can remove active trip memberships"
on public.trip_members
for delete
to authenticated
using (
  (select public.trip_role(trip_id)) = 'owner'
  and role <> 'owner'
  and exists (
    select 1
    from public.trips as trip
    where trip.id = public.trip_members.trip_id
      and trip.status <> 'archived'
  )
);

create or replace function public.protect_trip_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  caller_role public.trip_member_role;
begin
  if new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Trip ownership fields cannot be changed' using errcode = '42501';
  end if;

  if caller_id is not null and current_user = 'authenticated' then
    caller_role := (select public.trip_role(old.id));

    if (new.status = 'archived') is distinct from (old.status = 'archived')
      and caller_role is distinct from 'owner' then
      raise exception 'Only the trip owner can change archive state' using errcode = '42501';
    end if;

    if old.status = 'archived' and new.status = 'archived' and (
      to_jsonb(new) - array['updated_at', 'archived_at', 'status_before_archive']
      is distinct from
      to_jsonb(old) - array['updated_at', 'archived_at', 'status_before_archive']
    ) then
      raise exception 'Archived trips are read-only' using errcode = '42501';
    end if;

    if old.status = 'archived' and new.status <> 'archived'
      and new.status is distinct from coalesce(old.status_before_archive, 'planning') then
      raise exception 'Archived trips must be restored to their previous status' using errcode = '22023';
    end if;
  end if;

  if new.status = 'archived' and old.status <> 'archived' then
    new.status_before_archive = old.status;
    new.archived_at = now();
  elsif old.status = 'archived' and new.status <> 'archived' then
    new.status_before_archive = null;
    new.archived_at = null;
  elsif new.status = 'archived' then
    new.status_before_archive = old.status_before_archive;
    new.archived_at = old.archived_at;
  else
    new.status_before_archive = null;
    new.archived_at = null;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create function public.protect_archived_trip_content()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_trip_id uuid := case when tg_op = 'DELETE' then old.trip_id else new.trip_id end;
begin
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if exists (
    select 1
    from public.trips as trip
    where trip.id = target_trip_id
      and trip.status = 'archived'
  ) then
    raise exception 'Archived trips are read-only' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_archived_trip_content() from public;
revoke execute on function public.protect_archived_trip_content() from anon;
revoke execute on function public.protect_archived_trip_content() from authenticated;

create trigger protect_archived_trip_destinations
before insert or update or delete on public.trip_destinations
for each row execute function public.protect_archived_trip_content();

create trigger protect_archived_trip_travelers
before insert or update or delete on public.trip_travelers
for each row execute function public.protect_archived_trip_content();

create trigger protect_archived_trip_members
before insert or update or delete on public.trip_members
for each row execute function public.protect_archived_trip_content();

create function public.archive_trip(target_trip_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_status public.trip_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can archive a trip' using errcode = '42501';
  end if;

  select trip.status into current_status
  from public.trips as trip
  where trip.id = target_trip_id;

  if current_status = 'archived' then
    return 'already_archived';
  end if;

  update public.trips as trip
  set status = 'archived'
  where trip.id = target_trip_id;

  return 'archived';
end;
$$;

create function public.restore_trip(target_trip_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_status public.trip_status;
  restored_status public.trip_status;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can restore a trip' using errcode = '42501';
  end if;

  select trip.status, coalesce(trip.status_before_archive, 'planning')
  into current_status, restored_status
  from public.trips as trip
  where trip.id = target_trip_id;

  if current_status <> 'archived' then
    return 'not_archived';
  end if;

  update public.trips as trip
  set status = restored_status
  where trip.id = target_trip_id;

  return 'restored';
end;
$$;

create function public.delete_trip(target_trip_id uuid, confirmation_name text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_name text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (select public.trip_role(target_trip_id)) is distinct from 'owner' then
    raise exception 'Only the trip owner can delete a trip' using errcode = '42501';
  end if;

  select trip.name into current_name
  from public.trips as trip
  where trip.id = target_trip_id;

  if trim(confirmation_name) is distinct from current_name then
    return 'name_mismatch';
  end if;

  delete from public.trips as trip
  where trip.id = target_trip_id;

  return 'deleted';
end;
$$;

revoke execute on function public.archive_trip(uuid) from public;
revoke execute on function public.archive_trip(uuid) from anon;
grant execute on function public.archive_trip(uuid) to authenticated;

revoke execute on function public.restore_trip(uuid) from public;
revoke execute on function public.restore_trip(uuid) from anon;
grant execute on function public.restore_trip(uuid) to authenticated;

revoke execute on function public.delete_trip(uuid, text) from public;
revoke execute on function public.delete_trip(uuid, text) from anon;
grant execute on function public.delete_trip(uuid, text) to authenticated;

comment on function public.archive_trip(uuid) is
  'Archives a trip while preserving its previous explicit status. Owner only.';
comment on function public.restore_trip(uuid) is
  'Restores an archived trip to its previous explicit status. Owner only.';
comment on function public.delete_trip(uuid, text) is
  'Permanently deletes a trip and cascading related records after exact name confirmation. Owner only.';
