create type public.accommodation_type as enum (
  'hotel',
  'apartment',
  'hostel',
  'guesthouse',
  'camping',
  'friends_family',
  'other'
);

create type public.accommodation_payment_status as enum (
  'unknown',
  'unpaid',
  'partially_paid',
  'paid',
  'pay_on_site'
);

create table public.accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.trip_places(id) on delete set null,
  name text not null,
  accommodation_type public.accommodation_type not null default 'hotel',
  check_in_date date not null,
  check_in_time time,
  check_out_date date not null,
  check_out_time time,
  guest_count integer,
  room_type text,
  breakfast_included boolean,
  booking_reference text,
  booking_url text,
  total_price numeric(14, 2),
  currency text,
  payment_status public.accommodation_payment_status not null default 'unknown',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodations_name_length check (char_length(trim(name)) between 1 and 160),
  constraint accommodations_dates_in_order check (check_out_date > check_in_date),
  constraint accommodations_guest_count_positive check (guest_count is null or guest_count > 0),
  constraint accommodations_room_type_length check (room_type is null or char_length(trim(room_type)) between 1 and 160),
  constraint accommodations_booking_reference_length check (booking_reference is null or char_length(trim(booking_reference)) between 1 and 160),
  constraint accommodations_booking_url_length check (booking_url is null or char_length(trim(booking_url)) between 1 and 500),
  constraint accommodations_total_price_nonnegative check (total_price is null or total_price >= 0),
  constraint accommodations_currency_format check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint accommodations_notes_length check (notes is null or char_length(trim(notes)) between 1 and 4000)
);

comment on table public.accommodations is
  'Trip-scoped accommodation reservations; budget, documents and itinerary links are intentionally deferred.';

create index accommodations_trip_dates_idx
on public.accommodations (trip_id, check_in_date, check_out_date);

create index accommodations_place_id_idx
on public.accommodations (place_id)
where place_id is not null;

alter table public.accommodations enable row level security;
revoke all on table public.accommodations from anon;
grant select, insert, update, delete on table public.accommodations to authenticated;

create policy "Trip members can read accommodations"
on public.accommodations for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add active accommodations"
on public.accommodations for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.accommodations.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update active accommodations"
on public.accommodations for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.accommodations.trip_id and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.accommodations.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove active accommodations"
on public.accommodations for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.accommodations.trip_id and trip.status <> 'archived'
  )
);

create function public.check_accommodation_place_trip()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.place_id is not null and not exists (
    select 1
    from public.trip_places as place
    where place.id = new.place_id and place.trip_id = new.trip_id
  ) then
    raise exception 'Accommodation place must belong to the same trip' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.check_accommodation_place_trip() from public, anon, authenticated;

create trigger check_accommodation_place_trip
before insert or update of place_id, trip_id on public.accommodations
for each row execute function public.check_accommodation_place_trip();

create function public.protect_accommodation_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Accommodation system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_accommodation_system_fields() from public, anon, authenticated;

create trigger protect_accommodation_system_fields
before update on public.accommodations
for each row execute function public.protect_accommodation_system_fields();

create trigger protect_archived_accommodations
before insert or update or delete on public.accommodations
for each row execute function public.protect_archived_trip_content();
