<script setup>
import { ref } from 'vue'
import RecordArt from './RecordArt.vue'
import { genreLabel } from '../stores/catalog'
import { hasRecord, toggleRecord } from '../stores/rental'

defineProps({
  record: { type: Object, required: true },
})
defineEmits(['open'])

const hover = ref(false)
const statusClass = { Available: 'in', 'In Rent': 'out', 'Coming Soon': 'soon' }
</script>

<template>
  <article
    class="card"
    :class="{ 'is-hover': hover, 'on-loan': !record.available }"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <button class="open" @click="$emit('open', record)" @focus="hover = true" @blur="hover = false">
      <RecordArt :record="record" />
      <div class="meta">
        <div class="row">
          <span class="genre" :title="[genreLabel(record), record.year].filter(Boolean).join(' · ')">
            <span class="genre-name">{{ genreLabel(record) }}</span><span v-if="record.year">{{ record.genres.length ? ' · ' : '' }}{{ record.year }}</span>
          </span>
          <span class="status" :class="statusClass[record.status]">{{ record.status }}</span>
        </div>
        <h3>{{ record.title }}</h3>
        <p class="artist">{{ record.artist }}</p>
        <p v-if="record.artistAlt" class="artist-alt" lang="ja">{{ record.artistAlt }}</p>
      </div>
    </button>

    <button
      class="add"
      :class="{ added: hasRecord(record.id) }"
      :disabled="!record.available"
      @click="toggleRecord(record.id)"
    >
      <template v-if="record.status === 'In Rent'">Currently in rent</template>
      <template v-else-if="record.status === 'Coming Soon'">Coming soon</template>
      <template v-else-if="hasRecord(record.id)">✓ In your rental</template>
      <template v-else>+ Add to rental</template>
    </button>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%; /* fill the grid row so buttons line up */
  min-width: 0; /* let long one-line text truncate instead of widening the grid column */
}

.open {
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1; /* takes the spare height, pushing the button to the bottom */
  cursor: pointer;
  border-radius: var(--radius);
}

.open:focus-visible {
  outline: 3px solid var(--red);
  outline-offset: 6px;
}

.on-loan :deep(.sleeve) {
  filter: grayscale(0.7) brightness(0.95);
}

.meta {
  padding-right: 14%;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.genre {
  display: flex;
  min-width: 0;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.genre-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.status {
  flex: none;
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.status.in {
  background: var(--ink);
  color: var(--paper);
}

.status.soon {
  border: 1px solid var(--red);
  color: var(--red-dark);
}

.status.out {
  border: 1px solid var(--line);
  color: var(--muted);
}

h3 {
  font-size: 20px;
  line-height: 1.1;
  font-stretch: 100%;
  font-weight: 800;
}

.artist-alt {
  font-size: 14px;
  color: var(--muted);
  opacity: 0.85;
}

.artist {
  color: var(--muted);
  margin-top: 2px;
}

.add {
  margin-top: auto;
  margin-right: 14%;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  background: transparent;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.add:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.add.added {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
}

.add:disabled {
  border-color: var(--line);
  color: var(--muted);
  cursor: not-allowed;
}
</style>
