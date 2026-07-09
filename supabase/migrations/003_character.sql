-- Your pixel character travels with your profile so friends see your look.
alter table public.profiles
  add column if not exists character jsonb;
