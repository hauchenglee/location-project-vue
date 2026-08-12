<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  analysis: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['back'])

const isParameterOpen = ref(true)
const isMapOpen = ref(true)
const activeClusterId = ref(null)

const demoMetricClusters = [
  { id: 501, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.539, 25.029], [121.548, 25.029], [121.548, 25.023], [121.539, 25.023], [121.539, 25.029]]] }, compositeScore: 91, businessScore: 86, populationScore: 94, trafficScore: 90 },
  { id: 502, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.528, 25.026], [121.536, 25.026], [121.536, 25.019], [121.528, 25.019], [121.528, 25.026]]] }, compositeScore: 84, businessScore: 78, populationScore: 92, trafficScore: 73 },
  { id: 503, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.532, 25.035], [121.541, 25.035], [121.541, 25.028], [121.532, 25.028], [121.532, 25.035]]] }, compositeScore: 76, businessScore: 70, populationScore: 81, trafficScore: 82 },
  { id: 504, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.55, 25.027], [121.557, 25.027], [121.557, 25.021], [121.55, 25.021], [121.55, 25.027]]] }, compositeScore: 73, businessScore: 74, populationScore: 76, trafficScore: 79 },
]

const demoAnalysis = {
  taskNo: 'AN-20260812-001',
  productName: '手搖飲展店分析',
  businessCode: '餐飲',
  status: 'COMPLETED',
  createTime: '2026-08-12 08:15:00',
  countyName: '台北市',
  townName: '大安區',
  rangeSize: 800,
  preference: '0.5',
  selectedDayType: 'WEEKDAY',
  selectedTimeSlot: 'AFTERNOON',
  selectedAgeGroup: '25-34',
  metricClusters: demoMetricClusters,
}

const baseAnalysis = computed(() => {
  if (!props.analysis) return demoAnalysis

  return {
    ...demoAnalysis,
    ...props.analysis,
    metricClusters: props.analysis.metricClusters || [],
  }
})

const toScore = (value) => {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(score) : 0
}

const flattenCoordinates = (coordinates = []) =>
  coordinates.flat(Number.isFinite(coordinates?.[0]?.[0]) ? 0 : Infinity)

const getGeometryCenter = (geom) => {
  const coordinates = flattenCoordinates(geom?.coordinates)
  const points = []

  for (let index = 0; index < coordinates.length; index += 2) {
    const longitude = Number(coordinates[index])
    const latitude = Number(coordinates[index + 1])
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
      points.push([longitude, latitude])
    }
  }

  if (!points.length) return null

  const longitude = points.reduce((sum, point) => sum + point[0], 0) / points.length
  const latitude = points.reduce((sum, point) => sum + point[1], 0) / points.length
  return { longitude, latitude }
}

const metricClusters = computed(() =>
  (baseAnalysis.value.metricClusters || []).map((cluster, index) => {
    const score = toScore(cluster.compositeScore)
    const center = getGeometryCenter(cluster.geom)
    const fallbackPositions = [
      { left: '30%', top: '38%' },
      { left: '58%', top: '44%' },
      { left: '45%', top: '68%' },
      { left: '70%', top: '62%' },
    ]

    return {
      ...cluster,
      uiId: cluster.id ?? `cluster-${index + 1}`,
      name: `生活圈 ${index + 1}`,
      score,
      status: score >= 88 ? '建議優先' : score >= 80 ? '值得比較' : score >= 74 ? '可觀察' : '備選',
      competition: score >= 88 ? '中高' : score >= 80 ? '中' : '低',
      radius: baseAnalysis.value.rangeSize ? `約 ${baseAnalysis.value.rangeSize} 公尺` : '-',
      headline: `商業 ${toScore(cluster.businessScore)}、客群 ${toScore(cluster.populationScore)}、交通 ${toScore(cluster.trafficScore)}`,
      summary: center
        ? `生活圈中心約在 ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}，可搭配地圖範圍檢視周邊條件。`
        : '已取得生活圈範圍，可搭配地圖檢視周邊條件。',
      position: fallbackPositions[index % fallbackPositions.length],
      center,
    }
  }),
)

const activeCluster = computed(() => {
  const selectedId = activeClusterId.value ?? metricClusters.value[0]?.uiId
  return metricClusters.value.find((cluster) => cluster.uiId === selectedId) || metricClusters.value[0]
})

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
}

const dayTypeLabelMap = {
  ALL: '全部',
  WEEKDAY: '平日',
  WEEKEND: '假日',
}

const timeSlotLabelMap = {
  ALL: '全部時段',
  MORNING: '早上',
  AFTERNOON: '下午',
  EVENING: '晚上',
}

const ageGroupLabelMap = {
  ALL: '全部年齡',
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatLocation = (analysis) => [analysis.countyName, analysis.townName].filter(Boolean).join(' / ') || '-'
</script>

<template>
  <main class="main detail-layout">
    <div class="content-scroll">
      <div class="content-shell">
        <div class="detail-backbar">
          <button class="btn-sm primary back-link" type="button" @click="emit('back')">
            <span aria-hidden="true">‹</span>
            返回分析列表
          </button>
        </div>

        <div class="page-title detail-page-title">
          <div>
            <h2>{{ baseAnalysis.productName }}</h2>
            <p>{{ formatLocation(baseAnalysis) }}，共找到 {{ metricClusters.length }} 個生活圈可比較。</p>
          </div>

          <div class="detail-title-meta">
            <span class="badge done">{{ statusLabelMap[baseAnalysis.status] || '完成' }}</span>
            <strong>{{ baseAnalysis.taskNo }}</strong>
            <span>{{ formatDateTime(baseAnalysis.createTime) }}</span>
          </div>
        </div>

        <section class="section parameter-section">
          <div class="section-header parameter-header">
            <div>
              <h3>分析參數</h3>
              <p>商品、區域、範圍與觀察情境。</p>
            </div>
            <button class="btn-sm parameter-toggle" type="button" @click="isParameterOpen = !isParameterOpen">
              {{ isParameterOpen ? '收合' : '展開' }}
            </button>
          </div>

          <div v-show="isParameterOpen" class="grid-4 parameter-grid">
            <div class="field readonly-field">
              <label>商品類型</label>
              <div>{{ baseAnalysis.businessCode }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析區域</label>
              <div>{{ formatLocation(baseAnalysis) }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析範圍</label>
              <div>{{ baseAnalysis.rangeSize }} 公尺</div>
            </div>
            <div class="field readonly-field">
              <label>觀察情境</label>
              <div>{{ dayTypeLabelMap[baseAnalysis.selectedDayType] || '-' }} / {{ timeSlotLabelMap[baseAnalysis.selectedTimeSlot] || '-' }}</div>
            </div>
            <div class="field readonly-field">
              <label>目標年齡</label>
              <div>{{ ageGroupLabelMap[baseAnalysis.selectedAgeGroup] || baseAnalysis.selectedAgeGroup || '-' }}</div>
            </div>
          </div>
        </section>

        <section class="section cluster-map-section">
          <div class="section-header parameter-header">
            <div>
              <h3>生活圈分布</h3>
              <p>點選地圖上的生活圈，可同步切換下方列表選取狀態。</p>
            </div>
            <button class="btn-sm" type="button" @click="isMapOpen = !isMapOpen">
              {{ isMapOpen ? '收合' : '展開' }}
            </button>
          </div>

          <div v-show="isMapOpen && metricClusters.length">
            <div class="detail-map cluster-visual-map">
              <div class="map-grid-lines"></div>
              <div class="life-road road-a"></div>
              <div class="life-road road-b"></div>
              <button
                v-for="cluster in metricClusters"
                :key="cluster.uiId"
                class="map-marker"
                :class="{ active: activeCluster?.uiId === cluster.uiId }"
                :style="{ left: cluster.position.left, top: cluster.position.top }"
                type="button"
                @click="activeClusterId = cluster.uiId"
              >
                <span>{{ cluster.name }}</span>
                <strong>{{ cluster.score }}</strong>
              </button>
            </div>

            <div class="selected-cluster-summary">
              <div>
                <span class="sub">目前選取</span>
                <strong>{{ activeCluster?.name }}</strong>
                <p>{{ activeCluster?.summary }}</p>
              </div>
              <div class="selected-cluster-meta">
                <span class="badge type">{{ activeCluster?.status }}</span>
                <span class="pill">分數 {{ activeCluster?.score }}</span>
              </div>
            </div>
          </div>
          <div v-show="isMapOpen && !metricClusters.length" class="empty-cell">目前沒有生活圈資料。</div>
        </section>

        <section class="section cluster-table-section">
          <div class="section-header">
            <h3>生活圈列表</h3>
            <p>基本名稱、分數、狀態與重點摘要，可橫向捲動查看完整欄位。</p>
          </div>

          <div class="table-wrap cluster-scroll-table">
            <table>
              <thead>
                <tr>
                  <th>生活圈</th>
                  <th>分數</th>
                  <th>狀態</th>
                  <th>範圍</th>
                  <th>商業</th>
                  <th>客群</th>
                  <th>交通</th>
                  <th>競爭</th>
                  <th>摘要</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!metricClusters.length">
                  <td colspan="9" class="empty-cell">目前沒有生活圈資料。</td>
                </tr>
                <tr
                  v-for="cluster in metricClusters"
                  :key="cluster.uiId"
                  :class="{ 'active-row': activeCluster?.uiId === cluster.uiId }"
                  @click="activeClusterId = cluster.uiId"
                >
                  <td>
                    <span class="case-id">{{ cluster.name }}</span>
                    <span class="sub">ID：{{ cluster.id || '-' }}</span>
                  </td>
                  <td>{{ cluster.score }}</td>
                  <td><span class="badge type">{{ cluster.status }}</span></td>
                  <td>{{ cluster.radius }}</td>
                  <td>{{ toScore(cluster.businessScore) }}</td>
                  <td>{{ toScore(cluster.populationScore) }}</td>
                  <td>{{ toScore(cluster.trafficScore) }}</td>
                  <td>{{ cluster.competition }}</td>
                  <td>{{ cluster.headline }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
