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

-- ─── Orders (rental requests) ───────────────────────────────────────────────
-- Customers submit requests from the site through public.submit_order(); they can't
-- read or change orders. Only admins can see and manage them.
do $$ begin
  create type public.order_status as enum ('Pending', 'Confirmed', 'Active', 'Returned', 'Cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.orders (
  id               bigint generated always as identity primary key,

  -- Pending   = new request, not confirmed yet
  -- Confirmed = confirmed with the customer, not delivered yet
  -- Active    = out with the customer (its records are set to In Rent)
  -- Returned  = back (its records are set to Available again)
  -- Cancelled = didn't happen
  status           public.order_status not null default 'Pending',

  customer_name    text not null check (char_length(customer_name) between 1 and 100),
  phone            text not null check (char_length(phone) between 3 and 40),
  location         text not null check (char_length(location) between 1 and 300),
  off_campus       boolean not null default false,
  start_date       date not null,
  days             smallint not null check (days between 1 and 60),
  turntable        boolean not null,         -- false = records only (customer has a turntable)
  -- Snapshot of the records at the time of the request:
  -- [{ "id": 1, "title": "...", "artist": "..." }, ...]
  records          jsonb not null default '[]'
                   check (jsonb_typeof(records) = 'array' and jsonb_array_length(records) <= 30),
  notes            text check (char_length(notes) <= 1000),

  estimated_total  numeric(10, 2) check (estimated_total >= 0),  -- from the site; excludes off-campus delivery
  delivery_fee     numeric(10, 2) check (delivery_fee >= 0),     -- set by staff for off-campus orders
  admin_notes      text check (char_length(admin_notes) <= 2000),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders" on public.orders
  for select to authenticated
  using ((select private.is_admin()));

drop policy if exists "Admins can edit orders" on public.orders;
create policy "Admins can edit orders" on public.orders
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders" on public.orders
  for delete to authenticated
  using ((select private.is_admin()));

-- Called by the website to place a rental request. Returns the new order number.
-- Runs with elevated rights (customers have no direct access to the table), so it
-- validates everything and takes record titles from the catalog, not the browser.
create or replace function public.submit_order(
  p_name text,
  p_phone text,
  p_location text,
  p_off_campus boolean,
  p_start_date date,
  p_days integer,
  p_turntable boolean,
  p_record_ids bigint[],
  p_notes text default null,
  p_estimated_total numeric default null
) returns bigint
language plpgsql security definer set search_path = '' as $fn$
declare
  v_ids     bigint[] := coalesce(p_record_ids, '{}');
  v_records jsonb;
  v_found   integer;
  v_id      bigint;
begin
  if not p_turntable and cardinality(v_ids) = 0 then
    raise exception 'Pick at least one record or rent a turntable.';
  end if;
  if cardinality(v_ids) <> (select count(distinct x) from unnest(v_ids) x) then
    raise exception 'The same record is in the request twice.';
  end if;
  if p_start_date < (now() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'The start date is in the past.';
  end if;

  -- Basic flood protection: at most 5 requests per phone number per hour
  if (select count(*) from public.orders
      where phone = btrim(p_phone) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests from this phone number. Please try again later.';
  end if;

  select count(*), coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'title', r.title, 'artist', r.artist) order by u.ord), '[]')
    into v_found, v_records
  from unnest(v_ids) with ordinality as u(id, ord)
  join public.records r on r.id = u.id and r.status = 'Available';

  if v_found <> cardinality(v_ids) then
    raise exception 'Some of these records are no longer available. Please refresh and try again.';
  end if;

  insert into public.orders
    (customer_name, phone, location, off_campus, start_date, days, turntable, records, notes, estimated_total)
  values
    (btrim(p_name), btrim(p_phone), btrim(p_location), coalesce(p_off_campus, false), p_start_date, p_days,
     p_turntable, v_records, nullif(btrim(p_notes), ''), p_estimated_total)
  returning id into v_id;

  return v_id;
end;
$fn$;

revoke all on function public.submit_order(text, text, text, boolean, date, integer, boolean, bigint[], text, numeric) from public;
grant execute on function public.submit_order(text, text, text, boolean, date, integer, boolean, bigint[], text, numeric) to anon, authenticated;

-- When an order goes out (Active), mark its records In Rent; when it leaves Active
-- (Returned, Cancelled, …), put them back to Available. Runs as the admin making the change.
create or replace function public.sync_order_records()
returns trigger language plpgsql set search_path = '' as $fn$
declare
  v_ids bigint[];
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  select coalesce(array_agg((e ->> 'id')::bigint), '{}') into v_ids from jsonb_array_elements(new.records) e;

  if new.status = 'Active' then
    update public.records set status = 'In Rent' where id = any (v_ids) and status = 'Available';
  elsif old.status = 'Active' then
    update public.records set status = 'Available' where id = any (v_ids) and status = 'In Rent';
  end if;
  return new;
end;
$fn$;

drop trigger if exists orders_sync_records on public.orders;
create trigger orders_sync_records after update of status on public.orders
  for each row execute function public.sync_order_records();
