// Signs Cloudinary uploads for VOX admins.
//
// The browser asks this function for a signature, then uploads the image
// straight to Cloudinary. Only signed-in users listed in public.admins get one,
// and the Cloudinary API secret never leaves the server.
//
// Required secrets (Supabase → Edge Functions → Secrets):
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
import { createClient } from 'npm:@supabase/supabase-js@2'

const FOLDER = 'vox-covers'
const ALLOWED_FORMATS = 'avif,gif,heic,jpeg,jpg,png,webp'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function publishableKey() {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}')
    if (keys.default) return keys.default as string
  } catch {
    /* fall back to the legacy key */
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? ''
}

async function sha1Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Who is asking? (verified with Supabase Auth, not just decoded)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not signed in.' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Your session has expired. Sign in again.' }, 401)

  // Admins only (the admins table only shows a user their own row)
  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (!admin) return json({ error: 'Only admins can upload images.' }, 403)

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
  if (!cloudName || !apiKey || !apiSecret) {
    return json(
      {
        error:
          'Cloudinary is not set up yet. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Supabase → Edge Functions → Secrets.',
      },
      500,
    )
  }

  // Cloudinary signature: params sorted by name, joined with &, + API secret, SHA-1
  const timestamp = Math.floor(Date.now() / 1000)
  const toSign = `allowed_formats=${ALLOWED_FORMATS}&folder=${FOLDER}&timestamp=${timestamp}`
  const signature = await sha1Hex(toSign + apiSecret)

  return json({ cloudName, apiKey, timestamp, folder: FOLDER, allowedFormats: ALLOWED_FORMATS, signature })
})
