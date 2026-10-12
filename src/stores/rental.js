import { computed, reactive, watch } from 'vue'
import { catalog } from './catalog'
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
// record goes into the package (cheaper than turntable + record separately).
export const summary = computed(() => {
  const days = rental.days
  const records = rental.records.map((id) => catalog.records.find((v) => v.id === id)).filter(Boolean)
  const items = features.gear ? rental.gear.map((id) => catalog.gear.find((g) => g.id === id)).filter(Boolean) : []

  const usePackage = rental.turntable && records.length > 0
  const looseRecords = usePackage ? records.length - 1 : records.length

  const lines = []
  if (usePackage) lines.push({ label: 'Package — turntable + 1 record', perDay: pricing.package })
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
    // What the package saves per day versus renting the turntable and record separately
    packageSaving: usePackage ? pricing.turntable + pricing.record - pricing.package : 0,
    gearTotal,
    deliveryFee,
    total: perDay * days + gearTotal + deliveryFee,
    count: records.length + items.length,
    // Something to actually rent (a turntable on its own counts)
    hasItems: records.length + items.length > 0 || rental.turntable,
  }
})

export function requestMailto() {
  const s = summary.value
  const d = rental.details
  const lines = [
    'Hi VOX,',
    '',
    "I'd like to book a rental:",
    '',
    `Rental length: ${plural(s.days, 'day')}`,
    `Turntable: ${rental.turntable ? 'Yes' : 'No — I have my own'}`,
    '',
    'Records:',
    ...(s.records.length
      ? s.records.map((r, i) => `  ${i + 1}. ${r.title} — ${r.artist}${s.usePackage && i === 0 ? ' (package)' : ''}`)
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
