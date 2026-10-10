<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import VoxLogo from './VoxLogo.vue'
import { rental, summary } from '../stores/rental'

const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header class="header">
    <div class="wrap bar">
      <RouterLink to="/" class="brand" aria-label="VOX home">
        <VoxLogo />
      </RouterLink>

      <button class="menu-btn" :aria-expanded="open" aria-controls="site-nav" @click="open = !open">
        <span class="sr-only">Menu</span>
        <span class="burger" :class="{ open }" />
      </button>

      <nav id="site-nav" class="nav" :class="{ open }">
        <RouterLink to="/" exact-active-class="active">Home</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#how' }">How it works</RouterLink>
        <RouterLink :to="{ path: '/', hash: '#pricing' }">Pricing</RouterLink>
        <RouterLink to="/catalog" active-class="active">Catalog</RouterLink>
        <button v-if="summary.count" class="btn btn--red nav-cta" @click="rental.panelOpen = true">
          Your rental <span class="count">{{ summary.count }}</span>
        </button>
        <RouterLink v-else to="/catalog" class="btn btn--red nav-cta">Start renting</RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  /* Solid, so the tilted genre strip and covers don't show through when scrolling under it */
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.brand svg {
  height: 30px;
  width: auto;
}

.nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav a:not(.btn) {
  text-decoration: none;
  font-weight: 600;
  position: relative;
}

.nav a:not(.btn)::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  background: var(--red);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.nav a:not(.btn):hover::after,
.nav a.active::after {
  transform: scaleX(1);
}

.nav-cta {
  padding: 10px 18px;
}

.count {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #fff;
  color: var(--red-dark);
  font-size: 13px;
}

.menu-btn {
  display: none;
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  cursor: pointer;
  place-items: center;
}

.burger,
.burger::before,
.burger::after {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--ink);
  transition: transform 0.2s ease, background 0.2s ease;
}

.burger {
  position: relative;
}

.burger::before,
.burger::after {
  content: '';
  position: absolute;
}

.burger::before {
  top: -7px;
}

.burger::after {
  top: 7px;
}

.burger.open {
  background: transparent;
}

.burger.open::before {
  transform: translateY(7px) rotate(45deg);
}

.burger.open::after {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 820px) {
  .menu-btn {
    display: grid;
  }

  .nav {
    position: absolute;
    top: 72px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 8px 16px 20px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
    display: none;
  }

  .nav.open {
    display: flex;
  }

  .nav a:not(.btn) {
    padding: 14px 0;
    border-bottom: 1px solid var(--line);
  }

  .nav a:not(.btn)::after {
    display: none;
  }

  .nav-cta {
    margin-top: 16px;
    justify-content: center;
  }
}
</style>
