-- VOX catalog schema.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the starter records and gear.

-- ─── Records ────────────────────────────────────────────────────────────────
do $$ begin
  create type public.record_status as enum ('Available', 'In Rent', 'Coming Soon');
exception when duplicate_object then null;
end $$;

-- Validates the setlist shape:
--   [ "track", ... ]                                  (no sides)
--   [ { "side": "A", "tracks": ["track", ...] }, ... ] (any number of sides)
create or replace function public.is_valid_setlist(s jsonb)
returns boolean language sql immutable set search_path = '' as $fn$
  select s is null or (
    jsonb_typeof(s) = 'array'
    and not exists (
      select 1 from jsonb_array_elements(s) e
      where not (
        jsonb_typeof(e) = 'string'
        or (
          jsonb_typeof(e) = 'object'
          and coalesce(jsonb_typeof(e -> 'tracks'), '') = 'array'
          and coalesce(jsonb_typeof(e -> 'side'), 'string') in ('string', 'number')
          and not exists (
            select 1 from jsonb_array_elements(e -> 'tracks') t where jsonb_typeof(t) <> 'string'
          )
        )
      )
    )
  )
$fn$;

create table if not exists public.records (
  id           bigint generated always as identity primary key,

  -- What you see on the card
  cover_url    text,                      -- Cloudinary image link (leave empty to use a generated sleeve)
  title        text not null,
  artist       text not null,              -- romanized / international name, e.g. Mariya Takeuchi
  artist_alt   text check (char_length(artist_alt) <= 200),  -- original-language name, e.g. 竹内まりや

  -- Detail view
  -- List of sides, any number:  [{"side": "A", "tracks": ["Song 1", "Song 2"]}, {"side": "B", "tracks": [...]}]
  -- or a plain list of tracks:   ["Song 1", "Song 2"]
  setlist      jsonb check (public.is_valid_setlist(setlist)),
  description  text,                      -- your review of the record (shown as "The VOX review")
  reviewer     text check (char_length(reviewer) <= 80),  -- who wrote it; empty = "The VOX Crew"

  -- Filtering & info
  genres       text[] not null default '{}'   -- one or more, e.g. {Rock,Alternative}
               constraint records_genres_valid check (cardinality(genres) <= 8 and array_position(genres, '') is null),
  year         smallint check (year between 1900 and 2100),
  format       text not null default 'LP'
               check (format in ('LP', '2xLP', '3xLP', 'EP', '7"', '10"', '12"')),

  -- Available   = can be rented
  -- In Rent     = currently out with a customer
  -- Coming Soon = shown on the site but not rentable yet
  status       public.record_status not null default 'Available',

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists records_genres_idx on public.records using gin (genres);
create index if not exists records_status_idx on public.records (status);

-- ─── Gear / peripherals ─────────────────────────────────────────────────────
create table if not exists public.gear (
  id           bigint generated always as identity primary key,
  name         text not null,
  description  text,
  image_url    text,                      -- optional Cloudinary photo
  icon         text not null default 'speaker'
               check (icon in ('headphones', 'speaker', 'speakers', 'cleaning', 'crate')),
  price        numeric(10, 2) not null check (price >= 0),
  price_per    text not null default 'day' check (price_per in ('day', 'rental')),
  quantity     integer not null default 1 check (quantity >= 0),  -- how many you own
  active       boolean not null default true,                     -- false = hidden from the site
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── Keep updated_at current ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists records_updated_at on public.records;
create trigger records_updated_at before update on public.records
  for each row execute function public.set_updated_at();

drop trigger if exists gear_updated_at on public.gear;
create trigger gear_updated_at before update on public.gear
  for each row execute function public.set_updated_at();

-- ─── Security ───────────────────────────────────────────────────────────────
-- The website can only READ listed items. Adding/editing happens in the
-- Supabase dashboard (which bypasses these rules), so visitors can't change anything.
alter table public.records enable row level security;
alter table public.gear enable row level security;

drop policy if exists "Public can view records" on public.records;
create policy "Public can view records" on public.records
  for select to anon, authenticated
  using (true);

drop policy if exists "Public can view active gear" on public.gear;
create policy "Public can view active gear" on public.gear
  for select to anon, authenticated
  using (active);

-- ─── Admins ─────────────────────────────────────────────────────────────────
-- Only users listed here can add/edit/delete records. Being signed in is not enough.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in user may check whether *they* are an admin (used by the admin page).
drop policy if exists "Users can see their own admin row" on public.admins;
create policy "Users can see their own admin row" on public.admins
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Helper kept out of the public API schema.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$fn$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ─── Admin write access to records ──────────────────────────────────────────
drop policy if exists "Admins can add records" on public.records;
create policy "Admins can add records" on public.records
  for insert to authenticated
  with check ((select private.is_admin()));

drop policy if exists "Admins can edit records" on public.records;
create policy "Admins can edit records" on public.records
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins can delete records" on public.records;
create policy "Admins can delete records" on public.records
  for delete to authenticated
  using ((select private.is_admin()));
