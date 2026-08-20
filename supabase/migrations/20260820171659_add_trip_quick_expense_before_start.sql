alter table public.trips
  add column quick_expense_before_start_enabled boolean not null default false;

comment on column public.trips.quick_expense_before_start_enabled is
  'Allows an editable future trip to appear in the global Quick Expense action before its start date.';

create function public.set_trip_quick_expense_before_start(
  target_trip_id uuid,
  enabled boolean
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if enabled is null then
    raise exception 'Quick Expense preference must be true or false' using errcode = '22023';
  end if;

  if (select public.trip_role(target_trip_id)) not in ('owner', 'editor') then
    raise exception 'Only owners and editors can update Quick Expense settings' using errcode = '42501';
  end if;

  update public.trips as trip
  set quick_expense_before_start_enabled = enabled
  where trip.id = target_trip_id
    and trip.status <> 'archived';

  if not found then
    raise exception 'Archived or missing trip cannot be updated' using errcode = '42501';
  end if;

  return 'updated';
end;
$$;

revoke execute on function public.set_trip_quick_expense_before_start(uuid, boolean) from public, anon;
grant execute on function public.set_trip_quick_expense_before_start(uuid, boolean) to authenticated;
