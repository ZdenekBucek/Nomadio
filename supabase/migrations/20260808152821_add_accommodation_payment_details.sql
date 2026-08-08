alter table public.accommodations
  add column paid_amount numeric(14, 2),
  add column balance_due_date date,
  add constraint accommodations_paid_amount_nonnegative
    check (paid_amount is null or paid_amount >= 0),
  add constraint accommodations_paid_amount_within_total
    check (total_price is null or paid_amount is null or paid_amount <= total_price),
  add constraint accommodations_payment_status_amount_consistency
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
    );

comment on column public.accommodations.paid_amount is
  'Amount already paid in accommodations.currency; remaining amount is derived from total_price minus paid_amount.';

comment on column public.accommodations.balance_due_date is
  'Optional due date for the remaining accommodation balance and a future Budget input.';
