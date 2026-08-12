<script setup>
import { computed, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import CreateCaseView from '@/views/CreateCaseView.vue'
import CaseRecordsView from '@/views/CaseRecordsView.vue'
import AnalysisDetailView from '@/views/AnalysisDetailView.vue'

const activePage = ref('create')
const selectedAnalysis = ref(null)

const headerActivePage = computed(() => (activePage.value === 'detail' ? 'records' : activePage.value))

const navigate = (page) => {
  activePage.value = page
  if (page !== 'detail') {
    selectedAnalysis.value = null
  }
}

const openAnalysisDetail = (analysis) => {
  selectedAnalysis.value = analysis
  activePage.value = 'detail'
}
</script>

<template>
  <div class="page">
    <div class="app">
      <AppHeader :active-page="headerActivePage" @navigate="navigate" />
      <CreateCaseView v-if="activePage === 'create'" />
      <CaseRecordsView v-else-if="activePage === 'records'" @view-detail="openAnalysisDetail" />
      <AnalysisDetailView v-else :analysis="selectedAnalysis" @back="navigate('records')" />
    </div>
  </div>
</template>
