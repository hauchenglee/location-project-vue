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
      <div class="brand-mark">L</div>
      <div class="brand-text">
        <h1>區位分析案件系統</h1>
        <p>Glassmorphism Workspace</p>
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
      <button class="icon-btn" type="button" aria-label="通知">
        <span class="icon icon-bell"></span>
      </button>

      <button class="user-btn" type="button" aria-label="使用者帳號">
        <span class="avatar">CH</span>
        <span class="user-meta">
          <strong>Chris Huang</strong>
          <span>Admin</span>
        </span>
        <span class="chev"></span>
      </button>
    </div>
  </header>
</template>
