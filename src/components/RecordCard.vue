<script setup>
import { ref } from 'vue'
import RecordArt from './RecordArt.vue'
import { hasRecord, toggleRecord } from '../stores/rental'

defineProps({
  record: { type: Object, required: true },
})
defineEmits(['open'])

const hover = ref(false)
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
          <span class="genre">{{ record.genre }} · {{ record.year }}</span>
          <span class="status" :class="record.available ? 'in' : 'out'">
            {{ record.available ? 'Available' : 'On loan' }}
          </span>
        </div>
        <h3>{{ record.title }}</h3>
        <p class="artist">{{ record.artist }}</p>
      </div>
    </button>

    <button
      class="add"
      :class="{ added: hasRecord(record.id) }"
      :disabled="!record.available"
      @click="toggleRecord(record.id)"
    >
      <template v-if="!record.available">Currently on loan</template>
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
}

.open {
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.status {
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

.artist {
  color: var(--muted);
  margin-top: 2px;
}

.add {
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
