import { computed, reactive } from 'vue'
import { supabase } from '../lib/supabase'
import { optimizeImage } from '../lib/cloudinary'
import { features } from '../data/site'
import { vinyls as sampleRecords } from '../data/vinyls'
import { gear as sampleGear } from '../data/gear'

// Generated sleeve art for records without a cover photo.
const palettes = [
  { a: '#1d3a5f', b: '#e8e1d3', c: '#F74747' },
  { a: '#e9dcc4', b: '#131313', c: '#b8860b' },
  { a: '#2f5d8a', b: '#a9c6e0', c: '#ffffff' },
  { a: '#131313', b: '#c0c0c0', c: '#F74747' },
  { a: '#5a3e2b', b: '#d9a441', c: '#f3eee6' },
  { a: '#f28c28', b: '#131313', c: '#ffb347' },
  { a: '#c96f3b', b: '#f2d7a6', c: '#2e5e4e' },
  { a: '#d98ca6', b: '#f7e3ea', c: '#3a2a35' },
  { a: '#8b1e3f', b: '#f3c6a5', c: '#f3eee6' },
  { a: '#3d3d3d', b: '#b5a68b', c: '#f3eee6' },
]
const patterns = ['stripes', 'circles', 'split', 'sun', 'grid', 'waves']

function hash(str) {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.codePointAt(0)) >>> 0
  return h
}

function generatedCover(row) {
  const h = hash(`${row.title}|${row.artist}`)
  return { ...palettes[h % palettes.length], pattern: patterns[(h >> 4) % patterns.length] }
}

// Turn a `records` row into what the components use.
function toRecord(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artistAlt: row.artist_alt?.trim() || '', // original-language name, e.g. 竹内まりや
    year: row.year,
    // `genres` is a list; older data may still have a single `genre`
    genres: (row.genres ?? (row.genre ? [row.genre] : [])).filter(Boolean),
    format: row.format,
    status: row.status, // 'Available' | 'In Rent' | 'Coming Soon'
    available: row.status === 'Available',
    setlist: normalizeSetlist(row.setlist),
    description: row.description || '',
    reviewer: row.reviewer?.trim() || '',
    image: optimizeImage(row.cover_url),
    cover: generatedCover(row),
  }
}

function toGear(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    image: optimizeImage(row.image_url, 800),
    icon: row.icon,
    price: Number(row.price),
    per: row.price_per,
    available: row.active && row.quantity > 0,
  }
}

export const catalog = reactive({
  records: [],
  gear: [],
  loading: false,
  error: null,
  loaded: false,
})

export const genres = computed(() => [...new Set(catalog.records.flatMap((r) => r.genres))].sort())

// "Indie / Rock" — how a record's genres are shown on cards and in the popup
export const genreLabel = (record) => record.genres.join(' / ')

let pending = null

// Fetch the catalog again (e.g. after an admin edit).
export function reloadCatalog() {
  catalog.loaded = false
  return loadCatalog()
}

export function loadCatalog() {
  if (catalog.loaded) return Promise.resolve()
  if (pending) return pending

  catalog.loading = true
  catalog.error = null

  pending = (async () => {
    try {
      if (!supabase) {
        catalog.records = sampleRecords.map(toRecord)
        catalog.gear = features.gear ? sampleGear.filter((g) => g.active).map(toGear) : []
      } else {
        const [records, gear] = await Promise.all([
          supabase.from('records').select('*').order('title'),
          features.gear
            ? supabase.from('gear').select('*').order('sort_order').order('name')
            : { data: [], error: null },
        ])
        if (records.error) throw records.error
        if (gear.error) throw gear.error
        catalog.records = records.data.map(toRecord)
        catalog.gear = gear.data.map(toGear)
      }
      catalog.loaded = true
    } catch (err) {
      console.error('Failed to load catalog', err)
      catalog.error = "We couldn't load the catalog. Please refresh the page."
    } finally {
      catalog.loading = false
      pending = null
    }
  })()

  return pending
}

// Turns the `setlist` JSON into [{ side: 'Side A' | null, tracks: [...] }].
// Accepts a plain list of tracks (["a", "b"]) or a list of sides
// ([{ "side": "A", "tracks": ["a", "b"] }, ...]) with any number of sides.
export function normalizeSetlist(setlist) {
  if (!Array.isArray(setlist)) return []
  const groups = []
  let loose = null
  for (const item of setlist) {
    if (typeof item === 'string') {
      if (!loose) groups.push((loose = { side: null, tracks: [] }))
      loose.tracks.push(item)
    } else if (item && Array.isArray(item.tracks)) {
      loose = null
      groups.push({ side: sideLabel(item.side), tracks: item.tracks.filter((t) => typeof t === 'string') })
    }
  }
  return groups.filter((g) => g.tracks.length)
}

// "A" or 1 → "Side A" / "Side 1"; longer labels like "Bonus" are kept as-is.
function sideLabel(side) {
  if (side === null || side === undefined || side === '') return null
  const text = String(side).trim()
  return text.length <= 2 ? `Side ${text}` : text
}
