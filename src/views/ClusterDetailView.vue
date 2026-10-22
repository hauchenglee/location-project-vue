<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import ClusterDetailBusinessPanel from '@/views/cluster-detail/ClusterDetailBusinessPanel.vue'
import ClusterDetailPopulationPanel from '@/views/cluster-detail/ClusterDetailPopulationPanel.vue'
import ClusterDetailPeoplePanel from '@/views/cluster-detail/ClusterDetailPeoplePanel.vue'
import ClusterDetailTransitPanel from '@/views/cluster-detail/ClusterDetailTransitPanel.vue'
import ClusterDetailSpatialPanel from '@/views/cluster-detail/ClusterDetailSpatialPanel.vue'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
  clusterId: {
    type: [Number, String],
    default: null,
  },
  selectedAgeGroup: {
    type: String,
    default: 'ALL',
  },
})

const emit = defineEmits(['back'])

const activeTab = ref('business')
const metricCluster = ref(null)
const isMetricClusterLoading = ref(false)
const metricClusterError = ref('')
const tabVoMap = reactive({})
const tabLoading = reactive({})
const tabErrors = reactive({})

const clusterTabs = [
  { key: 'business', no: '01', label: '商業', component: ClusterDetailBusinessPanel, loader: caseApi.getBusiness },
  { key: 'population', no: '02', label: '人口', component: ClusterDetailPopulationPanel, loader: caseApi.getPopulation },
  { key: 'people', no: '03', label: '人潮', component: ClusterDetailPeoplePanel, loader: caseApi.getPeople },
  { key: 'transit', no: '04', label: '交通', component: ClusterDetailTransitPanel, loader: caseApi.getTransit },
  { key: 'spatial', no: '05', label: '熱區', component: ClusterDetailSpatialPanel, loader: null },
]

const activeTabConfig = computed(() => clusterTabs.find((tab) => tab.key === activeTab.value) || clusterTabs[0])
const activePanel = computed(() => activeTabConfig.value.component)
const activeVo = computed(() => tabVoMap[activeTab.value] || null)
const activeError = computed(() => tabErrors[activeTab.value] || '')
const isLoading = computed(() => isMetricClusterLoading.value || Boolean(tabLoading[activeTab.value]))
const loadingTitle = computed(() =>
  isMetricClusterLoading.value ? '正在取得生活圈資料' : `正在取得${activeTabConfig.value.label}資料`,
)

const toScore = (value) => {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(score) : '-'
}

const clusterTitle = computed(() =>
  props.clusterId ? `生活圈 ${props.clusterId}` : '生活圈詳情',
)

const clusterMetrics = computed(() => [
  { key: 'composite', label: '綜合評分', value: toScore(metricCluster.value?.compositeScore) },
  { key: 'business', label: '商業', value: toScore(metricCluster.value?.businessScore) },
  { key: 'population', label: '人口', value: toScore(metricCluster.value?.populationScore) },
  { key: 'people', label: '人潮', value: toScore(metricCluster.value?.peopleScore) },
  { key: 'transit', label: '交通', value: toScore(metricCluster.value?.transitScore) },
])

const headerMetrics = computed(() => {
  const composite = clusterMetrics.value.find((metric) => metric.key === 'composite')
  const active = clusterMetrics.value.find((metric) => metric.key === activeTab.value)
  return [composite, active].filter((metric, index, metrics) => metric && metrics.findIndex((item) => item.key === metric.key) === index)
})

const resetTabs = () => {
  Object.keys(tabVoMap).forEach((key) => delete tabVoMap[key])
  Object.keys(tabLoading).forEach((key) => delete tabLoading[key])
  Object.keys(tabErrors).forEach((key) => delete tabErrors[key])
}

const loadMetricCluster = async () => {
  if (!props.clusterId) {
    metricCluster.value = null
    metricClusterError.value = '缺少生活圈編號，無法取得生活圈資料。'
    return
  }

  isMetricClusterLoading.value = true
  metricClusterError.value = ''

  try {
    metricCluster.value = await caseApi.getMetricCluster({
      id: props.clusterId,
      analysisId: props.analysisId,
    })
  } catch (error) {
    metricCluster.value = null
    metricClusterError.value = error?.response?.data?.message || '取得生活圈資料失敗，請稍後再試。'
  } finally {
    isMetricClusterLoading.value = false
  }
}

const loadActiveTab = async () => {
  if (!props.clusterId) {
    tabErrors[activeTab.value] = '缺少生活圈編號，無法取得詳情。'
    return
  }

  if (tabVoMap[activeTab.value] || tabLoading[activeTab.value]) {
    return
  }

  const tab = activeTabConfig.value
  if (!tab.loader) {
    tabErrors[tab.key] = ''
    return
  }

  tabLoading[tab.key] = true
  tabErrors[tab.key] = ''

  try {
    tabVoMap[tab.key] = await tab.loader({
      id: props.clusterId,
      analysisId: props.analysisId,
    })
  } catch (error) {
    tabErrors[tab.key] = error?.response?.data?.message || `取得${tab.label}資料失敗，請稍後再試。`
    delete tabVoMap[tab.key]
  } finally {
    tabLoading[tab.key] = false
  }
}

watch(() => [props.clusterId, props.analysisId], () => {
  activeTab.value = clusterTabs[0].key
  metricCluster.value = null
  resetTabs()
  loadMetricCluster()
  loadActiveTab()
}, { immediate: true })

watch(activeTab, loadActiveTab)
</script>

<template>
  <div class="cluster-page">
    <div class="cluster-shell">
      <header class="cluster-header">
        <div>
          <div class="cluster-title-row">
            <button class="back-btn" type="button" aria-label="返回分析" @click="emit('back')">
              <span aria-hidden="true">‹</span>
            </button>
            <div class="cluster-title-main">
              <p class="eyebrow">AREA / 生活圈</p>
              <h1>{{ clusterTitle }}</h1>
              <p>ANALYSIS #{{ analysisId || '-' }} / AREA #{{ clusterId || '-' }} · 候選生活圈</p>
            </div>
          </div>
        </div>

        <div class="cluster-score-row">
          <div
            v-for="metric in headerMetrics"
            :key="metric.key"
            class="score-pill"
            :class="{ 'score-pill--main': metric.key === 'composite' }"
          >
            <span>{{ metric.label }}</span>
            <b>{{ metric.value }}<small>/100</small></b>
          </div>
        </div>
      </header>

      <div v-if="metricClusterError" class="form-message error">{{ metricClusterError }}</div>
      <div v-else-if="activeError" class="form-message error">{{ activeError }}</div>

      <nav class="cluster-tabs" aria-label="生活圈詳情頁籤">
        <button
          v-for="tab in clusterTabs"
          :key="tab.key"
          class="cluster-tab"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          <b>{{ tab.no }}</b>
          {{ tab.label }}
        </button>
      </nav>

      <component
        :is="activePanel"
        :vo="activeVo"
        :analysis-id="analysisId"
        :cluster-id="clusterId"
        :metric-cluster="metricCluster"
        :selected-age-group="selectedAgeGroup"
      />
    </div>

    <PageLoading
      v-if="isLoading"
      :title="loadingTitle"
      description="系統正在讀取這個生活圈的資料。"
    />
  </div>
</template>

<style scoped>
.cluster-page {
  position: relative;
}

.cluster-title-main .eyebrow {
  margin-bottom: 7px;
  font-size: 8px;
}
</style>
