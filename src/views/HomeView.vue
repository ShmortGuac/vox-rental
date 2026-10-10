<script setup>
import { computed, ref } from 'vue'
import RecordCard from '../components/RecordCard.vue'
import RecordModal from '../components/RecordModal.vue'
import GearCard from '../components/GearCard.vue'
import { catalog, genres } from '../stores/catalog'
import { site, durations, extraRecord, delivery, faqs, features } from '../data/site'
import { money } from '../stores/rental'

const featured = computed(() => catalog.records.filter((v) => v.available).slice(0, 4))
const featuredGear = computed(() => catalog.gear.filter((g) => g.available).slice(0, 3))
const selected = ref(null)

const steps = [
  { n: '01', title: 'Pick a record', text: 'Choose a record from the catalog. It comes with the turntable. Want more than one? Add extras for a small fee.' },
  { n: '02', title: 'Choose how long', text: 'Rent for a day, a few days or a week. Want more than one record? Add extras for a small fee.' },
  { n: '03', title: 'We deliver & set up', text: "We bring everything to you free anywhere on campus, set it up, and collect it when you're done. Off campus? We deliver for a fee." },
]
</script>

<template>
  <!-- Hero -->
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Turntable & vinyl rentals · {{ site.campusName }}</p>
        <h1>Spin it.<br />Return it.<br /><span>Spin something new.</span></h1>
        <p class="lede">
          {{ site.name }} rents out a turntable with a record of your choice, delivered free anywhere on campus.
          Want more than one record? Add as many as you like.
        </p>
        <div class="ctas">
          <RouterLink to="/catalog" class="btn btn--red">Browse the catalog →</RouterLink>
          <a href="#pricing" class="btn btn--ghost">See pricing</a>
        </div>
        <ul class="stats">
          <li><strong>{{ money(durations[0].price) }}</strong><span>turntable + record, {{ durations[0].label.toLowerCase() }}</span></li>
          <li><strong>{{ catalog.records.length }}+</strong><span>records to choose from</span></li>
          <li><strong>Free</strong><span>campus delivery</span></li>
        </ul>
      </div>

      <div class="turntable" aria-hidden="true">
        <div class="platter">
          <div class="record">
            <div class="record-label"><span>VOX</span></div>
          </div>
        </div>
        <div class="arm"><span class="arm-head" /></div>
      </div>
    </div>
  </section>

  <!-- Genre marquee (the clip wrapper keeps the tilted strip from making the page wider than the screen) -->
  <div class="marquee-clip">
    <div class="marquee" aria-hidden="true">
      <div class="track">
        <template v-for="n in 4" :key="n">
          <span v-for="g in genres" :key="g + n">{{ g }} <i>●</i></span>
        </template>
      </div>
    </div>
  </div>

  <!-- How it works -->
  <section id="how" class="section wrap">
    <div class="section-head">
      <p class="eyebrow">How it works</p>
      <h2>Records on your desk in three steps.</h2>
    </div>
    <ol class="steps">
      <li v-for="s in steps" :key="s.n">
        <span class="num">{{ s.n }}</span>
        <h3>{{ s.title }}</h3>
        <p>{{ s.text }}</p>
      </li>
    </ol>
  </section>

  <!-- Featured -->
  <section class="section featured">
    <div class="wrap">
      <div class="section-head row">
        <div>
          <p class="eyebrow">On the shelf now</p>
          <h2>Pick your first record.</h2>
        </div>
        <RouterLink to="/catalog" class="btn btn--ghost">See all records</RouterLink>
      </div>
      <div class="grid">
        <RecordCard v-for="r in featured" :key="r.id" :record="r" @open="selected = $event" />
      </div>
      <div class="genre-links">
        <span class="eyebrow">Jump to a genre:</span>
        <RouterLink v-for="g in genres" :key="g" :to="{ path: '/catalog', query: { genre: g } }" class="chip">
          {{ g }}
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- Gear -->
  <section v-if="features.gear" class="section wrap">
    <div class="section-head row">
      <div>
        <p class="eyebrow">Add-ons</p>
        <h2>Make it sound even better.</h2>
      </div>
      <RouterLink :to="{ path: '/catalog', query: { tab: 'gear' } }" class="btn btn--ghost">See all gear</RouterLink>
    </div>
    <div class="gear-grid">
      <GearCard v-for="g in featuredGear" :key="g.id" :item="g" />
    </div>
  </section>

  <!-- Pricing -->
  <section id="pricing" class="section wrap">
    <div class="section-head">
      <p class="eyebrow">Pricing</p>
      <h2>One turntable. One record. Your timeline.</h2>
    </div>

    <ul class="included">
      <li><span>✓</span> Turntable</li>
      <li><span>✓</span> 1 record of your choice</li>
      <li><span>✓</span> Free delivery & setup on campus</li>
    </ul>

    <div class="plans">
      <article v-for="d in durations" :key="d.id" class="plan" :class="{ featured: d.featured }">
        <p v-if="d.featured" class="badge">Most popular</p>
        <h3>{{ d.label }}</h3>
        <p class="plan-blurb">{{ d.blurb }}</p>
        <p class="plan-price">{{ money(d.price) }}</p>
        <p class="plan-per">turntable + 1 record</p>
        <RouterLink to="/catalog" class="btn" :class="d.featured ? 'btn--red' : 'btn--ghost'">Pick your record</RouterLink>
      </article>
    </div>

    <div class="extras">
      <div class="extras-card">
        <h3>Extras</h3>
        <ul class="price-list">
          <li><span>Each extra record</span><strong>+{{ money(extraRecord.price) }} / {{ extraRecord.per }}</strong></li>
          <li v-for="g in features.gear ? catalog.gear : []" :key="g.id">
            <span>{{ g.name }}</span><strong>+{{ money(g.price) }} / {{ g.per }}</strong>
          </li>
        </ul>
      </div>
      <div class="extras-card dark">
        <h3>Delivery</h3>
        <ul class="price-list">
          <li><span>{{ delivery.campus.label }}</span><strong>Free</strong></li>
          <li><span>{{ delivery.offCampus.label }}</span><strong>from {{ money(delivery.offCampus.fee) }}</strong></li>
        </ul>
        <p>{{ delivery.campus.note }} {{ delivery.offCampus.note }}</p>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="section wrap faq-wrap">
    <div class="section-head">
      <p class="eyebrow">FAQ</p>
      <h2>Good questions.</h2>
    </div>
    <div class="faq">
      <details v-for="f in faqs" :key="f.q">
        <summary>{{ f.q }}</summary>
        <p>{{ f.a }}</p>
      </details>
    </div>
  </section>

  <!-- CTA -->
  <section class="wrap">
    <div class="cta-band">
      <h2>A turntable and a record at your door for {{ money(durations[0].price) }}.</h2>
      <RouterLink to="/catalog" class="btn">Start digging →</RouterLink>
    </div>
  </section>

  <RecordModal v-if="selected" :record="selected" @close="selected = null" />
</template>

<style scoped>
/* Hero */
.hero {
  padding: 72px 0 88px;
  overflow: hidden;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 56px;
  align-items: center;
}

h1 {
  font-size: clamp(48px, 7.4vw, 96px);
  line-height: 0.92;
  margin: 18px 0 28px;
  text-transform: uppercase;
  font-stretch: 85%;
  font-weight: 900;
}

h1 span {
  color: var(--red);
}

.lede {
  font-size: 19px;
  max-width: 34ch;
  color: #3a3631;
}

.ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}

.stats {
  list-style: none;
  padding: 0;
  margin: 48px 0 0;
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.stats li {
  display: flex;
  flex-direction: column;
}

.stats strong {
  font-size: 32px;
  font-weight: 850;
  line-height: 1;
}

.stats span {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}

/* Turntable illustration */
.turntable {
  position: relative;
  aspect-ratio: 1;
  background: var(--ink);
  border-radius: 28px;
  padding: 9%;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.45);
}

.platter {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #2a2a2a;
  padding: 3%;
}

.record {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    conic-gradient(from 30deg, transparent 0 40deg, rgba(255, 255, 255, 0.08) 55deg, transparent 70deg 220deg, rgba(255, 255, 255, 0.06) 235deg, transparent 250deg),
    repeating-radial-gradient(circle, #151515 0 2px, #0b0b0b 2px 4px);
  display: grid;
  place-items: center;
  animation: spin 1.8s linear infinite;
}

.record-label {
  width: 34%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--red);
  display: grid;
  place-items: center;
  position: relative;
}

.record-label span {
  font-weight: 900;
  font-stretch: 125%;
  color: #fff;
  font-size: clamp(14px, 2vw, 24px);
  transform: translateY(-110%);
}

.record-label::after {
  content: '';
  position: absolute;
  width: 12%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--paper);
}

.arm {
  position: absolute;
  top: 7%;
  right: 7%;
  width: 6%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #cfcac2;
}

.arm::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 520%;
  background: #cfcac2;
  border-radius: 4px;
  transform-origin: top center;
  transform: translateX(-50%) rotate(28deg);
}

.arm-head {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60%;
  height: 120%;
  background: var(--red);
  border-radius: 3px;
  transform-origin: top center;
  transform: translateX(-50%) rotate(28deg) translateY(430%);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Marquee */
/* The strip is wider than the screen and tilted so its ends never show; this
   wrapper clips the overflow. Without it, phone browsers widen the whole page
   to fit the strip and the sticky header no longer reaches the right edge.
   Vertical padding leaves room for the tilt, cancelled by the negative margin. */
.marquee-clip {
  overflow: hidden;
  padding-block: 24px;
  margin-block: -24px;
}

.marquee {
  background: var(--red);
  color: #fff;
  overflow: hidden;
  border-block: 2px solid var(--ink);
  transform: rotate(-1.2deg);
  margin: 0 -20px;
}

.track {
  display: flex;
  width: max-content;
  padding: 14px 0;
  animation: scroll 40s linear infinite;
}

.track span {
  font-weight: 850;
  font-stretch: 112%;
  font-size: 22px;
  text-transform: uppercase;
  padding-right: 28px;
  white-space: nowrap;
}

.track i {
  font-style: normal;
  font-size: 12px;
  vertical-align: middle;
  margin-left: 24px;
  color: var(--ink);
}

@keyframes scroll {
  to { transform: translateX(-50%); }
}

/* Sections */
.section {
  padding-top: 112px;
}

.section-head {
  margin-bottom: 48px;
  max-width: 720px;
}

.section-head.row {
  max-width: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
}

h2 {
  font-size: clamp(34px, 4.6vw, 56px);
  margin-top: 12px;
}

/* Steps */
.steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.steps li {
  border-top: 2px solid var(--ink);
  padding-top: 24px;
}

.num {
  font-family: var(--mono);
  color: var(--red);
  font-size: 15px;
}

.steps h3 {
  font-size: 26px;
  margin: 14px 0 12px;
}

.steps p {
  color: #3a3631;
}

/* Featured */
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px 28px;
}

.genre-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 56px;
}

.genre-links .eyebrow {
  margin-right: 6px;
}

.chip {
  padding: 8px 16px;
  border: 1.5px solid var(--ink);
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: background 0.15s ease, color 0.15s ease;
}

.chip:hover {
  background: var(--ink);
  color: var(--paper);
}

/* Plans */
.plans {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: stretch;
}

.plan {
  position: relative;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
}

.plan.featured {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.badge {
  position: absolute;
  top: -14px;
  left: 32px;
  background: var(--red);
  color: #fff;
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 5px 12px;
  border-radius: 999px;
}

.plan h3 {
  font-size: 26px;
}

.plan-blurb {
  margin-top: 10px;
  opacity: 0.75;
}

.plan-blurb {
  flex: 1;
}

.plan-price {
  font-size: 56px;
  font-weight: 900;
  margin-top: 28px;
  line-height: 1;
}

.plan-per {
  opacity: 0.7;
  margin: 8px 0 28px;
}

.plan .btn {
  justify-content: center;
}

.plan.featured .btn--ghost {
  color: var(--paper);
  border-color: var(--paper);
}

/* Included strip */
.included {
  list-style: none;
  padding: 0;
  margin: 0 0 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.included li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 10px 10px;
  border-radius: 999px;
  background: var(--card);
  border: 1.5px solid var(--line);
  font-weight: 700;
}

.included span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  font-size: 14px;
}

/* Extras + delivery */
.extras {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.extras-card {
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 32px;
}

.extras-card.dark {
  background: var(--red);
  border-color: var(--red);
  color: #fff;
}

.extras-card h3 {
  font-size: 24px;
  margin-bottom: 16px;
}

.extras-card p {
  margin-top: 16px;
  font-size: 15px;
  opacity: 0.9;
}

.price-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.price-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}

.price-list strong {
  white-space: nowrap;
}

/* Gear */
.gear-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* FAQ */
.faq-wrap {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 56px;
}

.faq details {
  border-bottom: 1.5px solid var(--line);
}

.faq summary {
  list-style: none;
  cursor: pointer;
  padding: 22px 40px 22px 0;
  font-size: 20px;
  font-weight: 700;
  position: relative;
}

.faq summary::-webkit-details-marker {
  display: none;
}

.faq summary::after {
  content: '+';
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 28px;
  font-weight: 400;
  color: var(--red);
  transition: transform 0.2s ease;
}

.faq details[open] summary::after {
  transform: translateY(-50%) rotate(45deg);
}

.faq details p {
  padding-bottom: 22px;
  color: #3a3631;
  max-width: 60ch;
}

/* CTA */
.cta-band {
  margin-top: 112px;
  background: var(--red);
  color: #fff;
  border-radius: 28px;
  padding: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}

.cta-band h2 {
  margin: 0;
  max-width: 18ch;
}

/* Responsive */
@media (max-width: 980px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .plans {
    grid-template-columns: 1fr;
    max-width: 480px;
  }
  .extras {
    grid-template-columns: 1fr;
  }
  .gear-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .faq-wrap {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 820px) {
  .hero {
    padding-top: 40px;
  }
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .turntable {
    max-width: 420px;
    width: 100%;
    justify-self: center;
  }
  .steps {
    grid-template-columns: 1fr;
  }
  .section {
    padding-top: 80px;
  }
  .cta-band {
    padding: 40px 28px;
    margin-top: 80px;
  }
}

@media (max-width: 560px) {
  .gear-grid {
    grid-template-columns: 1fr;
  }
  .extras-card {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .grid {
    gap: 32px 16px;
  }
  .stats {
    gap: 24px;
  }
}
</style>
