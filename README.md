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

## 2. Add album covers with Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Go to **Media Library** and upload a cover (square images work best).
3. Click the image → **Copy URL** (it looks like `https://res.cloudinary.com/.../image/upload/v123/abbey-road.jpg`).
4. In Supabase **Table Editor → records**, paste it into that record's `cover_url`.

The site automatically resizes and compresses Cloudinary images. Records without a `cover_url` get a generated sleeve.

## Managing the catalog

Everything is edited in Supabase **Table Editor** — no code changes or redeploys needed.

### `records`

| Column | What to put in it |
|---|---|
| `cover_url` | Album cover link from Cloudinary (optional) |
| `title` | Album title |
| `artist` | Artist name |
| `setlist` | One track per line. Lines like `Side A` / `Side B` become headings. |
| `description` | Your description / review |
| `genre` | e.g. Jazz, Soul, Hip-Hop — the catalog's genre filters are built from this |
| `year` | Release year |
| `format` | `LP`, `2xLP`, `3xLP`, `EP`, `7"`, `10"`, `12"` |
| `condition` | `Mint`, `Near Mint`, `Very Good+`, `Very Good`, `Good`, `Fair` |
| `status` | `available` · `on_loan` (shown greyed out) · `unlisted` (hidden from the site) |

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

Deploy `dist/` to Netlify, Vercel or similar, and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` as environment variables in the host's settings. Add a rewrite so every path serves `index.html` (needed for `/catalog` to work on refresh).
