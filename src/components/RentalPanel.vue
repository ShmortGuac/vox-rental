<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import GearIcon from './GearIcon.vue'
import { pricing, maxDays, delivery, features } from '../data/site'
import {
  rental, summary, clampDays, toggleRecord, toggleGear, gearCost, money, requestMailto, canSubmitOnline, submitOrder, today,
} from '../stores/rental'

const route = useRoute()
const panel = ref(null)

const mailto = computed(() => requestMailto())
const canSend = computed(
  () =>
    summary.value.hasItems &&
    rental.details.name.trim() &&
    rental.details.phone.trim() &&
    rental.details.location.trim() &&
    rental.details.date >= today(),
)

const sending = ref(false)
const sendError = ref('')
const sentId = ref(null) // order number once the request is in

async function send() {
  if (!canSend.value || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    sentId.value = await submitOrder()
  } catch (e) {
    sendError.value = e.message
  } finally {
    sending.value = false
  }
}

function close() {
  rental.panelOpen = false
  sentId.value = null
  sendError.value = ''
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(
  () => rental.panelOpen,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      document.addEventListener('keydown', onKey)
      await nextTick()
      panel.value?.focus()
    } else {
      document.removeEventListener('keydown', onKey)
    }
  },
)

watch(() => route.fullPath, close)

onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <!-- Floating summary bar -->
  <Transition name="bar">
    <button v-if="summary.count && !rental.panelOpen" class="bar" @click="rental.panelOpen = true">
      <span class="bar-disc" aria-hidden="true" />
      <span class="bar-text">
        <strong>Your rental</strong>
        <span>
          {{ summary.records.length }} {{ summary.records.length === 1 ? 'record' : 'records' }}
          <template v-if="summary.items.length"> · {{ summary.items.length }} add-on{{ summary.items.length > 1 ? 's' : '' }}</template>
        </span>
      </span>
      <span class="bar-total">{{ money(summary.total) }} →</span>
    </button>
  </Transition>

  <!-- Drawer -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="rental.panelOpen" class="overlay" @click.self="close">
        <aside ref="panel" class="drawer" role="dialog" aria-modal="true" aria-label="Your rental" tabindex="-1">
          <header class="drawer-head">
            <h2>Your rental</h2>
            <button class="close" aria-label="Close" @click="close">×</button>
          </header>

          <!-- Request sent -->
          <div v-if="sentId" class="drawer-body done" role="status">
            <span class="done-disc" aria-hidden="true" />
            <h3 class="done-title">Request sent!</h3>
            <p class="done-ref">Order <strong>#{{ sentId }}</strong></p>
            <p>
              Thanks, {{ rental.details.name.split(' ')[0] }}. We'll contact you on <strong class="nowrap">{{ rental.details.phone }}</strong>
              to confirm your rental{{ rental.offCampus ? ' and quote the delivery fee' : '' }}.
            </p>
            <button class="btn btn--ghost" @click="close">Done</button>
          </div>

          <div v-else class="drawer-body">
            <!-- Turntable -->
            <section>
              <h3>Turntable</h3>
              <div class="seg">
                <button :class="{ active: rental.turntable }" :aria-pressed="rental.turntable" @click="rental.turntable = true">
                  <strong>Rent one</strong>
                  <span>{{ money(pricing.package) }}/day with a free record + headphones</span>
                </button>
                <button :class="{ active: !rental.turntable }" :aria-pressed="!rental.turntable" @click="rental.turntable = false">
                  <strong>I have my own</strong>
                  <span>Records only</span>
                </button>
              </div>
              <p class="note">
                <template v-if="!rental.turntable">Each record is {{ money(pricing.record) }}/day.</template>
                <template v-else-if="summary.usePackage">
                  Package — turntable, your first record free and headphones, {{ money(pricing.package) }}/day.
                </template>
                <template v-else>Turntable on its own is {{ money(pricing.turntable) }}/day, without headphones. Add a record to get the package — your first record is free and headphones are included.</template>
              </p>
            </section>

            <!-- Days -->
            <section>
              <h3>How many days?</h3>
              <div class="days">
                <button class="step" aria-label="One day less" :disabled="rental.days <= 1" @click="rental.days = clampDays(rental.days - 1)">−</button>
                <label class="days-value">
                  <input
                    :value="rental.days"
                    type="number"
                    inputmode="numeric"
                    min="1"
                    :max="maxDays"
                    aria-label="Number of days"
                    @change="rental.days = clampDays($event.target.value); $event.target.value = rental.days"
                  />
                  <span>{{ rental.days === 1 ? 'day' : 'days' }}</span>
                </label>
                <button class="step" aria-label="One day more" :disabled="rental.days >= maxDays" @click="rental.days = clampDays(rental.days + 1)">+</button>
                <span class="per-day">{{ money(summary.perDay) }}/day</span>
              </div>
              <p class="note">Need longer than {{ maxDays }} days? Ask us in the notes.</p>
            </section>

            <!-- Records -->
            <section>
              <h3>Records</h3>
              <ul v-if="summary.records.length" class="lines">
                <li v-for="(r, i) in summary.records" :key="r.id">
                  <img v-if="r.image" class="swatch" :src="r.image" alt="" />
                  <span v-else class="swatch" :style="{ background: r.cover.a }" />
                  <span class="line-main">
                    <strong>{{ r.title }}</strong>
                    <small>{{ r.artist }}</small>
                  </span>
                  <span class="line-price">
                    {{ summary.usePackage && i === 0 ? 'Free' : `${money(pricing.record)}/day` }}
                  </span>
                  <button class="remove" :aria-label="`Remove ${r.title}`" @click="toggleRecord(r.id)">×</button>
                </li>
              </ul>
              <p v-else class="empty">
                {{ rental.turntable ? 'No records yet — your first one is free with the package.' : 'No records picked yet.' }}
              </p>
              <RouterLink to="/catalog" class="link">Browse records →</RouterLink>
            </section>

            <!-- Gear -->
            <section v-if="features.gear">
              <h3>Add-ons</h3>
              <ul v-if="summary.items.length" class="lines">
                <li v-for="g in summary.items" :key="g.id">
                  <span class="swatch gear"><GearIcon :name="g.icon" /></span>
                  <span class="line-main">
                    <strong>{{ g.name }}</strong>
                    <small>{{ money(g.price) }} / {{ g.per }}</small>
                  </span>
                  <span class="line-price">+{{ money(gearCost(g, summary.days)) }}</span>
                  <button class="remove" :aria-label="`Remove ${g.name}`" @click="toggleGear(g.id)">×</button>
                </li>
              </ul>
              <p v-else class="empty">Headphones, speakers and more — optional.</p>
              <RouterLink :to="{ path: '/catalog', query: { tab: 'gear' } }" class="link">Browse gear →</RouterLink>
            </section>

            <!-- Delivery -->
            <section>
              <h3>Delivery</h3>
              <div class="seg">
                <button :class="{ active: !rental.offCampus }" :aria-pressed="!rental.offCampus" @click="rental.offCampus = false">
                  <strong>{{ delivery.campus.label }}</strong>
                  <span>Free</span>
                </button>
                <button :class="{ active: rental.offCampus }" :aria-pressed="rental.offCampus" @click="rental.offCampus = true">
                  <strong>{{ delivery.offCampus.label }}</strong>
                  <span>Fee by location</span>
                </button>
              </div>
              <p class="note">{{ rental.offCampus ? delivery.offCampus.note : delivery.campus.note }}</p>
            </section>

            <!-- Details -->
            <section>
              <h3>Your details</h3>
              <div class="fields">
                <label>Name<input v-model="rental.details.name" autocomplete="name" /></label>
                <label>Phone<input v-model="rental.details.phone" type="tel" autocomplete="tel" /></label>
                <label class="wide">
                  {{ rental.offCampus ? 'Delivery address' : 'Where on campus? (hall, room, building)' }}
                  <input v-model="rental.details.location" />
                </label>
                <label>Start date<input v-model="rental.details.date" type="date" :min="today()" required /></label>
                <label class="wide">Notes (optional)<input v-model="rental.details.notes" /></label>
              </div>
            </section>
          </div>

          <footer v-if="!sentId" class="drawer-foot">
            <dl class="totals">
              <div v-for="l in summary.lines" :key="l.label">
                <dt>{{ l.label }} <small>{{ money(l.perDay) }} × {{ summary.days }}</small></dt>
                <dd>{{ money(l.cost) }}</dd>
              </div>
              <div v-if="summary.items.length"><dt>Add-ons</dt><dd>{{ money(summary.gearTotal) }}</dd></div>
              <div><dt>Delivery</dt><dd>{{ rental.offCampus ? 'Quoted by location' : 'Free' }}</dd></div>
              <div class="grand"><dt>Estimated total</dt><dd>{{ money(summary.total) }}<small v-if="rental.offCampus"> + delivery</small></dd></div>
            </dl>
            <button v-if="canSubmitOnline" class="btn btn--red send" :disabled="!canSend || sending" @click="send">
              {{ sending ? 'Sending…' : 'Send rental request' }}
            </button>
            <a v-else class="btn btn--red send" :href="mailto" :aria-disabled="!canSend">Send rental request</a>
            <p v-if="sendError" class="send-error" role="alert">{{ sendError }}</p>
            <p v-else class="foot-note">
              <template v-if="!summary.hasItems">Pick a record or rent a turntable to send a request.</template>
              <template v-else-if="canSend">We'll confirm availability and the final price with you before anything's due.</template>
              <template v-else>Fill in your name, phone, location and start date to send.</template>
            </p>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Floating bar */
.bar {
  position: fixed;
  z-index: 60;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 22px 10px 10px;
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.5);
  text-align: left;
}

.bar:hover .bar-disc {
  animation: spin 1.8s linear infinite;
}

.bar-disc {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background:
    radial-gradient(circle, var(--paper) 0 6%, var(--red) 6.5% 30%, transparent 31%),
    repeating-radial-gradient(circle, #2a2a2a 0 1.5px, #1a1a1a 1.5px 3px);
}

.bar-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.bar-text span {
  font-size: 13px;
  color: #b9b3aa;
}

.bar-total {
  font-weight: 850;
  margin-left: 10px;
  white-space: nowrap;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.bar-enter-active,
.bar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.bar-enter-from,
.bar-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Drawer */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(19, 19, 19, 0.55);
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(480px, 100%);
  height: 100%;
  background: var(--card);
  display: flex;
  flex-direction: column;
  outline: none;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-enter-active .drawer,
.drawer-leave-active .drawer {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer,
.drawer-leave-to .drawer {
  transform: translateX(100%);
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.drawer-head h2 {
  font-size: 28px;
}

.close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.close:hover {
  background: var(--paper);
}

.drawer-body {
  counter-reset: step;
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 24px;
}

section {
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

section:last-child {
  border-bottom: 0;
}

h3::before {
  counter-increment: step;
  content: counter(step) '. ';
}

h3 {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 12px;
  font-stretch: 100%;
}

.seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 8px;
}

.seg button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.seg button span {
  font-size: 14px;
  color: var(--muted);
}

.seg button.active {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.seg button.active span {
  color: var(--red);
}

/* Day picker */
.days {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.step:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.step:disabled {
  border-color: var(--line);
  color: var(--muted);
  cursor: not-allowed;
}

.days-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding-inline: 4px;
}

.days-value input {
  width: 2.6ch;
  border: 0;
  border-bottom: 1.5px solid var(--line);
  background: transparent;
  font-size: 28px;
  font-weight: 850;
  text-align: center;
  -moz-appearance: textfield;
  appearance: textfield;
}

.days-value input::-webkit-inner-spin-button,
.days-value input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.days-value input:focus {
  border-color: var(--ink);
  outline: none;
}

.days-value span {
  color: var(--muted);
}

.per-day {
  margin-left: auto;
  font-weight: 800;
}

.note,
.empty {
  margin-top: 10px;
  font-size: 14px;
  color: var(--muted);
}

.lines {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lines li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.swatch {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 4px;
}

img.swatch {
  object-fit: cover;
}

.swatch.gear {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
}

.swatch.gear svg {
  width: 60%;
  height: auto;
}

.line-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.line-main strong,
.line-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-main small {
  color: var(--muted);
}

.line-price {
  font-weight: 700;
  font-size: 15px;
}

.remove {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
}

.remove:hover {
  background: var(--paper);
  color: var(--ink);
}

.link {
  display: inline-block;
  margin-top: 10px;
  font-weight: 700;
  font-size: 15px;
  color: var(--red-dark);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.fields label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.fields .wide {
  grid-column: 1 / -1;
}

.fields input {
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid var(--line);
  background: #fff;
  font-weight: 400;
}

.fields input:focus {
  border-color: var(--ink);
  outline: none;
}

.drawer-foot {
  padding: 18px 24px 22px;
  border-top: 1px solid var(--line);
  background: var(--paper);
}

.totals {
  margin: 0 0 14px;
}

.totals div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  padding: 2px 0;
}

.totals dt {
  color: var(--muted);
}

.totals dt small {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.totals dd {
  margin: 0;
  font-weight: 600;
}

.totals .grand {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--line);
  font-size: 18px;
}

.totals .grand dt {
  color: var(--ink);
  font-weight: 700;
}

.totals .grand dd {
  font-weight: 900;
}

.totals .grand dd small {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.send {
  width: 100%;
  justify-content: center;
}

.send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.send-error {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--red-dark);
  text-align: center;
}

/* Request sent */
.done {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding-bottom: 64px;
}

.done-disc {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin-bottom: 8px;
  background:
    radial-gradient(circle, var(--paper) 0 6%, var(--red) 6.5% 30%, transparent 31%),
    repeating-radial-gradient(circle, #2a2a2a 0 1.5px, #1a1a1a 1.5px 3px);
  animation: spin 2.4s linear infinite;
}

.done h3.done-title {
  font-family: var(--font);
  font-size: 32px;
  font-weight: 850;
  font-stretch: 112%;
  text-transform: none;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin: 0;
}

.done h3.done-title::before {
  content: none;
}

.done-ref {
  font-family: var(--mono);
  font-size: 15px;
}

.done p {
  max-width: 34ch;
  color: var(--muted);
}

.nowrap {
  white-space: nowrap;
}

.done .btn {
  margin-top: 12px;
}

.foot-note {
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 640px) {
  .bar {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
  .bar-total {
    margin-left: auto;
  }
  .drawer-head,
  .drawer-body,
  .drawer-foot {
    padding-inline: 16px;
  }
}
</style>
