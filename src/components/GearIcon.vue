<script setup>
defineProps({
  name: { type: String, required: true },
})
</script>

<template>
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'headphones'">
      <path d="M12 38V32a20 20 0 0 1 40 0v6" />
      <rect x="8" y="36" width="12" height="18" rx="4" fill="currentColor" />
      <rect x="44" y="36" width="12" height="18" rx="4" fill="currentColor" />
    </template>
    <template v-else-if="name === 'speaker'">
      <rect x="14" y="8" width="36" height="48" rx="8" />
      <circle cx="32" cy="38" r="9" fill="currentColor" />
      <circle cx="32" cy="19" r="3.5" fill="currentColor" />
    </template>
    <template v-else-if="name === 'speakers'">
      <rect x="4" y="12" width="24" height="40" rx="4" />
      <circle cx="16" cy="38" r="7" fill="currentColor" />
      <circle cx="16" cy="22" r="3" fill="currentColor" />
      <rect x="36" y="12" width="24" height="40" rx="4" />
      <circle cx="48" cy="38" r="7" fill="currentColor" />
      <circle cx="48" cy="22" r="3" fill="currentColor" />
    </template>
    <template v-else-if="name === 'cleaning'">
      <rect x="8" y="30" width="32" height="12" rx="3" fill="currentColor" />
      <path d="M12 42v8M18 42v8M24 42v8M30 42v8M36 42v8" />
      <rect x="44" y="20" width="12" height="32" rx="3" />
      <path d="M47 20v-6h6v6" />
    </template>
    <template v-else>
      <path d="M8 24h48v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
      <path d="M16 24V10M24 24V8M32 24V10M40 24V8M48 24V12" />
      <path d="M24 38h16" />
    </template>
  </svg>
</template>
