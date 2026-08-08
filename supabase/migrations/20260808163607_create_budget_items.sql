create type public.budget_source_type as enum (
  'manual',
  'accommodation',
  'transport'
);

create type public.budget_category as enum (
  'accommodation',
  'transport',
  'food',
  'local_transport',
  'activities',
  'rental_car',
  'insurance',
  'shopping',
  'other'
);

create type public.budget_payment_status as enum (
  'unknown',
  'unpaid',
  'partially_paid',
  'paid',
  'pay_on_site'
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  source_type public.budget_source_type not null default 'manual',
  source_id uuid,
  category public.budget_category not null,
  name text not null,
  estimated_amount numeric(14, 2),
  actual_amount numeric(14, 2),
  paid_amount numeric(14, 2),
  balance_due_date date,
  currency text not null,
  payment_status public.budget_payment_status not null default 'unknown',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_items_name_length
    check (char_length(trim(name)) between 1 and 160),
  constraint budget_items_estimated_amount_nonnegative
    check (estimated_amount is null or estimated_amount >= 0),
  constraint budget_items_actual_amount_nonnegative
    check (actual_amount is null or actual_amount >= 0),
  constraint budget_items_paid_amount_nonnegative
    check (paid_amount is null or paid_amount >= 0),
  constraint budget_items_paid_amount_has_base
    check (
      paid_amount is null
      or paid_amount = 0
      or coalesce(actual_amount, estimated_amount) is not null
    ),
  constraint budget_items_paid_amount_within_base
    check (
      coalesce(actual_amount, estimated_amount) is null
      or paid_amount is null
      or paid_amount <= coalesce(actual_amount, estimated_amount)
    ),
  constraint budget_items_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint budget_items_notes_length
    check (notes is null or char_length(trim(notes)) between 1 and 4000),
  constraint budget_items_payment_status_amount_consistency
    check (
      (payment_status <> 'unpaid' or paid_amount is null or paid_amount = 0)
      and (
        payment_status <> 'partially_paid'
        or (
          coalesce(actual_amount, estimated_amount) is not null
          and paid_amount > 0
          and paid_amount < coalesce(actual_amount, estimated_amount)
        )
      )
      and (
        payment_status <> 'paid'
        or (
          coalesce(actual_amount, estimated_amount) is not null
          and paid_amount = coalesce(actual_amount, estimated_amount)
        )
      )
    )
);

comment on table public.budget_items is
  'Manual trip budget items. Accommodation and transport costs are composed at read time and are not copied here.';
comment on column public.budget_items.source_id is
  'Reserved for a future explicit source link. The current authenticated write policy only permits manual rows with a null source_id.';
comment on column public.budget_items.paid_amount is
  'Amount already paid. Remaining amount is derived from actual_amount, or estimated_amount when actual is unknown.';

create index budget_items_trip_idx
on public.budget_items (trip_id, created_at, id);

create index budget_items_trip_due_idx
on public.budget_items (trip_id, balance_due_date)
where balance_due_date is not null;

create unique index budget_items_external_source_unique
on public.budget_items (trip_id, source_type, source_id)
where source_type <> 'manual' and source_id is not null;

alter table public.budget_items enable row level security;

revoke all on table public.budget_items from anon;
grant select, insert, update, delete on table public.budget_items to authenticated;

create policy "Trip members can read budget items"
on public.budget_items for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add manual budget items"
on public.budget_items for insert to authenticated
with check (
  source_type = 'manual'
  and source_id is null
  and (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_items.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can update manual budget items"
on public.budget_items for update to authenticated
using (
  source_type = 'manual'
  and (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_items.trip_id and trip.status <> 'archived'
  )
)
with check (
  source_type = 'manual'
  and source_id is null
  and (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_items.trip_id and trip.status <> 'archived'
  )
);

create policy "Editors can remove manual budget items"
on public.budget_items for delete to authenticated
using (
  source_type = 'manual'
  and (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_items.trip_id and trip.status <> 'archived'
  )
);

create function public.protect_budget_item_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.source_type is distinct from old.source_type
    or new.source_id is distinct from old.source_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Budget item system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_budget_item_system_fields() from public, anon, authenticated;

create trigger protect_budget_item_system_fields
before update on public.budget_items
for each row execute function public.protect_budget_item_system_fields();

create trigger protect_archived_budget_items
before insert or update or delete on public.budget_items
for each row execute function public.protect_archived_trip_content();
