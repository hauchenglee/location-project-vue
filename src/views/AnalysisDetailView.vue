<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  analysis: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['back'])

const isParameterOpen = ref(true)
const isMapOpen = ref(true)
const activeCircleId = ref('zhongxiao')

const baseAnalysis = computed(() => ({
  taskNo: 'AN-20260812-001',
  productName: '手搖飲展店分析',
  businessCode: '餐飲',
  status: 'COMPLETED',
  createTime: '2026-08-12 08:15:00',
  countyName: '台北市',
  townName: '大安區',
  rangeSize: 800,
  preference: '0.5',
  selectedDayType: 'WEEKDAY',
  selectedTimeSlot: 'AFTERNOON',
  selectedAgeGroup: '25-34',
  ...props.analysis,
}))

const lifeCircles = [
  {
    id: 'zhongxiao',
    name: '忠孝復興生活圈',
    score: 91,
    status: '建議優先',
    competition: '中高',
    businessScore: 86,
    populationScore: 94,
    trafficScore: 90,
    radius: '約 800 公尺',
    headline: '高人流、高曝光，適合外帶型與品牌展示型門市。',
    summary: '位於捷運交會與商辦聚集區，下午至傍晚人流穩定，目標年齡層集中。',
    position: { left: '30%', top: '38%' },
  },
  {
    id: 'shida',
    name: '師大商圈北側',
    score: 84,
    status: '值得比較',
    competition: '中',
    businessScore: 78,
    populationScore: 92,
    trafficScore: 73,
    radius: '約 650 公尺',
    headline: '年輕客群集中，適合高辨識度與高翻桌率品項。',
    summary: '以校園、住宅與巷弄商業為主，年輕客群占比高，晚間與假日仍具消費潛力。',
    position: { left: '58%', top: '44%' },
  },
  {
    id: 'daanpark',
    name: '大安森林公園西側',
    score: 76,
    status: '可觀察',
    competition: '低',
    businessScore: 70,
    populationScore: 81,
    trafficScore: 82,
    radius: '約 700 公尺',
    headline: '生活客群穩定，適合社區型與低競爭壓力策略。',
    summary: '以住宅、休憩與日常採買動線為主，競品壓力較低但尖峰人流較分散。',
    position: { left: '45%', top: '68%' },
  },
  {
    id: 'xinyi',
    name: '信義安和站周邊',
    score: 73,
    status: '備選',
    competition: '中',
    businessScore: 74,
    populationScore: 76,
    trafficScore: 79,
    radius: '約 600 公尺',
    headline: '商辦與住宅混合，適合作為中小型展店備選。',
    summary: '消費力穩定但人流高峰較短，需搭配明確商品差異化。',
    position: { left: '70%', top: '62%' },
  },
]

const activeCircle = computed(() => lifeCircles.find((circle) => circle.id === activeCircleId.value) || lifeCircles[0])

const statusLabelMap = {
  COMPLETED: '完成',
  PROCESSING: '處理中',
  PENDING: '待處理',
  FAILED: '失敗',
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

const formatDateTime = (value) => {
  if (!value) return '-'
  return String(value).replace('T', ' ')
}

const formatLocation = (analysis) => [analysis.countyName, analysis.townName].filter(Boolean).join(' / ') || '-'
</script>

<template>
  <main class="main detail-layout">
    <div class="content-scroll">
      <div class="content-shell">
        <div class="detail-backbar">
          <button class="btn-sm primary back-link" type="button" @click="emit('back')">
            <span aria-hidden="true">‹</span>
            返回分析列表
          </button>
        </div>

        <div class="page-title detail-page-title">
          <div>
            <h2>{{ baseAnalysis.productName }}</h2>
            <p>{{ formatLocation(baseAnalysis) }}，共找到 {{ lifeCircles.length }} 個生活圈可比較。</p>
          </div>

          <div class="detail-title-meta">
            <span class="badge done">{{ statusLabelMap[baseAnalysis.status] || '完成' }}</span>
            <strong>{{ baseAnalysis.taskNo }}</strong>
            <span>{{ formatDateTime(baseAnalysis.createTime) }}</span>
          </div>
        </div>

        <section class="section parameter-section">
          <div class="section-header parameter-header">
            <div>
              <h3>分析參數</h3>
              <p>商品、區域、範圍與觀察情境。</p>
            </div>
            <button class="btn-sm parameter-toggle" type="button" @click="isParameterOpen = !isParameterOpen">
              {{ isParameterOpen ? '收合' : '展開' }}
            </button>
          </div>

          <div v-show="isParameterOpen" class="grid-4 parameter-grid">
            <div class="field readonly-field">
              <label>商品類型</label>
              <div>{{ baseAnalysis.businessCode }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析區域</label>
              <div>{{ formatLocation(baseAnalysis) }}</div>
            </div>
            <div class="field readonly-field">
              <label>分析範圍</label>
              <div>{{ baseAnalysis.rangeSize }} 公尺</div>
            </div>
            <div class="field readonly-field">
              <label>觀察情境</label>
              <div>{{ dayTypeLabelMap[baseAnalysis.selectedDayType] || '-' }} / {{ timeSlotLabelMap[baseAnalysis.selectedTimeSlot] || '-' }}</div>
            </div>
            <div class="field readonly-field">
              <label>目標年齡</label>
              <div>{{ ageGroupLabelMap[baseAnalysis.selectedAgeGroup] || baseAnalysis.selectedAgeGroup || '-' }}</div>
            </div>
          </div>
        </section>

        <section class="section cluster-map-section">
          <div class="section-header parameter-header">
            <div>
              <h3>生活圈分布</h3>
              <p>點選地圖上的生活圈，可同步切換下方列表選取狀態。</p>
            </div>
            <button class="btn-sm" type="button" @click="isMapOpen = !isMapOpen">
              {{ isMapOpen ? '收合' : '展開' }}
            </button>
          </div>

          <div v-show="isMapOpen">
            <div class="detail-map cluster-visual-map">
              <div class="map-grid-lines"></div>
              <div class="life-road road-a"></div>
              <div class="life-road road-b"></div>
              <button
                v-for="circle in lifeCircles"
                :key="circle.id"
                class="map-marker"
                :class="{ active: activeCircle.id === circle.id }"
                :style="{ left: circle.position.left, top: circle.position.top }"
                type="button"
                @click="activeCircleId = circle.id"
              >
                <span>{{ circle.name }}</span>
                <strong>{{ circle.score }}</strong>
              </button>
            </div>

            <div class="selected-cluster-summary">
              <div>
                <span class="sub">目前選取</span>
                <strong>{{ activeCircle.name }}</strong>
                <p>{{ activeCircle.summary }}</p>
              </div>
              <div class="selected-cluster-meta">
                <span class="badge type">{{ activeCircle.status }}</span>
                <span class="pill">分數 {{ activeCircle.score }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section cluster-table-section">
          <div class="section-header">
            <h3>生活圈列表</h3>
            <p>基本名稱、分數、狀態與重點摘要，可橫向捲動查看完整欄位。</p>
          </div>

          <div class="table-wrap cluster-scroll-table">
            <table>
              <thead>
                <tr>
                  <th>生活圈</th>
                  <th>分數</th>
                  <th>狀態</th>
                  <th>範圍</th>
                  <th>商業</th>
                  <th>客群</th>
                  <th>交通</th>
                  <th>競爭</th>
                  <th>摘要</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="circle in lifeCircles"
                  :key="circle.id"
                  :class="{ 'active-row': activeCircle.id === circle.id }"
                  @click="activeCircleId = circle.id"
                >
                  <td><span class="case-id">{{ circle.name }}</span></td>
                  <td>{{ circle.score }}</td>
                  <td><span class="badge type">{{ circle.status }}</span></td>
                  <td>{{ circle.radius }}</td>
                  <td>{{ circle.businessScore }}</td>
                  <td>{{ circle.populationScore }}</td>
                  <td>{{ circle.trafficScore }}</td>
                  <td>{{ circle.competition }}</td>
                  <td>{{ circle.headline }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
