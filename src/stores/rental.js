import { computed, reactive, watch } from 'vue'
import { catalog } from './catalog'
import { supabase } from '../lib/supabase'
import { site, pricing, maxDays, delivery, features } from '../data/site'

const STORAGE_KEY = 'vox-rental'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

const saved = load()

export function clampDays(n) {
  return Math.min(maxDays, Math.max(1, Math.round(Number(n)) || 1))
}

// The rental the visitor is putting together. Kept in localStorage so it
// survives a page refresh.
export const rental = reactive({
  records: saved.records ?? [],
  gear: saved.gear ?? [],
  turntable: saved.turntable ?? true, // false = records only (they have their own turntable)
  days: clampDays(saved.days),
  offCampus: saved.offCampus ?? false,
  details: saved.details ?? { name: '', phone: '', location: '', date: '', notes: '' },
  panelOpen: false,
})

watch(
  () => ({ ...rental, panelOpen: undefined }),
  (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable — the rental just won't persist */
    }
  },
  { deep: true },
)

export function hasRecord(id) {
  return rental.records.includes(id)
}

export function toggleRecord(id) {
  const i = rental.records.indexOf(id)
  i === -1 ? rental.records.push(id) : rental.records.splice(i, 1)
}

export function hasGear(id) {
  return rental.gear.includes(id)
}

export function toggleGear(id) {
  const i = rental.gear.indexOf(id)
  i === -1 ? rental.gear.push(id) : rental.gear.splice(i, 1)
}

export function gearCost(item, days) {
  return item.per === 'day' ? item.price * days : item.price
}

export const money = (n) => `${site.currency}${n}`

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Per-day price lines. With a turntable and at least one record, the first
// record goes into the package (turntable + 1 free record + headphones).
export const summary = computed(() => {
  const days = rental.days
  const records = rental.records.map((id) => catalog.records.find((v) => v.id === id)).filter(Boolean)
  const items = features.gear ? rental.gear.map((id) => catalog.gear.find((g) => g.id === id)).filter(Boolean) : []

  const usePackage = rental.turntable && records.length > 0
  const looseRecords = usePackage ? records.length - 1 : records.length

  const lines = []
  if (usePackage) lines.push({ label: 'Package — turntable + 1 free record + headphones', perDay: pricing.package })
  else if (rental.turntable) lines.push({ label: 'Turntable', perDay: pricing.turntable })
  if (looseRecords) {
    lines.push({ label: usePackage ? plural(looseRecords, 'extra record') : plural(looseRecords, 'record'), perDay: looseRecords * pricing.record })
  }
  for (const line of lines) line.cost = line.perDay * days

  const gearTotal = items.reduce((sum, g) => sum + gearCost(g, days), 0)
  // Off-campus delivery is quoted per location, so it isn't in the total
  const deliveryFee = rental.offCampus ? 0 : delivery.campus.fee
  const perDay = lines.reduce((sum, l) => sum + l.perDay, 0)

  return {
    days,
    records,
    items,
    usePackage,
    lines,
    perDay,
    gearTotal,
    deliveryFee,
    total: perDay * days + gearTotal + deliveryFee,
    count: records.length + items.length,
    // Something to actually rent (a turntable on its own counts)
    hasItems: records.length + items.length > 0 || rental.turntable,
  }
})

// Requests go into the Supabase `orders` table when Supabase is configured;
// otherwise the panel falls back to an email (requestMailto).
export const canSubmitOnline = !!supabase

// Today's date (YYYY-MM-DD) in the visitor's timezone, for the start-date picker
export function today() {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Sends the rental request. Returns the order number; throws with a readable message.
export async function submitOrder() {
  const s = summary.value
  const d = rental.details
  const { data, error } = await supabase.rpc('submit_order', {
    p_name: d.name.trim(),
    p_phone: d.phone.trim(),
    p_location: d.location.trim(),
    p_off_campus: rental.offCampus,
    p_start_date: d.date,
    p_days: s.days,
    p_turntable: rental.turntable,
    p_record_ids: s.records.map((r) => r.id),
    p_notes: d.notes.trim() || null,
    p_estimated_total: s.total,
  })
  if (error) throw new Error(error.message || "Couldn't send your request.")

  // Start fresh for next time, but remember who they are
  rental.records = []
  rental.gear = []
  rental.details.date = ''
  rental.details.notes = ''
  return data
}

export function requestMailto() {
  const s = summary.value
  const d = rental.details
  const lines = [
    'Hi VOX,',
    '',
    "I'd like to book a rental:",
    '',
    `Rental length: ${plural(s.days, 'day')}`,
    `Turntable: ${rental.turntable ? (s.usePackage ? 'Yes — package with headphones' : 'Yes') : 'No — I have my own'}`,
    '',
    'Records:',
    ...(s.records.length
      ? s.records.map((r, i) => `  ${i + 1}. ${r.title} — ${r.artist}${s.usePackage && i === 0 ? ' (free with the package)' : ''}`)
      : [rental.turntable ? '  none — turntable only' : '  (please help me choose)']),
    '',
    ...(features.gear
      ? ['Add-ons:', ...(s.items.length ? s.items.map((g) => `  - ${g.name}`) : ['  none']), '']
      : []),
    'Price:',
    ...s.lines.map((l) => `  ${l.label}: ${money(l.perDay)}/day × ${s.days} = ${money(l.cost)}`),
    `  Delivery: ${rental.offCampus ? `${delivery.offCampus.label}, fee to be quoted` : `${delivery.campus.label}, free`}`,
    `Estimated total: ${money(s.total)}${rental.offCampus ? ' + delivery' : ''}`,
    '',
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Delivery location: ${d.location}`,
    `Start date: ${d.date}`,
    d.notes ? `Notes: ${d.notes}` : '',
    '',
    'Thanks!',
  ]
  const subject = `Rental request — ${plural(s.days, 'day')}${d.name ? ` — ${d.name}` : ''}`
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}
