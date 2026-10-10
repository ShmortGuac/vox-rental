<script setup>
import VoxLogo from './VoxLogo.vue'
import { site, features } from '../data/site'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="wrap grid">
      <div class="brand">
        <VoxLogo ink="#f3eee6" hole="#131313" />
        <p>{{ site.tagline }}</p>
      </div>

      <div>
        <h4>Where we deliver</h4>
        <p>Free anywhere on {{ site.campusName }} campus</p>
        <p>Off campus for a delivery fee</p>
        <p>{{ site.hours }}</p>
      </div>

      <div>
        <h4>Contact</h4>
        <p><a :href="`mailto:${site.email}`">{{ site.email }}</a></p>
        <p>{{ site.phone }}</p>
        <p>{{ site.instagram }}</p>
      </div>

      <div>
        <h4>Explore</h4>
        <p><RouterLink to="/">Home</RouterLink></p>
        <p><RouterLink to="/catalog">Catalog</RouterLink></p>
        <p v-if="features.gear"><RouterLink :to="{ path: '/catalog', query: { tab: 'gear' } }">Gear</RouterLink></p>
        <p><RouterLink :to="{ path: '/', hash: '#pricing' }">Pricing</RouterLink></p>
        <p><RouterLink :to="{ path: '/', hash: '#faq' }">FAQ</RouterLink></p>
        <p><a :href="site.suggestUrl" target="_blank" rel="noopener">Suggest a vinyl ↗</a></p>
      </div>
    </div>
    <div class="wrap legal">© {{ year }} {{ site.name }}. All rights reserved.</div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--ink);
  color: #d8d2c8;
  padding: 72px 0 32px;
  margin-top: 96px;
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
}

.brand svg {
  width: 160px;
  height: auto;
  margin-bottom: 16px;
}

h4 {
  margin: 0 0 12px;
  font-family: var(--mono);
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--red);
}

p {
  margin-bottom: 6px;
  overflow-wrap: anywhere;
}

a {
  text-decoration: none;
}

a:hover {
  color: #fff;
  text-decoration: underline;
}

.legal {
  margin-top: 56px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 14px;
  color: #8f8a83;
}

@media (max-width: 820px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
  .brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
