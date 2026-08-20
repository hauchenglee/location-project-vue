<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import ClusterDetailBusinessPanel from '@/views/cluster-detail/ClusterDetailBusinessPanel.vue'
import ClusterDetailPopulationPanel from '@/views/cluster-detail/ClusterDetailPopulationPanel.vue'
import ClusterDetailPeoplePanel from '@/views/cluster-detail/ClusterDetailPeoplePanel.vue'
import ClusterDetailTransitPanel from '@/views/cluster-detail/ClusterDetailTransitPanel.vue'
import ClusterDetailCellPenel from '@/views/cluster-detail/ClusterDetailCellPenel.vue'

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
  { key: 'business', label: '商業', component: ClusterDetailBusinessPanel, loader: caseApi.getBusiness },
  { key: 'population', label: '人口', component: ClusterDetailPopulationPanel, loader: caseApi.getPopulation },
  { key: 'people', label: '人潮', component: ClusterDetailPeoplePanel, loader: caseApi.getPeople },
  { key: 'transit', label: '交通', component: ClusterDetailTransitPanel, loader: caseApi.getTransit },
  {
    key: 'cell',
    label: '空間熱點',
    component: ClusterDetailCellPenel,
    loader: caseApi.listMetricCells,
    buildRequest: () => ({
      analysisId: props.analysisId,
    }),
  },
]

const activeTabConfig = computed(() => clusterTabs.find((tab) => tab.key === activeTab.value) || clusterTabs[0])
const activePanel = computed(
  () => activeTabConfig.value.component,
)
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

const clusterTitle = computed(() => (metricCluster.value?.id || props.clusterId ? `生活圈 ${metricCluster.value?.id || props.clusterId}` : '生活圈詳情'))

const clusterMetrics = computed(() => [
  { key: 'composite', label: '綜合', value: toScore(metricCluster.value?.compositeScore) },
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
    metricClusterError.value = error?.response?.data?.message || error.message || '取得生活圈資料失敗'
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
    const request = tab.buildRequest
      ? tab.buildRequest()
      : {
          id: props.clusterId,
          analysisId: props.analysisId,
        }
    tabVoMap[tab.key] = await tab.loader(request)
  } catch (error) {
    tabErrors[tab.key] = error?.response?.data?.message || error.message || `取得${tab.label}資料失敗`
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
  <main class="main detail-layout">
    <div class="content-scroll">
      <div class="content-shell">
        <section class="section cluster-detail-shell">
          <div class="detail-hero cluster-detail-header">
            <div class="detail-hero-main">
              <div class="detail-title-row">
                <button class="detail-back-button" type="button" aria-label="返回分析詳情" @click="emit('back')">
                  <span aria-hidden="true">‹</span>
                </button>
                <h2>{{ clusterTitle }}</h2>
              </div>
              <p>Analysis #{{ analysisId || '-' }} / Cluster #{{ clusterId || '-' }}</p>
            </div>

            <div class="cluster-header-summary">
              <span v-for="metric in headerMetrics" :key="metric.key" class="cluster-metric">
                {{ metric.label }}
                <strong>{{ metric.value }}</strong>
              </span>
            </div>
          </div>

          <div v-if="metricClusterError" class="form-message error">{{ metricClusterError }}</div>
          <div v-if="activeError" class="form-message error">{{ activeError }}</div>

          <nav class="cluster-detail-tabs" aria-label="生活圈詳情頁籤">
            <button
              v-for="tab in clusterTabs"
              :key="tab.key"
              class="cluster-detail-tab"
              :class="{ active: activeTab === tab.key }"
              type="button"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </nav>

          <component
            :is="activePanel"
            :vo="activeVo"
            :cluster-id="clusterId"
            :selected-age-group="selectedAgeGroup"
          />
        </section>

        <PageLoading
          v-if="isLoading"
          :title="loadingTitle"
          description="系統正在載入目前頁簽需要的生活圈資料。"
        />
      </div>
    </div>
  </main>
</template>
