alter table public.members
  add column seminar_2_days_completed boolean not null default false,
  add column seminar_7_days_completed boolean not null default false,
  add column seminar_21_days_completed boolean not null default false,
  add column seminar_40_days_completed boolean not null default false;