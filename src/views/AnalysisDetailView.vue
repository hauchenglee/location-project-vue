<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ClusterLocatorMap from '@/components/maps/ClusterLocatorMap.vue'
import PageLoading from '@/components/PageLoading.vue'
import { CLUSTER_LOCATOR_COLORS } from '@/maps/constants'
import { sameClusterId } from '@/maps/models/metricCluster'
import { caseApi } from '@/services/caseApi'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['back', 'view-cluster', 'create'])

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
    loadError.value = '缺少分析編號，無法取得這筆分析。'
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
    loadError.value = error?.response?.data?.message || '取得分析失敗，請稍後再試。'
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

const metricClusterRows = computed(() =>
  metricClusterList.value.map((metricCluster, index) => {
    const compositeScoreDisplay = toScore(metricCluster.compositeScore)

    return {
      ...metricCluster,
      rowKey: metricCluster.id,
      sequence: index + 1,
      displayName: `生活圈 ${String(index + 1).padStart(2, '0')}`,
      compositeScoreDisplay,
    }
  }),
)

const selectedCluster = computed(
  () => metricClusterRows.value.find((metricCluster) => sameClusterId(metricCluster.id, selectedMetricClusterId.value)) || null,
)

const mapReadyCount = computed(() => metricClusterRows.value.length)

const legendItems = computed(() =>
  metricClusterRows.value.slice(0, 8).map((metricCluster, index) => ({
    id: metricCluster.id,
    label: String(metricCluster.sequence).padStart(2, '0'),
    color: CLUSTER_LOCATOR_COLORS[index % CLUSTER_LOCATOR_COLORS.length],
  })),
)

const formatLocation = (analysis) => {
  const longitude = Number(analysis.longitude)
  const latitude = Number(analysis.latitude)
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    return `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`
  }

  return [analysis.countyName, analysis.townName].filter(Boolean).join(' / ') || '座標未設定'
}

const formatMeter = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || !number) return '-'
  return number >= 1000 ? `${number / 1000} km` : `${number} m`
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

watch(metricClusterRows, (rows) => {
  if (!rows.length) {
    selectedMetricClusterId.value = null
    return
  }

  if (selectedMetricClusterId.value && !rows.some((row) => sameClusterId(row.id, selectedMetricClusterId.value))) {
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
  <div class="detail-workspace">
    <aside class="star-pane">
      <div class="star-pane-head">
        <div class="star-head-row">
          <button class="back-btn" type="button" aria-label="返回分析紀錄" @click="emit('back')">
            <span aria-hidden="true">‹</span>
          </button>
          <div class="star-head-main">
            <p class="eyebrow eyebrow--plain">ANALYSIS / 分析</p>
            <h1>{{ baseAnalysis.productName || '分析詳情' }}</h1>
            <p>{{ baseAnalysis.analysisNo || `#${analysisId}` }} · {{ formatLocation(baseAnalysis) }}</p>
          </div>
        </div>

        <div class="star-head-meta">
          <span>範圍 <b>{{ formatMeter(baseAnalysis.radius) }}</b></span>
          <span>偏好 <b>{{ baseAnalysis.preference || '-' }}</b></span>
          <span>生活圈 <b>{{ mapReadyCount }}</b></span>
        </div>

        <div v-if="loadError" class="form-message error">{{ loadError }}</div>
      </div>

      <div class="star-list" aria-label="生活圈列表">
        <div class="star-list-label">
          <span>AREAS / 生活圈</span>
          <span>{{ mapReadyCount }} 個候選</span>
        </div>

        <div v-if="!metricClusterRows.length" class="star-pane-empty">
          這筆分析還沒有產生生活圈。等分析完成，或回分析紀錄看看其他分析。
          <div class="btn-row" style="justify-content: center; margin-top: 14px;">
            <button class="btn-sm" type="button" @click="emit('create')">開始分析</button>
          </div>
        </div>

        <article
          v-for="(metricCluster, index) in metricClusterRows"
          :key="metricCluster.rowKey"
          :ref="(element) => setClusterItemEl(metricCluster.id, element)"
          class="star-card"
          :class="{ active: sameClusterId(metricCluster.id, selectedMetricClusterId) }"
          tabindex="0"
          @click="selectCluster(metricCluster, { centerMap: true })"
          @keydown.enter="selectCluster(metricCluster, { centerMap: true })"
        >
          <div class="star-card-top">
            <span class="star-name">
              {{ metricCluster.displayName }}
              <small>AREA #{{ metricCluster.id || '-' }}</small>
            </span>
            <span v-if="index === 0" class="star-badge">首選</span>
          </div>

          <div class="star-score">
            <b>{{ metricCluster.compositeScoreDisplay }}</b>
            <span>綜合評分 / 100</span>
          </div>

          <div class="star-bar">
            <i :style="{ width: `${Math.min(metricCluster.compositeScoreDisplay, 100)}%` }"></i>
          </div>

          <div class="star-card-foot">
            <span>綜合排名 {{ String(metricCluster.sequence).padStart(2, '0') }}</span>
            <button class="star-link" type="button" @click.stop="emit('view-cluster', metricCluster, baseAnalysis)">
              查看生活圈 →
            </button>
          </div>
        </article>
      </div>
    </aside>

    <section class="map-pane">
      <div class="map-toolbar">
        <div>
          <h2>區位地圖</h2>
          <p v-if="selectedCluster">
            已選取 {{ selectedCluster.displayName }} · 綜合評分 {{ selectedCluster.compositeScoreDisplay }}
          </p>
          <p v-else>點列表或地圖上的編號，同步定位</p>
        </div>
        <div class="map-toolbar-actions">
          <button class="btn-sm" type="button" :disabled="!mapReadyCount" @click="fitAllClusters">
            全部範圍
          </button>
          <button class="btn-sm" type="button" :disabled="!selectedCluster" @click="locateSelectedCluster">
            定位選取
          </button>
          <span class="map-toolbar-count">{{ mapReadyCount }} AREAS</span>
        </div>
      </div>

      <div class="map-stage">
        <ClusterLocatorMap
          ref="locatorMapRef"
          :analysis-id="analysisId"
          :metric-clusters="metricClusterRows"
          :selected-metric-cluster-id="selectedMetricClusterId"
          @select-cluster="selectCluster($event, { scrollList: true })"
        />

        <div v-if="!metricClusterRows.length && !isLoading" class="map-empty">
          目前沒有可顯示的生活圈位置。
        </div>

        <div v-if="legendItems.length" class="map-legend">
          <span class="map-legend-title">AREA INDEX / 生活圈</span>
          <div class="map-legend-items">
            <span v-for="item in legendItems" :key="item.id" class="map-legend-item">
              <i :style="{ background: item.color }"></i>{{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <PageLoading
      v-if="isLoading"
      title="正在載入分析"
      description="系統正在載入生活圈與區位地圖圖層。"
    />
  </div>
</template>

<style scoped>
.detail-workspace {
  position: relative;
}

.detail-workspace > .map-pane {
  display: flex;
  flex-direction: column;
}

.star-head-main .eyebrow {
  font-size: 8px;
  margin-bottom: 5px;
}
</style>
