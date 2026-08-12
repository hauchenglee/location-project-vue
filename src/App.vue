<script setup>
import { computed, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AnalysisSubmitView from '@/views/AnalysisSubmitView.vue'
import AnalysisListView from '@/views/AnalysisListView.vue'
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
      <AnalysisSubmitView v-if="activePage === 'create'" />
      <AnalysisListView v-else-if="activePage === 'records'" @view-detail="openAnalysisDetail" />
      <AnalysisDetailView v-else :analysis="selectedAnalysis" @back="navigate('records')" />
    </div>
  </div>
</template>
