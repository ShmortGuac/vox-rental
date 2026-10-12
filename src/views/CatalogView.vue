<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecordCard from '../components/RecordCard.vue'
import RecordModal from '../components/RecordModal.vue'
import GearCard from '../components/GearCard.vue'
import { catalog, genres } from '../stores/catalog'
import { pricing, features, site } from '../data/site'
import { money } from '../stores/rental'

const route = useRoute()
const router = useRouter()

// Filters live in the URL (?genre=Jazz&q=miles) so they can be linked and shared.
function queryRef(key, fallback = '') {
  return computed({
    get: () => route.query[key] ?? fallback,
    set: (val) => {
      const query = { ...route.query, [key]: val || undefined }
      router.replace({ query })
    },
  })
}

// Search is local state so typing stays snappy; it's mirrored into the URL.
const search = ref(route.query.q ?? '')
watch(search, (q) => router.replace({ query: { ...route.query, q: q || undefined } }))
watch(() => route.query.q, (q) => { if ((q ?? '') !== search.value) search.value = q ?? '' })
const tab = queryRef('tab', 'records')
const genre = queryRef('genre', 'All')
const sort = queryRef('sort', 'title')
const onlyAvailable = computed({
  get: () => route.query.available === '1',
  set: (val) => router.replace({ query: { ...route.query, available: val ? '1' : undefined } }),
})

const selected = ref(null)

const sorters = {
  title: (a, b) => a.title.localeCompare(b.title),
  artist: (a, b) => a.artist.localeCompare(b.artist),
  newest: (a, b) => b.year - a.year,
  oldest: (a, b) => a.year - b.year,
}

const results = computed(() => {
  const q = search.value.trim().toLowerCase()
  return catalog.records
    .filter((v) => genre.value === 'All' || v.genres.includes(genre.value))
    .filter((v) => !onlyAvailable.value || v.available)
    .filter((v) => !q || `${v.title} ${v.artist} ${v.artistAlt} ${v.genres.join(' ')} ${v.year}`.toLowerCase().includes(q))
    .sort(sorters[sort.value] ?? sorters.title)
    // Coming Soon records always go last, keeping the chosen order within each group
    .sort((a, b) => (a.status === 'Coming Soon') - (b.status === 'Coming Soon'))
})

function reset() {
  router.replace({ query: {} })
}
</script>

<template>
  <section class="head" :class="{ 'no-tabs': !features.gear }">
    <div class="wrap">
      <p class="eyebrow">The catalog</p>
      <h1 v-if="features.gear">Records<br />& gear.</h1>
      <h1 v-else>Every record<br />we've got.</h1>
      <p class="sub">
        Turntable + 1 free record + headphones is {{ money(pricing.package) }}/day. Each extra record — or records on their own — {{ money(pricing.record) }}/day.
      </p>
      <div v-if="features.gear" class="tabs" role="tablist">
        <button role="tab" :aria-selected="tab === 'records'" :class="{ active: tab === 'records' }" @click="tab = ''">
          Records <span>{{ catalog.records.length }}</span>
        </button>
        <button role="tab" :aria-selected="tab === 'gear'" :class="{ active: tab === 'gear' }" @click="tab = 'gear'">
          Gear & add-ons <span>{{ catalog.gear.length }}</span>
        </button>
      </div>
    </div>
  </section>

  <section v-if="features.gear && tab === 'gear'" class="wrap results">
    <p class="count">Optional extras — add as many as you like to your rental.</p>
    <div class="gear-grid">
      <GearCard v-for="g in catalog.gear" :key="g.id" :item="g" />
    </div>
  </section>

  <template v-else>
  <div class="toolbar-wrap">
    <div class="wrap toolbar">
      <label class="search">
        <span class="sr-only">Search records</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input v-model="search" type="search" placeholder="Search title, artist, year…" />
      </label>

      <div class="controls">
        <label class="toggle">
          <input v-model="onlyAvailable" type="checkbox" />
          <span class="switch" aria-hidden="true" />
          Available only
        </label>
        <label class="sort">
          <span>Sort</span>
          <select v-model="sort">
            <option value="title">Title A–Z</option>
            <option value="artist">Artist A–Z</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div class="chips" role="group" aria-label="Filter by genre">
        <button
          v-for="g in ['All', ...genres]"
          :key="g"
          class="chip"
          :class="{ active: genre === g }"
          :aria-pressed="genre === g"
          @click="genre = g === 'All' ? '' : g"
        >
          {{ g }}
        </button>
      </div>
    </div>
  </div>

  <section class="wrap results">
    <p class="count" aria-live="polite">
      Showing {{ results.length }} {{ results.length === 1 ? 'record' : 'records' }}
    </p>

    <p v-if="catalog.error" class="empty">{{ catalog.error }}</p>

    <div v-else-if="catalog.loading" class="grid" aria-label="Loading records">
      <div v-for="n in 8" :key="n" class="skeleton" />
    </div>

    <div v-else-if="results.length" class="grid">
      <RecordCard v-for="r in results" :key="r.id" :record="r" @open="selected = $event" />
    </div>

    <div v-else class="empty">
      <div class="empty-disc" aria-hidden="true" />
      <h2>Nothing in this crate.</h2>
      <p>Try a different search or genre — or tell us what you're looking for.</p>
      <div class="empty-actions">
        <button class="btn btn--ghost" @click="reset">Clear filters</button>
        <a class="btn btn--red" :href="site.suggestUrl" target="_blank" rel="noopener">Suggest a vinyl ↗</a>
      </div>
    </div>

    <aside v-if="!catalog.loading && !catalog.error && results.length" class="suggest">
      <div class="suggest-disc" aria-hidden="true" />
      <div class="suggest-text">
        <h2>Can't find a record?</h2>
        <p>Tell us what you'd love to spin and we'll try to add it to the crates.</p>
      </div>
      <a class="btn" :href="site.suggestUrl" target="_blank" rel="noopener">Suggest a vinyl ↗</a>
    </aside>
  </section>
  </template>

  <RecordModal v-if="selected" :record="selected" @close="selected = null" />
</template>

<style scoped>
.head {
  padding: 64px 0 0;
}

.head.no-tabs {
  padding-bottom: 40px;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-top: 36px;
}

.tabs button {
  padding: 14px 20px;
  border: 0;
  border-bottom: 3px solid transparent;
  background: none;
  font-weight: 700;
  font-size: 17px;
  color: var(--muted);
  cursor: pointer;
}

.tabs button.active {
  color: var(--ink);
  border-bottom-color: var(--red);
}

.tabs span {
  font-family: var(--mono);
  font-weight: 400;
  font-size: 13px;
  margin-left: 4px;
}

.gear-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

h1 {
  font-size: clamp(44px, 7vw, 88px);
  text-transform: uppercase;
  font-stretch: 85%;
  font-weight: 900;
  line-height: 0.92;
  margin-top: 14px;
}

.sub {
  margin-top: 20px;
  color: var(--muted);
  font-size: 18px;
}

.toolbar-wrap {
  position: sticky;
  top: 72px;
  z-index: 10;
  background: color-mix(in srgb, var(--paper) 94%, transparent);
  backdrop-filter: blur(10px);
  border-block: 1px solid var(--line);
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px 24px;
  padding-block: 16px;
  align-items: center;
}

.search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  height: 48px;
  border-radius: 999px;
  background: var(--card);
  border: 1.5px solid var(--line);
  color: var(--muted);
  max-width: 460px;
}

.search:focus-within {
  border-color: var(--ink);
  color: var(--ink);
}

.search input {
  border: 0;
  outline: 0;
  background: none;
  width: 100%;
  height: 100%;
  color: var(--ink);
}

.controls {
  display: flex;
  align-items: center;
  gap: 24px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.toggle input {
  position: absolute;
  opacity: 0;
}

.switch {
  width: 40px;
  height: 24px;
  border-radius: 999px;
  background: #d6d0c6;
  position: relative;
  transition: background 0.2s ease;
}

.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
}

.toggle input:checked + .switch {
  background: var(--red);
}

.toggle input:checked + .switch::after {
  transform: translateX(16px);
}

.toggle input:focus-visible + .switch {
  outline: 3px solid var(--red);
  outline-offset: 3px;
}

.sort {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.sort select {
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid var(--line);
  background: var(--card);
  cursor: pointer;
}

.chips {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: none;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  background: transparent;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.chip:hover {
  background: color-mix(in srgb, var(--ink) 8%, transparent);
}

.chip.active {
  background: var(--ink);
  color: var(--paper);
}

.results {
  padding-top: 32px;
}

.count {
  font-family: var(--mono);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 28px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 48px 28px;
}

.skeleton {
  aspect-ratio: 100 / 86;
  border-radius: 6px;
  background: linear-gradient(90deg, #e9e3d9 0%, #f3eee6 50%, #e9e3d9 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  to { background-position: -200% 0; }
}

.empty {
  text-align: center;
  padding: 64px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty h2 {
  font-size: 32px;
}

.empty p {
  color: var(--muted);
  margin-bottom: 12px;
}

.empty-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

/* Suggest-a-vinyl callout */
.suggest {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 72px;
  padding: 28px 32px;
  border-radius: 20px;
  background: var(--ink);
  color: var(--paper);
}

.suggest-disc {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background:
    radial-gradient(circle, var(--paper) 0 6%, var(--red) 6.5% 30%, transparent 31%),
    repeating-radial-gradient(circle, #2a2a2a 0 1.5px, #1a1a1a 1.5px 3px);
}

.suggest-text {
  flex: 1;
}

.suggest h2 {
  font-size: 26px;
}

.suggest p {
  margin-top: 6px;
  color: #b9b3aa;
}

.suggest .btn {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
  white-space: nowrap;
}

.suggest .btn:hover {
  background: var(--red-dark);
  border-color: var(--red-dark);
}

.empty-disc {
  width: 120px;
  aspect-ratio: 1;
  border-radius: 50%;
  margin-bottom: 12px;
  background:
    radial-gradient(circle, var(--paper) 0 5%, var(--red) 5.5% 16%, transparent 16.5%),
    repeating-radial-gradient(circle, #1b1b1b 0 2px, #101010 2px 4px);
}

@media (max-width: 760px) {
  .suggest {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
    gap: 16px;
  }
  .toolbar {
    /* minmax(0, …) so the controls can't stretch the column past the screen edge */
    grid-template-columns: minmax(0, 1fr);
  }
  .search {
    max-width: none;
  }
  .controls {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px 16px;
    min-width: 0;
  }
  .sort select {
    min-width: 0;
    max-width: 100%;
  }
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px 16px;
  }
}
</style>
