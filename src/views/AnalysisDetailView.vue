<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import { formatGeometrySummary } from '@/utils/geoJson'

maplibregl.setWorkerUrl(maplibreWorkerUrl)

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
let mapResizeObserver
const clusterItemEls = new Map()

const MVT_SOURCE_ID = 'location-mvt'
const TAIWAN_CENTER = [121.5654, 25.033]
const TAIWAN_BOUNDS = [
  [118.0, 21.5],
  [123.5, 26.6],
]
const CLUSTER_SEARCH_ZOOM = 11
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

const mapReadyCount = computed(() => metricClusterRows.value.length)

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

const extendBoundsWithCoordinates = (bounds, coordinates) => {
  if (!Array.isArray(coordinates)) return

  if (Number.isFinite(Number(coordinates[0])) && Number.isFinite(Number(coordinates[1]))) {
    bounds.extend([Number(coordinates[0]), Number(coordinates[1])])
    return
  }

  coordinates.forEach((coordinate) => extendBoundsWithCoordinates(bounds, coordinate))
}

const getGeometryBounds = (geometryLike) => {
  const geometry = geometryLike?.type === 'Feature' ? geometryLike.geometry : geometryLike
  if (!geometry) return null

  const bounds = new maplibregl.LngLatBounds()

  if (geometry.type === 'GeometryCollection') {
    geometry.geometries?.forEach((item) => extendBoundsWithCoordinates(bounds, item?.coordinates))
  } else {
    extendBoundsWithCoordinates(bounds, geometry.coordinates)
  }

  return bounds.isEmpty() ? null : bounds
}

const toFiniteNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const getClusterBoundsFromVo = (metricCluster) => {
  const minLng = toFiniteNumber(metricCluster?.minLng)
  const minLat = toFiniteNumber(metricCluster?.minLat)
  const maxLng = toFiniteNumber(metricCluster?.maxLng)
  const maxLat = toFiniteNumber(metricCluster?.maxLat)

  if ([minLng, minLat, maxLng, maxLat].some((value) => value === null)) {
    return null
  }

  const bounds = new maplibregl.LngLatBounds()
  bounds.extend([Math.min(minLng, maxLng), Math.min(minLat, maxLat)])
  bounds.extend([Math.max(minLng, maxLng), Math.max(minLat, maxLat)])

  return bounds.isEmpty() ? null : bounds
}

const selectCluster = (metricCluster, options = {}) => {
  if (!metricCluster) return

  selectedClusterKey.value = metricCluster.clusterKey
  updateMetricCellPaint()

  if (options.focusMap) {
    scheduleClusterFocus(metricCluster)
  }

  if (options.scrollList) {
    scrollToClusterItem(metricCluster.clusterKey)
  }
}

const fitAllClusters = () => {
  if (!map) return

  map.fitBounds(TAIWAN_BOUNDS, {
    padding: 34,
    animate: false,
  })
}

const resizeMapAfterLayout = async () => {
  if (!map) return

  await nextTick()
  map.resize()
  requestAnimationFrame(() => {
    map?.resize()
    requestAnimationFrame(() => map?.resize())
  })
}

const fitAnalysisAreaForClusterSearch = (options = {}) => {
  if (!map) return

  const analysisBounds = getGeometryBounds(baseAnalysis.value.geom)
  const duration = options.animate === false ? 0 : 360

  if (analysisBounds) {
    map.fitBounds(analysisBounds, {
      padding: 72,
      maxZoom: 14,
      duration,
    })
    return
  }

  map.easeTo({
    center: TAIWAN_CENTER,
    zoom: CLUSTER_SEARCH_ZOOM,
    duration,
  })
}

const getApiUrl = (path) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return `${baseUrl}${path}`
}

const getTileUrl = () => {
  const params = new URLSearchParams()
  if (props.analysisId) params.set('analysisId', props.analysisId)
  const query = params.toString()
  return getApiUrl(`/api/map/tiles/{z}/{x}/{y}.mvt${query ? `?${query}` : ''}`)
}

const createMapStyle = () => ({
  version: 8,
  sources: {
    [MVT_SOURCE_ID]: {
      type: 'vector',
      tiles: [getTileUrl()],
      minzoom: 0,
      maxzoom: 22,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#eef3f8',
      },
    },
    {
      id: 'admin-county-fill',
      type: 'fill',
      source: MVT_SOURCE_ID,
      'source-layer': 'admin_county',
      minzoom: 0,
      maxzoom: 12,
      paint: {
        'fill-color': '#e8edf3',
        'fill-opacity': 0.72,
      },
    },
    {
      id: 'admin-county-outline',
      type: 'line',
      source: MVT_SOURCE_ID,
      'source-layer': 'admin_county',
      minzoom: 0,
      maxzoom: 13,
      paint: {
        'line-color': '#9aa8b8',
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 11, 1.2],
      },
    },
    {
      id: 'admin-town-outline',
      type: 'line',
      source: MVT_SOURCE_ID,
      'source-layer': 'admin_town',
      minzoom: 8,
      maxzoom: 15,
      paint: {
        'line-color': '#c0cad6',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 13, 0.9],
      },
    },
    {
      id: 'metric-cell-fill',
      type: 'fill',
      source: MVT_SOURCE_ID,
      'source-layer': 'metric_cell',
      minzoom: 8,
      maxzoom: 23,
      paint: metricCellFillPaint(),
    },
    {
      id: 'metric-cell-outline',
      type: 'line',
      source: MVT_SOURCE_ID,
      'source-layer': 'metric_cell',
      minzoom: 8,
      maxzoom: 23,
      paint: metricCellOutlinePaint(),
    },
    {
      id: 'metro-station-circle',
      type: 'circle',
      source: MVT_SOURCE_ID,
      'source-layer': 'metro_station',
      minzoom: 10,
      maxzoom: 23,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 16, 5],
        'circle-color': '#2662d9',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
        'circle-opacity': 0.9,
      },
    },
    {
      id: 'business-entity-circle',
      type: 'circle',
      source: MVT_SOURCE_ID,
      'source-layer': 'business_entity',
      minzoom: 12,
      maxzoom: 23,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 17, 4],
        'circle-color': '#14825d',
        'circle-opacity': 0.52,
      },
    },
  ],
})

function clusterMatchExpression(clusterKey) {
  return ['==', ['to-string', ['get', 'metric_cluster_id']], clusterKey || '']
}

function metricCellBaseColorExpression() {
  return [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'composite_rank'], 0],
    0,
    '#94a3b8',
    25,
    '#d73b3e',
    50,
    '#ff9f1c',
    75,
    '#2f7df0',
    100,
    '#188a55',
  ]
}

function metricCellFillPaint() {
  const selected = clusterMatchExpression(selectedClusterKey.value)
  const hovered = clusterMatchExpression(hoveredClusterKey.value)

  return {
    'fill-color': ['case', selected, '#0f172a', hovered, '#1f2937', metricCellBaseColorExpression()],
    'fill-opacity': ['case', selected, 0.58, hovered, 0.42, 0.28],
  }
}

function metricCellOutlinePaint() {
  const selected = clusterMatchExpression(selectedClusterKey.value)
  const hovered = clusterMatchExpression(hoveredClusterKey.value)

  return {
    'line-color': ['case', selected, '#020617', hovered, '#111827', '#ffffff'],
    'line-width': ['case', selected, 2.2, hovered, 1.5, 0.7],
    'line-opacity': ['case', selected, 0.95, hovered, 0.85, 0.55],
  }
}

const updateMetricCellPaint = () => {
  if (!map?.isStyleLoaded?.()) return
  if (!map.getLayer('metric-cell-fill') || !map.getLayer('metric-cell-outline')) return

  map.setPaintProperty('metric-cell-fill', 'fill-color', metricCellFillPaint()['fill-color'])
  map.setPaintProperty('metric-cell-fill', 'fill-opacity', metricCellFillPaint()['fill-opacity'])
  map.setPaintProperty('metric-cell-outline', 'line-color', metricCellOutlinePaint()['line-color'])
  map.setPaintProperty('metric-cell-outline', 'line-width', metricCellOutlinePaint()['line-width'])
  map.setPaintProperty('metric-cell-outline', 'line-opacity', metricCellOutlinePaint()['line-opacity'])
}

const isClusterFeature = (feature, clusterKey) => String(feature?.properties?.metric_cluster_id ?? '') === clusterKey

const focusClusterBounds = (bounds, options = {}) => {
  if (!map || !bounds) return false
  const duration = options.animate === false ? 0 : 520

  map.fitBounds(bounds, {
    padding: 54,
    maxZoom: 15,
    duration,
  })

  return true
}

const scheduleClusterFocus = (metricClusterOrKey, options = {}) => {
  if (!map || !metricClusterOrKey) return

  const metricCluster = typeof metricClusterOrKey === 'object'
    ? metricClusterOrKey
    : metricClusterRows.value.find((row) => row.clusterKey === String(metricClusterOrKey))

  if (focusClusterBounds(getClusterBoundsFromVo(metricCluster), options)) {
    return
  }

  fitAnalysisAreaForClusterSearch(options)
}

const findMetricClusterByFeature = (feature) => {
  const clusterKey = String(feature?.properties?.metric_cluster_id ?? '')
  return metricClusterRows.value.find((metricCluster) => metricCluster.clusterKey === clusterKey)
}

const refreshMapTiles = () => {
  if (!map) return

  map.setStyle(createMapStyle())
  map.once('idle', () => {
    updateMetricCellPaint()
    if (selectedClusterKey.value) {
      scheduleClusterFocus(selectedClusterKey.value)
    }
  })
}

const initializeMap = async () => {
  await nextTick()
  if (map || !mapEl.value) return

  map = new maplibregl.Map({
    container: mapEl.value,
    style: createMapStyle(),
    center: TAIWAN_CENTER,
    zoom: 8,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

  mapResizeObserver = new ResizeObserver(() => {
    map?.resize()
  })
  mapResizeObserver.observe(mapEl.value)

  map.on('load', async () => {
    await resizeMapAfterLayout()
    if (selectedClusterKey.value) {
      scheduleClusterFocus(selectedClusterKey.value, { animate: false })
    } else {
      fitAllClusters()
    }
    updateMetricCellPaint()
  })

  map.on('click', 'metric-cell-fill', (event) => {
    const metricCluster = findMetricClusterByFeature(event.features?.[0])
    if (metricCluster) selectCluster(metricCluster, { scrollList: true, focusMap: true })
  })

  map.on('mousemove', 'metric-cell-fill', (event) => {
    map.getCanvas().style.cursor = 'pointer'
    hoveredClusterKey.value = String(event.features?.[0]?.properties?.metric_cluster_id ?? '')
    updateMetricCellPaint()
  })

  map.on('mouseleave', 'metric-cell-fill', () => {
    map.getCanvas().style.cursor = ''
    hoveredClusterKey.value = null
    updateMetricCellPaint()
  })
}

watch(() => props.analysisId, () => {
  selectedClusterKey.value = null
  loadAnalysisDetail()
  refreshMapTiles()
})

watch(metricClusterRows, async (rows) => {
  if (!rows.length) {
    selectedClusterKey.value = null
    return
  }

  if (!rows.some((metricCluster) => metricCluster.clusterKey === selectedClusterKey.value)) {
    selectedClusterKey.value = rows[0].clusterKey
  }

  await nextTick()
  updateMetricCellPaint()
  scheduleClusterFocus(selectedClusterKey.value)
}, { deep: true })

watch(selectedClusterKey, updateMetricCellPaint)

onMounted(async () => {
  await loadAnalysisDetail()
  initializeMap()
})

onBeforeUnmount(() => {
  mapResizeObserver?.disconnect()
  mapResizeObserver = null
  map?.remove()
  map = null
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
            <h3>Vector Tile / MVT</h3>
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
            <strong>{{ mapReadyCount }} clusters</strong>
          </div>
        </div>

        <div class="analysis-map-stage">
          <div ref="mapEl" class="analysis-cluster-map maplibre-stage" aria-label="生活圈 Vector Tile 地圖"></div>
          <div v-if="!metricClusterRows.length && !isLoading" class="analysis-map-empty">
            目前沒有可顯示的生活圈 MVT 資料。
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
