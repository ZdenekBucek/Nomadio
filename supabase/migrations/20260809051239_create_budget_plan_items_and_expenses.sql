create table public.budget_plan_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category public.budget_category not null,
  subcategory text,
  name text not null,
  planned_amount numeric(14, 2) not null,
  currency text not null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_plan_items_name_length
    check (char_length(trim(name)) between 1 and 160),
  constraint budget_plan_items_planned_amount_nonnegative
    check (planned_amount >= 0),
  constraint budget_plan_items_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint budget_plan_items_notes_length
    check (notes is null or char_length(trim(notes)) between 1 and 4000),
  constraint budget_plan_items_subcategory_format
    check (subcategory is null or subcategory ~ '^[a-z][a-z0-9_]{0,63}$'),
  constraint budget_plan_items_category_subcategory_fkey
    foreign key (category, subcategory)
    references public.budget_subcategory_catalog (category, subcategory)
    on update restrict
    on delete restrict
);

comment on table public.budget_plan_items is
  'Expected trip costs. Plan remains separate from incurred costs and payment cashflow.';

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category public.budget_category not null,
  subcategory text,
  title text,
  amount numeric(14, 2) not null,
  currency text not null,
  occurred_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  paid_by_traveler_id uuid references public.trip_travelers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expenses_title_length
    check (title is null or char_length(trim(title)) between 1 and 160),
  constraint expenses_amount_positive
    check (amount > 0),
  constraint expenses_currency_format
    check (currency ~ '^[A-Z]{3}$'),
  constraint expenses_notes_length
    check (notes is null or char_length(trim(notes)) between 1 and 4000),
  constraint expenses_subcategory_format
    check (subcategory is null or subcategory ~ '^[a-z][a-z0-9_]{0,63}$'),
  constraint expenses_category_subcategory_fkey
    foreign key (category, subcategory)
    references public.budget_subcategory_catalog (category, subcategory)
    on update restrict
    on delete restrict
);

comment on table public.expenses is
  'Manual incurred trip expenses. Accommodation and transport remain external Reality sources.';
comment on column public.expenses.occurred_at is
  'Timestamp when the cost was incurred, independent from record creation time.';

create index budget_plan_items_trip_category_idx
on public.budget_plan_items (trip_id, category, subcategory, created_at, id);

create index expenses_trip_occurred_idx
on public.expenses (trip_id, occurred_at desc, id);

create index expenses_trip_category_idx
on public.expenses (trip_id, category, subcategory);

create index expenses_paid_by_traveler_idx
on public.expenses (paid_by_traveler_id)
where paid_by_traveler_id is not null;

alter table public.budget_plan_items enable row level security;
alter table public.expenses enable row level security;

revoke all on table public.budget_plan_items from anon;
revoke all on table public.expenses from anon;
grant select, insert, update, delete on table public.budget_plan_items to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;

create policy "Trip members can read budget plan items"
on public.budget_plan_items for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add budget plan items"
on public.budget_plan_items for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_plan_items.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can update budget plan items"
on public.budget_plan_items for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_plan_items.trip_id
      and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_plan_items.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove budget plan items"
on public.budget_plan_items for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.budget_plan_items.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Trip members can read expenses"
on public.expenses for select to authenticated
using ((select public.trip_role(trip_id)) is not null);

create policy "Editors can add expenses"
on public.expenses for insert to authenticated
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and created_by = (select auth.uid())
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.expenses.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can update expenses"
on public.expenses for update to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.expenses.trip_id
      and trip.status <> 'archived'
  )
)
with check (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.expenses.trip_id
      and trip.status <> 'archived'
  )
);

create policy "Editors can remove expenses"
on public.expenses for delete to authenticated
using (
  (select public.trip_role(trip_id)) in ('owner', 'editor')
  and exists (
    select 1 from public.trips as trip
    where trip.id = public.expenses.trip_id
      and trip.status <> 'archived'
  )
);

create function public.validate_expense_traveler()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.paid_by_traveler_id is not null and not exists (
    select 1
    from public.trip_travelers as traveler
    where traveler.id = new.paid_by_traveler_id
      and traveler.trip_id = new.trip_id
  ) then
    raise exception 'Expense traveler does not belong to expense trip' using errcode = '23503';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_expense_traveler() from public, anon, authenticated;

create trigger validate_expense_traveler
before insert or update of paid_by_traveler_id, trip_id on public.expenses
for each row execute function public.validate_expense_traveler();

create function public.protect_budget_plan_item_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Budget plan item system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_budget_plan_item_system_fields() from public, anon, authenticated;

create trigger protect_budget_plan_item_system_fields
before update on public.budget_plan_items
for each row execute function public.protect_budget_plan_item_system_fields();

create function public.protect_expense_system_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.trip_id is distinct from old.trip_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Expense system fields cannot be changed' using errcode = '42501';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.protect_expense_system_fields() from public, anon, authenticated;

create trigger protect_expense_system_fields
before update on public.expenses
for each row execute function public.protect_expense_system_fields();

create trigger protect_archived_budget_plan_items
before insert or update or delete on public.budget_plan_items
for each row execute function public.protect_archived_trip_content();

create trigger protect_archived_expenses
before insert or update or delete on public.expenses
for each row execute function public.protect_archived_trip_content();
