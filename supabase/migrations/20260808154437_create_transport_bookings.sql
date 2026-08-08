create type public.transport_type as enum (
  'flight',
  'train',
  'bus',
  'ferry',
  'rental_car',
  'private_car',
  'taxi_transfer',
  'other'
);

create type public.transport_booking_status as enum (
  'planned',
  'booked',
  'checked_in',
  'completed',
  'cancelled'
);

create type public.transport_payment_status as enum (
  'unknown',
  'unpaid',
  'partially_paid',
  'paid',
  'pay_on_site'
);

create table public.transport_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  transport_type public.transport_type not null default 'other',
  title text not null,
  provider text,
  booking_reference text,
  status public.transport_booking_status not null default 'planned',
  total_price numeric(14, 2),
  paid_amount numeric(14, 2),
  balance_due_date date,
  currency text,
  payment_status public.transport_payment_status not null default 'unknown',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transport_bookings_title_length
    check (char_length(trim(title)) between 1 and 160),
  constraint transport_bookings_provider_length
    check (provider is null or char_length(trim(provider)) between 1 and 160),
  constraint transport_bookings_reference_length
    check (booking_reference is null or char_length(trim(booking_reference)) between 1 and 160),
  constraint transport_bookings_total_price_nonnegative
    check (total_price is null or total_price >= 0),
  constraint transport_bookings_paid_amount_nonnegative
    check (paid_amount is null or paid_amount >= 0),
  constraint transport_bookings_paid_amount_within_total
    check (total_price is null or paid_amount is null or paid_amount <= total_price),
  constraint transport_bookings_currency_format
    check (currency is null or currency ~ '^[A-Z]{3}$'),
  constraint transport_bookings_notes_length
    check (notes is null or char_length(trim(notes)) between 1 and 4000),
  constraint transport_bookings_payment_status_amount_consistency
    check (
      (payment_status <> 'unpaid' or paid_amount is null or paid_amount = 0)
      and (
        payment_status <> 'partially_paid'
        or paid_amount is null
        or total_price is null
        or (paid_amount > 0 and paid_amount < total_price)
      )
      and (
        payment_status <> 'paid'
        or paid_amount is null
        or total_price is null
        or paid_amount = total_price
      )
    )
);

create table public.transport_segments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.transport_bookings(id) on delete cascade,
  departure_place_id uuid references public.trip_places(id) on delete set null,
  arrival_place_id uuid references public.trip_places(id) on delete set null,
  departure_at timestamptz,
  arrival_at timestamptz,
  service_number text,
  terminal text,
  platform text,
  seat text,
  baggage text,
  sort_order integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transport_segments_times_in_order
    check (departure_at is null or arrival_at is null or arrival_at >= departure_at),
  constraint transport_segments_sort_order_nonnegative check (sort_order >= 0),
  constraint transport_segments_service_number_length
    check (service_number is null or char_length(trim(service_number)) between 1 and 80),
  constraint transport_segments_terminal_length
    check (terminal is null or char_length(trim(terminal)) between 1 and 80),
  constraint transport_segments_platform_length
    check (platform is null or char_length(trim(platform)) between 1 and 80),
  constraint transport_segments_seat_length
    check (seat is null or char_length(trim(seat)) between 1 and 160),
  constraint transport_segments_baggage_length
    check (baggage is null or char_length(trim(baggage)) between 1 and 500),
  constraint transport_segments_notes_length
    check (notes is null or char_length(trim(notes)) between 1 and 2000),
  constraint transport_segments_booking_order_unique unique (booking_id, sort_order)
    deferrable initially immediate
);

comment on table public.transport_bookings is
  'Trip-scoped transport reservations. Payment fields are future Budget inputs; itinerary projection is intentionally deferred.';
comment on table public.transport_segments is
  'Ordered legs of one transport booking. Each leg can later become an itinerary item without duplicating its places.';
comment on column public.transport_bookings.paid_amount is
  'Amount already paid in transport_bookings.currency; remaining amount is derived from total_price minus paid_amount.';
comment on column public.transport_bookings.balance_due_date is
  'Optional due date for the remaining transport balance and a future Budget input.';

create index transport_bookings_trip_idx
on public.transport_bookings (trip_id, created_at, id);

create index transport_segments_booking_idx
on public.transport_segments (booking_id, sort_order);

create index transport_segments_departure_place_idx
on public.transport_segments (departure_place_id)
where departure_place_id is not null;

create index transport_segments_arrival_place_idx
on public.transport_segments (arrival_place_id)
where arrival_place_id is not null;

alter table public.transport_bookings enable row level security;
alter table public.transport_segments enable row level security;

revoke all on table public.transport_bookings from anon;
revoke all on table public.transport_segments from anon;
grant select, insert, update, delete on table public.transport_bookings to authenticated;
grant select, insert, update, delete on table public.transport_segments to authenticated;

create policy "Trip members can read transport bookings"
on public.transport_bookings for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add active transport bookings"
on public.transport_bookings for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.transport_bookings.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update active transport bookings"
on public.transport_bookings for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.transport_bookings.trip_id and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.transport_bookings.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove active transport bookings"
on public.transport_bookings for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.transport_bookings.trip_id and trip.status <> 'archived'
  )
);

create policy "Trip members can read transport segments"
on public.transport_segments for select to authenticated
using (
  exists (
    select 1
    from public.transport_bookings as booking
    where booking.id = public.transport_segments.booking_id
      and (select public.trip_role(booking.trip_id)) is not null
  )
);

create policy "Editors can add active transport segments"
on public.transport_segments for insert to authenticated
with check (
  exists (
    select 1
    from public.transport_bookings as booking
    join public.trips as trip on trip.id = booking.trip_id
    where booking.id = public.transport_segments.booking_id
      and (select public.trip_role(booking.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create policy "Editors can update active transport segments"
on public.transport_segments for update to authenticated
using (
  exists (
    select 1
    from public.transport_bookings as booking
    join public.trips as trip on trip.id = booking.trip_id
    where booking.id = public.transport_segments.booking_id
      and (select public.trip_role(booking.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
)
with check (
  exists (
    select 1
    from public.transport_bookings as booking
    join public.trips as trip on trip.id = booking.trip_id
    where booking.id = public.transport_segments.booking_id
      and (select public.trip_role(booking.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove active transport segments"
on public.transport_segments for delete to authenticated
using (
  exists (
    select 1
    from public.transport_bookings as booking
    join public.trips as trip on trip.id = booking.trip_id
    where booking.id = public.transport_segments.booking_id
      and (select public.trip_role(booking.trip_id)) in ('owner', 'editor')
      and trip.status <> 'archived'
  )
);

create function public.check_transport_segment_places()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking_trip_id uuid;
begin
  select booking.trip_id into booking_trip_id
  from public.transport_bookings as booking
  where booking.id = new.booking_id;

  if booking_trip_id is null then
    raise exception 'Transport booking does not exist' using errcode = '23503';
  end if;

  if new.departure_place_id is not null and not exists (
    select 1 from public.trip_places as place
    where place.id = new.departure_place_id and place.trip_id = booking_trip_id
  ) then
    raise exception 'Departure place must belong to the booking trip' using errcode = '23514';
  end if;

  if new.arrival_place_id is not null and not exists (
    select 1 from public.trip_places as place
    where place.id = new.arrival_place_id and place.trip_id = booking_trip_id
  ) then
    raise exception 'Arrival place must belong to the booking trip' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.check_transport_segment_places() from public, anon, authenticated;

create trigger check_transport_segment_places
before insert or update of booking_id, departure_place_id, arrival_place_id
on public.transport_segments
for each row execute function public.check_transport_segment_places();

create function public.protect_transport_booking_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Transport booking system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_transport_booking_system_fields() from public, anon, authenticated;

create trigger protect_transport_booking_system_fields
before update on public.transport_bookings
for each row execute function public.protect_transport_booking_system_fields();

create trigger protect_archived_transport_bookings
before insert or update or delete on public.transport_bookings
for each row execute function public.protect_archived_trip_content();

create function public.protect_transport_segment_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.booking_id is distinct from old.booking_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Transport segment system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_transport_segment_system_fields() from public, anon, authenticated;

create trigger protect_transport_segment_system_fields
before update on public.transport_segments
for each row execute function public.protect_transport_segment_system_fields();

create function public.protect_archived_transport_segment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_booking_id uuid := case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
begin
  if exists (
    select 1
    from public.transport_bookings as booking
    join public.trips as trip on trip.id = booking.trip_id
    where booking.id = target_booking_id and trip.status = 'archived'
  ) then
    raise exception 'Archived trip content is read-only' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_archived_transport_segment() from public, anon, authenticated;

create trigger protect_archived_transport_segments
before insert or update or delete on public.transport_segments
for each row execute function public.protect_archived_transport_segment();

create function public.save_transport_booking(
  target_trip_id uuid,
  target_booking_id uuid,
  booking_transport_type public.transport_type,
  booking_title text,
  booking_provider text,
  booking_reference text,
  booking_status public.transport_booking_status,
  booking_total_price numeric,
  booking_paid_amount numeric,
  booking_balance_due_date date,
  booking_currency text,
  booking_payment_status public.transport_payment_status,
  booking_notes text,
  booking_segments jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_variable
declare
  saved_booking_id uuid;
  trip_timezone text;
  segment_entry record;
  departure_text text;
  arrival_text text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select trip.timezone into trip_timezone
  from public.trips as trip
  where trip.id = target_trip_id
    and trip.status <> 'archived'
    and (select public.trip_role(trip.id)) in ('owner', 'editor')
  for update;

  if trip_timezone is null then
    raise exception 'Trip is not editable' using errcode = '42501';
  end if;

  if jsonb_typeof(booking_segments) <> 'array'
    or jsonb_array_length(booking_segments) < 1
    or jsonb_array_length(booking_segments) > 20 then
    raise exception 'A booking requires between 1 and 20 segments' using errcode = '22023';
  end if;

  if target_booking_id is null then
    insert into public.transport_bookings (
      trip_id, transport_type, title, provider, booking_reference, status,
      total_price, paid_amount, balance_due_date, currency, payment_status, notes, created_by
    ) values (
      target_trip_id, booking_transport_type, booking_title, booking_provider,
      booking_reference, booking_status, booking_total_price, booking_paid_amount,
      booking_balance_due_date, booking_currency, booking_payment_status, booking_notes,
      (select auth.uid())
    ) returning id into saved_booking_id;
  else
    update public.transport_bookings as booking
    set transport_type = booking_transport_type,
        title = booking_title,
        provider = booking_provider,
        booking_reference = booking_reference,
        status = booking_status,
        total_price = booking_total_price,
        paid_amount = booking_paid_amount,
        balance_due_date = booking_balance_due_date,
        currency = booking_currency,
        payment_status = booking_payment_status,
        notes = booking_notes
    where booking.id = target_booking_id and booking.trip_id = target_trip_id
    returning booking.id into saved_booking_id;

    if saved_booking_id is null then
      raise exception 'Transport booking not found' using errcode = 'P0002';
    end if;

    delete from public.transport_segments as segment
    where segment.booking_id = saved_booking_id;
  end if;

  for segment_entry in
    select value, ordinality
    from jsonb_array_elements(booking_segments) with ordinality
  loop
    departure_text := nullif(trim(segment_entry.value ->> 'departure_at'), '');
    arrival_text := nullif(trim(segment_entry.value ->> 'arrival_at'), '');

    if (departure_text is not null and departure_text !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')
      or (arrival_text is not null and arrival_text !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$') then
      raise exception 'Segment date and time is invalid' using errcode = '22007';
    end if;

    insert into public.transport_segments (
      booking_id, departure_place_id, arrival_place_id, departure_at, arrival_at,
      service_number, terminal, platform, seat, baggage, sort_order, notes
    ) values (
      saved_booking_id,
      nullif(trim(segment_entry.value ->> 'departure_place_id'), '')::uuid,
      nullif(trim(segment_entry.value ->> 'arrival_place_id'), '')::uuid,
      case when departure_text is null then null else departure_text::timestamp at time zone trip_timezone end,
      case when arrival_text is null then null else arrival_text::timestamp at time zone trip_timezone end,
      nullif(trim(segment_entry.value ->> 'service_number'), ''),
      nullif(trim(segment_entry.value ->> 'terminal'), ''),
      nullif(trim(segment_entry.value ->> 'platform'), ''),
      nullif(trim(segment_entry.value ->> 'seat'), ''),
      nullif(trim(segment_entry.value ->> 'baggage'), ''),
      segment_entry.ordinality - 1,
      nullif(trim(segment_entry.value ->> 'notes'), '')
    );
  end loop;

  return saved_booking_id;
end;
$$;

revoke execute on function public.save_transport_booking(
  uuid, uuid, public.transport_type, text, text, text,
  public.transport_booking_status, numeric, numeric, date, text,
  public.transport_payment_status, text, jsonb
) from public, anon;
grant execute on function public.save_transport_booking(
  uuid, uuid, public.transport_type, text, text, text,
  public.transport_booking_status, numeric, numeric, date, text,
  public.transport_payment_status, text, jsonb
) to authenticated;

create function public.remove_transport_booking(target_booking_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  removed_id uuid;
begin
  delete from public.transport_bookings as booking
  where booking.id = target_booking_id
    and (select public.trip_role(booking.trip_id)) in ('owner', 'editor')
    and exists (
      select 1 from public.trips as trip
      where trip.id = booking.trip_id and trip.status <> 'archived'
    )
  returning booking.id into removed_id;

  if removed_id is null then
    raise exception 'Transport booking not found or not editable' using errcode = '42501';
  end if;
  return 'removed';
end;
$$;

revoke execute on function public.remove_transport_booking(uuid) from public, anon;
grant execute on function public.remove_transport_booking(uuid) to authenticated;
