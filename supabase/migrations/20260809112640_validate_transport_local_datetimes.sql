create or replace function public.save_transport_booking(
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
  departure_at_value timestamptz;
  arrival_at_value timestamptz;
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
    departure_at_value := null;
    arrival_at_value := null;

    if (departure_text is not null and departure_text !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')
      or (arrival_text is not null and arrival_text !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$') then
      raise exception 'Segment date and time is invalid' using errcode = '22007';
    end if;

    if departure_text is not null then
      departure_at_value := departure_text::timestamp at time zone trip_timezone;
      if to_char(departure_at_value at time zone trip_timezone, 'YYYY-MM-DD"T"HH24:MI') <> departure_text then
        raise exception 'transport_nonexistent_local_time:departure:%', segment_entry.ordinality - 1 using errcode = '22007';
      end if;
    end if;

    if arrival_text is not null then
      arrival_at_value := arrival_text::timestamp at time zone trip_timezone;
      if to_char(arrival_at_value at time zone trip_timezone, 'YYYY-MM-DD"T"HH24:MI') <> arrival_text then
        raise exception 'transport_nonexistent_local_time:arrival:%', segment_entry.ordinality - 1 using errcode = '22007';
      end if;
    end if;

    insert into public.transport_segments (
      booking_id, departure_place_id, arrival_place_id, departure_at, arrival_at,
      service_number, terminal, platform, seat, baggage, sort_order, notes
    ) values (
      saved_booking_id,
      nullif(trim(segment_entry.value ->> 'departure_place_id'), '')::uuid,
      nullif(trim(segment_entry.value ->> 'arrival_place_id'), '')::uuid,
      departure_at_value,
      arrival_at_value,
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
