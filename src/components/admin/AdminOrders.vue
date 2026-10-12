<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { money } from '../../stores/rental'
import { site } from '../../data/site'

const emit = defineEmits(['notify', 'records-changed'])

const STATUSES = ['Pending', 'Confirmed', 'Active', 'Returned', 'Cancelled']
const OPEN = ['Pending', 'Confirmed', 'Active']
const FILTERS = ['Open', ...STATUSES, 'All']

const orders = ref([])
const loading = ref(false)
const loaded = ref(false)
const filter = ref('Open')
const search = ref('')

async function load({ quiet = false } = {}) {
  if (!quiet) loading.value = true
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
  loading.value = false
  loaded.value = true
  if (error) emit('notify', `Couldn't load orders: ${error.message}`, true)
  else orders.value = data
}

// ─── Dates ──────────────────────────────────────────────────────────────────
const DAY = 86400000
const parseDate = (s) => new Date(`${s}T00:00:00`)
const todayDate = () => parseDate(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10))
const fmtDate = (d) => d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (s) =>
  new Date(s).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// Delivered on start_date, collected `days` days later (a 1-day rental from Mon is collected Tue).
function period(o) {
  const start = parseDate(o.start_date)
  const end = new Date(start.getTime() + o.days * DAY)
  return { start, end }
}

// Something the team should notice about an order right now
function flag(o) {
  const { start, end } = period(o)
  const today = todayDate()
  if (o.status === 'Active' && today > end) return { text: `Overdue · was due ${fmtDate(end)}`, tone: 'bad' }
  if (o.status === 'Active' && +today === +end) return { text: 'Due back today', tone: 'warn' }
  if ((o.status === 'Pending' || o.status === 'Confirmed') && today > start) return { text: 'Start date has passed', tone: 'bad' }
  if ((o.status === 'Pending' || o.status === 'Confirmed') && +today === +start) return { text: 'Starts today', tone: 'warn' }
  return null
}

// Records that are also in another open order whose dates overlap this one
function conflicts(o) {
  if (!OPEN.includes(o.status)) return []
  const { start, end } = period(o)
  const out = []
  for (const other of orders.value) {
    if (other.id === o.id || !OPEN.includes(other.status)) continue
    const p = period(other)
    if (p.start >= end || start >= p.end) continue
    for (const r of o.records) {
      if (other.records.some((x) => x.id === r.id)) out.push({ title: r.title, order: other.id })
    }
  }
  return out
}

// ─── Labels ─────────────────────────────────────────────────────────────────
function kind(o) {
  if (!o.turntable) return 'Records only'
  return o.records.length ? 'Package' : 'Turntable only'
}

function total(o) {
  if (o.estimated_total == null) return null
  if (o.off_campus && o.delivery_fee == null) return null
  return Number(o.estimated_total) + Number(o.delivery_fee ?? 0)
}

// Malaysian numbers: 012-345 6789 → 60123456789 for wa.me links
function whatsapp(phone) {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `6${digits}`
  return `https://wa.me/${digits}`
}

// ─── Lists ──────────────────────────────────────────────────────────────────
const counts = computed(() => {
  const c = { All: orders.value.length, Open: 0 }
  for (const s of STATUSES) c[s] = 0
  for (const o of orders.value) {
    c[o.status]++
    if (OPEN.includes(o.status)) c.Open++
  }
  return c
})

const shown = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^#/, '')
  let list = orders.value.filter((o) =>
    filter.value === 'All' ? true : filter.value === 'Open' ? OPEN.includes(o.status) : o.status === filter.value,
  )
  if (q) {
    list = list.filter((o) =>
      `${o.id} ${o.customer_name} ${o.phone} ${o.location} ${o.records.map((r) => `${r.title} ${r.artist}`).join(' ')}`
        .toLowerCase()
        .includes(q),
    )
  }
  // Open orders: soonest start first, so the next delivery is at the top
  if (filter.value === 'Open') {
    const rank = { Active: 0, Confirmed: 1, Pending: 1 }
    list = [...list].sort((a, b) => rank[a.status] - rank[b.status] || a.start_date.localeCompare(b.start_date))
  }
  return list
})

// ─── Updates ────────────────────────────────────────────────────────────────
async function update(o, changes, message) {
  const previous = Object.fromEntries(Object.keys(changes).map((k) => [k, o[k]]))
  Object.assign(o, changes)
  const { data, error } = await supabase.from('orders').update(changes).eq('id', o.id).select().single()
  if (error || !data) {
    Object.assign(o, previous)
    emit('notify', `Couldn't update order #${o.id}${error ? `: ${error.message}` : ''}`, true)
    return false
  }
  Object.assign(o, data)
  if (message) emit('notify', message)
  return true
}

async function setStatus(o, status) {
  const from = o.status
  const ok = await update(o, { status }, `Order #${o.id} is now ${status}`)
  // The database flips the records' status when an order goes out or comes back
  if (ok && o.records.length && (status === 'Active' || from === 'Active')) emit('records-changed')
}

function setDeliveryFee(o, value) {
  const fee = value === '' ? null : Math.max(0, Number(value))
  if (fee === (o.delivery_fee == null ? null : Number(o.delivery_fee))) return
  update(o, { delivery_fee: fee }, `Delivery fee saved for #${o.id}`)
}

function setAdminNotes(o, value) {
  const notes = value.trim() || null
  if (notes === o.admin_notes) return
  update(o, { admin_notes: notes }, `Notes saved for #${o.id}`)
}

async function remove(o) {
  if (!confirm(`Delete order #${o.id} from ${o.customer_name}? This can't be undone.`)) return
  const { error, count } = await supabase.from('orders').delete({ count: 'exact' }).eq('id', o.id)
  if (error || count === 0) return emit('notify', `Couldn't delete${error ? `: ${error.message}` : ''}`, true)
  orders.value = orders.value.filter((x) => x.id !== o.id)
  emit('notify', `Deleted order #${o.id}`)
}

// Pick up new requests: when the tab regains focus, and every minute while it's visible
function onVisible() {
  if (document.visibilityState === 'visible') load({ quiet: true })
}
let timer
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
  timer = setInterval(() => document.visibilityState === 'visible' && load({ quiet: true }), 60000)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisible)
  clearInterval(timer)
})
</script>

<template>
  <section class="orders">
    <div class="orders-head">
      <div>
        <h1>Orders</h1>
        <p class="muted">
          {{ counts.Pending }} new · {{ counts.Confirmed }} confirmed · {{ counts.Active }} out now
        </p>
      </div>
      <button class="btn btn--ghost small" :disabled="loading" @click="load()">{{ loading ? 'Refreshing…' : '↻ Refresh' }}</button>
    </div>

    <div class="filters" role="tablist" aria-label="Filter orders">
      <button
        v-for="f in FILTERS"
        :key="f"
        role="tab"
        :aria-selected="filter === f"
        :class="{ active: filter === f }"
        @click="filter = f"
      >
        {{ f }} <span>{{ counts[f] }}</span>
      </button>
    </div>

    <input v-model="search" class="order-search" type="search" placeholder="Search name, phone, order #, record…" aria-label="Search orders" />

    <p v-if="loading && !loaded" class="muted">Loading orders…</p>
    <p v-else-if="!orders.length" class="no-orders">No orders yet. Requests from the site will show up here.</p>
    <p v-else-if="!shown.length" class="no-orders">No {{ filter === 'All' ? '' : filter.toLowerCase() }} orders{{ search ? ` match “${search}”` : '' }}.</p>

    <ul v-else class="order-list">
      <li v-for="o in shown" :key="o.id" class="order" :class="`o-${o.status.toLowerCase()}`">
        <header class="order-top">
          <div class="order-id">
            <strong>#{{ o.id }}</strong>
            <span>{{ fmtTime(o.created_at) }}</span>
          </div>
          <span v-if="flag(o)" class="flag" :class="flag(o).tone">{{ flag(o).text }}</span>
          <select
            class="order-status"
            :class="`st-${o.status.toLowerCase()}`"
            :value="o.status"
            :aria-label="`Status of order ${o.id}`"
            @change="setStatus(o, $event.target.value)"
          >
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </header>

        <div class="order-grid">
          <div class="cell">
            <p class="label">Customer</p>
            <p class="strong">{{ o.customer_name }}</p>
            <p class="contact">
              <a :href="`tel:${o.phone}`">{{ o.phone }}</a>
              <a :href="whatsapp(o.phone)" target="_blank" rel="noopener" class="wa">WhatsApp</a>
            </p>
          </div>

          <div class="cell">
            <p class="label">{{ o.off_campus ? 'Off campus' : 'On campus' }}</p>
            <p class="strong">{{ o.location }}</p>
          </div>

          <div class="cell">
            <p class="label">{{ o.days }} day{{ o.days === 1 ? '' : 's' }}</p>
            <p class="strong">{{ fmtDate(period(o).start) }} → {{ fmtDate(period(o).end) }}</p>
            <p class="small">Delivery → pickup</p>
          </div>

          <div class="cell">
            <p class="label">{{ kind(o) }}<template v-if="o.turntable && o.records.length"> · headphones</template></p>
            <ol v-if="o.records.length" class="order-records">
              <li v-for="(r, i) in o.records" :key="r.id">
                {{ r.title }} <span>— {{ r.artist }}</span>
                <em v-if="o.turntable && i === 0">free</em>
              </li>
            </ol>
            <p v-else class="strong">Turntable, no records</p>
          </div>
        </div>

        <p v-for="c in conflicts(o)" :key="`${c.title}-${c.order}`" class="conflict">
          ⚠ “{{ c.title }}” is also in order #{{ c.order }} for overlapping dates.
        </p>

        <p v-if="o.notes" class="customer-notes"><span>Customer note:</span> {{ o.notes }}</p>

        <footer class="order-bottom">
          <div class="money">
            <span>Estimate <strong>{{ o.estimated_total != null ? money(Number(o.estimated_total)) : '—' }}</strong></span>
            <label v-if="o.off_campus" class="fee">
              Delivery {{ site.currency }}
              <input
                type="number"
                min="0"
                step="1"
                inputmode="decimal"
                placeholder="quote"
                :value="o.delivery_fee == null ? '' : Number(o.delivery_fee)"
                @change="setDeliveryFee(o, $event.target.value)"
              />
            </label>
            <span v-else>Delivery <strong>Free</strong></span>
            <span class="grand">
              Total <strong>{{ total(o) != null ? money(total(o)) : 'needs delivery quote' }}</strong>
            </span>
          </div>
          <textarea
            class="admin-notes"
            rows="1"
            placeholder="Staff notes (paid, deposit, who's delivering…)"
            :value="o.admin_notes ?? ''"
            :aria-label="`Staff notes for order ${o.id}`"
            @change="setAdminNotes(o, $event.target.value)"
          />
          <button class="icon-btn" :aria-label="`Delete order ${o.id}`" title="Delete order" @click="remove(o)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
          </button>
        </footer>
      </li>
    </ul>
  </section>
</template>

<style scoped>
h1 {
  font-size: 36px;
}

.muted {
  color: var(--muted);
  margin-top: 6px;
}

.orders-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.btn.small {
  padding: 8px 16px;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 8px;
  margin-top: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.filters button {
  flex: none;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--line);
  background: transparent;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.filters button span {
  margin-left: 4px;
  font-family: var(--mono);
  font-weight: 400;
  color: var(--muted);
}

.filters button.active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.filters button.active span {
  color: #b9b3aa;
}

.order-search {
  width: 100%;
  height: 46px;
  margin: 16px 0;
  padding: 0 14px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  font-size: 16px;
}

.order-search:focus {
  outline: none;
  border-color: var(--ink);
}

.no-orders {
  padding: 48px 0;
  text-align: center;
  color: var(--muted);
}

.order-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order {
  background: var(--card);
  border: 1.5px solid var(--line);
  border-left: 6px solid var(--line);
  border-radius: 14px;
  padding: 16px 18px;
}

.order.o-pending {
  border-left-color: var(--red);
}

.order.o-confirmed {
  border-left-color: #e3a72f;
}

.order.o-active {
  border-left-color: var(--ink);
}

.order.o-returned,
.order.o-cancelled {
  opacity: 0.7;
}

.order-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.order-id {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-right: auto;
}

.order-id strong {
  font-size: 20px;
  font-weight: 850;
}

.order-id span {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.flag {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 999px;
}

.flag.warn {
  background: #fdf0d2;
  color: #8a5a00;
}

.flag.bad {
  background: #fde6e6;
  color: var(--red-dark);
}

.order-status {
  height: 36px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px solid var(--line);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  background: #fff;
}

.order-status.st-pending {
  border-color: var(--red);
  color: var(--red-dark);
}

.order-status.st-confirmed {
  border-color: #e3a72f;
  color: #8a5a00;
}

.order-status.st-active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.order-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.4fr;
  gap: 16px 24px;
  margin-top: 14px;
}

.cell {
  min-width: 0;
  line-height: 1.35;
}

.label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 4px;
}

.strong {
  font-weight: 700;
  overflow-wrap: anywhere;
}

.small {
  font-size: 13px;
  color: var(--muted);
}

.contact {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 14px;
}

.contact a {
  color: var(--ink);
}

.contact .wa {
  color: #128c4b;
  font-weight: 700;
}

.order-records {
  margin: 0;
  padding-left: 18px;
  font-size: 14px;
}

.order-records li {
  overflow-wrap: anywhere;
}

.order-records span {
  color: var(--muted);
}

.order-records em {
  margin-left: 6px;
  font-style: normal;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--red-dark);
}

.conflict {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fdf0d2;
  color: #8a5a00;
  font-size: 14px;
  font-weight: 600;
}

.customer-notes {
  margin-top: 12px;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.customer-notes span {
  color: var(--muted);
}

.order-bottom {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.money {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--muted);
}

.money strong {
  color: var(--ink);
}

.money .grand strong {
  font-size: 16px;
}

.fee {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fee input {
  width: 72px;
  height: 32px;
  padding: 0 8px;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
}

.admin-notes {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: 7px 12px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  resize: vertical;
}

.fee input:focus,
.admin-notes:focus {
  outline: none;
  border-color: var(--ink);
}

.icon-btn {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.icon-btn:hover {
  background: #fde6e6;
  color: var(--red-dark);
}

@media (max-width: 900px) {
  .order-grid {
    grid-template-columns: 1fr 1fr;
  }
  .order-bottom {
    flex-wrap: wrap;
  }
  .admin-notes {
    flex-basis: 100%;
    order: 3;
  }
}

@media (max-width: 520px) {
  .order {
    padding: 14px;
  }
  .order-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
