import { createClient } from '@supabase/supabase-js'

// Set these in a .env file (see .env.example). If they're missing the site
// falls back to the sample data in src/data/.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

export const supabase = url && key ? createClient(url, key) : null
