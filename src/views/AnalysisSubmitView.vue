<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import AdminDistrictLocator from '@/components/AdminDistrictLocator.vue'
import IndustryCodeSelect from '@/components/IndustryCodeSelect.vue'
import LocationMap from '@/components/LocationMap.vue'
import PageLoading from '@/components/PageLoading.vue'
import { TAIWAN_CENTER } from '@/maps/constants'
import { caseApi } from '@/services/caseApi'
import {
  findAdminDistrictByCode,
  flattenAdminDistricts,
  formatAdminDistrict,
} from '@/utils/adminAreas'

const emit = defineEmits(['view-detail', 'view-records'])

const isSubmitting = ref(false)
const submitError = ref('')
const submitResult = ref(null)

const businessIndustryCodes = ref([])
const isLoadingBusinessIndustryCodes = ref(false)
const businessIndustryCodeError = ref('')

const timePeriods = ref([])
const isLoadingTimePeriods = ref(false)
const timePeriodError = ref('')

const adminCounties = ref([])
const isLoadingAdminAreas = ref(false)
const adminAreaError = ref('')
const selectedDistrictCode = ref('')
const locationSource = ref('default')
const isIdentifying = ref(false)
const identifyError = ref('')
const manualInputsOpen = ref(false)
const locationMapRef = ref(null)

let identifySeq = 0
let manualIdentifyTimer = null
let manualSessionDistrict = null

const DISTRICT_FOCUS_ZOOM = 14.1
const DEFAULT_MAP_ZOOM = 13.2

const radiusOptions = [
  { value: 200, label: '街道級', detail: '200m', note: '轉角與街廓' },
  { value: 500, label: '步行級', detail: '500m', note: '五到八分鐘' },
  { value: 1000, label: '生活圈', detail: '1km', note: '完整生活半徑' },
]

const preferenceOptions = [
  { value: '0.1', label: '極保守', note: '0.1' },
  { value: '0.3', label: '保守', note: '0.3' },
  { value: '0.5', label: '均衡', note: '0.5' },
  { value: '0.7', label: '積極', note: '0.7' },
  { value: '0.9', label: '極積極', note: '0.9' },
]

const ageGroupOptions = [
  { value: 'ALL', label: '全部年齡' },
  { value: '0-14', label: '0-14 歲' },
  { value: '15-24', label: '15-24 歲' },
  { value: '25-34', label: '25-34 歲' },
  { value: '35-44', label: '35-44 歲' },
  { value: '45-54', label: '45-54 歲' },
  { value: '55-64', label: '55-64 歲' },
  { value: '65+', label: '65 歲以上' },
]

const quickSpots = [
  { label: '台北・信義', note: '市府商圈', longitude: 121.5654, latitude: 25.0330, townCode: '63000020' },
  { label: '台北・中山', note: '南西商圈', longitude: 121.5267, latitude: 25.0528, townCode: '63000040' },
  { label: '新北・板橋', note: '板橋車站', longitude: 121.4628, latitude: 25.0115, townCode: '65000010' },
]

const initialForm = {
  productName: '',
  industryCode: '',
  longitude: TAIWAN_CENTER[0],
  latitude: TAIWAN_CENTER[1],
  radius: 500,
  preference: '0.5',
  selectedTimePeriodIds: [],
  selectedAgeGroup: 'ALL',
}

const form = reactive({
  ...initialForm,
  selectedTimePeriodIds: [],
})

const radius = computed(() => Number.parseInt(form.radius, 10))
const radiusLabel = computed(() =>
  radiusOptions.find((option) => option.value === radius.value)?.detail || `${form.radius}m`,
)
const ageGroupLabel = computed(() =>
  ageGroupOptions.find((option) => option.value === form.selectedAgeGroup)?.label || '全部年齡',
)

const flattenIndustryCodes = (industries) =>
  industries.flatMap((industry) => [industry, ...flattenIndustryCodes(industry.children || [])])

const selectedIndustry = computed(() =>
  flattenIndustryCodes(businessIndustryCodes.value).find((industry) => industry.industryCode === form.industryCode),
)

const selectedTimePeriods = computed(() => {
  const selected = new Set(form.selectedTimePeriodIds.map(String))
  return timePeriods.value.filter((period) => selected.has(String(period.id)))
})

const selectedTimePeriodLabel = computed(() => {
  if (!form.selectedTimePeriodIds.length) return '全部時段'
  return selectedTimePeriods.value.map((period) => period.periodName).join('、') || '全部時段'
})

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const longitude = computed(() => toFiniteNumber(form.longitude))
const latitude = computed(() => toFiniteNumber(form.latitude))

const hasValidLongitudeLatitude = computed(() =>
  longitude.value !== null
  && latitude.value !== null
  && longitude.value >= -180
  && longitude.value <= 180
  && latitude.value >= -90
  && latitude.value <= 90,
)

const hasValidRadius = computed(() =>
  Number.isInteger(radius.value) && radius.value > 0 && radius.value % 100 === 0,
)

const adminDistricts = computed(() => flattenAdminDistricts(adminCounties.value))
const selectedDistrict = computed(() =>
  findAdminDistrictByCode(adminDistricts.value, selectedDistrictCode.value),
)
const districtLabel = computed(() => formatAdminDistrict(selectedDistrict.value))

const coordinateText = computed(() => {
  if (!hasValidLongitudeLatitude.value) return '尚未設定'
  return `${latitude.value.toFixed(4)}°N / ${longitude.value.toFixed(4)}°E`
})

const coordinateTag = computed(() => {
  if (locationSource.value === 'district') return '行政區代表點'
  if (locationSource.value === 'quick') return '快速地點'
  if (locationSource.value === 'map') return '地圖選點'
  if (locationSource.value === 'manual') return '手動輸入'
  return '預設地點'
})

const coordinateNote = '實際送出的位置。長按地圖標記 300ms 後拖拽，或在右側地圖點選即可微調。'

const canSubmit = computed(() => {
  if (!form.productName.trim() || !form.industryCode) return false
  if (isIdentifying.value) return false
  if (!selectedDistrict.value) return false
  return hasValidLongitudeLatitude.value && hasValidRadius.value
})

const summaryTitle = computed(() => {
  const product = form.productName.trim() || '你的新店型'
  return `${product} · ${radiusLabel.value}`
})

const summaryMeta = computed(() => {
  const coordinate = hasValidLongitudeLatitude.value
    ? `${longitude.value.toFixed(4)}, ${latitude.value.toFixed(4)}`
    : '尚未設定座標'
  const district = districtLabel.value || '未對應行政區'
  return `${district} · ${coordinate} · ${selectedTimePeriodLabel.value} · ${ageGroupLabel.value}`
})

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
  ACTIVE: '有效',
  INACTIVE: '無效',
}

const identifyAdminArea = async (lng, lat) =>
  caseApi.identifyAdminArea({ longitude: lng, latitude: lat })

const syncDistrictFromPoint = async (
  lng,
  lat,
  { resetZoom = false, previousCode = selectedDistrictCode.value, focusIfSame = false } = {},
) => {
  const requestId = ++identifySeq
  isIdentifying.value = true
  identifyError.value = ''

  try {
    const data = await identifyAdminArea(lng, lat)
    if (requestId !== identifySeq) return

    const nextDistrict = data ? findAdminDistrictByCode(adminDistricts.value, data.townCode) : null
    const nextCode = nextDistrict ? String(nextDistrict.townCode) : ''
    selectedDistrictCode.value = nextCode

    if (nextDistrict) {
      const changed = nextCode !== String(previousCode || '')
      if (changed && resetZoom) {
        locationMapRef.value?.focusOn(Number(lng), Number(lat), DISTRICT_FOCUS_ZOOM)
      } else if (!changed && focusIfSame) {
        locationMapRef.value?.focusOn(Number(lng), Number(lat))
      }
    }
  } catch (error) {
    if (requestId !== identifySeq) return
    selectedDistrictCode.value = ''
    identifyError.value =
      error?.response?.data?.message || '行政區查詢失敗，請再點一次地圖或稍後重試。'
  } finally {
    if (requestId === identifySeq) isIdentifying.value = false
  }
}

const handleDistrictSelect = (district) => {
  if (!district) return

  const nextCode = String(district.townCode)
  if (nextCode === String(selectedDistrictCode.value)) return

  identifySeq += 1
  isIdentifying.value = false
  selectedDistrictCode.value = nextCode
  locationSource.value = 'district'
  identifyError.value = ''

  const nextLongitude = Number(district.longitude)
  const nextLatitude = Number(district.latitude)
  if (!Number.isFinite(nextLongitude) || !Number.isFinite(nextLatitude)) return

  form.longitude = Number(nextLongitude.toFixed(6))
  form.latitude = Number(nextLatitude.toFixed(6))
  locationMapRef.value?.focusOn(form.longitude, form.latitude, DISTRICT_FOCUS_ZOOM)
}

const handleMapPick = ({ longitude: nextLongitude, latitude: nextLatitude }) => {
  const lng = Number(nextLongitude)
  const lat = Number(nextLatitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return

  // Keep the boundary intersection precise; rounding can move a point outside.
  form.longitude = lng
  form.latitude = lat
  locationSource.value = 'map'

  const previousCode = selectedDistrictCode.value
  syncDistrictFromPoint(form.longitude, form.latitude, {
    resetZoom: true,
    previousCode,
  })
}

const handleManualInput = () => {
  identifySeq += 1
  isIdentifying.value = false
  locationSource.value = 'manual'
  if (manualSessionDistrict === null) {
    manualSessionDistrict = selectedDistrictCode.value
  }
  selectedDistrictCode.value = ''
  identifyError.value = ''

  if (manualIdentifyTimer) window.clearTimeout(manualIdentifyTimer)
  manualIdentifyTimer = window.setTimeout(async () => {
    if (!hasValidLongitudeLatitude.value) return
    const previousCode = manualSessionDistrict
    await syncDistrictFromPoint(longitude.value, latitude.value, {
      resetZoom: true,
      previousCode,
      focusIfSame: true,
    })
    manualSessionDistrict = null
  }, 650)
}

const applyQuickSpot = (spot) => {
  identifySeq += 1
  isIdentifying.value = false
  form.longitude = Number(Number(spot.longitude).toFixed(6))
  form.latitude = Number(Number(spot.latitude).toFixed(6))
  selectedDistrictCode.value = String(spot.townCode)
  locationSource.value = 'quick'
  identifyError.value = ''
  locationMapRef.value?.focusOn(form.longitude, form.latitude, DISTRICT_FOCUS_ZOOM)
}

const toggleTimePeriod = (periodId) => {
  const normalizedId = String(periodId)
  const selected = new Set(form.selectedTimePeriodIds.map(String))

  if (selected.has(normalizedId)) {
    selected.delete(normalizedId)
  } else {
    selected.add(normalizedId)
  }

  form.selectedTimePeriodIds = timePeriods.value
    .filter((period) => selected.has(String(period.id)))
    .map((period) => period.id)
}

const clearTimePeriods = () => {
  form.selectedTimePeriodIds = []
}

const resetForm = () => {
  Object.assign(form, {
    ...initialForm,
    selectedTimePeriodIds: [],
  })
  submitError.value = ''
  submitResult.value = null
  selectedDistrictCode.value = ''
  locationSource.value = 'default'
  identifyError.value = ''
  manualSessionDistrict = null
  if (manualIdentifyTimer) window.clearTimeout(manualIdentifyTimer)
  identifySeq += 1
  isIdentifying.value = false
  locationMapRef.value?.focusOn(initialForm.longitude, initialForm.latitude, DEFAULT_MAP_ZOOM)

  window.setTimeout(() => {
    syncDistrictFromPoint(initialForm.longitude, initialForm.latitude, {
      resetZoom: false,
      previousCode: '',
    })
  }, 100)
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

const loadTimePeriods = async () => {
  isLoadingTimePeriods.value = true
  timePeriodError.value = ''

  try {
    const data = await caseApi.listTimePeriods()
    timePeriods.value = Array.isArray(data) ? data : []
  } catch (error) {
    timePeriodError.value = '時段資料暫時不可用，本次將以全部時段分析。'
    timePeriods.value = []
  } finally {
    isLoadingTimePeriods.value = false
  }
}

const loadAdminAreas = async () => {
  isLoadingAdminAreas.value = true
  adminAreaError.value = ''

  try {
    const data = await caseApi.listAdminAreas()
    adminCounties.value = Array.isArray(data) ? data : []
    if (!adminCounties.value.length) {
      adminAreaError.value = '目前沒有可用的行政區資料，暫時無法選擇地點。'
    }
  } catch (error) {
    adminAreaError.value =
      error?.response?.data?.message || error.message || '取得行政區失敗，暫時無法選擇地點。'
    adminCounties.value = []
  } finally {
    isLoadingAdminAreas.value = false
  }
}

onMounted(async () => {
  loadBusinessIndustryCodes()
  loadTimePeriods()
  await loadAdminAreas()

  if (adminDistricts.value.length) {
    syncDistrictFromPoint(initialForm.longitude, initialForm.latitude, {
      resetZoom: false,
      previousCode: '',
    })
  }
})

onBeforeUnmount(() => {
  if (manualIdentifyTimer) window.clearTimeout(manualIdentifyTimer)
})

const createPayload = () => ({
  productName: form.productName.trim(),
  industryCode: form.industryCode,
  industryName: selectedIndustry.value?.name || null,
  longitude: longitude.value,
  latitude: latitude.value,
  radius: radius.value,
  preference: form.preference,
  selectedTimePeriodIds: form.selectedTimePeriodIds.length
    ? form.selectedTimePeriodIds.join(',')
    : null,
  selectedAgeGroup: form.selectedAgeGroup,
})

const submitAnalysis = async () => {
  if (!canSubmit.value) {
    submitError.value = isIdentifying.value
      ? '正在確認中心點所屬行政區，請稍候。'
      : '請完成品牌名稱、產業類別、有效座標與分析範圍，並確認中心點位於台北市或新北市。'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitResult.value = null

  try {
    submitResult.value = await caseApi.submitAnalysis(createPayload())
  } catch (error) {
    submitError.value = error?.response?.data?.message || error.message || '分析失敗，請稍後再試。'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="create-layout">
    <section class="create-pane">
      <div class="create-form">
        <header class="create-intro">
          <p class="eyebrow">NEW ANALYSIS / 新分析</p>
          <h1>先設定地點，<br>再開始分析。</h1>
          <p>選一個品牌或店型，拖拽中心點、設定範圍。商業、人口、人潮與交通會在同一個畫面裡展開。</p>
        </header>

        <form @submit.prevent="submitAnalysis">
          <section class="form-section">
            <div class="form-section-head">
              <span class="step-no">01</span>
              <div>
                <h2>分析對象</h2>
                <p>這次要分析哪個品牌或店型？用什麼業態比較？</p>
              </div>
            </div>

            <div class="field">
              <label for="productName">品牌 / 店型</label>
              <input
                id="productName"
                v-model="form.productName"
                type="text"
                placeholder="例如：山焙手搖茶、早午餐、社區超市"
                autocomplete="off"
              />
              <div class="field-note">取一個你認得出來的名字，之後會出現在分析紀錄裡。</div>
            </div>

            <div class="field">
              <label for="industryCode">產業類別</label>
              <IndustryCodeSelect
                id="industryCode"
                v-model="form.industryCode"
                :options="businessIndustryCodes"
                :disabled="isLoadingBusinessIndustryCodes"
                :placeholder="isLoadingBusinessIndustryCodes ? '載入產業類別中' : '請選擇最接近的產業類別'"
              />
              <div v-if="businessIndustryCodeError" class="field-note error">{{ businessIndustryCodeError }}</div>
              <div v-else class="field-note">選擇最接近的業態，讓商業結構與競品判讀更貼近實際。</div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-head">
              <span class="step-no">02</span>
              <div>
                <h2>地點</h2>
                <p>想分析哪裡？選行政區，或直接拖拽右側地圖。</p>
              </div>
            </div>

            <AdminDistrictLocator
              :counties="adminCounties"
              :model-value="selectedDistrictCode"
              :loading="isLoadingAdminAreas"
              :error="adminAreaError || identifyError"
              @select="handleDistrictSelect"
            />

            <div class="coordinate-readout">
              <div class="coordinate-head">
                <span class="field-label">中心點 <em>ANALYSIS POINT</em></span>
                <span
                  class="coordinate-tag"
                  :class="{ 'is-district': locationSource === 'district' }"
                >{{ coordinateTag }}</span>
              </div>
              <strong class="coordinate-value">{{ coordinateText }}</strong>
              <p class="coordinate-note">{{ coordinateNote }}</p>
              <div v-if="isIdentifying" class="field-note">正在確認行政區…</div>

              <button
                class="coordinate-manual-toggle"
                type="button"
                @click="manualInputsOpen = !manualInputsOpen"
              >
                {{ manualInputsOpen ? '收起手動輸入' : '無法使用地圖？手動輸入座標' }}
              </button>

              <div v-if="manualInputsOpen" class="coordinate-manual">
                <div class="field-row">
                  <div class="field">
                    <label for="longitude">經度 Lng</label>
                    <input
                      id="longitude"
                      v-model="form.longitude"
                      type="number"
                      step="0.000001"
                      placeholder="121.5654"
                      @input="handleManualInput"
                    />
                  </div>
                  <div class="field">
                    <label for="latitude">緯度 Lat</label>
                    <input
                      id="latitude"
                      v-model="form.latitude"
                      type="number"
                      step="0.000001"
                      placeholder="25.0330"
                      @input="handleManualInput"
                    />
                  </div>
                </div>
                <div class="field-note">僅在地圖無法操作時使用；分析仍以此座標為準。</div>
              </div>
            </div>

            <div class="field quick-spots-field">
              <span class="field-label">快速地點</span>
              <div class="quick-spots">
                <button
                  v-for="spot in quickSpots"
                  :key="spot.label"
                  class="quick-spot"
                  type="button"
                  @click="applyQuickSpot(spot)"
                >
                  <i aria-hidden="true"></i>
                  {{ spot.label }}
                  <small>{{ spot.note }}</small>
                </button>
              </div>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-head">
              <span class="step-no">03</span>
              <div>
                <h2>分析範圍</h2>
                <p>這次要看多大的範圍？從街道到生活圈。</p>
              </div>
            </div>

            <div class="radius-grid">
              <button
                v-for="option in radiusOptions"
                :key="option.value"
                class="range-card"
                :class="{ active: Number(form.radius) === option.value }"
                type="button"
                @click="form.radius = option.value"
              >
                <b>{{ option.value === 1000 ? '1' : option.value }}<small>{{ option.value === 1000 ? 'km' : 'm' }}</small></b>
                <span>{{ option.label }}</span>
                <em>{{ option.note }}</em>
              </button>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-head">
              <span class="step-no">04</span>
              <div>
                <h2>分析條件</h2>
                <p>這次想用什麼角度解讀？</p>
              </div>
            </div>

            <div class="field">
              <span class="field-label">偏好 / 取捨</span>
              <div class="preference-scale">
                <button
                  v-for="option in preferenceOptions"
                  :key="option.value"
                  class="preference-option"
                  :class="{ active: form.preference === option.value }"
                  type="button"
                  @click="form.preference = option.value"
                >
                  <span>{{ option.label }}</span>
                  <small>{{ option.note }}</small>
                </button>
              </div>
              <div class="field-note">偏保守看穩定，偏積極看爆發；設定會跟著這次分析一起記錄。</div>
            </div>

            <div class="field">
              <span class="field-label">人潮時段</span>
              <div v-if="isLoadingTimePeriods" class="field-note">正在取得時段資料…</div>
              <template v-else>
                <div class="chip-grid">
                  <button
                    class="choice-chip"
                    :class="{ active: !form.selectedTimePeriodIds.length }"
                    type="button"
                    @click="clearTimePeriods"
                  >
                    不限時段
                    <small>ALL</small>
                  </button>
                  <button
                    v-for="period in timePeriods"
                    :key="period.id"
                    class="choice-chip"
                    :class="{ active: form.selectedTimePeriodIds.map(String).includes(String(period.id)) }"
                    type="button"
                    @click="toggleTimePeriod(period.id)"
                  >
                    {{ period.periodName }}
                  </button>
                </div>
                <div v-if="timePeriodError" class="field-note">{{ timePeriodError }}</div>
                <div v-else class="field-note">可複選。沒有選擇時，會以全部六個時段平均計算。</div>
              </template>
            </div>

            <div class="field">
              <label for="selectedAgeGroup">目標年齡層</label>
              <select id="selectedAgeGroup" v-model="form.selectedAgeGroup">
                <option v-for="option in ageGroupOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <div class="field-note">人口維度會特別看這一層的比例與數量。</div>
            </div>
          </section>

          <div v-if="submitError" class="form-message error">{{ submitError }}</div>

          <div v-if="submitResult" class="submit-success">
            <p class="eyebrow">ANALYSIS READY</p>
            <strong>分析已建立：{{ submitResult.analysisNo || `#${submitResult.id}` }}</strong>
            <p>
              目前狀態 {{ statusLabelMap[submitResult.status] || '待處理' }}。系統已整理候選生活圈與綜合評分，
              可以進去看看哪些地點值得先看。
            </p>
            <div class="btn-row">
              <button class="btn-sm btn-sm--primary" type="button" @click="emit('view-detail', submitResult)">
                查看分析 <span aria-hidden="true">→</span>
              </button>
              <button class="btn-sm" type="button" @click="emit('view-records')">看分析紀錄</button>
              <button class="btn-sm" type="button" @click="resetForm">再分析一筆</button>
            </div>
          </div>

          <div class="form-summary">
            <span class="summary-kicker">SUMMARY / 本次設定</span>
            <strong>{{ summaryTitle }}</strong>
            <p>{{ summaryMeta }}</p>
          </div>

          <div class="form-actions">
            <button class="btn" type="button" @click="resetForm">清除</button>
            <button class="btn btn--primary" type="submit" :disabled="isSubmitting || !canSubmit">
              {{ isSubmitting ? '分析中…' : '開始分析' }}
              <span v-if="!isSubmitting" class="arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </div>
    </section>

    <aside class="map-pane">
      <LocationMap
        ref="locationMapRef"
        :longitude="form.longitude"
        :latitude="form.latitude"
        :radius="radius"
        :district-code="selectedDistrictCode"
        :district-name="districtLabel"
        @pick-location="handleMapPick"
        @update:radius="form.radius = $event"
        @map-unavailable="manualInputsOpen = true"
      />
    </aside>

    <PageLoading
      v-if="isSubmitting"
      title="正在分析"
      description="系統正在建立分析、展開格網，並整理候選生活圈。"
    />
  </div>
</template>

<style scoped>
.create-layout {
  position: relative;
}

.submit-success {
  border-radius: 12px;
  margin-top: 18px;
  padding: 16px;
  border: 1px solid rgba(63, 107, 88, 0.3);
  background: rgba(63, 107, 88, 0.06);
}

.submit-success .eyebrow {
  font-size: 8.5px;
  color: var(--jade);
}

.submit-success .eyebrow::before {
  background: var(--jade);
}

.submit-success strong {
  display: block;
  margin-top: 7px;
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.submit-success p {
  margin: 6px 0 12px;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.75;
}

.submit-success .btn-row {
  margin-top: 2px;
}

.coordinate-readout {
  margin-top: 18px;
  padding-top: 2px;
}

.coordinate-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}

.coordinate-head .field-label {
  margin: 0;
}

.coordinate-head .field-label em {
  margin-left: 7px;
  color: var(--muted-2);
  font-family: var(--font-sans);
  font-size: 8px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: 0.16em;
}

.coordinate-value {
  display: block;
  margin-top: 2px;
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.coordinate-note {
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.6;
}

.coordinate-tag {
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--muted);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.coordinate-tag.is-district {
  border-color: rgba(138, 106, 58, 0.28);
  background: rgba(138, 106, 58, 0.08);
  color: var(--gold);
}

.coordinate-manual-toggle {
  margin-top: 7px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 9.5px;
  letter-spacing: 0.02em;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.coordinate-manual-toggle:hover {
  color: var(--ink);
}

.coordinate-manual {
  margin-top: 10px;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 6px;
  background: rgba(239, 232, 216, 0.4);
}

.coordinate-manual .field-row {
  gap: 8px;
}

.coordinate-manual .field input {
  min-height: 38px;
  font-size: 12px;
}

.coordinate-manual .field-note {
  margin-top: 7px;
}

.quick-spots-field {
  margin-top: 16px;
}

.quick-spots-field .field-label {
  display: block;
  margin-bottom: 1px;
}
</style>
