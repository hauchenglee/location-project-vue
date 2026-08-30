<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ClusterLocatorMap from '@/components/maps/ClusterLocatorMap.vue'
import { sameClusterId } from '@/maps/models/metricCluster'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['back', 'view-cluster'])

const detailAnalysis = ref(null)
const metricClusterList = ref([])
const isLoading = ref(false)
const loadError = ref('')
const locatorMapRef = ref(null)
const selectedMetricClusterId = ref(null)

const metricClusterItemEls = new Map()
const baseAnalysis = computed(() => detailAnalysis.value || {})

const loadAnalysisDetail = async () => {
  if (!props.analysisId) {
    detailAnalysis.value = null
    metricClusterList.value = []
    loadError.value = '缺少分析案件編號，無法取得詳情。'
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [analysis, clusters] = await Promise.all([
      caseApi.getAnalysis({ id: props.analysisId }),
      caseApi.listMetricClusters({ analysisId: props.analysisId }),
    ])

    detailAnalysis.value = analysis
    metricClusterList.value = Array.isArray(clusters) ? clusters : []
  } catch (error) {
    loadError.value = error?.response?.data?.message || error.message || '取得分析詳情失敗'
    detailAnalysis.value = null
    metricClusterList.value = []
  } finally {
    isLoading.value = false
  }
}

const toScore = (value) => {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(score) : 0
}

const metricClusterRows = computed(() => {
  return metricClusterList.value.map((metricCluster, index) => {
    const compositeScoreDisplay = toScore(metricCluster.compositeScore)

    return {
      ...metricCluster,
      rowKey: metricCluster.id,
      displayName: `生活圈 ${index + 1}`,
      compositeScoreDisplay,
      sequence: index + 1,
    }
  })
})

const selectedCluster = computed(
  () => metricClusterRows.value.find((metricCluster) => sameClusterId(metricCluster.id, selectedMetricClusterId.value)) || null,
)

const mapReadyCount = computed(() => metricClusterRows.value.length)

const formatLocation = (analysis) => {
  const district = [analysis.countyName, analysis.townName].filter(Boolean).join(' / ')

  return district || '-'
}

const setClusterItemEl = (metricClusterId, element) => {
  if (element) {
    metricClusterItemEls.set(String(metricClusterId), element)
    return
  }

  metricClusterItemEls.delete(String(metricClusterId))
}

const scrollToClusterItem = (metricClusterId) => {
  const itemEl = metricClusterItemEls.get(String(metricClusterId))
  itemEl?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
}

const selectCluster = (metricCluster, options = {}) => {
  if (!metricCluster) return

  selectedMetricClusterId.value = metricCluster.id

  if (options.focusMap) {
    locatorMapRef.value?.focusCluster(metricCluster)
  }

  if (options.centerMap) {
    locatorMapRef.value?.centerCluster(metricCluster)
  }

  if (options.scrollList) {
    scrollToClusterItem(metricCluster.id)
  }
}

const fitAllClusters = () => {
  locatorMapRef.value?.fitAllClusters()
}

const locateSelectedCluster = () => {
  if (!selectedCluster.value) return

  locatorMapRef.value?.focusCluster(selectedCluster.value)
}

watch(() => props.analysisId, async () => {
  selectedMetricClusterId.value = null
  await loadAnalysisDetail()
})

watch(metricClusterRows, async (rows) => {
  if (!rows.length) {
    selectedMetricClusterId.value = null
    return
  }

  if (selectedMetricClusterId.value && !rows.some((metricCluster) => sameClusterId(metricCluster.id, selectedMetricClusterId.value))) {
    selectedMetricClusterId.value = null
  }

  if (!selectedMetricClusterId.value) {
    selectedMetricClusterId.value = rows[0].id
  }
}, { deep: true })

onMounted(async () => {
  await loadAnalysisDetail()
})

onBeforeUnmount(() => {
  metricClusterItemEls.clear()
})
</script>

<template>
  <main class="main detail-layout">
    <div class="analysis-detail-workspace">
      <aside class="analysis-cluster-pane">
        <div class="analysis-cluster-head">
          <div class="detail-title-row">
            <button class="detail-back-button" type="button" aria-label="返回分析列表" @click="emit('back')">
              <span aria-hidden="true">‹</span>
            </button>
            <div>
              <h2>{{ baseAnalysis.productName || '分析詳情' }}</h2>
              <p>{{ formatLocation(baseAnalysis) }}</p>
            </div>
          </div>

          <div v-if="loadError" class="form-message error">{{ loadError }}</div>
        </div>

        <div class="analysis-cluster-list" aria-label="生活圈列表">
          <div v-if="!metricClusterRows.length" class="analysis-empty-state">
            目前沒有生活圈資料。
          </div>

          <article
            v-for="metricCluster in metricClusterRows"
            :key="metricCluster.rowKey"
            :ref="(element) => setClusterItemEl(metricCluster.id, element)"
            class="analysis-cluster-item"
            :class="{ active: sameClusterId(metricCluster.id, selectedMetricClusterId) }"
            tabindex="0"
            @click="selectCluster(metricCluster, { centerMap: true })"
            @keydown.enter="selectCluster(metricCluster, { centerMap: true })"
          >
            <div class="cluster-item-main">
              <span class="cluster-index">{{ metricCluster.sequence }}</span>
              <div>
                <h3>{{ metricCluster.displayName }}</h3>
                <p>Cluster #{{ metricCluster.id || '-' }}</p>
              </div>
            </div>

            <div class="cluster-score-row">
              <strong>{{ metricCluster.compositeScoreDisplay }}</strong>
              <span>綜合分數</span>
            </div>

            <button class="btn-sm primary" type="button" @click.stop="emit('view-cluster', metricCluster, baseAnalysis)">
              查看詳情
            </button>
          </article>
        </div>
      </aside>

      <section class="analysis-map-pane">
        <div class="analysis-map-top">
          <div>
            <h3>生活圈位置</h3>
            <p>
              <template v-if="selectedCluster">
                已選取 {{ selectedCluster.displayName }} / Cluster #{{ selectedCluster.id || '-' }}
              </template>
              <template v-else>
                點選列表、編號或地圖區塊進行同步定位
              </template>
            </p>
          </div>
          <div class="analysis-map-actions">
            <button class="btn-sm" type="button" :disabled="!mapReadyCount" @click="fitAllClusters">
              全部範圍
            </button>
            <button class="btn-sm" type="button" :disabled="!selectedCluster" @click="locateSelectedCluster">
              定位選取
            </button>
            <strong>{{ mapReadyCount }} clusters</strong>
          </div>
        </div>

        <div class="analysis-map-stage">
          <ClusterLocatorMap
            ref="locatorMapRef"
            :analysis-id="analysisId"
            :metric-clusters="metricClusterRows"
            :selected-metric-cluster-id="selectedMetricClusterId"
            @select-cluster="selectCluster($event, { scrollList: true })"
          />
          <div v-if="!metricClusterRows.length && !isLoading" class="analysis-map-empty">
            目前沒有可顯示的生活圈位置資料。
          </div>
        </div>
      </section>

      <PageLoading
        v-if="isLoading"
        title="正在取得分析詳情"
        description="系統正在載入生活圈列表與地圖資料。"
      />
    </div>
  </main>
</template>
