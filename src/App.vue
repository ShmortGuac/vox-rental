<script setup>
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import RentalPanel from './components/RentalPanel.vue'
import { useRoute } from 'vue-router'

// Pages like /admin opt out of the shop header, footer and rental panel.
const route = useRoute()
</script>

<template>
  <RouterView v-if="route.meta.bare" />
  <template v-else>
    <SiteHeader />
    <main>
      <RouterView />
    </main>
    <SiteFooter />
    <RentalPanel />
  </template>
</template>
