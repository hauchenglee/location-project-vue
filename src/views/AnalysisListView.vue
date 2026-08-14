<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'

const emit = defineEmits(['view-detail'])

const isLoading = ref(false)
const loadError = ref('')
const analyses = ref([])

const filters = reactive({
  taskNo: '',
  productName: '',
  industryCode: '全部類別',
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

const analysisItems = computed(() => analyses.value)

const filteredAnalyses = computed(() =>
  analysisItems.value.filter((item) => {
    const matchesTaskNo = !filters.taskNo || `${item.taskNo || item.id || ''}`.includes(filters.taskNo)
    const matchesProductName = !filters.productName || `${item.productName || ''}`.includes(filters.productName)
    const matchesIndustryCode =
      filters.industryCode === '全部類別' || item.industryCode === filters.industryCode
    const matchesStatus = filters.status === '全部狀態' || item.status === filters.status

    return matchesTaskNo && matchesProductName && matchesIndustryCode && matchesStatus
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
const formatRadius = (item) => item.radius ?? '-'
const topClusterScore = (item) => {
  const scores = item.metricClusters?.map((cluster) => Number(cluster.compositeScore)).filter(Number.isFinite) || []
  return scores.length ? Math.max(...scores) : '-'
}

const loadCases = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const data = await caseApi.listAnalyses()
    analyses.value = Array.isArray(data) ? data : []
  } catch (error) {
    loadError.value = error?.response?.data?.message || error.message || '取得分析列表失敗'
    analyses.value = []
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    taskNo: '',
    productName: '',
    industryCode: '全部類別',
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
            <p>可依案件號碼、商品名稱、產業類別與處理狀態進行篩選。</p>
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
              <label for="industryCodeFilter">產業類別</label>
              <select id="industryCodeFilter" v-model="filters.industryCode">
                <option>全部類別</option>
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

          <div class="table-wrap interactive-table">
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
                <tr
                  v-for="analysis in filteredAnalyses"
                  :key="analysis.id || analysis.taskNo"
                  tabindex="0"
                  @click="emit('view-detail', analysis)"
                  @keydown.enter="emit('view-detail', analysis)"
                >
                  <td>
                    <span class="case-id">{{ analysis.taskNo || '-' }}</span>
                    <span class="sub">系統編號：{{ analysis.id || '-' }}</span>
                  </td>
                  <td>
                    {{ analysis.productName || '-' }}
                    <span class="sub">產業類別：{{ analysis.industryCode || '-' }}</span>
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
                    {{ formatRadius(analysis) }} 公尺
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
                    <button class="btn-sm primary" type="button" @click.stop="emit('view-detail', analysis)">
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

        <PageLoading
          v-if="isLoading"
          title="正在取得分析列表"
          description="系統正在載入分析案件與生活圈摘要。"
        />
      </div>
    </div>
  </main>
</template>
