<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import BrandMark from '@/components/BrandMark.vue'
import IndustryCodeSelect from '@/components/IndustryCodeSelect.vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'

const emit = defineEmits(['view-detail', 'create'])

const isLoading = ref(false)
const loadError = ref('')
const analyses = ref([])
const businessIndustryCodes = ref([])
const isLoadingBusinessIndustryCodes = ref(false)
const businessIndustryCodeError = ref('')

const page = ref(1)
const pageSize = 8

const filters = reactive({
  analysisNo: '',
  productName: '',
  industryCode: '',
  status: 'ALL',
})

const statusClassMap = {
  COMPLETED: 'status-chip--done',
  PROCESSING: 'status-chip--run',
  PENDING: 'status-chip--pending',
  FAILED: 'status-chip--failed',
  ACTIVE: 'status-chip--done',
  INACTIVE: 'status-chip--pending',
}

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
  ACTIVE: '有效',
  INACTIVE: '無效',
}

const statusOptions = [
  { value: 'ALL', label: '全部狀態' },
  { value: 'PENDING', label: '待處理' },
  { value: 'PROCESSING', label: '處理中' },
  { value: 'COMPLETED', label: '完成' },
  { value: 'FAILED', label: '失敗' },
]

const sortedAnalyses = computed(() =>
  [...analyses.value].sort((left, right) => {
    const leftId = Number(left.id) || 0
    const rightId = Number(right.id) || 0
    if (leftId !== rightId) return rightId - leftId
    return String(right.createTime || '').localeCompare(String(left.createTime || ''))
  }),
)

const filteredAnalyses = computed(() =>
  sortedAnalyses.value.filter((item) => {
    const matchesAnalysisNo = !filters.analysisNo
      || `${item.analysisNo || item.id || ''}`.toLowerCase().includes(filters.analysisNo.toLowerCase())
    const matchesProductName = !filters.productName
      || `${item.productName || ''}`.toLowerCase().includes(filters.productName.toLowerCase())
    const matchesIndustryCode = !filters.industryCode || item.industryCode === filters.industryCode
    const matchesStatus = filters.status === 'ALL' || item.status === filters.status

    return matchesAnalysisNo && matchesProductName && matchesIndustryCode && matchesStatus
  }),
)

const total = computed(() => filteredAnalyses.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const pagedAnalyses = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredAnalyses.value.slice(start, start + pageSize)
})

const visiblePages = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))

const paginationText = computed(() => {
  if (!total.value) return '目前沒有符合條件的分析'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, total.value)
  return `第 ${start}–${end} 筆，共 ${total.value} 筆`
})

const stats = computed(() => {
  const all = sortedAnalyses.value
  return [
    { key: 'total', label: '全部分析', value: all.length },
    { key: 'completed', label: '已完成', value: all.filter((item) => item.status === 'COMPLETED').length },
    { key: 'processing', label: '處理中', value: all.filter((item) => item.status === 'PROCESSING').length },
    { key: 'pending', label: '待處理', value: all.filter((item) => item.status === 'PENDING').length },
  ]
})

const formatDate = (value) => (value ? String(value).split(' ')[0] : '-')
const formatTime = (value) => (value ? String(value).split(' ')[1]?.slice(0, 5) || '' : '')

const formatLocation = (item) => {
  const longitude = Number(item.longitude)
  const latitude = Number(item.latitude)
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
  return [item.countyName, item.townName].filter(Boolean).join(' / ') || '-'
}

const formatAdminArea = (item) => [item.countyName, item.townName].filter(Boolean).join(' / ')

const formatMeter = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return number >= 1000 ? `${number / 1000} km` : `${number} m`
}

const resetFilters = () => {
  Object.assign(filters, {
    analysisNo: '',
    productName: '',
    industryCode: '',
    status: 'ALL',
  })
  page.value = 1
}

const loadCases = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const data = await caseApi.listAnalyses()
    analyses.value = Array.isArray(data) ? data : []
  } catch (error) {
    loadError.value = error?.response?.data?.message || error.message || '取得分析紀錄失敗'
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

watch(filters, () => {
  page.value = 1
}, { deep: true })

watch(totalPages, (value) => {
  if (page.value > value) page.value = value
})

onMounted(() => {
  loadCases()
  loadBusinessIndustryCodes()
})
</script>

<template>
  <div class="records-page">
    <div class="records-shell">
      <header class="page-head">
        <div>
          <p class="eyebrow">ANALYSIS LOG / 分析紀錄</p>
          <h1>分析紀錄</h1>
          <p>
            每一次分析都留在這裡。翻開某一筆，看看當時的地點、範圍與生活圈；也可以從舊分析裡，找到下一個地點的線索。
          </p>
        </div>
        <div class="page-head-side">
          <button class="btn btn--primary" type="button" @click="emit('create')">
            開始分析 <span class="arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </header>

      <div class="records-stats">
        <div v-for="stat in stats" :key="stat.key" class="records-stat">
          <span>{{ stat.label }}</span>
          <b>{{ String(stat.value).padStart(2, '0') }}<small>筆</small></b>
        </div>
      </div>

      <section class="filter-panel" aria-label="分析紀錄篩選">
        <div class="filter-grid">
          <div class="field">
            <label for="analysisNo">分析編號</label>
            <input id="analysisNo" v-model="filters.analysisNo" type="text" placeholder="AN-20260812-0001" />
          </div>
          <div class="field">
            <label for="productNameFilter">品牌 / 店型</label>
            <input id="productNameFilter" v-model="filters.productName" type="text" placeholder="手搖飲、早午餐、超市" />
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
            <label for="statusFilter">狀態</label>
            <select id="statusFilter" v-model="filters.status">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="filter-actions">
          <div class="filter-actions-left">
            <span>{{ total }} 筆符合條件</span>
            <button class="btn-sm" type="button" @click="resetFilters">清除條件</button>
          </div>
          <button class="btn-sm" type="button" :disabled="isLoading" @click="loadCases">
            {{ isLoading ? '讀取中…' : '重新取得紀錄' }}
          </button>
        </div>
      </section>

      <div v-if="loadError" class="form-message error">{{ loadError }}</div>

      <div class="table-shell">
        <table class="data-table">
          <thead>
            <tr>
              <th aria-label="序號">#</th>
              <th>分析</th>
              <th>品牌 / 店型</th>
              <th>座標</th>
              <th>範圍</th>
              <th>建立時間</th>
              <th>狀態</th>
              <th aria-label="開啟"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(analysis, index) in pagedAnalyses"
              :key="analysis.id || analysis.analysisNo"
              tabindex="0"
              @click="emit('view-detail', analysis)"
              @keydown.enter="emit('view-detail', analysis)"
            >
              <td class="row-idx">{{ String((page - 1) * pageSize + index + 1).padStart(2, '0') }}</td>
              <td>
                <span class="cell-mono">{{ analysis.analysisNo || `#${analysis.id}` || '-' }}</span>
              </td>
              <td>
                <div class="cell-product">
                  <strong>{{ analysis.productName || '未命名分析' }}</strong>
                  <span>{{ analysis.industryName || analysis.industryCode || '未分類' }}</span>
                </div>
              </td>
              <td>
                <div class="cell-location">
                  <strong>{{ formatLocation(analysis) }}</strong>
                  <span>{{ formatAdminArea(analysis) || '座標範圍' }}</span>
                </div>
              </td>
              <td>
                <span class="cell-mono">{{ formatMeter(analysis.radius) }}</span>
                <span class="cell-soft"> / {{ analysis.preference || '-' }}</span>
              </td>
              <td>
                <span class="cell-mono">{{ formatDate(analysis.createTime) }}</span>
                <span class="cell-soft"> {{ formatTime(analysis.createTime) }}</span>
              </td>
              <td>
                <span class="status-chip" :class="statusClassMap[analysis.status] || 'status-chip--pending'">
                  {{ statusLabelMap[analysis.status] || analysis.status || '-' }}
                </span>
              </td>
              <td>
                <span class="row-open" aria-hidden="true">→</span>
              </td>
            </tr>

            <tr v-if="!isLoading && !pagedAnalyses.length">
              <td colspan="8">
                <div class="table-empty">
                  <span class="empty-mark"><BrandMark :size="30" /></span>
                  <h3>{{ sortedAnalyses.length ? '這組條件下沒有分析' : '還沒有分析紀錄' }}</h3>
                  <p>
                    {{ sortedAnalyses.length ? '換個關鍵字，或清除條件再看一次。' : '從一個地點開始，建立第一筆分析。' }}
                  </p>
                  <button v-if="!sortedAnalyses.length" class="btn-sm btn-sm--primary" type="button" @click="emit('create')">
                    開始分析
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagedAnalyses.length" class="record-cards">
        <button
          v-for="(analysis, index) in pagedAnalyses"
          :key="`card-${analysis.id || analysis.analysisNo}`"
          class="record-card"
          type="button"
          @click="emit('view-detail', analysis)"
        >
          <div class="record-card-top">
            <span class="record-card-no">{{ analysis.analysisNo || `#${analysis.id}` }}</span>
            <span class="status-chip" :class="statusClassMap[analysis.status] || 'status-chip--pending'">
              {{ statusLabelMap[analysis.status] || analysis.status || '-' }}
            </span>
          </div>
          <div class="record-card-title">
            <span class="record-card-index">{{ String((page - 1) * pageSize + index + 1).padStart(2, '0') }}</span>
            <span>
              <strong>{{ analysis.productName || '未命名分析' }}</strong>
              <small>{{ analysis.industryName || analysis.industryCode || '未分類' }}</small>
            </span>
          </div>
          <div class="record-card-meta">
            <span><b>座標</b>{{ formatLocation(analysis) }}</span>
            <span><b>範圍</b>{{ formatMeter(analysis.radius) }}</span>
            <span><b>建立</b>{{ formatDate(analysis.createTime) }} {{ formatTime(analysis.createTime) }}</span>
          </div>
          <div class="record-card-foot">
            <span>{{ formatAdminArea(analysis) || '座標範圍' }}</span>
            <span>打開分析 <i aria-hidden="true">→</i></span>
          </div>
        </button>
      </div>

      <div v-if="!pagedAnalyses.length" class="record-cards-empty">
        <span class="empty-mark"><BrandMark :size="30" /></span>
        <h3>{{ sortedAnalyses.length ? '這組條件下沒有分析' : '還沒有分析紀錄' }}</h3>
        <p>{{ sortedAnalyses.length ? '換個關鍵字，或清除條件再看一次。' : '從一個地點開始，建立第一筆分析。' }}</p>
        <button v-if="!sortedAnalyses.length" class="btn-sm btn-sm--primary" type="button" @click="emit('create')">
          開始分析
        </button>
      </div>

      <div v-if="total > 0" class="pagination">
        <div class="pagination-info">{{ paginationText }}</div>
        <div class="page-btns">
          <button class="page-btn" type="button" :disabled="page <= 1" @click="page -= 1">←</button>
          <button
            v-for="pageNo in visiblePages"
            :key="pageNo"
            class="page-btn"
            :class="{ active: pageNo === page }"
            type="button"
            @click="page = pageNo"
          >
            {{ pageNo }}
          </button>
          <button class="page-btn" type="button" :disabled="page >= totalPages" @click="page += 1">→</button>
        </div>
      </div>
    </div>

    <PageLoading
      v-if="isLoading"
      title="正在載入分析紀錄"
      description="系統正在載入每一筆分析紀錄。"
    />
  </div>
</template>

<style scoped>
.records-page {
  position: relative;
}

.record-cards,
.record-cards-empty {
  display: none;
}

@media (max-width: 700px) {
  .table-shell {
    display: none;
  }

  .record-cards {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .record-card {
    border-radius: 14px;
    display: grid;
    gap: 12px;
    width: 100%;
    padding: 15px;
    border: 1px solid var(--line);
    background: var(--card);
    color: var(--ink);
    cursor: pointer;
    text-align: left;
  }

  .record-card-top,
  .record-card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .record-card-no {
    color: var(--muted);
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.04em;
  }

  .record-card-title {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }

  .record-card-index {
    color: var(--vermilion);
    font-family: var(--font-mono);
    font-size: 9px;
  }

  .record-card-title strong {
    display: block;
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.2;
  }

  .record-card-title small {
    display: block;
    margin-top: 2px;
    color: var(--muted);
    font-size: 10px;
  }

  .record-card-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 7px 12px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }

  .record-card-meta span {
    display: grid;
    gap: 2px;
    color: var(--ink-2);
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1.45;
  }

  .record-card-meta span:last-child {
    grid-column: 1 / -1;
  }

  .record-card-meta b {
    color: var(--muted);
    font-family: var(--font-sans);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  .record-card-foot {
    color: var(--muted);
    font-size: 9.5px;
  }

  .record-card-foot span:last-child {
    color: var(--vermilion);
    font-weight: 700;
  }

  .record-card-foot i {
    font-style: normal;
  }

  .record-cards-empty {
    border-radius: 14px;
    display: grid;
    place-items: center;
    padding: 52px 16px;
    border: 1px solid var(--line);
    background: var(--card);
    text-align: center;
  }

  .record-cards-empty .empty-mark {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    margin-bottom: 14px;
    border: 1px solid var(--line);
    background: var(--paper);
  }

  .record-cards-empty h3 {
    font-family: var(--font-display);
    font-size: 21px;
    font-weight: 600;
  }

  .record-cards-empty p {
    margin: 6px 0 14px;
    color: var(--muted);
    font-size: 11px;
  }
}

.row-open {
  color: var(--muted-2);
  font-family: var(--font-mono);
  font-size: 12px;
  transition: color 0.16s ease, transform 0.16s ease;
  display: inline-block;
}

tr:hover .row-open {
  color: var(--vermilion);
  transform: translateX(2px);
}
</style>
