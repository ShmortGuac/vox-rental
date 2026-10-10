<script setup>
// A sleeve with the vinyl peeking out. The record slides out when the parent
// has the `is-hover` state (hover/focus on a card). Pass :disc="false" for
// the sleeve on its own. A "Coming Soon" record gets a banner across the cover.
defineProps({
  record: { type: Object, required: true },
  disc: { type: Boolean, default: true },
})
</script>

<template>
  <div class="art" :class="{ 'no-disc': !disc }">
    <div v-if="disc" class="rec-disc" aria-hidden="true">
      <span class="label" :style="{ background: record.cover.c }" />
    </div>
    <div
      class="sleeve"
      :class="!record.image && `p-${record.cover.pattern}`"
      :style="{ '--a': record.cover.a, '--b': record.cover.b, '--c': record.cover.c }"
    >
      <img v-if="record.image" :src="record.image" :alt="`${record.title} cover`" loading="lazy" />
      <div v-else class="type">
        <span class="t">{{ record.title }}</span>
        <span class="r">{{ record.artist }}</span>
      </div>
    </div>
    <!-- Separate layer over the sleeve, so dimming the cover doesn't dim the banner -->
    <div v-if="record.status === 'Coming Soon'" class="sleeve-overlay" aria-hidden="true">
      <div class="banner"><span>Coming soon</span></div>
    </div>
  </div>
</template>

<style scoped>
.art {
  position: relative;
  aspect-ratio: 100 / 86;
}

.art.no-disc {
  aspect-ratio: 1;
}

.rec-disc {
  position: absolute;
  top: 4%;
  right: 0;
  height: 92%;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 0 31%, rgba(255, 255, 255, 0.06) 31.5% 32%, transparent 32.5%),
    repeating-radial-gradient(circle, #1b1b1b 0 2px, #101010 2px 4px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  display: grid;
  place-items: center;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.label {
  width: 32%;
  aspect-ratio: 1;
  border-radius: 50%;
  position: relative;
}

.label::after {
  content: '';
  position: absolute;
  inset: 44%;
  border-radius: 50%;
  background: var(--paper);
}

:global(.is-hover .rec-disc) {
  transform: translateX(6%) rotate(120deg); /* small enough to stay inside the gap between cards */
}

/* Cards sit closer together on phones */
@media (max-width: 760px) {
  :global(.is-hover .rec-disc) {
    transform: translateX(3%) rotate(120deg);
  }
}

.sleeve {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  background: var(--a);
  color: var(--b);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05), 6px 10px 24px rgba(0, 0, 0, 0.18);
  display: flex;
  align-items: flex-end;
}

/* "Coming soon" band — sized relative to the sleeve so it works on cards and in the popup */
.sleeve-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 6px;
  container-type: inline-size;
  pointer-events: none;
}

.banner {
  position: absolute;
  left: -10%;
  right: -10%;
  top: 50%;
  transform: translateY(-50%) rotate(-12deg);
  padding: 3.5cqw 0;
  background: var(--red);
  color: #fff;
  text-align: center;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  border-block: 2px solid rgba(255, 255, 255, 0.85);
  pointer-events: none;
}

.banner span {
  display: block;
  font-weight: 900;
  font-stretch: 90%;
  font-size: 11cqw;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.sleeve img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.type {
  position: relative;
  padding: 8%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.t {
  font-weight: 850;
  font-stretch: 75%;
  font-size: clamp(18px, 2.2vw, 30px);
  line-height: 0.95;
  text-transform: uppercase;
  letter-spacing: -0.01em;
}

.r {
  font-family: var(--mono);
  font-size: 12px;
  opacity: 0.85;
}

/* Generated cover patterns */
.p-stripes {
  background: repeating-linear-gradient(-45deg, var(--a) 0 18px, color-mix(in srgb, var(--a) 80%, var(--c)) 18px 22px);
}
.p-stripes::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10%;
  background: var(--c);
}

.p-circles::before {
  content: '';
  position: absolute;
  width: 70%;
  aspect-ratio: 1;
  top: 8%;
  right: -12%;
  border-radius: 50%;
  background: repeating-radial-gradient(circle, var(--b) 0 6px, transparent 6px 14px);
  opacity: 0.6;
}

.p-split {
  background: linear-gradient(90deg, var(--a) 0 58%, var(--c) 58%);
}
.p-split::before {
  content: '';
  position: absolute;
  top: 12%;
  left: 12%;
  width: 34%;
  aspect-ratio: 1;
  background: var(--b);
  border-radius: 50%;
}

.p-sun {
  background:
    radial-gradient(circle at 50% -10%, var(--b) 0 30%, transparent 30.5%),
    repeating-conic-gradient(from 0deg at 50% -10%, var(--a) 0 6deg, color-mix(in srgb, var(--a) 75%, var(--b)) 6deg 12deg);
}

.p-grid {
  background-color: var(--a);
  background-image:
    linear-gradient(color-mix(in srgb, var(--b) 35%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--b) 35%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
}
.p-grid::before {
  content: '';
  position: absolute;
  top: 14%;
  right: 14%;
  width: 22%;
  aspect-ratio: 1;
  background: var(--c);
}

.p-waves {
  background:
    repeating-radial-gradient(circle at 0 0, transparent 0 14px, color-mix(in srgb, var(--b) 45%, transparent) 14px 16px),
    var(--a);
}
</style>
