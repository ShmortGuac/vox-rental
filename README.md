# VOX — Vinyl Rentals

Vue 3 + Vite site for VOX: a landing page, a catalog of records & gear, and a rental request builder.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

Without any setup the site runs on the sample data in `src/data/`. Follow the steps below to load the real catalog from Supabase.

## 1. Set up Supabase (the database)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and click **Run**.
3. (Optional) Do the same with `supabase/seed.sql` to load the sample records and gear. Delete them later from the Table Editor.
4. Open **Project Settings → API** and copy the **Project URL** and the **publishable (anon) key**.
5. Copy `.env.example` to `.env` and paste them in:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_KEY=your-publishable-or-anon-key
   ```
6. Restart `npm run dev`. The catalog now comes from Supabase.

> Only use the **publishable/anon** key. Never put the secret / `service_role` key in `.env` — it ends up in the browser.

## 2. Album covers with Cloudinary

Covers are uploaded from the admin page (`/admin`) straight to Cloudinary. A Supabase Edge Function
(`supabase/functions/cloudinary-sign`) checks the user is an admin and signs each upload, so the
Cloudinary API secret never reaches the browser.

**One-time setup**

1. In the Cloudinary dashboard open **Settings → API Keys** (or the dashboard home) and note your
   **Cloud name**, **API Key** and **API Secret**.
2. In Supabase open **Edge Functions → Secrets** and add:
   | Name | Value |
   |---|---|
   | `CLOUDINARY_CLOUD_NAME` | your cloud name |
   | `CLOUDINARY_API_KEY` | your API key |
   | `CLOUDINARY_API_SECRET` | your API secret |
3. Done — the **Upload image** button in the admin form now works. Images go into the `vox-covers` folder.

You can still paste an image link instead of uploading. Images are resized and compressed automatically
when shown on the site; records without a cover get a generated sleeve.

To redeploy the function after editing it: `supabase functions deploy cloudinary-sign --no-verify-jwt`
(it checks admin access itself).

## Admin page (`/admin`)

Add, edit and delete records, change their status, and edit setlists side by side — no JSON typing.
Upload cover images right in the form (see Cloudinary setup above), or paste an image link.

**Giving someone admin access**

1. Supabase → **Authentication → Users → Add user → Create new user**. Enter their email and a password and tick **Auto Confirm User**.
2. Supabase → **SQL Editor**, run (with their email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'them@example.com';
   ```
3. They sign in at `/admin`.

Only users in the `admins` table can change records — the database enforces this, so other signed-in accounts can't edit anything.
Recommended: turn off public sign-ups in **Authentication → Sign In / Providers** ("Allow new users to sign up"), since staff accounts are created by hand.

To remove someone: `delete from public.admins where user_id = (select id from auth.users where email = 'them@example.com');`

## Managing the catalog

Records can be edited on the admin page or directly in the Supabase **Table Editor** — no code changes or redeploys needed.

### `records`

| Column | What to put in it |
|---|---|
| `cover_url` | Album cover link from Cloudinary (optional) |
| `title` | Album title |
| `artist` | Artist name in English letters (use the artist's official romanization, e.g. Mariya Takeuchi) |
| `artist_alt` | Optional: the name in its original language, e.g. 竹内まりや — shown under the artist name and searchable |
| `setlist` | JSON list of sides — see [Setlists](#setlists) below |
| `description` | Your review of the record — shown as "The VOX review" in the record popup. Leave a blank line between paragraphs. |
| `reviewer` | Who wrote the review — shown as "— Name from the VOX Crew". Leave empty for "— The VOX Crew". |
| `genres` | One or more genres, e.g. `{Rock,Alternative}` (up to 8). In the admin page, type a genre and press Enter. The catalog's genre filters are built from these. |
| `year` | Release year |
| `format` | `LP`, `2xLP`, `3xLP`, `EP`, `7"`, `10"`, `12"` |
| `status` | `Available` · `In Rent` (shown greyed out, customers can ask when it's back) · `Coming Soon` (shown, not rentable yet) |

### Setlists

`setlist` is JSON. Use a list of sides — as many as the record has:

```json
[
  { "side": "A", "tracks": ["Come Together", "Something"] },
  { "side": "B", "tracks": ["Here Comes the Sun", "Because"] }
]
```

- **1 side:** `[{ "side": "A", "tracks": ["...", "..."] }]`
- **4 sides (2xLP):** four entries, e.g. sides `"1"`–`"4"` or `"A"`–`"D"`
- **No side labels:** just a list of tracks — `["Track one", "Track two"]`
- Short side names show as "Side A" / "Side 1"; longer ones (e.g. `"Bonus"`) are shown as written.

Supabase rejects a setlist that isn't in one of these shapes, so a typo can't break the site.

### `gear`

| Column | What to put in it |
|---|---|
| `name`, `description` | Shown on the gear card |
| `image_url` | Optional Cloudinary photo (otherwise an icon is shown) |
| `icon` | `headphones`, `speaker`, `speakers`, `cleaning`, `crate` |
| `price`, `price_per` | Price and whether it's per `day` or per `rental` |
| `quantity` | How many you own — `0` shows it as "Currently out" |
| `active` | Untick to hide it from the site |
| `sort_order` | Lower numbers show first |

## Other settings

Rental lengths, prices, extra-record price, delivery fees, contact details and the FAQ live in `src/data/site.js`.

## Deploying

Deploy `dist/` to Netlify, Vercel or similar, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` as environment variables in the host's settings. Every path must serve `index.html` so links like `/catalog` and `/admin` work when opened directly or refreshed — `vercel.json` already does this on Vercel (on Netlify, add a `_redirects` file with `/* /index.html 200`).
