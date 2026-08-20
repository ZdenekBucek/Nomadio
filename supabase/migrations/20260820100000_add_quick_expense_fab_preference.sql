alter table public.profiles
  add column quick_expense_fab_enabled boolean not null default false;

comment on column public.profiles.quick_expense_fab_enabled is
  'Whether the authenticated user wants a global Quick Expense floating action button.';
