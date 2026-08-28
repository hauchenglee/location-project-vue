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

const analysisScopeOptions = [
  { value: 'ADMIN', label: '行政區域' },
  { value: 'POINT', label: '指定地點' },
]

const rangeSizeOptions = [
  { value: 250, label: '街道級', detail: '250m' },
  { value: 500, label: '步行級', detail: '500m' },
  { value: 1000, label: '生活圈', detail: '1000m' },
]

const initialForm = {
  analysisScope: 'ADMIN',
  productName: '',
  industryCode: '',
  countyName: '',
  townName: '',
  longitude: '',
  latitude: '',
  radius: 500,
  rangeSize: 500,
  preference: '0.5',
  selectedDayType: 'ALL',
  selectedTimeSlot: 'ALL',
  selectedAgeGroup: 'ALL',
}

const form = reactive({ ...initialForm })

const rangeSize = computed(() => Math.max(Number.parseInt(form.rangeSize, 10) || 500, 100))
const radius = computed(() => Math.max(Number.parseInt(form.radius, 10) || 500, 100))
const isAdminScope = computed(() => form.analysisScope === 'ADMIN')
const isPointScope = computed(() => form.analysisScope === 'POINT')
const selectedAdminArea = computed(() => adminAreas.value.find((area) => area.countyName === form.countyName))
const townOptions = computed(() => selectedAdminArea.value?.towns || [])
const flattenIndustryCodes = (industries) =>
  industries.flatMap((industry) => [industry, ...flattenIndustryCodes(industry.children || [])])
const selectedIndustry = computed(() =>
  flattenIndustryCodes(businessIndustryCodes.value).find((industry) => industry.industryCode === form.industryCode),
)
const canSubmit = computed(() => {
  if (!form.productName || !form.industryCode) return false
  if (isAdminScope.value) return Boolean(form.countyName && form.townName)

  return false
})

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

watch(
  () => form.analysisScope,
  (analysisScope) => {
    if (analysisScope === 'ADMIN') {
      form.longitude = ''
      form.latitude = ''
      form.radius = 500
    }
  },
)

onMounted(() => {
  loadAdminAreas()
  loadBusinessIndustryCodes()
})

const createPayload = () => {
  return {
    productName: form.productName,
    industryCode: form.industryCode,
    industryName: selectedIndustry.value?.name || null,
    countyName: isAdminScope.value ? form.countyName || null : null,
    townName: isAdminScope.value ? form.townName || null : null,
    longitude: isPointScope.value && form.longitude !== '' ? Number(form.longitude) : null,
    latitude: isPointScope.value && form.latitude !== '' ? Number(form.latitude) : null,
    radius: isPointScope.value ? radius.value : null,
    rangeSize: rangeSize.value,
    preference: form.preference,
    selectedDayType: form.selectedDayType,
    selectedTimeSlot: form.selectedTimeSlot,
    selectedAgeGroup: form.selectedAgeGroup,
  }
}

const submitAnalysis = async () => {
  if (!canSubmit.value) {
    submitError.value = isPointScope.value
      ? '指定地點分析尚未啟用，請先使用行政區域建立案件。'
      : '請完成商品名稱、產業類別與行政區域設定。'
    return
  }

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
          </div>

          <div class="section">
            <div class="section-header">
              <h3>分析目標</h3>
            </div>

            <div class="field">
              <label for="productName">商品名稱</label>
              <input id="productName" v-model="form.productName" type="text" placeholder="例如：手搖飲、早午餐、超商" />
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

            <div class="section-header">
              <h3>分析範圍</h3>
            </div>

            <div class="segmented-control" aria-label="分析範圍類型">
              <button
                v-for="option in analysisScopeOptions"
                :key="option.value"
                class="segmented-option"
                :class="{ active: form.analysisScope === option.value }"
                type="button"
                @click="form.analysisScope = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <div v-if="isAdminScope" class="grid-2">
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

            <div v-else class="grid-2">
              <div class="field">
                <label for="longitude">經度</label>
                <input id="longitude" v-model="form.longitude" type="number" step="0.000001" placeholder="121.5654" />
              </div>
              <div class="field">
                <label for="latitude">緯度</label>
                <input id="latitude" v-model="form.latitude" type="number" step="0.000001" placeholder="25.0330" />
              </div>
              <div class="field">
                <label for="radius">分析半徑</label>
                <select id="radius" v-model="form.radius">
                  <option :value="250">250m</option>
                  <option :value="500">500m</option>
                  <option :value="1000">1000m</option>
                </select>
                <div class="field-note">指定地點分析需後端 point scope 啟用後才能提交。</div>
              </div>
            </div>

            <div class="field">
              <label>商圈尺度</label>
              <div class="range-choice-grid">
                <button
                  v-for="option in rangeSizeOptions"
                  :key="option.value"
                  class="range-choice"
                  :class="{ active: Number(form.rangeSize) === option.value }"
                  type="button"
                  @click="form.rangeSize = option.value"
                >
                  <strong>{{ option.label }}</strong>
                  <span>{{ option.detail }}</span>
                </button>
              </div>
            </div>

            <div class="section-header">
              <h3>情境條件</h3>
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
            已提交分析：{{ submitResult.analysisNo || submitResult.id }}，目前狀態 {{ statusLabelMap[submitResult.status] || '待處理' }}。
          </div>

          <div class="footer-actions">
            <button class="btn" type="button" @click="resetForm">清除</button>
            <button class="btn primary" type="button" :disabled="isSubmitting || !canSubmit" @click="submitAnalysis">
              {{ isSubmitting ? '提交中' : '提交分析' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <aside class="right">
      <div class="map-wrap">
        <LocationMap
          :analysis-scope="form.analysisScope"
          :county-name="form.countyName"
          :town-name="form.townName"
          :longitude="form.longitude"
          :latitude="form.latitude"
          :radius="radius"
          :range-size="rangeSize"
        />
      </div>
    </aside>

    <PageLoading
      v-if="isSubmitting"
      title="正在提交分析"
      description="系統正在建立案件並啟動分析流程。"
    />
  </main>
</template>
