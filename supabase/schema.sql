-- VOX catalog schema.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Then run seed.sql to load the starter records and gear.

-- ─── Records ────────────────────────────────────────────────────────────────
create table if not exists public.records (
  id           bigint generated always as identity primary key,

  -- What you see on the card
  cover_url    text,                      -- Cloudinary image link (leave empty to use a generated sleeve)
  title        text not null,
  artist       text not null,

  -- Detail view
  setlist      text,                      -- one track per line; lines like "Side A" become headings
  description  text,                      -- your description / review of the record

  -- Filtering & info
  genre        text,
  year         smallint check (year between 1900 and 2100),
  format       text not null default 'LP'
               check (format in ('LP', '2xLP', '3xLP', 'EP', '7"', '10"', '12"')),
  condition    text not null default 'Very Good+'
               check (condition in ('Mint', 'Near Mint', 'Very Good+', 'Very Good', 'Good', 'Fair')),

  -- available  = can be rented
  -- on_loan    = currently out with a customer
  -- unlisted   = hidden from the site (damaged, being cleaned, sold, etc.)
  status       text not null default 'available'
               check (status in ('available', 'on_loan', 'unlisted')),

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists records_genre_idx on public.records (genre);
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
returns trigger language plpgsql as $$
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

drop policy if exists "Public can view listed records" on public.records;
create policy "Public can view listed records" on public.records
  for select to anon, authenticated
  using (status <> 'unlisted');

drop policy if exists "Public can view active gear" on public.gear;
create policy "Public can view active gear" on public.gear
  for select to anon, authenticated
  using (active);
