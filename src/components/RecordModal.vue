<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import RecordArt from './RecordArt.vue'
import { genreLabel } from '../stores/catalog'
import { site, extraRecord } from '../data/site'
import { hasRecord, toggleRecord, money, rental } from '../stores/rental'

const props = defineProps({
  record: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const closeBtn = ref(null)
const setlist = computed(() => props.record.setlist)

// Single line breaks flow as normal text; a blank line starts a new paragraph.
const reviewParagraphs = computed(() =>
  (props.record.description || '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean),
)

const waitlistMailto = computed(() => {
  const r = props.record
  const when = r.status === 'Coming Soon' ? 'is available to rent' : 'is back'
  const body = `Hi VOX,\n\nCould you let me know when "${r.title}" by ${r.artist} ${when}?\n\nName:\nPhone:\n\nThanks!`
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

        <!-- Only this inner area scrolls, so the close button stays put -->
        <div class="body">
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
          <p class="eyebrow">{{ [genreLabel(record), record.year].filter(Boolean).join(' · ') }}</p>
          <h2>{{ record.title }}</h2>
          <p class="artist">{{ record.artist }}</p>
          <p v-if="record.artistAlt" class="artist-alt" lang="ja">{{ record.artistAlt }}</p>
          <figure v-if="record.description" class="review">
            <figcaption class="review-label">The {{ site.name }} review</figcaption>
            <blockquote>
              <p v-for="(para, i) in reviewParagraphs" :key="i">{{ para }}</p>
            </blockquote>
            <p class="review-sign">— {{ record.reviewer ? `${record.reviewer} from the ${site.name} Crew` : `The ${site.name} Crew` }}</p>
          </figure>

          <dl>
            <div><dt>Format</dt><dd>{{ record.format }}</dd></div>
            <div><dt>Status</dt><dd>{{ record.status }}</dd></div>
          </dl>

          <div class="buy">
            <template v-if="record.available">
              <button class="btn" :class="hasRecord(record.id) ? 'btn--ghost' : 'btn--red'" @click="toggleRecord(record.id)">
                {{ hasRecord(record.id) ? 'Remove from rental' : '+ Add to rental' }}
              </button>
              <button v-if="hasRecord(record.id)" class="btn btn--red" @click="reviewRental">Review rental →</button>
            </template>
            <a v-else class="btn btn--ghost" :href="waitlistMailto">
              {{ record.status === 'Coming Soon' ? 'Notify me when it arrives' : "Ask when it's back" }}
            </a>
          </div>
          <p class="hint">
            Your first record comes free with the turntable. Each extra record is
            +{{ money(extraRecord.price) }}/{{ extraRecord.per }}.
          </p>
        </div>
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
  display: flex;
  overflow: hidden;
  background: var(--card);
  border-radius: 20px;
  animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.body {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}

.close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  z-index: 1;
  border: 0;
  background: var(--card);
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

.artist-alt {
  font-size: 16px;
  color: var(--muted);
  margin-top: 2px;
}

.artist {
  font-size: 19px;
  color: var(--muted);
  margin-top: 6px;
}

.review {
  position: relative;
  margin: 24px 0 0;
  padding: 20px 22px 18px 22px;
  background: var(--paper);
  border-left: 3px solid var(--red);
  border-radius: 4px 14px 14px 4px;
}

.review::before {
  content: '\201C';
  position: absolute;
  top: 2px;
  right: 16px;
  font-size: 72px;
  font-weight: 900;
  line-height: 1;
  color: var(--red);
  opacity: 0.25;
}

.review-label {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--red-dark);
  margin-bottom: 8px;
}

.review blockquote {
  margin: 0;
  font-size: 17px;
  line-height: 1.6;
}

.review blockquote p + p {
  margin-top: 10px;
}

.review-sign {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--muted);
}

dl {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
  .body {
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
