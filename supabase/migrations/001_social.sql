-- Adda social schema (v1)
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ---- profiles ----------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles readable by everyone"
  on public.profiles for select using (true);
create policy "insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ---- follows ------------------------------------------------------------
create table if not exists public.follows (
  follower   uuid not null references public.profiles (id) on delete cascade,
  followee   uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);

alter table public.follows enable row level security;

create policy "follows readable by everyone"
  on public.follows for select using (true);
create policy "follow as yourself"
  on public.follows for insert with check (auth.uid() = follower);
create policy "unfollow as yourself"
  on public.follows for delete using (auth.uid() = follower);

-- ---- rankings (Beli-style buckets, synced from the app) ------------------
create table if not exists public.rankings (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  spot_id    text not null,
  sentiment  text not null check (sentiment in ('liked', 'fine', 'disliked')),
  rank       int  not null default 0,
  score      numeric(3, 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.rankings enable row level security;

create policy "rankings readable by everyone"
  on public.rankings for select using (true);
create policy "write own rankings"
  on public.rankings for insert with check (auth.uid() = user_id);
create policy "update own rankings"
  on public.rankings for update using (auth.uid() = user_id);
create policy "delete own rankings"
  on public.rankings for delete using (auth.uid() = user_id);

-- ---- rsvps ---------------------------------------------------------------
create table if not exists public.rsvps (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

alter table public.rsvps enable row level security;

create policy "rsvps readable by everyone"
  on public.rsvps for select using (true);
create policy "rsvp as yourself"
  on public.rsvps for insert with check (auth.uid() = user_id);
create policy "unrsvp as yourself"
  on public.rsvps for delete using (auth.uid() = user_id);

-- ---- indexes -------------------------------------------------------------
create index if not exists follows_followee_idx on public.follows (followee);
create index if not exists rankings_spot_idx    on public.rankings (spot_id);
create index if not exists rsvps_event_idx      on public.rsvps (event_id);
