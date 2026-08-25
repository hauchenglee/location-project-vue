<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  vo: {
    type: Array,
    default: () => [],
  },
  clusterId: {
    type: [Number, String],
    default: null,
  },
})

const mapEl = ref(null)
const selectedCellId = ref(null)
const hoveredCellId = ref(null)
const visibleMode = ref('cluster')

let map
let geoJsonLayer
const layerByCellId = new Map()
const maxCellZoom = 19
const cellZoomOffset = 2
const cellBoundsPadding = [36, 36]
let cellFocusZoom = 17

const metricGroups = [
  {
    key: 'heat',
    title: '熱力',
    metrics: [
      { key: 'compositeRank', label: '綜合模型強度' },
    ],
  },
  {
    key: 'business',
    title: '商業',
    metrics: [
      { key: 'businessCountRank', label: '店家總數' },
      { key: 'industryCountRank', label: '產業類別數' },
      { key: 'hhiRank', label: 'HHI 集中度' },
      { key: 'entropyRank', label: 'Shannon Entropy 多樣性' },
      { key: 'competitionImpactRank', label: '競品壓力' },
    ],
  },
  {
    key: 'population',
    title: '人口',
    metrics: [
      { key: 'populationCountRank', label: '人口數量' },
      { key: 'populationTargetAgeRank', label: '目標年齡層人口' },
    ],
  },
  {
    key: 'people',
    title: '人潮',
    metrics: [
      { key: 'peopleCountRank', label: '人潮數量' },
      { key: 'peoplePeakRank', label: '人潮高峰' },
      { key: 'peopleAverageRank', label: '平均人潮' },
    ],
  },
  {
    key: 'transit',
    title: '交通',
    metrics: [
      { key: 'metroImpactRank', label: '捷運影響力' },
    ],
  },
]

const metricCells = computed(() => {
  const cells = Array.isArray(props.vo) ? props.vo : []

  if (visibleMode.value === 'all' || !props.clusterId) {
    return cells
  }

  return cells.filter((cell) => String(cell.metricClusterId) === String(props.clusterId))
})

const selectedCell = computed(
  () => metricCells.value.find((cell) => String(cell.id) === String(selectedCellId.value)) || metricCells.value[0] || null,
)

const selectedCellMetrics = computed(() => {
  if (!selectedCell.value) return []

  return metricGroups.map((group) => ({
    ...group,
    metrics: group.metrics.map((metric) => ({
      ...metric,
      value: selectedCell.value?.[metric.key],
      displayValue: formatRank(selectedCell.value?.[metric.key]),
    })),
  }))
})

const formatRank = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number)
}

const getHeatColor = (value) => {
  const rank = Number(value)

  if (!Number.isFinite(rank)) return '#e2e8f0'
  if (rank < 80) return '#e2e8f0'
  if (rank < 85) return '#fde68a'
  if (rank < 90) return '#f59e0b'
  if (rank < 95) return '#f97316'
  return '#dc2626'
}

const toFeature = (cell) => {
  if (!cell?.geom) return null

  return {
    type: 'Feature',
    properties: {
      cell,
      cellId: cell.id,
    },
    geometry: cell.geom,
  }
}

const getCellStyle = (cellId, cell) => {
  const isSelected = String(cellId) === String(selectedCellId.value)
  const isHovered = String(cellId) === String(hoveredCellId.value)

  if (isSelected) {
    return {
      color: '#0f172a',
      weight: 3,
      fillColor: getHeatColor(cell?.compositeRank),
      fillOpacity: 0.88,
    }
  }

  if (isHovered) {
    return {
      color: '#0f172a',
      weight: 3,
      fillColor: getHeatColor(cell?.compositeRank),
      fillOpacity: 0.72,
    }
  }

  return {
    color: '#334155',
    weight: 1.4,
    fillColor: getHeatColor(cell?.compositeRank),
    fillOpacity: cell?.metricClusterId ? 0.5 : 0.24,
  }
}

const restyleLayers = () => {
  layerByCellId.forEach((layer, cellId) => {
    layer.setStyle(getCellStyle(cellId, layer.feature?.properties?.cell))

    if (String(cellId) === String(selectedCellId.value)) {
      layer.bringToFront()
    }
  })
}

const setVisibleMode = (value) => {
  visibleMode.value = value
}

const selectCell = (cellId) => {
  selectedCellId.value = cellId
  restyleLayers()
}

const focusSelectedCell = () => {
  if (!map || !selectedCellId.value) return

  const layer = layerByCellId.get(selectedCellId.value)
  const bounds = layer?.getBounds?.()
  if (!bounds?.isValid?.()) return

  map.flyTo(bounds.getCenter(), cellFocusZoom, {
    animate: true,
    duration: 0.45,
  })
}

const updateCellFocusZoom = (bounds) => {
  if (!map || !bounds?.isValid?.()) return cellFocusZoom

  const fitZoom = map.getBoundsZoom(bounds, false, cellBoundsPadding)
  cellFocusZoom = Math.min(fitZoom + cellZoomOffset, maxCellZoom)
  return cellFocusZoom
}

const renderCells = async () => {
  await nextTick()
  if (!map) return

  if (geoJsonLayer) {
    geoJsonLayer.remove()
    geoJsonLayer = null
  }

  layerByCellId.clear()

  const features = metricCells.value.map(toFeature).filter(Boolean)
  if (!features.length) {
    selectedCellId.value = null
    return
  }

  if (!selectedCell.value || !metricCells.value.some((cell) => String(cell.id) === String(selectedCellId.value))) {
    selectedCellId.value = metricCells.value[0]?.id ?? null
  }

  geoJsonLayer = L.geoJSON(
    {
      type: 'FeatureCollection',
      features,
    },
    {
      style: (feature) => getCellStyle(feature.properties.cellId, feature.properties.cell),
      onEachFeature: (feature, layer) => {
        const cellId = feature.properties.cellId
        layerByCellId.set(cellId, layer)
        layer.on({
          click: () => {
            selectCell(cellId)
            window.setTimeout(focusSelectedCell, 0)
          },
          mouseover: () => {
            hoveredCellId.value = cellId
            restyleLayers()
          },
          mouseout: () => {
            hoveredCellId.value = null
            restyleLayers()
          },
        })
      },
    },
  ).addTo(map)

  const bounds = geoJsonLayer.getBounds()
  map.setView(bounds.getCenter(), updateCellFocusZoom(bounds), {
    animate: false,
  })

  restyleLayers()
  window.setTimeout(() => map?.invalidateSize(), 80)
}

onMounted(async () => {
  await nextTick()

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    boxZoom: true,
    keyboard: true,
  }).setView([25.033, 121.5654], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  renderCells()
})

watch(metricCells, renderCells, { deep: true })
watch(selectedCellId, restyleLayers)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  layerByCellId.clear()
})
</script>

<template>
  <div class="cell-panel">
    <section class="cell-map-shell">
      <div class="cell-map-head">
        <h3>
          空間熱點
          <span>MetricCellVo</span>
        </h3>
        <div class="cell-map-actions">
          <button class="cell-locate-button" type="button" :disabled="!selectedCell" @click="focusSelectedCell">
            定位選取 Cell
          </button>
          <strong>{{ metricCells.length }} cells</strong>
        </div>
      </div>
      <div class="cell-control-bar">
        <div class="cell-filter-block">
          <span>格網範圍</span>
          <div class="cell-filter-toggle" aria-label="格網顯示範圍">
            <button
              type="button"
              :class="{ active: visibleMode === 'cluster' }"
              @click="setVisibleMode('cluster')"
            >
              目前生活圈
            </button>
            <button
              type="button"
              :class="{ active: visibleMode === 'all' }"
              @click="setVisibleMode('all')"
            >
              全部格網
            </button>
          </div>
        </div>

        <div class="cell-heat-legend" aria-label="compositeRank 熱力圖例">
          <strong>compositeRank</strong>
          <span><i class="heat-80"></i>80-85</span>
          <span><i class="heat-85"></i>85-90</span>
          <span><i class="heat-90"></i>90-95</span>
          <span><i class="heat-95"></i>95-100</span>
        </div>
      </div>
      <div ref="mapEl" class="cell-map leaflet-stage" aria-label="空間熱點格網地圖"></div>
    </section>

    <aside class="cell-detail-shell">
      <div v-if="selectedCell" class="cell-detail">
        <div class="cell-detail-head">
          <div>
            <span>Selected Cell</span>
            <h3>Cell #{{ selectedCell.id }}</h3>
          </div>
          <strong>Cluster #{{ selectedCell.metricClusterId || clusterId || '-' }}</strong>
        </div>

        <dl class="cell-meta-grid">
          <div>
            <dt>Analysis</dt>
            <dd>{{ selectedCell.analysisId || '-' }}</dd>
          </div>
          <div>
            <dt>Cell ID</dt>
            <dd>{{ selectedCell.id || '-' }}</dd>
          </div>
        </dl>

        <section v-for="group in selectedCellMetrics" :key="group.key" class="cell-metric-group">
          <h4>{{ group.title }}</h4>
          <div class="cell-metric-list">
            <article v-for="metric in group.metrics" :key="metric.key" class="cell-metric-item">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.displayValue }} <small>/ 100</small></strong>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="cell-empty">
        <strong>尚無格網資料</strong>
        <span>目前生活圈沒有可呈現的 MetricCellVo。</span>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.cell-panel {
  min-height: 620px;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 16px;
}

.cell-map-shell,
.cell-detail-shell {
  min-height: 620px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.cell-map-shell {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}

.cell-map-head {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.5);
}

.cell-map-head h3,
.cell-detail-head h3,
.cell-metric-group h4 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}

.cell-map-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
}

.cell-map-head h3 span,
.cell-detail-head span {
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.cell-map-head strong,
.cell-detail-head strong {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.cell-map-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.cell-locate-button {
  min-height: 30px;
  padding: 6px 10px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  border-radius: 10px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  cursor: pointer;
  font-size: 12px;
  font-weight: 800;
}

.cell-locate-button:hover {
  background: rgba(37, 99, 235, 0.16);
}

.cell-locate-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.cell-control-bar {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(248, 250, 252, 0.72);
}

.cell-filter-block,
.cell-heat-legend {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.cell-filter-block > span,
.cell-heat-legend strong {
  color: #475569;
  font-size: 12px;
  font-weight: 900;
}

.cell-filter-toggle {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
}

.cell-filter-toggle button {
  min-height: 30px;
  padding: 6px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
}

.cell-filter-toggle button.active {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.2);
}

.cell-heat-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.cell-heat-legend i {
  width: 14px;
  height: 10px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 3px;
}

.cell-heat-legend .heat-80 {
  background: #fde68a;
}

.cell-heat-legend .heat-85 {
  background: #f59e0b;
}

.cell-heat-legend .heat-90 {
  background: #f97316;
}

.cell-heat-legend .heat-95 {
  background: #dc2626;
}

.cell-map {
  min-height: 560px;
  background: #eff6ff;
}

.cell-detail-shell {
  padding: 16px;
  overflow: auto;
}

.cell-detail {
  display: grid;
  gap: 14px;
}

.cell-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cell-detail-head h3 {
  margin-top: 4px;
  font-size: 24px;
}

.cell-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.cell-meta-grid div {
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.58);
}

.cell-meta-grid dt {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.cell-meta-grid dd {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 900;
}

.cell-metric-group {
  display: grid;
  gap: 9px;
}

.cell-metric-group h4 {
  font-size: 13px;
}

.cell-metric-list {
  display: grid;
  gap: 8px;
}

.cell-metric-item {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.62);
}

.cell-metric-item span {
  min-width: 0;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.cell-metric-item strong {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex-shrink: 0;
  color: #1e3a8a;
  font-size: 18px;
  font-weight: 900;
}

.cell-metric-item small {
  color: #64748b;
  font-size: 11px;
}

.cell-empty {
  min-height: 100%;
  display: grid;
  place-content: center;
  gap: 8px;
  color: #64748b;
  text-align: center;
}

.cell-empty strong {
  color: #0f172a;
}

:deep(.leaflet-interactive) {
  outline: none;
  transition: fill-opacity 0.16s ease, stroke-width 0.16s ease;
}

:deep(.leaflet-control-zoom a) {
  color: #1e40af;
  font-weight: 900;
}

@media (max-width: 1100px) {
  .cell-panel {
    grid-template-columns: 1fr;
  }

  .cell-map-shell,
  .cell-detail-shell {
    min-height: 520px;
  }
}

@media (max-width: 860px) {
  .cell-panel {
    min-height: 0;
  }

  .cell-map,
  .cell-map-shell,
  .cell-detail-shell {
    min-height: 420px;
  }
}
</style>
