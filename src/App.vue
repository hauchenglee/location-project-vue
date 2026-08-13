<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AnalysisSubmitView from '@/views/AnalysisSubmitView.vue'
import AnalysisListView from '@/views/AnalysisListView.vue'
import AnalysisDetailView from '@/views/AnalysisDetailView.vue'

const validPages = new Set(['create', 'records', 'detail'])

const readHashState = () => {
  const rawHash = window.location.hash.replace(/^#\/?/, '')
  const [page = 'create', query = ''] = rawHash.split('?')
  const params = new URLSearchParams(query)
  const active = validPages.has(page) ? page : 'create'
  const rawId = params.get('id')
  const id = rawId && /^\d+$/.test(rawId) ? Number(rawId) : rawId
  const activePage = active === 'detail' && !id ? 'records' : active

  return {
    activePage,
    analysisId: activePage === 'detail' ? id : null,
  }
}

const initialState = readHashState()
const activePage = ref(initialState.activePage)
const analysisId = ref(initialState.analysisId)

const headerActivePage = computed(() => (activePage.value === 'detail' ? 'records' : activePage.value))

const writeHashState = () => {
  const nextHash =
    activePage.value === 'detail' && analysisId.value
      ? `#/detail?id=${encodeURIComponent(analysisId.value)}`
      : `#/${activePage.value}`

  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

const syncStateFromHash = () => {
  const hashState = readHashState()
  activePage.value = hashState.activePage
  analysisId.value = hashState.analysisId
}

const navigate = (page) => {
  activePage.value = page
  if (page !== 'detail') {
    analysisId.value = null
  }
}

const openAnalysisDetail = (analysis) => {
  analysisId.value = analysis.id
  activePage.value = 'detail'
}

watch([activePage, analysisId], writeHashState)

onMounted(() => {
  writeHashState()
  window.addEventListener('hashchange', syncStateFromHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncStateFromHash)
})
</script>

<template>
  <div class="page">
    <div class="app">
      <AppHeader :active-page="headerActivePage" @navigate="navigate" />
      <AnalysisSubmitView v-if="activePage === 'create'" />
      <AnalysisListView v-else-if="activePage === 'records'" @view-detail="openAnalysisDetail" />
      <AnalysisDetailView v-else :analysis-id="analysisId" @back="navigate('records')" />
    </div>
  </div>
</template>
