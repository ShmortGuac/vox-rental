# VOX — vinyl rental site

Vue 3 + Vite site for VOX, a campus vinyl rental business. Prices are in **RM**, **per day**, à la carte or
as a package: turntable alone RM35/day, each record RM10/day, or the package (turntable + 1 record) RM40/day
with extra records at RM10/day. Customers with their own turntable can rent records only. Delivery is free on
campus, paid off campus.
Rentals are requested by email (mailto) — there is no checkout or rentals table yet.

## Commands

```bash
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build → dist/  (run after every change to confirm it compiles)
npm run preview  # serve dist/ (port 4173)
```

No test suite. Verify UI changes with a build and, when visual, a headless Chrome screenshot of `vite preview`.

## Stack & services

- **Vue 3** (`<script setup>`), **vue-router 5** (history mode), plain CSS with tokens in `src/style.css`. No UI library, no Pinia — stores are `reactive()` modules in `src/stores/`.
- **Supabase** (project ref `udcqeckomjiebepfcoof`) — Postgres for the catalog, Auth for admins, an Edge Function for upload signing. The Supabase MCP server is configured for this project.
- **Cloudinary** — cover images (folder `vox-covers`). Uploads are *signed*: browser → `cloudinary-sign` edge function (checks admin) → direct upload to Cloudinary. Secrets `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` live in Supabase Edge Function secrets, never in the repo.
- `.env` (gitignored) holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` (publishable key only — never a secret/service key; anything `VITE_` ships to the browser). Without them the site falls back to sample data in `src/data/`.

## Layout

| Path | What |
|---|---|
| `src/data/site.js` | Business config: contact, `campusName`, currency (`RM`), `suggestUrl` (Google Form), `features` flags, per-day `pricing` (`turntable`, `record`, `package`), `maxDays`, `delivery` fees, FAQ (prices interpolated from `pricing`) |
| `src/data/vinyls.js`, `gear.js` | Sample data in **DB row shape** — fallback only; also the source for `supabase/seed.sql` |
| `src/stores/catalog.js` | Loads records/gear (Supabase or samples), `toRecord()` maps DB rows → component shape, `normalizeSetlist()`, `genres`, `genreLabel()`, `reloadCatalog()` |
| `src/stores/rental.js` | The visitor's rental (localStorage: `records`, `turntable` on/off, `days`, delivery, details), price `summary` (applies the package automatically when there's a turntable + ≥1 record), `requestMailto()` |
| `src/lib/cloudinary.js` | `optimizeImage()` (adds `f_auto,q_auto,c_fill,w_N` to Cloudinary URLs), `uploadImage()` |
| `src/views/AdminView.vue` + `src/components/admin/AdminRecordForm.vue` | `/admin` — sign-in, record list, add/edit form (setlist editor, genre tags, cover upload) |
| `supabase/schema.sql` | Full schema for a fresh project (tables, enum, checks, RLS, admins) — keep in sync with migrations |
| `supabase/seed.sql` | Generated from `src/data/vinyls.js` + `gear.js` |
| `supabase/functions/cloudinary-sign/` | Edge function; deployed with `verify_jwt = false` (it verifies the user + admin itself — the platform JWT check doesn't work with the new publishable keys) |

Hosted on **Vercel** (vox-rental.vercel.app). `vercel.json` rewrites every path to `/index.html` — required for history-mode routes like `/catalog` to load directly.

`/admin` uses `meta: { bare: true }` so `App.vue` renders it without the shop header/footer/rental panel.

## Data model (`public.records`)

- `title`, `artist` (romanized/official name), `artist_alt` (original script, e.g. 竹内まりや — shown under artist, searchable)
- `genres text[]` — 0–8 non-empty items (check constraint). Cards show them as `Indie / Rock`.
- `status` — enum `record_status`: `Available` · `In Rent` · `Coming Soon`. Only `Available` can be added to a rental. Coming Soon: dimmed cover + "COMING SOON" banner, always sorted last in the catalog.
- `setlist jsonb` — `[{ "side": "A", "tracks": [...] }, ...]` (any number of sides) **or** a plain `["track", ...]`. Validated by `public.is_valid_setlist()`. Short side labels render as "Side A".
- `description` = the **VOX review** (blank line = new paragraph); `reviewer` → signed "— Name from the VOX Crew", empty → "— The VOX Crew"
- `cover_url` (Cloudinary), `year`, `format` (check: LP, 2xLP, 3xLP, EP, 7", 10", 12")
- No `condition` column (removed on purpose).

`public.gear` exists but is unused while `features.gear` is `false` in `site.js` (all gear UI is behind that flag).

## Security model

- RLS on everything. Anyone can **read** records/active gear.
- Writes to `records` only for users in `public.admins` (via `private.is_admin()`, security definer, kept out of the API schema). Being signed in is not enough — Supabase allows public sign-ups by default.
- Add an admin: create the user in Supabase Auth, then `insert into public.admins (user_id) select id from auth.users where email = '...'`.
- After DB changes, run the Supabase security + performance advisors.

## Conventions & gotchas

- **Schema changes:** apply via a migration (MCP `apply_migration`), then mirror the change in `supabase/schema.sql`, update `src/data/vinyls.js` + regenerate `seed.sql` if the shape changed, map the column in `toRecord()`, add it to the admin form, and document it in `README.md`. Test non-trivial SQL locally first (PGlite works well) — especially RLS and constraints.
- Files on disk may have **CRLF** line endings — normalize before string-matching edits in scripts.
- Status/format values in `AdminRecordForm.vue` must match the DB enum/check constraint.
- Layout details that were deliberately fixed: record cards fill the grid row with the "Add to rental" button pinned to the bottom (`margin-top: auto`); cards have `min-width: 0` so one-line genre text truncates instead of widening the grid; the hover disc slide is small (6%, 3% on phones) so it doesn't touch the next card; the "Coming soon" banner is a separate layer so the cover's grayscale filter doesn't affect it.
- Scoped CSS class names have collided before (e.g. `.empty`) — pick specific names.
- Pricing in `site.js` is confirmed by the owner (RM35 / RM10 / RM40 per day). Off-campus delivery has no set fee — it depends on location, so it's quoted per rental and left out of the estimated total. Contact and campus name are still placeholders.
- Commit/push only when asked. Never commit `.env` or paste keys/tokens into files.
