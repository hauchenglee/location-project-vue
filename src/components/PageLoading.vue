<script setup>
defineProps({
  title: {
    type: String,
    default: '資料載入中',
  },
  description: {
    type: String,
    default: '正在取得最新資料，請稍候。',
  },
})
</script>

<template>
  <div class="page-loading-overlay" aria-live="polite" aria-busy="true">
    <div class="page-loading-card">
      <span class="loading-spinner" aria-hidden="true"></span>
      <div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
    </div>
  </div>
</template>
