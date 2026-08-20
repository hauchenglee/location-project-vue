<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import IndustryCodeSelect from '@/components/IndustryCodeSelect.vue'
import LocationMap from '@/components/LocationMap.vue'
import PageLoading from '@/components/PageLoading.vue'
import { caseApi } from '@/services/caseApi'

const isSubmitting = ref(false)
const submitError = ref('')
const submitResult = ref(null)
const adminAreas = ref([])
const isLoadingAdminAreas = ref(false)
const adminAreaError = ref('')
const businessIndustryCodes = ref([])
const isLoadingBusinessIndustryCodes = ref(false)
const businessIndustryCodeError = ref('')

const initialForm = {
  taskNo: '',
  productName: '',
  industryCode: '',
  countyName: '',
  townName: '',
  rangeSize: 500,
  preference: '0.5',
  selectedDayType: 'ALL',
  selectedTimeSlot: 'ALL',
  selectedAgeGroup: 'ALL',
}

const form = reactive({ ...initialForm })

const rangeSize = computed(() => Math.max(Number.parseInt(form.rangeSize, 10) || 500, 100))
const selectedAdminArea = computed(() => adminAreas.value.find((area) => area.countyName === form.countyName))
const townOptions = computed(() => selectedAdminArea.value?.towns || [])

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
  ACTIVE: '有效',
  INACTIVE: '無效',
}

const resetForm = () => {
  Object.assign(form, initialForm)
  submitError.value = ''
  submitResult.value = null
}

const loadAdminAreas = async () => {
  isLoadingAdminAreas.value = true
  adminAreaError.value = ''

  try {
    adminAreas.value = await caseApi.listAdminAreas()
  } catch (error) {
    adminAreaError.value = error?.response?.data?.message || error.message || '取得行政區失敗'
  } finally {
    isLoadingAdminAreas.value = false
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

watch(
  () => form.countyName,
  () => {
    form.townName = ''
  },
)

onMounted(() => {
  loadAdminAreas()
  loadBusinessIndustryCodes()
})

const createPayload = () => {
  return {
    taskNo: form.taskNo || null,
    productName: form.productName,
    industryCode: form.industryCode,
    countyName: form.countyName || null,
    townName: form.townName || null,
    rangeSize: rangeSize.value,
    preference: form.preference,
    selectedDayType: form.selectedDayType,
    selectedTimeSlot: form.selectedTimeSlot,
    selectedAgeGroup: form.selectedAgeGroup,
  }
}

const submitAnalysis = async () => {
  isSubmitting.value = true
  submitError.value = ''
  submitResult.value = null

  try {
    const payload = createPayload()
    submitResult.value = await caseApi.submitAnalysis(payload)
  } catch (error) {
    submitError.value = error?.response?.data?.message || error.message || '提交分析失敗'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="main create-layout">
    <section class="left">
      <div class="left-scroll">
        <div class="form-shell">
          <div class="page-title">
            <h2>提交分析</h2>
            <p>填寫商品、區域與人口條件，建立新的選址分析。</p>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>分析基本資料</h3>
              <p>輸入案件識別資訊與商品內容。</p>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="taskNo">案件號碼</label>
                <input id="taskNo" v-model="form.taskNo" type="text" placeholder="例如：AN-20260812-001" />
              </div>
              <div class="field">
                <label for="productName">商品名稱</label>
                <input id="productName" v-model="form.productName" type="text" placeholder="例如：手搖飲、早午餐、超商" />
              </div>
            </div>

            <div class="field">
              <label for="industryCode">產業類別</label>
              <IndustryCodeSelect
                id="industryCode"
                v-model="form.industryCode"
                :options="businessIndustryCodes"
                :disabled="isLoadingBusinessIndustryCodes"
                :placeholder="isLoadingBusinessIndustryCodes ? '載入產業類別中' : '請選擇產業類別'"
              />
              <div v-if="businessIndustryCodeError" class="field-note error">{{ businessIndustryCodeError }}</div>
              <div v-else class="field-note">選擇最接近的產業類別，讓分析結果更貼近實際經營情境。</div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>區域設定</h3>
              <p>設定分析範圍，系統會以縣市與鄉鎮市區作為分析基準。</p>
            </div>

            <div class="location-card">
              <div class="location-card-head">
                <strong>依行政區設定</strong>
                <span>適合前期區域探索</span>
              </div>

              <div class="grid-2">
                <div class="field">
                  <label for="countyName">縣市</label>
                  <select id="countyName" v-model="form.countyName" :disabled="isLoadingAdminAreas">
                    <option value="">{{ isLoadingAdminAreas ? '載入縣市中' : '請選擇縣市' }}</option>
                    <option
                      v-for="area in adminAreas"
                      :key="area.countyCode || area.countyId || area.countyName"
                      :value="area.countyName"
                    >
                      {{ area.countyName }}
                    </option>
                  </select>
                  <div v-if="adminAreaError" class="field-note error">{{ adminAreaError }}</div>
                </div>
                <div class="field">
                  <label for="townName">鄉鎮市區</label>
                  <select id="townName" v-model="form.townName" :disabled="!form.countyName || isLoadingAdminAreas">
                    <option value="">請選擇鄉鎮市區</option>
                    <option
                      v-for="town in townOptions"
                      :key="town.townCode || town.townId || town.townName"
                      :value="town.townName"
                    >
                      {{ town.townName }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="field">
              <label for="rangeSize">格網範圍大小（公尺）</label>
              <input id="rangeSize" v-model="form.rangeSize" type="number" min="100" step="100" />
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>情境條件</h3>
              <p>設定分析偏好、日別、時段與目標年齡層。</p>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="preference">分析偏好</label>
                <select id="preference" v-model="form.preference">
                  <option value="0.1">0.1</option>
                  <option value="0.3">0.3</option>
                  <option value="0.5">0.5</option>
                  <option value="0.7">0.7</option>
                  <option value="0.9">0.9</option>
                </select>
              </div>
              <div class="field">
                <label for="selectedDayType">日別</label>
                <select id="selectedDayType" v-model="form.selectedDayType">
                  <option value="ALL">全部</option>
                  <option value="WEEKDAY">平日</option>
                  <option value="WEEKEND">假日</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="selectedTimeSlot">時段</label>
                <select id="selectedTimeSlot" v-model="form.selectedTimeSlot">
                  <option value="ALL">全部</option>
                  <option value="MORNING">早上</option>
                  <option value="AFTERNOON">下午</option>
                  <option value="EVENING">晚上</option>
                </select>
              </div>
              <div class="field">
                <label for="selectedAgeGroup">年齡層</label>
                <select id="selectedAgeGroup" v-model="form.selectedAgeGroup">
                  <option value="ALL">全部</option>
                  <option value="0-14">0-14</option>
                  <option value="15-24">15-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55-64">55-64</option>
                  <option value="65+">65+</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="submitError" class="form-message error">{{ submitError }}</div>
          <div v-if="submitResult" class="form-message success">
            已提交分析：{{ submitResult.taskNo || submitResult.id }}，目前狀態 {{ statusLabelMap[submitResult.status] || '待處理' }}。
          </div>

          <div class="footer-actions">
            <button class="btn" type="button" @click="resetForm">清除</button>
            <button class="btn primary" type="button" :disabled="isSubmitting" @click="submitAnalysis">
              {{ isSubmitting ? '提交中' : '提交分析' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <aside class="right">
      <div class="map-wrap">
        <LocationMap />
      </div>
    </aside>

    <PageLoading
      v-if="isSubmitting"
      title="正在提交分析"
      description="系統正在建立案件並啟動分析流程。"
    />
  </main>
</template>
