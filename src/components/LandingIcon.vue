<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 20,
  },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'store'">
      <path d="M4 9h16l-1.2-4.5H5.2L4 9Z" />
      <path d="M5.5 9v11h13V9" />
      <path d="M9.5 20v-5.5h5V20" />
    </template>
    <template v-else-if="name === 'users'">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.2 2.5-5.8 5.5-5.8s5.5 2.6 5.5 5.8" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.7c2.8 0 5 2.1 5 5" />
    </template>
    <template v-else-if="name === 'pulse'">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </template>
    <template v-else-if="name === 'transit'">
      <rect x="5" y="3.5" width="14" height="14.5" rx="3" />
      <path d="M5 10.5h14M9 21l1.4-3M15 21l-1.4-3M8.5 7h.01M15.5 7h.01" />
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="3.5" y="3.5" width="6.5" height="6.5" />
      <rect x="14" y="3.5" width="6.5" height="6.5" />
      <rect x="3.5" y="14" width="6.5" height="6.5" />
      <rect x="14" y="14" width="6.5" height="6.5" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="m5 12.5 4.2 4.2L19 6.5" />
    </template>
    <template v-else-if="name === 'arrow'">
      <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 3 4.5 6v5.8c0 4.4 3.2 7.5 7.5 8.7 4.3-1.2 7.5-4.3 7.5-8.7V6L12 3Z" />
      <path d="m8.5 11.5 2.4 2.4 4.6-5" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </template>
    <template v-else-if="name === 'map'">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </template>
    <template v-else-if="name === 'spark'">
      <path d="m12 3 2.2 6.1L20 11l-5.8 1.9L12 19l-2.2-6.1L4 11l5.8-1.9L12 3Z" />
    </template>
    <template v-else-if="name === 'layers'">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </template>
    <template v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </template>
  </svg>
</template>
