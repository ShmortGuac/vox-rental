import { computed, reactive, watch } from 'vue'
import { catalog } from './catalog'
import { site, durations, extraRecord, delivery, features } from '../data/site'

const STORAGE_KEY = 'vox-rental'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

const saved = load()

// The rental the visitor is putting together. Kept in localStorage so it
// survives a page refresh.
export const rental = reactive({
  records: saved.records ?? [],
  gear: saved.gear ?? [],
  durationId: saved.durationId ?? durations[0].id,
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

export const summary = computed(() => {
  const duration = durations.find((d) => d.id === rental.durationId) ?? durations[0]
  const days = duration.days
  const records = rental.records.map((id) => catalog.records.find((v) => v.id === id)).filter(Boolean)
  const items = features.gear ? rental.gear.map((id) => catalog.gear.find((g) => g.id === id)).filter(Boolean) : []

  const extraCount = Math.max(0, records.length - 1)
  const extraRecordsCost = extraCount * (extraRecord.per === 'day' ? extraRecord.price * days : extraRecord.price)
  const gearTotal = items.reduce((sum, g) => sum + gearCost(g, days), 0)
  const deliveryFee = rental.offCampus ? delivery.offCampus.fee : delivery.campus.fee

  return {
    duration,
    days,
    records,
    items,
    extraCount,
    extraRecordsCost,
    gearTotal,
    deliveryFee,
    total: duration.price + extraRecordsCost + gearTotal + deliveryFee,
    count: records.length + items.length,
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
    `Rental length: ${s.duration.label} (turntable + 1 record) — ${money(s.duration.price)}`,
    '',
    'Records:',
    ...(s.records.length
      ? s.records.map((r, i) => `  ${i + 1}. ${r.title} — ${r.artist}${i === 0 ? ' (included)' : ' (extra)'}`)
      : ['  (please help me choose)']),
    '',
    ...(features.gear
      ? ['Add-ons:', ...(s.items.length ? s.items.map((g) => `  - ${g.name}`) : ['  none']), '']
      : []),
    `Delivery: ${rental.offCampus ? 'Off campus' : 'On campus'}`,
    `Estimated total: ${money(s.total)}${rental.offCampus ? ' (delivery fee to be confirmed)' : ''}`,
    '',
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Delivery location: ${d.location}`,
    `Start date: ${d.date}`,
    d.notes ? `Notes: ${d.notes}` : '',
    '',
    'Thanks!',
  ]
  const subject = `Rental request — ${s.duration.label}${d.name ? ` — ${d.name}` : ''}`
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}
