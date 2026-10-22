<script setup>
import { computed } from 'vue'

const props = defineProps({
  vo: {
    type: Object,
    default: null,
  },
})

const businessScoreVo = computed(() => props.vo?.businessScoreVo || {})
const businessOverviewVo = computed(() => props.vo?.businessOverviewVo || {})
const sameIndustryStructureVo = computed(() => props.vo?.sameIndustryStructureVo || {})

const formatInteger = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW').format(Math.round(number))
}

const formatDecimal = (value, digits = 2) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number)
}

const formatRank = (value) => formatDecimal(value, 1)

const formatShare = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 1,
  }).format(number * 100)}%`
}

const formatDistance = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${formatInteger(number)} m`
}

const scoreWidth = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(number, 100)) : 0
}

const scoreMetrics = computed(() => [
  { key: 'businessCountRank', label: '店家總數', value: formatRank(businessScoreVo.value.businessCountRank), width: scoreWidth(businessScoreVo.value.businessCountRank) },
  { key: 'industryCountRank', label: '產業類別數', value: formatRank(businessScoreVo.value.industryCountRank), width: scoreWidth(businessScoreVo.value.industryCountRank) },
  { key: 'hhiRank', label: '產業集中度', value: formatRank(businessScoreVo.value.hhiRank), width: scoreWidth(businessScoreVo.value.hhiRank) },
  { key: 'entropyRank', label: '產業多樣性', value: formatRank(businessScoreVo.value.entropyRank), width: scoreWidth(businessScoreVo.value.entropyRank) },
])

const overviewStats = computed(() => [
  { key: 'storeCount', label: '生活圈內店家數', value: formatInteger(businessOverviewVo.value.storeCount) },
  { key: 'industryCount', label: '生活圈內產業數', value: formatInteger(businessOverviewVo.value.industryCount) },
  { key: 'storeDensityPerSquareKm', label: '每平方公里店家密度', value: formatDecimal(businessOverviewVo.value.storeDensityPerSquareKm) },
  { key: 'catchmentAverageStoreCount', label: '周邊平均店家數', value: formatDecimal(businessOverviewVo.value.catchmentAverageStoreCount) },
  { key: 'catchmentAverageIndustryCount', label: '周邊平均產業數', value: formatDecimal(businessOverviewVo.value.catchmentAverageIndustryCount) },
  { key: 'catchmentAverageHhi', label: '周邊平均產業集中度', value: formatDecimal(businessOverviewVo.value.catchmentAverageHhi, 4) },
  { key: 'catchmentAverageEntropy', label: '周邊平均產業多樣性', value: formatDecimal(businessOverviewVo.value.catchmentAverageEntropy, 4) },
])

const sameIndustrySummary = computed(() => [
  { key: 'industryCode', label: '同類產業大類代碼', value: sameIndustryStructureVo.value.industryCode || '-' },
  { key: 'industryName', label: '同類產業大類名稱', value: sameIndustryStructureVo.value.industryName || '-' },
  { key: 'storeCount', label: '同類產業店家數', value: formatInteger(sameIndustryStructureVo.value.storeCount) },
  { key: 'storeShare', label: '佔全部店家比例', value: formatShare(sameIndustryStructureVo.value.storeShare) },
])

const sameIndustryGroups = computed(() => (
  Array.isArray(sameIndustryStructureVo.value.groups) ? sameIndustryStructureVo.value.groups : []
))

const sameIndustryDetails = computed(() => (
  Array.isArray(sameIndustryStructureVo.value.details) ? sameIndustryStructureVo.value.details : []
))

const sameIndustryStores = computed(() => (
  Array.isArray(sameIndustryStructureVo.value.sameIndustryStores) ? sameIndustryStructureVo.value.sameIndustryStores : []
))

const groupMaxShare = computed(() =>
  Math.max(...sameIndustryGroups.value.map((group) => Number(group.share) || 0), 0.0001),
)

const detailMaxShare = computed(() =>
  Math.max(...sameIndustryDetails.value.map((detail) => Number(detail.share) || 0), 0.0001),
)

const shareWidth = (value, max) => {
  const number = Number(value)
  if (!Number.isFinite(number) || !max) return 0
  return Math.max(2, Math.min((number / max) * 100, 100))
}
</script>

<template>
  <div class="business-panel">
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">BUSINESS / 商業</p>
          <h2>這附近的店，開成了什麼樣子</h2>
        </div>
        <span class="panel-kicker">INDEX / 100</span>
      </div>

      <div class="metric-grid">
        <article v-for="metric in scoreMetrics" :key="metric.key" class="metric-tile">
          <span class="metric-tile__label">{{ metric.label }}</span>
          <strong class="metric-tile__value">{{ metric.value }}<small>/ 100</small></strong>
          <span class="metric-tile__bar"><i :style="{ width: `${metric.width}%` }"></i></span>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">OVERVIEW / 總覽</p>
          <h2>商業基底</h2>
        </div>
      </div>

      <div class="stat-grid stat-grid--seven">
        <article v-for="stat in overviewStats" :key="stat.key" class="stat-card">
          <span>{{ stat.label }}</span>
          <b>{{ stat.value }}</b>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">STRUCTURE / 結構</p>
          <h2>同類產業，怎麼分布</h2>
        </div>
        <span class="panel-kicker">{{ sameIndustryStructureVo.industryCode || '—' }}</span>
      </div>

      <div class="stat-grid">
        <article v-for="stat in sameIndustrySummary" :key="stat.key" class="stat-card">
          <span>{{ stat.label }}</span>
          <b>{{ stat.value }}</b>
        </article>
      </div>

      <div class="two-col subsection">
        <div class="subcard">
          <h3 class="subhead">中分類結構 <small>MID</small></h3>
          <div v-if="!sameIndustryGroups.length" class="empty-state">目前沒有同類產業中分類資料。</div>
          <div v-else class="data-list">
            <div v-for="group in sameIndustryGroups" :key="group.industryCode || group.industryName" class="data-row">
              <div class="data-row__main">
                <strong>{{ group.industryName || '-' }}</strong>
                <span>{{ group.industryCode || '-' }}</span>
              </div>
              <div class="data-row__metrics">
                <span>{{ formatInteger(group.storeCount) }}</span>
                <span class="data-row__bar"><i :style="{ width: `${shareWidth(group.share, groupMaxShare)}%` }"></i></span>
                <span class="share-chip">{{ formatShare(group.share) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="subcard">
          <h3 class="subhead">細項結構 <small>DETAIL</small></h3>
          <div v-if="!sameIndustryDetails.length" class="empty-state">目前沒有同類產業細項資料。</div>
          <div v-else class="data-list">
            <div v-for="detail in sameIndustryDetails" :key="detail.industryCode || detail.industryName" class="data-row">
              <div class="data-row__main">
                <strong>{{ detail.industryName || '-' }}</strong>
                <span>{{ detail.industryCode || '-' }}</span>
              </div>
              <div class="data-row__metrics">
                <span>{{ formatInteger(detail.storeCount) }}</span>
                <span class="data-row__bar"><i :style="{ width: `${shareWidth(detail.share, detailMaxShare)}%` }"></i></span>
                <span class="share-chip">{{ formatShare(detail.share) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3 class="subhead">生活圈內同類產業店家 <small>STORES</small></h3>
        <div v-if="!sameIndustryStores.length" class="empty-state">目前沒有生活圈內同類產業店家資料。</div>
        <div v-else class="data-list">
          <div v-for="store in sameIndustryStores" :key="store.id || store.name" class="data-row">
            <div class="data-row__main">
              <strong>{{ store.name || '-' }}</strong>
              <span>{{ store.address || '-' }}</span>
            </div>
            <div class="data-row__metrics">
              <span>{{ formatDistance(store.distanceMeters) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.subcard {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--paper);
}

@media (max-width: 860px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
