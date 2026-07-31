<script setup>
import { reactive, ref } from 'vue'
import LocationMap from '@/components/LocationMap.vue'
import { caseApi } from '@/services/caseApi'

const isSubmitting = ref(false)

const form = reactive({
  productName: '',
  productType: '請選擇類型',
  note: '',
  locationMode: 'district',
  city: '請選擇縣市',
  district: '請先選擇縣市',
  districtRadius: 500,
  lat: '',
  lng: '',
  pinRadius: 500,
  dayType: '平日',
  timeSlot: '早餐',
  targetAge: '18-24',
  priceRange: '100 以下',
  parkingDependency: '低',
  rentBudget: '',
})

const resetForm = () => {
  Object.assign(form, {
    productName: '',
    productType: '請選擇類型',
    note: '',
    locationMode: 'district',
    city: '請選擇縣市',
    district: '請先選擇縣市',
    districtRadius: 500,
    lat: '',
    lng: '',
    pinRadius: 500,
    dayType: '平日',
    timeSlot: '早餐',
    targetAge: '18-24',
    priceRange: '100 以下',
    parkingDependency: '低',
    rentBudget: '',
  })
}

const createCase = async () => {
  isSubmitting.value = true
  await caseApi.createCase({ ...form })
  isSubmitting.value = false
}
</script>

<template>
  <main class="main create-layout">
    <section class="left">
      <div class="left-scroll">
        <div class="form-shell">
          <div class="page-title">
            <h2>建立新案件</h2>
            <p>請依序完成案件基本資料、區域設定與情境條件，以建立分析案件。</p>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>案件基本資料</h3>
              <p>輸入案件識別資訊與商品內容。</p>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="productName">商品名稱</label>
                <input id="productName" v-model="form.productName" type="text" placeholder="例如：手搖飲、早午餐、超商" />
              </div>
              <div class="field">
                <label for="productType">商品類型</label>
                <select id="productType" v-model="form.productType">
                  <option>請選擇類型</option>
                  <option>餐飲</option>
                  <option>零售</option>
                  <option>服務</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="note">備註</label>
              <input id="note" v-model="form.note" type="text" placeholder="可填寫此案件的簡短補充說明" />
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>區域設定</h3>
            </div>

            <div class="mode-switch">
              <label class="mode-item">
                <input v-model="form.locationMode" type="radio" name="locationMode" value="district" />
                <span class="mode-card">
                  <strong>依行政區設定</strong>
                  <span>顯示縣市與行政區選單，適合前期區域探索。</span>
                </span>
              </label>

              <label class="mode-item">
                <input v-model="form.locationMode" type="radio" name="locationMode" value="pin" />
                <span class="mode-card">
                  <strong>地圖放圖釘</strong>
                  <span>顯示經緯度欄位，適合明確候選點位。</span>
                </span>
              </label>
            </div>

            <div class="mode-panels">
              <div v-show="form.locationMode === 'district'" class="mode-panel active">
                <div class="info-inline">
                  請選擇縣市與行政區，系統將依所選範圍進行分析設定。
                </div>

                <div class="grid-2">
                  <div class="field">
                    <label for="city">縣市</label>
                    <select id="city" v-model="form.city">
                      <option>請選擇縣市</option>
                      <option>台北市</option>
                      <option>新北市</option>
                      <option>桃園市</option>
                      <option>台中市</option>
                      <option>高雄市</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="district">行政區 / 鄉鎮市區</label>
                    <select id="district" v-model="form.district">
                      <option>請先選擇縣市</option>
                      <option>大安區</option>
                      <option>信義區</option>
                      <option>中山區</option>
                      <option>松山區</option>
                    </select>
                  </div>
                </div>

                <div class="field">
                  <label for="districtRadius">分析半徑（公尺）</label>
                  <input id="districtRadius" v-model="form.districtRadius" type="number" />
                  <div class="field-note">以行政區中心點或指定規則作為分析範圍基準。</div>
                </div>
              </div>

              <div v-show="form.locationMode === 'pin'" class="mode-panel active">
                <div class="info-inline">
                  請於地圖指定位置，或輸入經緯度座標，以設定分析中心點。
                </div>

                <div class="grid-2">
                  <div class="field">
                    <label for="lat">緯度（Latitude）</label>
                    <input id="lat" v-model="form.lat" type="text" placeholder="例如：25.0330" />
                  </div>
                  <div class="field">
                    <label for="lng">經度（Longitude）</label>
                    <input id="lng" v-model="form.lng" type="text" placeholder="例如：121.5654" />
                  </div>
                </div>

                <div class="field">
                  <label for="pinRadius">分析半徑（公尺）</label>
                  <input id="pinRadius" v-model="form.pinRadius" type="number" />
                  <div class="field-note">以圖釘位置為中心向外建立分析半徑。</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <h3>情境條件</h3>
              <p>請設定分析所需的條件參數，以利後續評估作業。</p>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="dayType">日別</label>
                <select id="dayType" v-model="form.dayType">
                  <option>平日</option>
                  <option>假日</option>
                </select>
              </div>
              <div class="field">
                <label for="timeSlot">時段</label>
                <select id="timeSlot" v-model="form.timeSlot">
                  <option>早餐</option>
                  <option>午餐</option>
                  <option>下午茶</option>
                  <option>晚餐</option>
                  <option>宵夜</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="targetAge">目標年齡層</label>
                <select id="targetAge" v-model="form.targetAge">
                  <option>18-24</option>
                  <option>25-34</option>
                  <option>35-44</option>
                  <option>45-54</option>
                  <option>55+</option>
                </select>
              </div>
              <div class="field">
                <label for="priceRange">客單價</label>
                <select id="priceRange" v-model="form.priceRange">
                  <option>100 以下</option>
                  <option>100 - 300</option>
                  <option>300 - 600</option>
                  <option>600 以上</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label for="parkingDependency">停車依賴程度</label>
                <select id="parkingDependency" v-model="form.parkingDependency">
                  <option>低</option>
                  <option>中</option>
                  <option>高</option>
                </select>
              </div>
              <div class="field">
                <label for="rentBudget">租金預算</label>
                <input id="rentBudget" v-model="form.rentBudget" type="number" placeholder="例如：80000" />
              </div>
            </div>
          </div>

          <div class="footer-actions">
            <button class="btn" type="button" @click="resetForm">清除</button>
            <button class="btn primary" type="button" :disabled="isSubmitting" @click="createCase">
              建立案件
            </button>
          </div>
        </div>
      </div>
    </section>

    <aside class="right">
      <div class="map-wrap">
        <LocationMap
          :mode="form.locationMode"
          :lat="form.lat || '25.0330'"
          :lng="form.lng || '121.5654'"
          :radius="form.locationMode === 'district' ? form.districtRadius : form.pinRadius"
        />
      </div>
    </aside>
  </main>
</template>
