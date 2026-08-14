<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import ClusterDetailOverviewPanel from '@/views/cluster-detail/ClusterDetailOverviewPanel.vue'
import ClusterDetailBusinessPanel from '@/views/cluster-detail/ClusterDetailBusinessPanel.vue'
import ClusterDetailPopulationPanel from '@/views/cluster-detail/ClusterDetailPopulationPanel.vue'
import ClusterDetailPeoplePanel from '@/views/cluster-detail/ClusterDetailPeoplePanel.vue'
import ClusterDetailTransitPanel from '@/views/cluster-detail/ClusterDetailTransitPanel.vue'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
  clusterId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['back'])

const activeTab = ref('business')
const cluster = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const clusterTabs = [
  { key: 'business', label: '商業', component: ClusterDetailBusinessPanel },
  { key: 'population', label: '人口', component: ClusterDetailPopulationPanel },
  { key: 'people', label: '人流表現', component: ClusterDetailPeoplePanel },
  { key: 'transit', label: '交通', component: ClusterDetailTransitPanel },
  { key: 'overview', label: '總覽', component: ClusterDetailOverviewPanel },
]

const activePanel = computed(
  () => clusterTabs.find((tab) => tab.key === activeTab.value)?.component || ClusterDetailOverviewPanel,
)

const toScore = (value) => {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(score) : '-'
}

const clusterTitle = computed(() => (cluster.value?.id ? `生活圈 ${cluster.value.id}` : '生活圈詳情'))

const clusterMetrics = computed(() => [
  { key: 'composite', label: '綜合', value: toScore(cluster.value?.compositeScore) },
  { key: 'business', label: '商業', value: toScore(cluster.value?.businessScore) },
  { key: 'population', label: '人口', value: toScore(cluster.value?.populationScore) },
  { key: 'people', label: '人流', value: toScore(cluster.value?.peopleScore) },
  { key: 'transit', label: '交通', value: toScore(cluster.value?.transitScore) },
])

const loadClusterDetail = async () => {
  if (!props.clusterId) {
    cluster.value = null
    loadError.value = '缺少生活圈編號，無法取得詳情。'
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    cluster.value = await caseApi.getCluster({ id: props.clusterId })
  } catch (error) {
    loadError.value = error?.response?.data?.message || error.message || '取得生活圈詳情失敗'
    cluster.value = null
  } finally {
    isLoading.value = false
  }
}

watch(() => props.clusterId, () => {
  activeTab.value = clusterTabs[0].key
  loadClusterDetail()
})

onMounted(loadClusterDetail)
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

              <div class="cluster-metric-strip">
                <span class="cluster-rating">熱區 <strong>A</strong></span>
                <span v-for="metric in clusterMetrics" :key="metric.key" class="cluster-metric">
                  {{ metric.label }}
                  <strong>{{ metric.value }}</strong>
                </span>
              </div>
            </div>

            <div class="detail-title-meta">
              <span class="badge type">生活圈</span>
              <strong>ID：{{ clusterId || '-' }}</strong>
            </div>
          </div>

          <div v-if="loadError" class="form-message error">{{ loadError }}</div>

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

          <component :is="activePanel" :cluster="cluster" />
        </section>

        <PageLoading
          v-if="isLoading"
          title="正在取得生活圈詳情"
          description="系統正在載入生活圈分數與指標資料。"
        />
      </div>
    </div>
  </main>
</template>
