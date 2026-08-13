<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { caseApi } from '@/services/caseApi'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['back'])

const isParameterOpen = ref(false)
const activeClusterId = ref(null)
const detailAnalysis = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const baseAnalysis = computed(() => detailAnalysis.value || {})

const loadAnalysisDetail = async () => {
  if (!props.analysisId) {
    detailAnalysis.value = null
    loadError.value = '缺少分析案件編號，無法取得詳情。'
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    detailAnalysis.value = await caseApi.getAnalysis({ id: props.analysisId })
  } catch (error) {
    loadError.value = error?.response?.data?.message || error.message || '取得分析詳情失敗'
    detailAnalysis.value = null
  } finally {
    isLoading.value = false
  }
}

const toScore = (value) => {
  const score = Number(value)
  return Number.isFinite(score) ? Math.round(score) : 0
}

const analysisRadius = computed(() => baseAnalysis.value.radius ?? null)

const metricClusters = computed(() => {
  const clusters = baseAnalysis.value.metricClusters || []

  return clusters.map((cluster, index) => {
    const score = toScore(cluster.compositeScore)

    return {
      ...cluster,
      uiId: cluster.id ?? `cluster-${index + 1}`,
      name: `生活圈 ${index + 1}`,
      score,
      status: score >= 88 ? '建議優先' : score >= 80 ? '值得比較' : score >= 74 ? '可觀察' : '備選',
      competition: score >= 88 ? '中高' : score >= 80 ? '中' : '低',
      radius: analysisRadius.value ? `約 ${analysisRadius.value} 公尺` : '-',
      headline: `商業 ${toScore(cluster.businessScore)}、客群 ${toScore(cluster.populationScore)}、交通 ${toScore(cluster.trafficScore)}`,
    }
  })
})

const activeCluster = computed(() => {
  const selectedId = activeClusterId.value ?? metricClusters.value[0]?.uiId
  return metricClusters.value.find((cluster) => cluster.uiId === selectedId) || metricClusters.value[0] || null
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

const formatLocation = (analysis) => {
  const district = [analysis.countyName, analysis.townName].filter(Boolean).join(' / ')
  const coordinate = [analysis.latitude, analysis.longitude]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .join(', ')

  return district || coordinate || '-'
}

watch(() => props.analysisId, () => {
  activeClusterId.value = null
  loadAnalysisDetail()
})

onMounted(loadAnalysisDetail)
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
            <h2>{{ baseAnalysis.productName || '分析詳情' }}</h2>
            <p>{{ formatLocation(baseAnalysis) }}，共找到 {{ metricClusters.length }} 個生活圈可比較。</p>
          </div>

          <div class="detail-title-meta">
            <span class="badge done">{{ statusLabelMap[baseAnalysis.status] || '-' }}</span>
            <strong>{{ baseAnalysis.taskNo || '-' }}</strong>
            <span>{{ formatDateTime(baseAnalysis.createTime) }}</span>
          </div>
        </div>

        <div v-if="isLoading" class="form-message">正在取得分析詳情...</div>
        <div v-if="loadError" class="form-message error">{{ loadError }}</div>

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
              <div>{{ baseAnalysis.businessCode || '-' }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析區域</label>
              <div>{{ formatLocation(baseAnalysis) }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析範圍</label>
              <div>{{ analysisRadius ? `${analysisRadius} 公尺` : '-' }}</div>
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
