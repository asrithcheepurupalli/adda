-- Check-ins + photo drops.
-- A check-in is "I was here", optionally with a photo that hangs on the map.
-- spot_id is text like rankings (client-side ids, includes user-added spots).

create table if not exists public.checkins (
  id         text primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  spot_id    text not null,
  note       text check (char_length(note) <= 120),
  photo_url  text,
  verified   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.checkins enable row level security;

create policy "checkins are readable by everyone"
  on public.checkins for select using (true);

create policy "users insert own checkins"
  on public.checkins for insert with check (auth.uid() = user_id);

create policy "users update own checkins"
  on public.checkins for update using (auth.uid() = user_id);

create policy "users delete own checkins"
  on public.checkins for delete using (auth.uid() = user_id);

create index if not exists checkins_spot_idx on public.checkins (spot_id, created_at desc);
create index if not exists checkins_user_idx on public.checkins (user_id, created_at desc);
create index if not exists checkins_time_idx on public.checkins (created_at desc);

-- Public bucket for check-in photos; each user writes only inside their
-- own <uid>/ folder, everyone can view.
insert into storage.buckets (id, name, public)
values ('checkins', 'checkins', true)
on conflict (id) do nothing;

create policy "checkin photos are public"
  on storage.objects for select
  using (bucket_id = 'checkins');

create policy "users upload own checkin photos"
  on storage.objects for insert
  with check (
    bucket_id = 'checkins'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users replace own checkin photos"
  on storage.objects for update
  using (
    bucket_id = 'checkins'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
