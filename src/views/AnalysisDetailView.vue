<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import { formatGeometrySummary } from '@/utils/geoJson'

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
const mapEl = ref(null)
const selectedClusterKey = ref(null)
const hoveredClusterKey = ref(null)

let map
let clusterLayer
const layerByClusterKey = new Map()
const clusterItemEls = new Map()
const clusterBoundsPadding = [40, 40]

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
    const clusterKey = String(metricCluster.id ?? `metric-cluster-${index + 1}`)

    return {
      ...metricCluster,
      rowKey: clusterKey,
      clusterKey,
      displayName: `生活圈 ${index + 1}`,
      compositeScoreDisplay,
      sequence: index + 1,
    }
  })
})

const selectedCluster = computed(
  () => metricClusterRows.value.find((metricCluster) => metricCluster.clusterKey === selectedClusterKey.value) || null,
)

const mapReadyCount = computed(() => metricClusterRows.value.filter((metricCluster) => metricCluster.geom).length)

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatLocation = (analysis) => {
  const district = [analysis.countyName, analysis.townName].filter(Boolean).join(' / ')

  return district || formatGeometrySummary(analysis.geom)
}

const getScoreColor = (value) => {
  const score = Number(value)

  if (!Number.isFinite(score)) return '#94a3b8'
  if (score >= 90) return '#188a55'
  if (score >= 80) return '#2f7df0'
  if (score >= 70) return '#ff9f1c'
  return '#d73b3e'
}

const getClusterStyle = (metricCluster) => {
  const isSelected = metricCluster.clusterKey === selectedClusterKey.value
  const isHovered = metricCluster.clusterKey === hoveredClusterKey.value
  const color = getScoreColor(metricCluster.compositeScore)

  return {
    color: isSelected || isHovered ? '#0f172a' : color,
    weight: isSelected ? 3 : isHovered ? 2.5 : 1.6,
    fillColor: color,
    fillOpacity: isSelected ? 0.36 : isHovered ? 0.28 : 0.18,
  }
}

const restyleClusterLayers = () => {
  layerByClusterKey.forEach((layer, clusterKey) => {
    const metricCluster = layer.feature?.properties?.metricCluster
    layer.setStyle(getClusterStyle(metricCluster))

    if (clusterKey === selectedClusterKey.value) {
      layer.bringToFront()
    }
  })
}

const setClusterItemEl = (clusterKey, element) => {
  if (element) {
    clusterItemEls.set(clusterKey, element)
    return
  }

  clusterItemEls.delete(clusterKey)
}

const scrollToClusterItem = (clusterKey) => {
  const itemEl = clusterItemEls.get(clusterKey)
  itemEl?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
}

const getLayerBounds = (clusterKey) => {
  const layer = layerByClusterKey.get(clusterKey)
  const bounds = layer?.getBounds?.()

  if (bounds?.isValid?.()) return bounds

  const latLng = layer?.getLatLng?.()
  return latLng ? L.latLngBounds([latLng]) : null
}

const focusClusterOnMap = (clusterKey) => {
  if (!map) return

  const bounds = getLayerBounds(clusterKey)
  if (!bounds) return

  map.flyToBounds(bounds, {
    padding: clusterBoundsPadding,
    maxZoom: 16,
    animate: true,
    duration: 0.5,
  })
}

const selectCluster = (metricCluster, options = {}) => {
  if (!metricCluster) return

  selectedClusterKey.value = metricCluster.clusterKey
  restyleClusterLayers()

  if (options.focusMap) {
    focusClusterOnMap(metricCluster.clusterKey)
  }

  if (options.scrollList) {
    scrollToClusterItem(metricCluster.clusterKey)
  }
}

const toFeature = (metricCluster) => {
  if (!metricCluster?.geom) return null
  const geometry = metricCluster.geom.type === 'Feature' ? metricCluster.geom.geometry : metricCluster.geom

  if (!geometry) return null

  return {
    type: 'Feature',
    properties: {
      metricCluster,
      clusterKey: metricCluster.clusterKey,
    },
    geometry,
  }
}

const fitAllClusters = () => {
  if (!map || !clusterLayer) return

  const bounds = clusterLayer.getBounds()
  if (!bounds?.isValid?.()) return

  map.fitBounds(bounds, {
    padding: clusterBoundsPadding,
    maxZoom: 14,
    animate: false,
  })
}

const renderClusterMap = async () => {
  await nextTick()
  if (!map) return

  if (clusterLayer) {
    clusterLayer.remove()
    clusterLayer = null
  }

  layerByClusterKey.clear()

  const features = metricClusterRows.value.map(toFeature).filter(Boolean)
  if (!features.length) {
    selectedClusterKey.value = metricClusterRows.value[0]?.clusterKey ?? null
    return
  }

  if (!metricClusterRows.value.some((metricCluster) => metricCluster.clusterKey === selectedClusterKey.value)) {
    selectedClusterKey.value = features[0].properties.clusterKey
  }

  clusterLayer = L.geoJSON(
    {
      type: 'FeatureCollection',
      features,
    },
    {
      style: (feature) => getClusterStyle(feature.properties.metricCluster),
      onEachFeature: (feature, layer) => {
        const metricCluster = feature.properties.metricCluster
        const clusterKey = feature.properties.clusterKey
        layerByClusterKey.set(clusterKey, layer)
        layer.on({
          click: () => selectCluster(metricCluster, { scrollList: true }),
          mouseover: () => {
            hoveredClusterKey.value = clusterKey
            restyleClusterLayers()
          },
          mouseout: () => {
            hoveredClusterKey.value = null
            restyleClusterLayers()
          },
        })
      },
    },
  ).addTo(map)

  fitAllClusters()
  restyleClusterLayers()
  window.setTimeout(() => map?.invalidateSize(), 80)
}

const initializeMap = async () => {
  await nextTick()
  if (map || !mapEl.value) return

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
  }).setView([25.033, 121.5654], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderClusterMap()
}

watch(() => props.analysisId, () => {
  selectedClusterKey.value = null
  loadAnalysisDetail()
})

watch(metricClusterRows, renderClusterMap, { deep: true })
watch(selectedClusterKey, restyleClusterLayers)

onMounted(async () => {
  await loadAnalysisDetail()
  initializeMap()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layerByClusterKey.clear()
  clusterItemEls.clear()
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

          <div class="analysis-meta-strip">
            <span class="badge done">{{ statusLabelMap[baseAnalysis.status] || '-' }}</span>
            <span>{{ metricClusterRows.length }} 個生活圈</span>
            <span>{{ formatDateTime(baseAnalysis.createTime) }}</span>
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
            :ref="(element) => setClusterItemEl(metricCluster.clusterKey, element)"
            class="analysis-cluster-item"
            :class="{ active: metricCluster.clusterKey === selectedClusterKey }"
            tabindex="0"
            @click="selectCluster(metricCluster, { focusMap: true })"
            @keydown.enter="selectCluster(metricCluster, { focusMap: true })"
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

            <div class="cluster-mini-metrics">
              <span>商業 <strong>{{ toScore(metricCluster.businessScore) }}</strong></span>
              <span>人口 <strong>{{ toScore(metricCluster.populationScore) }}</strong></span>
              <span>人潮 <strong>{{ toScore(metricCluster.peopleScore) }}</strong></span>
              <span>交通 <strong>{{ toScore(metricCluster.transitScore) }}</strong></span>
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
            <h3>OpenStreetMap</h3>
            <p>
              <template v-if="selectedCluster">
                已選取 {{ selectedCluster.displayName }} / Cluster #{{ selectedCluster.id || '-' }}
              </template>
              <template v-else>
                點選生活圈或地圖區塊進行同步定位
              </template>
            </p>
          </div>
          <div class="analysis-map-actions">
            <button class="btn-sm" type="button" :disabled="!mapReadyCount" @click="fitAllClusters">
              全部範圍
            </button>
            <strong>{{ mapReadyCount }} layers</strong>
          </div>
        </div>

        <div class="analysis-map-stage">
          <div ref="mapEl" class="analysis-cluster-map leaflet-stage" aria-label="生活圈 OpenStreetMap"></div>
          <div v-if="metricClusterRows.length && !mapReadyCount" class="analysis-map-empty">
            目前生活圈缺少可繪製的 geom。
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
