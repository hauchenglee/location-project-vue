<script setup>
defineProps({
  activePage: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])

const tabs = [
  { key: 'create', label: '建立案件' },
  { key: 'records', label: '分析列表' },
]
</script>

<template>
  <header class="header">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M16 3 28 9.8v12.4L16 29 4 22.2V9.8L16 3Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
          <path d="M5.5 10.5 16 16l10.5-5.5M5.5 21.5 16 16l10.5 5.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="brand-text">
        <h1>區位分析案件系統</h1>
        <p>Location Analysis</p>
      </div>
    </div>

    <nav class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activePage === tab.key }"
        type="button"
        @click="emit('navigate', tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="header-actions">
      <button class="icon-btn" type="button" aria-label="訊息">
        <span class="icon icon-chat"></span>
      </button>

      <button class="icon-btn" type="button" aria-label="行事曆">
        <span class="icon icon-calendar"></span>
      </button>

      <button class="icon-btn" type="button" aria-label="通知">
        <span class="icon icon-bell"></span>
      </button>

      <button class="user-btn" type="button" aria-label="使用者帳號">
        <span class="avatar">管</span>
        <span class="user-meta">
          <strong>系統管理員</strong>
          <span>Admin</span>
        </span>
        <span class="chev"></span>
      </button>
    </div>
  </header>
</template>
