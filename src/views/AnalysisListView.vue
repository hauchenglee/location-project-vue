<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { caseApi } from '@/services/caseApi'

const emit = defineEmits(['view-detail'])

const isLoading = ref(false)
const loadError = ref('')
const analyses = ref([])

const demoAnalyses = [
  {
    id: 1001,
    taskNo: 'AN-20260812-001',
    status: 'COMPLETED',
    createTime: '2026-08-12 08:15:00',
    productName: '手搖飲展店分析',
    businessCode: '餐飲',
    countyName: '台北市',
    townName: '大安區',
    longitude: 121.5435,
    latitude: 25.0262,
    rangeSize: 800,
    preference: '0.5',
    selectedDayType: 'WEEKDAY',
    selectedTimeSlot: 'AFTERNOON',
    selectedAgeGroup: '25-34',
    metricClusters: [
      { id: 501, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.539, 25.029], [121.548, 25.029], [121.548, 25.023], [121.539, 25.023], [121.539, 25.029]]] }, compositeScore: 91, businessScore: 86, populationScore: 94, trafficScore: 90 },
      { id: 502, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.528, 25.026], [121.536, 25.026], [121.536, 25.019], [121.528, 25.019], [121.528, 25.026]]] }, compositeScore: 84, businessScore: 78, populationScore: 92, trafficScore: 73 },
      { id: 503, analysisId: 1001, geom: { type: 'Polygon', coordinates: [[[121.532, 25.035], [121.541, 25.035], [121.541, 25.028], [121.532, 25.028], [121.532, 25.035]]] }, compositeScore: 76, businessScore: 70, populationScore: 81, trafficScore: 82 },
    ],
  },
  {
    id: 1002,
    taskNo: 'AN-20260811-014',
    status: 'COMPLETED',
    createTime: '2026-08-11 15:42:00',
    productName: '早餐店商圈評估',
    businessCode: '餐飲',
    countyName: '新北市',
    townName: '板橋區',
    longitude: 121.4598,
    latitude: 25.0114,
    rangeSize: 600,
    preference: '0.7',
    selectedDayType: 'WEEKDAY',
    selectedTimeSlot: 'MORNING',
    selectedAgeGroup: '35-44',
    metricClusters: [
      { id: 601, analysisId: 1002, geom: { type: 'Polygon', coordinates: [[[121.456, 25.014], [121.464, 25.014], [121.464, 25.008], [121.456, 25.008], [121.456, 25.014]]] }, compositeScore: 88, businessScore: 81, populationScore: 90, trafficScore: 85 },
      { id: 602, analysisId: 1002, geom: { type: 'Polygon', coordinates: [[[121.45, 25.012], [121.457, 25.012], [121.457, 25.006], [121.45, 25.006], [121.45, 25.012]]] }, compositeScore: 80, businessScore: 75, populationScore: 84, trafficScore: 78 },
    ],
  },
  {
    id: 1003,
    taskNo: 'AN-20260810-009',
    status: 'PROCESSING',
    createTime: '2026-08-10 11:20:00',
    productName: '藥妝店生活圈分析',
    businessCode: '零售',
    countyName: '台中市',
    townName: '西屯區',
    longitude: 120.6398,
    latitude: 24.1793,
    rangeSize: 1000,
    preference: '0.3',
    selectedDayType: 'ALL',
    selectedTimeSlot: 'ALL',
    selectedAgeGroup: 'ALL',
    metricClusters: [
      { id: 701, analysisId: 1003, geom: { type: 'Polygon', coordinates: [[[120.636, 24.182], [120.645, 24.182], [120.645, 24.176], [120.636, 24.176], [120.636, 24.182]]] }, compositeScore: 79, businessScore: 82, populationScore: 76, trafficScore: 80 },
      { id: 702, analysisId: 1003, geom: { type: 'Polygon', coordinates: [[[120.629, 24.181], [120.638, 24.181], [120.638, 24.174], [120.629, 24.174], [120.629, 24.181]]] }, compositeScore: 72, businessScore: 74, populationScore: 70, trafficScore: 71 },
    ],
  },
]

const filters = reactive({
  taskNo: '',
  productName: '',
  businessCode: '全部類型',
  status: '全部狀態',
})

const statusClassMap = {
  COMPLETED: 'done',
  PROCESSING: 'run',
  PENDING: 'draft',
  FAILED: 'failed',
  ACTIVE: 'done',
  INACTIVE: 'draft',
}

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
  ACTIVE: '有效',
  INACTIVE: '無效',
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

const analysisItems = computed(() => (analyses.value.length ? analyses.value : demoAnalyses))

const filteredAnalyses = computed(() =>
  analysisItems.value.filter((item) => {
    const matchesTaskNo = !filters.taskNo || `${item.taskNo || item.id || ''}`.includes(filters.taskNo)
    const matchesProductName = !filters.productName || `${item.productName || ''}`.includes(filters.productName)
    const matchesBusinessCode =
      filters.businessCode === '全部類型' || item.businessCode === filters.businessCode
    const matchesStatus = filters.status === '全部狀態' || item.status === filters.status

    return matchesTaskNo && matchesProductName && matchesBusinessCode && matchesStatus
  }),
)

const total = computed(() => filteredAnalyses.value.length)
const paginationText = computed(() => `顯示第 ${total.value ? 1 : 0} - ${total.value} 筆，共 ${total.value} 筆資料`)

const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatLocation = (item) => {
  const district = [item.countyName, item.townName].filter(Boolean).join(' / ')
  const coordinate = [item.latitude, item.longitude].filter((value) => value !== null && value !== undefined && value !== '').join(', ')
  return district || coordinate || '-'
}

const formatDayType = (value) => dayTypeLabelMap[value] || value || '-'
const formatTimeSlot = (value) => timeSlotLabelMap[value] || value || '-'
const formatAgeGroup = (value) => ageGroupLabelMap[value] || value || '-'

const clusterCount = (item) => item.metricClusters?.length || 0
const topClusterScore = (item) => {
  const scores = item.metricClusters?.map((cluster) => Number(cluster.compositeScore)).filter(Number.isFinite) || []
  return scores.length ? Math.max(...scores) : '-'
}

const loadCases = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const data = await caseApi.listAnalyses()
    analyses.value = data.length ? data : demoAnalyses
  } catch (error) {
    loadError.value = ''
    analyses.value = demoAnalyses
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    taskNo: '',
    productName: '',
    businessCode: '全部類型',
    status: '全部狀態',
  })
}

onMounted(loadCases)
</script>

<template>
  <main class="main records-layout">
    <div class="content-scroll">
      <div class="content-shell">
          <div class="page-title">
            <h2>分析列表</h2>
          <p>透過查詢條件快速篩選分析任務，並從列表進入分析總覽與生活圈比較。</p>
          </div>

        <section class="section">
          <div class="section-header">
            <h3>搜尋條件</h3>
            <p>可依案件號碼、商品名稱、商品類型與處理狀態進行篩選。</p>
          </div>

          <div class="grid-4">
            <div class="field">
              <label for="taskNo">案件號碼</label>
              <input id="taskNo" v-model="filters.taskNo" type="text" placeholder="例如：AN-20260812-001" />
            </div>
            <div class="field">
              <label for="productNameFilter">商品名稱</label>
              <input id="productNameFilter" v-model="filters.productName" type="text" placeholder="例如：手搖飲、早午餐、超商" />
            </div>
            <div class="field">
              <label for="businessCodeFilter">商品類型</label>
              <select id="businessCodeFilter" v-model="filters.businessCode">
                <option>全部類型</option>
                <option>餐飲</option>
                <option>零售</option>
                <option>服務</option>
              </select>
            </div>
            <div class="field">
              <label for="statusFilter">處理狀態</label>
              <select id="statusFilter" v-model="filters.status">
                <option>全部狀態</option>
                <option value="PENDING">待處理</option>
                <option value="PROCESSING">處理中</option>
                <option value="COMPLETED">完成</option>
                <option value="FAILED">失敗</option>
              </select>
            </div>
          </div>

          <div class="actions">
            <button class="btn" type="button" @click="resetFilters">清除條件</button>
            <button class="btn primary" type="button" :disabled="isLoading" @click="loadCases">
              {{ isLoading ? '載入中' : '重新取得列表' }}
            </button>
          </div>
        </section>

        <section class="section">
          <div class="section-header">
            <h3>分析列表</h3>
            <p>以下列表顯示符合條件的分析案件。</p>
          </div>

          <div v-if="loadError" class="form-message error">{{ loadError }}</div>

          <div class="toolbar">
            <div class="toolbar-left">
              <span class="count">共 {{ total }} 筆分析</span>
              <span class="pill">最近建立優先</span>
              <span class="pill">可橫向捲動查看完整欄位</span>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>案件</th>
                  <th>商品</th>
                  <th>區域</th>
                  <th>經緯度</th>
                  <th>範圍 / 偏好</th>
                  <th>情境條件</th>
                  <th>生活圈</th>
                  <th>建立時間</th>
                  <th>狀態</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!isLoading && !filteredAnalyses.length">
                  <td colspan="10" class="empty-cell">目前沒有符合條件的分析資料。</td>
                </tr>
                <tr v-for="analysis in filteredAnalyses" :key="analysis.id || analysis.taskNo">
                  <td>
                    <span class="case-id">{{ analysis.taskNo || '-' }}</span>
                    <span class="sub">系統編號：{{ analysis.id || '-' }}</span>
                  </td>
                  <td>
                    {{ analysis.productName || '-' }}
                    <span class="sub">商品類型：{{ analysis.businessCode || '-' }}</span>
                  </td>
                  <td>
                    {{ formatLocation(analysis) }}
                    <span class="sub">行政區域</span>
                  </td>
                  <td>
                    {{ analysis.latitude ?? '-' }}
                    <span class="sub">經度：{{ analysis.longitude ?? '-' }}</span>
                  </td>
                  <td>
                    {{ analysis.rangeSize ?? '-' }} 公尺
                    <span class="sub">偏好：{{ analysis.preference || '-' }}</span>
                  </td>
                  <td>
                    {{ formatDayType(analysis.selectedDayType) }} / {{ formatTimeSlot(analysis.selectedTimeSlot) }}
                    <span class="sub">年齡層：{{ formatAgeGroup(analysis.selectedAgeGroup) }}</span>
                  </td>
                  <td>
                    {{ clusterCount(analysis) }} 個
                    <span class="sub">最高分：{{ topClusterScore(analysis) }}</span>
                  </td>
                  <td>{{ formatDateTime(analysis.createTime) }}</td>
                  <td>
                    <span class="badge" :class="statusClassMap[analysis.status] || 'draft'">
                      {{ statusLabelMap[analysis.status] || analysis.status || '-' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-sm primary" type="button" @click="emit('view-detail', analysis)">
                      查看分析
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <div class="pagination-info">{{ paginationText }}</div>
            <div class="pagination-actions">
              <button class="btn-sm" type="button" disabled>上一頁</button>
              <button class="btn-sm" type="button" disabled>1</button>
              <button class="btn-sm" type="button" disabled>下一頁</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
