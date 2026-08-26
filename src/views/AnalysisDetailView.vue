<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
      rowKey: metricCluster.id ?? `metric-cluster-${index + 1}`,
      displayName: `生活圈 ${index + 1}`,
      compositeScoreDisplay,
    }
  })
})

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

watch(() => props.analysisId, () => {
  loadAnalysisDetail()
})

onMounted(loadAnalysisDetail)
</script>

<template>
  <main class="main detail-layout">
    <div class="content-scroll">
      <div class="content-shell">
        <div class="detail-hero">
          <div class="detail-hero-main">
            <div class="detail-title-row">
              <button class="detail-back-button" type="button" aria-label="返回分析列表" @click="emit('back')">
                <span aria-hidden="true">‹</span>
              </button>
              <h2>{{ baseAnalysis.productName || '分析詳情' }}</h2>
            </div>
            <p>{{ formatLocation(baseAnalysis) }}，共找到 {{ metricClusterRows.length }} 個生活圈可比較。</p>
          </div>

          <div class="detail-title-meta">
            <span class="badge done">{{ statusLabelMap[baseAnalysis.status] || '-' }}</span>
            <strong>{{ baseAnalysis.taskNo || '-' }}</strong>
            <span>{{ formatDateTime(baseAnalysis.createTime) }}</span>
          </div>
        </div>

        <div v-if="loadError" class="form-message error">{{ loadError }}</div>

        <section class="section cluster-table-section">
          <div class="section-header">
            <h3>生活圈列表</h3>
          </div>

          <div class="table-wrap cluster-scroll-table interactive-table">
            <table>
              <thead>
                <tr>
                  <th>生活圈</th>
                  <th>綜合</th>
                  <th>商業</th>
                  <th>人口</th>
                  <th>人潮</th>
                  <th>交通</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!metricClusterRows.length">
                  <td colspan="7" class="empty-cell">目前沒有生活圈資料。</td>
                </tr>
                <tr
                  v-for="metricCluster in metricClusterRows"
                  :key="metricCluster.rowKey"
                  tabindex="0"
                  @click="emit('view-cluster', metricCluster, baseAnalysis)"
                  @keydown.enter="emit('view-cluster', metricCluster, baseAnalysis)"
                >
                  <td>
                    <span class="case-id">{{ metricCluster.displayName }}</span>
                    <span class="sub">ID：{{ metricCluster.id || '-' }}</span>
                  </td>
                  <td>{{ metricCluster.compositeScoreDisplay }}</td>
                  <td>{{ toScore(metricCluster.businessScore) }}</td>
                  <td>{{ toScore(metricCluster.populationScore) }}</td>
                  <td>{{ toScore(metricCluster.peopleScore) }}</td>
                  <td>{{ toScore(metricCluster.transitScore) }}</td>
                  <td>
                    <button class="btn-sm primary" type="button" @click.stop="emit('view-cluster', metricCluster, baseAnalysis)">
                      查看詳情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <PageLoading
          v-if="isLoading"
          title="正在取得分析詳情"
          description="系統正在載入生活圈列表。"
        />
      </div>
    </div>
  </main>
</template>
