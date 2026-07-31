<script setup>
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import CreateCaseView from '@/views/CreateCaseView.vue'
import CaseRecordsView from '@/views/CaseRecordsView.vue'

const activePage = ref('create')
</script>

<template>
  <div class="page">
    <div class="app">
      <AppHeader :active-page="activePage" @navigate="activePage = $event" />
      <CreateCaseView v-if="activePage === 'create'" />
      <CaseRecordsView v-else />
    </div>
  </div>
</template>
