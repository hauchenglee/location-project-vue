<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import ProductView from '@/views/ProductView.vue'
import AnalysisSubmitView from '@/views/AnalysisSubmitView.vue'
import AnalysisListView from '@/views/AnalysisListView.vue'
import AnalysisDetailView from '@/views/AnalysisDetailView.vue'
import ClusterDetailView from '@/views/ClusterDetailView.vue'

const validPages = new Set(['product', 'create', 'records', 'detail', 'cluster-detail'])

const parseId = (value) => (value && /^\d+$/.test(value) ? Number(value) : value)

const readHashState = () => {
  const rawHash = window.location.hash.replace(/^#\/?/, '')
  const [page = 'product', query = ''] = rawHash.split('?')
  const params = new URLSearchParams(query)
  const active = validPages.has(page) ? page : 'product'
  const analysisId = parseId(params.get('id') || params.get('analysisId'))
  const clusterId = parseId(params.get('clusterId'))
  const activePage =
    (active === 'detail' && !analysisId) || (active === 'cluster-detail' && (!analysisId || !clusterId))
      ? 'records'
      : active

  return {
    activePage,
    analysisId: ['detail', 'cluster-detail'].includes(activePage) ? analysisId : null,
    clusterId: activePage === 'cluster-detail' ? clusterId : null,
  }
}

const initialState = readHashState()
const activePage = ref(initialState.activePage)
const analysisId = ref(initialState.analysisId)
const clusterId = ref(initialState.clusterId)
const selectedAnalysis = ref(null)

const headerActivePage = computed(() =>
  ['detail', 'cluster-detail'].includes(activePage.value) ? 'records' : activePage.value,
)

const writeHashState = () => {
  let nextHash = `#/${activePage.value}`

  if (activePage.value === 'detail' && analysisId.value) {
    nextHash = `#/detail?id=${encodeURIComponent(analysisId.value)}`
  }

  if (activePage.value === 'cluster-detail' && analysisId.value && clusterId.value) {
    nextHash = `#/cluster-detail?analysisId=${encodeURIComponent(analysisId.value)}&clusterId=${encodeURIComponent(clusterId.value)}`
  }

  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

const syncStateFromHash = () => {
  const hashState = readHashState()
  activePage.value = hashState.activePage
  analysisId.value = hashState.analysisId
  clusterId.value = hashState.clusterId
}

const scrollToTop = async () => {
  await nextTick()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

const navigate = (page) => {
  activePage.value = validPages.has(page) ? page : 'product'

  if (!['detail', 'cluster-detail'].includes(page)) {
    analysisId.value = null
    clusterId.value = null
    selectedAnalysis.value = null
  }

  scrollToTop()
}

const openAnalysisDetail = (analysis) => {
  if (!analysis?.id) return
  analysisId.value = analysis.id
  clusterId.value = null
  selectedAnalysis.value = analysis
  activePage.value = 'detail'
  scrollToTop()
}

const openClusterDetail = (metricCluster, analysis) => {
  if (!metricCluster?.id) return
  clusterId.value = metricCluster.id
  selectedAnalysis.value = analysis || selectedAnalysis.value
  activePage.value = 'cluster-detail'
  scrollToTop()
}

watch([activePage, analysisId, clusterId], writeHashState)

onMounted(() => {
  if (!window.location.hash) {
    writeHashState()
  }
  window.addEventListener('hashchange', syncStateFromHash)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncStateFromHash)
})
</script>

<template>
  <div class="site">
    <ProductView v-if="activePage === 'product'" @navigate="navigate" />

    <div v-else class="app">
      <AppHeader :active-page="headerActivePage" @navigate="navigate" />

      <div class="app-main">
        <Transition name="page" mode="out-in">
          <AnalysisSubmitView
            v-if="activePage === 'create'"
            key="create"
            @view-detail="openAnalysisDetail"
            @view-records="navigate('records')"
          />
          <AnalysisListView
            v-else-if="activePage === 'records'"
            key="records"
            @view-detail="openAnalysisDetail"
            @create="navigate('create')"
          />
          <AnalysisDetailView
            v-else-if="activePage === 'detail'"
            key="detail"
            :analysis-id="analysisId"
            @back="navigate('records')"
            @create="navigate('create')"
            @view-cluster="openClusterDetail"
          />
          <ClusterDetailView
            v-else
            key="cluster"
            :analysis-id="analysisId"
            :cluster-id="clusterId"
            :selected-age-group="selectedAnalysis?.selectedAgeGroup"
            @back="activePage = 'detail'"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>
