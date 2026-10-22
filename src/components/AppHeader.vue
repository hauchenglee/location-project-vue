<script setup>
import { computed } from 'vue'
import BrandMark from '@/components/BrandMark.vue'

const props = defineProps({
  activePage: {
    type: String,
    default: 'create',
  },
})

const emit = defineEmits(['navigate'])

const isCreatePage = computed(() => props.activePage === 'create')

const tabs = [
  { key: 'create', no: '01', label: '新分析' },
  { key: 'records', no: '02', label: '分析紀錄' },
]
</script>

<template>
  <header class="header">
    <button class="brand" type="button" aria-label="回到落子產品頁" @click="emit('navigate', 'product')">
      <BrandMark :size="34" />
      <span class="brand-text">
        <span class="brand-name">落子<small>luozi</small></span>
        <span class="brand-sub">Decision Platform</span>
      </span>
    </button>

    <nav class="tabs" aria-label="主要導覽">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ active: activePage === tab.key }"
        type="button"
        @click="emit('navigate', tab.key)"
      >
        <span class="tab-no">{{ tab.no }}</span>
        {{ tab.label }}
      </button>
    </nav>

    <div class="header-actions">
      <button class="header-link" type="button" @click="emit('navigate', 'product')">
        產品介紹
      </button>
      <button class="header-cta" type="button" @click="emit('navigate', isCreatePage ? 'records' : 'create')">
        <span class="header-cta-dot" aria-hidden="true"></span>
        {{ isCreatePage ? '看分析紀錄' : '開始分析' }}
      </button>
    </div>
  </header>
</template>
