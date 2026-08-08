alter table public.budget_items
  alter column category type text using category::text;

alter table public.budget_items
  add column subcategory text;

update public.budget_items
set
  subcategory = case category
    when 'local_transport' then 'local_transport'
    when 'rental_car' then 'rental_car'
    when 'insurance' then 'insurance'
    else subcategory
  end,
  category = case category
    when 'local_transport' then 'transport'
    when 'rental_car' then 'car'
    when 'insurance' then 'travel_services'
    else category
  end;

drop type public.budget_category;

create type public.budget_category as enum (
  'accommodation',
  'transport',
  'food',
  'activities',
  'car',
  'shopping',
  'travel_services',
  'health',
  'fees',
  'other'
);

alter table public.budget_items
  alter column category type public.budget_category using category::public.budget_category;

create table public.budget_subcategory_catalog (
  category public.budget_category not null,
  subcategory text not null,
  primary key (category, subcategory),
  constraint budget_subcategory_catalog_value_format
    check (subcategory ~ '^[a-z][a-z0-9_]{0,63}$')
);

insert into public.budget_subcategory_catalog (category, subcategory) values
  ('accommodation', 'hotel'),
  ('accommodation', 'apartment'),
  ('accommodation', 'hostel'),
  ('accommodation', 'guesthouse'),
  ('accommodation', 'camping'),
  ('accommodation', 'other_accommodation'),
  ('transport', 'flights'),
  ('transport', 'train'),
  ('transport', 'bus'),
  ('transport', 'ferry'),
  ('transport', 'local_transport'),
  ('transport', 'taxi_transfer'),
  ('transport', 'other_transport'),
  ('food', 'restaurants'),
  ('food', 'groceries'),
  ('food', 'cafes'),
  ('food', 'drinks'),
  ('food', 'other_food'),
  ('activities', 'entrance_fees'),
  ('activities', 'tours'),
  ('activities', 'wellness_spa'),
  ('activities', 'entertainment'),
  ('activities', 'nature'),
  ('activities', 'other_activity'),
  ('car', 'rental_car'),
  ('car', 'fuel'),
  ('car', 'ev_charging'),
  ('car', 'parking'),
  ('car', 'tolls'),
  ('car', 'road_vignettes'),
  ('car', 'car_other'),
  ('shopping', 'souvenirs'),
  ('shopping', 'cosmetics'),
  ('shopping', 'clothing'),
  ('shopping', 'electronics'),
  ('shopping', 'gifts'),
  ('shopping', 'other_shopping'),
  ('travel_services', 'insurance'),
  ('travel_services', 'visa_entry_fees'),
  ('travel_services', 'esim_internet'),
  ('travel_services', 'luggage'),
  ('travel_services', 'travel_service_other'),
  ('health', 'pharmacy'),
  ('health', 'medical'),
  ('health', 'hygiene'),
  ('health', 'health_other'),
  ('fees', 'bank_fees'),
  ('fees', 'exchange_fees'),
  ('fees', 'tips'),
  ('fees', 'city_tax'),
  ('fees', 'booking_fees'),
  ('fees', 'fee_other'),
  ('other', 'emergency'),
  ('other', 'unexpected'),
  ('other', 'miscellaneous');

alter table public.budget_subcategory_catalog enable row level security;
revoke all on table public.budget_subcategory_catalog from anon, authenticated;

alter table public.budget_items
  add constraint budget_items_subcategory_format
    check (subcategory is null or subcategory ~ '^[a-z][a-z0-9_]{0,63}$'),
  add constraint budget_items_category_subcategory_fkey
    foreign key (category, subcategory)
    references public.budget_subcategory_catalog (category, subcategory)
    on update restrict
    on delete restrict;

create index budget_items_category_subcategory_idx
on public.budget_items (trip_id, category, subcategory);

comment on table public.budget_subcategory_catalog is
  'Allowed predefined Budget category and subcategory pairs. It is not exposed through the Data API.';
comment on column public.budget_items.category is
  'Stable main reporting category.';
comment on column public.budget_items.subcategory is
  'Optional predefined subcategory validated by a composite foreign key.';
