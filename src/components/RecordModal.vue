<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import RecordArt from './RecordArt.vue'
import { site, extraRecord } from '../data/site'
import { hasRecord, toggleRecord, money, rental } from '../stores/rental'
import { parseSetlist } from '../stores/catalog'

const props = defineProps({
  record: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const closeBtn = ref(null)
const setlist = computed(() => parseSetlist(props.record.setlist))

const waitlistMailto = computed(() => {
  const r = props.record
  const body = `Hi VOX,\n\nCould you let me know when "${r.title}" by ${r.artist} is back?\n\nName:\nPhone:\n\nThanks!`
  return `mailto:${site.email}?subject=${encodeURIComponent(`Waitlist: ${r.title}`)}&body=${encodeURIComponent(body)}`
})

function reviewRental() {
  emit('close')
  rental.panelOpen = true
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  closeBtn.value?.focus()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-label="record.title">
        <button ref="closeBtn" class="close" aria-label="Close" @click="emit('close')">×</button>

        <div class="side">
          <div class="art-wrap">
            <RecordArt :record="record" :disc="false" />
          </div>

          <section v-if="setlist.length" class="setlist">
            <h3>Setlist</h3>
            <div v-for="(group, gi) in setlist" :key="gi" class="side-group">
              <p v-if="group.side" class="side-label">{{ group.side }}</p>
              <ol>
                <li v-for="(track, ti) in group.tracks" :key="ti">{{ track }}</li>
              </ol>
            </div>
          </section>
        </div>

        <div class="info">
          <p class="eyebrow">{{ record.genre }} · {{ record.year }}</p>
          <h2>{{ record.title }}</h2>
          <p class="artist">{{ record.artist }}</p>
          <p v-if="record.description" class="notes">{{ record.description }}</p>

          <dl>
            <div><dt>Format</dt><dd>{{ record.format }}</dd></div>
            <div><dt>Condition</dt><dd>{{ record.condition }}</dd></div>
            <div><dt>Status</dt><dd>{{ record.available ? 'Available' : 'On loan' }}</dd></div>
          </dl>

          <div class="buy">
            <template v-if="record.available">
              <button class="btn" :class="hasRecord(record.id) ? 'btn--ghost' : 'btn--red'" @click="toggleRecord(record.id)">
                {{ hasRecord(record.id) ? 'Remove from rental' : '+ Add to rental' }}
              </button>
              <button v-if="hasRecord(record.id)" class="btn btn--red" @click="reviewRental">Review rental →</button>
            </template>
            <a v-else class="btn btn--ghost" :href="waitlistMailto">Ask when it's back</a>
          </div>
          <p class="hint">
            Your first record comes free with the turntable. Each extra record is
            +{{ money(extraRecord.price) }}/{{ extraRecord.per }}.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(19, 19, 19, 0.6);
  display: grid;
  place-items: center;
  padding: 16px;
  animation: fade 0.2s ease;
}

.dialog {
  position: relative;
  width: min(920px, 100%);
  max-height: calc(100vh - 32px);
  overflow: auto;
  background: var(--card);
  border-radius: 20px;
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
  animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
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

.setlist {
  margin-top: 28px;
}

.setlist h3 {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-stretch: 100%;
  margin-bottom: 10px;
}

.side-group + .side-group {
  margin-top: 14px;
}

.side-label {
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 4px;
}

.setlist ol {
  margin: 0;
  padding-left: 26px;
  font-size: 15px;
}

.setlist li {
  padding: 3px 0;
  border-bottom: 1px solid var(--line);
}

.setlist li::marker {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.info {
  position: sticky;
  top: 0;
}

h2 {
  font-size: clamp(28px, 4vw, 42px);
  margin-top: 8px;
}

.artist {
  font-size: 19px;
  color: var(--muted);
  margin-top: 6px;
}

.notes {
  margin-top: 20px;
}

dl {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 24px 0;
  padding: 16px 0;
  border-block: 1px solid var(--line);
}

dt {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

dd {
  margin: 2px 0 0;
  font-weight: 700;
}

.buy {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hint {
  margin-top: 16px;
  font-size: 14px;
  color: var(--muted);
}

@keyframes fade {
  from { opacity: 0; }
}

@keyframes pop {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
}

@media (max-width: 720px) {
  .dialog {
    grid-template-columns: 1fr;
    padding: 24px;
    gap: 24px;
  }
  .art-wrap {
    max-width: 280px;
  }
  /* Stack as: cover, details, then setlist */
  .side {
    display: contents;
  }
  .info {
    position: static;
    order: 1;
  }
  .setlist {
    order: 2;
    margin-top: 0;
  }
}
</style>
