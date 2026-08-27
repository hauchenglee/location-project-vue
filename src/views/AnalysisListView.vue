<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import IndustryCodeSelect from '@/components/IndustryCodeSelect.vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'
import { formatGeometrySummary } from '@/utils/geoJson'

const emit = defineEmits(['view-detail'])

const isLoading = ref(false)
const loadError = ref('')
const analyses = ref([])
const businessIndustryCodes = ref([])
const isLoadingBusinessIndustryCodes = ref(false)
const businessIndustryCodeError = ref('')

const filters = reactive({
  taskNo: '',
  productName: '',
  industryCode: '',
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
    const matchesIndustryCode = !filters.industryCode || item.industryCode === filters.industryCode
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
  return district || formatGeometrySummary(item.geom)
}

const formatDayType = (value) => dayTypeLabelMap[value] || value || '-'
const formatTimeSlot = (value) => timeSlotLabelMap[value] || value || '-'
const formatAgeGroup = (value) => ageGroupLabelMap[value] || value || '-'

const formatMeter = (value) => (value !== null && value !== undefined && value !== '' ? `${value} 公尺` : '-')

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

const loadBusinessIndustryCodes = async () => {
  isLoadingBusinessIndustryCodes.value = true
  businessIndustryCodeError.value = ''

  try {
    const data = await caseApi.listBusinessIndustryCodes()
    businessIndustryCodes.value = Array.isArray(data) ? data : []
  } catch (error) {
    businessIndustryCodeError.value =
      error?.response?.data?.message || error.message || '取得產業類別失敗'
    businessIndustryCodes.value = []
  } finally {
    isLoadingBusinessIndustryCodes.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, {
    taskNo: '',
    productName: '',
    industryCode: '',
    status: '全部狀態',
  })
}

onMounted(() => {
  loadCases()
  loadBusinessIndustryCodes()
})
</script>

<template>
  <main class="main records-layout">
    <div class="content-scroll">
        <div class="content-shell">
          <div class="page-title">
            <h2>分析列表</h2>
          </div>

        <section class="section">
          <div class="section-header">
            <h3>搜尋條件</h3>
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
              <IndustryCodeSelect
                id="industryCodeFilter"
                v-model="filters.industryCode"
                :options="businessIndustryCodes"
                :disabled="isLoadingBusinessIndustryCodes"
                :placeholder="isLoadingBusinessIndustryCodes ? '載入類別中' : '全部類別'"
                empty-label="全部類別"
              />
              <div v-if="businessIndustryCodeError" class="field-note error">{{ businessIndustryCodeError }}</div>
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
                  <th>geom</th>
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
                  <td>{{ formatGeometrySummary(analysis.geom) }}</td>
                  <td>
                    {{ formatMeter(analysis.radius) }}
                    <span class="sub">格網：{{ formatMeter(analysis.rangeSize) }}</span>
                    <span class="sub">偏好：{{ analysis.preference || '-' }}</span>
                  </td>
                  <td>
                    {{ formatDayType(analysis.selectedDayType) }} / {{ formatTimeSlot(analysis.selectedTimeSlot) }}
                    <span class="sub">年齡層：{{ formatAgeGroup(analysis.selectedAgeGroup) }}</span>
                  </td>
                  <td>
                    詳情頁取得
                    <span class="sub">分數列表</span>
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
          description="系統正在載入分析案件資料。"
        />
      </div>
    </div>
  </main>
</template>
