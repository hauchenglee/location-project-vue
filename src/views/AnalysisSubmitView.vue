<script setup>
import { computed, reactive, ref } from 'vue'
import LocationMap from '@/components/LocationMap.vue'
import { caseApi } from '@/services/caseApi'

const isSubmitting = ref(false)
const submitError = ref('')
const submitResult = ref(null)

const initialForm = {
  taskNo: '',
  productName: '',
  businessCode: '',
  locationMode: 'district',
  countyName: '',
  townName: '',
  longitude: '',
  latitude: '',
  radius: 500,
  preference: '0.5',
  selectedDayType: 'ALL',
  selectedTimeSlot: 'ALL',
  selectedAgeGroup: 'ALL',
}

const form = reactive({ ...initialForm })

const radius = computed(() => Math.max(Number.parseInt(form.radius, 10) || 500, 500))

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

const createPayload = () => ({
  taskNo: form.taskNo || null,
  productName: form.productName,
  businessCode: form.businessCode,
  countyName: form.locationMode === 'district' ? form.countyName || null : null,
  townName: form.locationMode === 'district' ? form.townName || null : null,
  longitude: form.locationMode === 'pin' && form.longitude !== '' ? Number(form.longitude) : null,
  latitude: form.locationMode === 'pin' && form.latitude !== '' ? Number(form.latitude) : null,
  radius: form.locationMode === 'pin' ? radius.value : null,
  preference: form.preference,
  selectedDayType: form.selectedDayType,
  selectedTimeSlot: form.selectedTimeSlot,
  selectedAgeGroup: form.selectedAgeGroup,
})

const submitAnalysis = async () => {
  isSubmitting.value = true
  submitError.value = ''
  submitResult.value = null

  try {
    submitResult.value = await caseApi.submitAnalysis(createPayload())
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
            <p>填寫商品、區域與客群條件，建立新的選址分析。</p>
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
              <label for="businessCode">商品類型</label>
              <select id="businessCode" v-model="form.businessCode">
                <option value="">請選擇商品類型</option>
                <option value="餐飲">餐飲</option>
                <option value="零售">零售</option>
                <option value="服務">服務</option>
              </select>
              <div class="field-note">選擇最接近的商品類型，讓分析結果更貼近實際經營情境。</div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>區域設定</h3>
              <p>設定分析範圍，可用行政區或精確座標作為分析中心。</p>
            </div>

            <div class="mode-switch">
              <label class="mode-item">
                <input v-model="form.locationMode" type="radio" name="locationMode" value="district" />
                <span class="mode-card">
                  <strong>依行政區設定</strong>
                  <span>填寫縣市與鄉鎮市區，適合前期區域探索。</span>
                </span>
              </label>

              <label class="mode-item">
                <input v-model="form.locationMode" type="radio" name="locationMode" value="pin" />
                <span class="mode-card">
                  <strong>地圖放圖釘</strong>
                  <span>填寫經緯度欄位，適合已有明確位置時使用。</span>
                </span>
              </label>
            </div>

            <div class="mode-panels">
              <div v-show="form.locationMode === 'district'" class="mode-panel active">
                <div class="info-inline">請選擇縣市與鄉鎮市區，系統會以該區域作為分析基準。</div>

                <div class="grid-2">
                  <div class="field">
                    <label for="countyName">縣市</label>
                    <select id="countyName" v-model="form.countyName">
                      <option value="">請選擇縣市</option>
                      <option>台北市</option>
                      <option>新北市</option>
                      <option>桃園市</option>
                      <option>台中市</option>
                      <option>高雄市</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="townName">鄉鎮市區</label>
                    <select id="townName" v-model="form.townName">
                      <option value="">請選擇鄉鎮市區</option>
                      <option>大安區</option>
                      <option>信義區</option>
                      <option>中山區</option>
                      <option>松山區</option>
                    </select>
                  </div>
                </div>
              </div>

              <div v-show="form.locationMode === 'pin'" class="mode-panel active">
                <div class="info-inline">請於地圖指定位置，或輸入經緯度座標，以設定分析中心點。</div>

                <div class="grid-2">
                  <div class="field">
                    <label for="latitude">緯度</label>
                    <input id="latitude" v-model="form.latitude" type="number" step="0.0000001" placeholder="例如：25.0330" />
                  </div>
                  <div class="field">
                    <label for="longitude">經度</label>
                    <input id="longitude" v-model="form.longitude" type="number" step="0.0000001" placeholder="例如：121.5654" />
                  </div>
                </div>

                <div class="field">
                  <label for="radius">分析範圍（公尺）</label>
                  <input id="radius" v-model="form.radius" type="number" min="500" step="100" />
                  <div class="field-note">建議至少 500 公尺，範圍越大會納入越多周邊資料。</div>
                </div>
              </div>
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
        <LocationMap
          :mode="form.locationMode"
          :lat="form.latitude || '25.0330'"
          :lng="form.longitude || '121.5654'"
          :radius="radius"
        />
      </div>
    </aside>
  </main>
</template>
