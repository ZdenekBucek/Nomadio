create type public.trip_member_role as enum ('owner', 'editor', 'viewer');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  start_date date,
  end_date date,
  countries text[] not null default '{}',
  cities text[] not null default '{}',
  continent text,
  currency text not null default 'CZK' check (currency ~ '^[A-Z]{3}$'),
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_dates_in_order check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.trip_member_role not null,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

comment on table public.trips is
  'Private travel plans visible only to their members.';
comment on table public.trip_members is
  'Registered-user access and role assignments for a trip.';

create index trip_members_user_id_idx on public.trip_members (user_id);
create index trips_created_by_idx on public.trips (created_by);

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

revoke all on table public.trips from anon;
revoke all on table public.trip_members from anon;
grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.trip_members to authenticated;

create function public.trip_role(target_trip_id uuid)
returns public.trip_member_role
language sql
stable
security definer
set search_path = ''
as $$
  select member.role
  from public.trip_members as member
  where member.trip_id = target_trip_id
    and member.user_id = (select auth.uid())
$$;

revoke execute on function public.trip_role(uuid) from public;
revoke execute on function public.trip_role(uuid) from anon;
grant execute on function public.trip_role(uuid) to authenticated;

create policy "Members can read trips"
on public.trips
for select
to authenticated
using ((select public.trip_role(id)) is not null);

create policy "Users can create private trips"
on public.trips
for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "Editors can update trips"
on public.trips
for update
to authenticated
using ((select public.trip_role(id)) in ('owner', 'editor'))
with check ((select public.trip_role(id)) in ('owner', 'editor'));

create policy "Owners can delete trips"
on public.trips
for delete
to authenticated
using ((select public.trip_role(id)) = 'owner');

create policy "Members can read trip memberships"
on public.trip_members
for select
to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Owners can add trip memberships"
on public.trip_members
for insert
to authenticated
with check ((select public.trip_role(trip_id)) = 'owner');

create policy "Owners can update trip memberships"
on public.trip_members
for update
to authenticated
using ((select public.trip_role(trip_id)) = 'owner')
with check ((select public.trip_role(trip_id)) = 'owner');

create policy "Owners can remove trip memberships"
on public.trip_members
for delete
to authenticated
using ((select public.trip_role(trip_id)) = 'owner');

create function public.add_trip_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

revoke execute on function public.add_trip_owner_membership() from public;
revoke execute on function public.add_trip_owner_membership() from anon;
revoke execute on function public.add_trip_owner_membership() from authenticated;

create trigger on_trip_created_add_owner
after insert on public.trips
for each row
execute function public.add_trip_owner_membership();

create function public.protect_trip_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Trip ownership fields cannot be changed' using errcode = '42501';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger protect_trips_system_fields
before update on public.trips
for each row
execute function public.protect_trip_system_fields();
