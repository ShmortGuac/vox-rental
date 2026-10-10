<script setup>
import GearIcon from './GearIcon.vue'
import { hasGear, toggleGear, money } from '../stores/rental'

defineProps({
  item: { type: Object, required: true },
})
</script>

<template>
  <article class="gear" :class="{ 'on-loan': !item.available, added: hasGear(item.id) }">
    <div class="icon">
      <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
      <GearIcon v-else :name="item.icon" />
    </div>
    <div class="body">
      <div class="top">
        <h3>{{ item.name }}</h3>
        <p class="price">
          +{{ money(item.price) }}<span>/ {{ item.per }}</span>
        </p>
      </div>
      <p class="notes">{{ item.description }}</p>
      <button class="add" :disabled="!item.available" @click="toggleGear(item.id)">
        <template v-if="!item.available">Currently out</template>
        <template v-else-if="hasGear(item.id)">✓ Added</template>
        <template v-else>+ Add to rental</template>
      </button>
    </div>
  </article>
</template>

<style scoped>
.gear {
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.gear.added {
  border-color: var(--red);
}

.icon {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  background: var(--ink);
  color: var(--paper);
}

.icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon svg {
  width: 30%;
  height: auto;
}

.gear.added .icon svg {
  color: var(--red);
}

.on-loan .icon {
  background: #8f8a83;
}

.body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

h3 {
  font-size: 20px;
  line-height: 1.15;
  font-stretch: 100%;
  font-weight: 800;
}

.price {
  font-weight: 850;
  white-space: nowrap;
}

.price span {
  font-weight: 400;
  font-size: 14px;
  color: var(--muted);
  margin-left: 2px;
}

.notes {
  color: var(--muted);
  font-size: 15px;
  flex: 1;
}

.add {
  margin-top: 6px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  background: transparent;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}

.add:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.added .add {
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
