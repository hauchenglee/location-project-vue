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
const targetIndustryCompetitionVo = computed(() => props.vo?.targetIndustryCompetitionVo || {})

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

const scoreMetrics = computed(() => [
  { key: 'compositeScore', label: '綜合分數', value: formatRank(businessScoreVo.value.compositeScore) },
  { key: 'businessScore', label: '商業分數', value: formatRank(businessScoreVo.value.businessScore) },
  { key: 'businessCountRank', label: '店家總數分數', value: formatRank(businessScoreVo.value.businessCountRank) },
  { key: 'industryCountRank', label: '產業類別數分數', value: formatRank(businessScoreVo.value.industryCountRank) },
  { key: 'hhiRank', label: 'HHI 集中度分數', value: formatRank(businessScoreVo.value.hhiRank) },
  { key: 'entropyRank', label: 'Shannon Entropy 多樣性分數', value: formatRank(businessScoreVo.value.entropyRank) },
  { key: 'competitionImpactRank', label: '競品壓力分數', value: formatRank(businessScoreVo.value.competitionImpactRank) },
])

const overviewStats = computed(() => [
  { key: 'storeCount', label: '分群內店家數', value: formatInteger(businessOverviewVo.value.storeCount) },
  { key: 'industryCount', label: '分群內產業數', value: formatInteger(businessOverviewVo.value.industryCount) },
  { key: 'storeDensityPerSquareKm', label: '每平方公里店家密度', value: formatDecimal(businessOverviewVo.value.storeDensityPerSquareKm) },
  { key: 'catchmentAverageStoreCount', label: '周邊平均店家數', value: formatDecimal(businessOverviewVo.value.catchmentAverageStoreCount) },
  { key: 'catchmentAverageIndustryCount', label: '周邊平均產業數', value: formatDecimal(businessOverviewVo.value.catchmentAverageIndustryCount) },
  { key: 'catchmentAverageHhi', label: '周邊平均 HHI 集中度', value: formatDecimal(businessOverviewVo.value.catchmentAverageHhi, 4) },
  { key: 'catchmentAverageEntropy', label: '周邊平均 Shannon Entropy 多樣性', value: formatDecimal(businessOverviewVo.value.catchmentAverageEntropy, 4) },
])

const sameIndustrySummary = computed(() => [
  { key: 'industryCode', label: '同類產業大類代碼', value: sameIndustryStructureVo.value.industryCode || '-' },
  { key: 'industryName', label: '同類產業大類名稱', value: sameIndustryStructureVo.value.industryName || '-' },
  { key: 'storeCount', label: '同類產業店家數', value: formatInteger(sameIndustryStructureVo.value.storeCount) },
  { key: 'storeShare', label: '同類產業佔全部店家比例', value: formatShare(sameIndustryStructureVo.value.storeShare) },
])

const targetIndustrySummary = computed(() => [
  { key: 'industryCode', label: '目標產業代碼', value: targetIndustryCompetitionVo.value.industryCode || '-' },
  { key: 'industryName', label: '目標產業名稱', value: targetIndustryCompetitionVo.value.industryName || '-' },
  { key: 'coreStoreCount', label: '分群內同業數', value: formatInteger(targetIndustryCompetitionVo.value.coreStoreCount) },
  { key: 'nearbyStoreCount', label: '周邊同業數', value: formatInteger(targetIndustryCompetitionVo.value.nearbyStoreCount) },
  { key: 'nearestDistanceMeters', label: '最近同業距離', value: formatDistance(targetIndustryCompetitionVo.value.nearestDistanceMeters) },
])

const sameIndustryGroups = computed(() => (
  Array.isArray(sameIndustryStructureVo.value.groups) ? sameIndustryStructureVo.value.groups : []
))

const sameIndustryDetails = computed(() => (
  Array.isArray(sameIndustryStructureVo.value.details) ? sameIndustryStructureVo.value.details : []
))

const competitors = computed(() => (
  Array.isArray(targetIndustryCompetitionVo.value.competitors) ? targetIndustryCompetitionVo.value.competitors : []
))
</script>

<template>
  <div class="business-panel">
    <section class="business-section">
      <div class="business-section-head">
        <h3>
          商業指標
          <span class="business-section-kicker">BusinessScoreVo</span>
        </h3>
      </div>

      <div class="business-rank-grid">
        <article v-for="metric in scoreMetrics" :key="metric.key" class="business-rank-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }} <small>/ 100</small></strong>
        </article>
      </div>
    </section>

    <section class="business-section">
      <div class="business-section-head">
        <h3>
          商業總覽
          <span class="business-section-kicker">BusinessOverviewVo</span>
        </h3>
      </div>

      <div class="business-stat-grid">
        <article v-for="stat in overviewStats" :key="stat.key" class="business-stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>
    </section>

    <section class="business-section">
      <div class="business-section-head">
        <h3>
          同類產業結構
          <span class="business-section-kicker">SameIndustryStructureVo</span>
        </h3>
      </div>

      <div class="business-stat-grid compact">
        <article v-for="stat in sameIndustrySummary" :key="stat.key" class="business-stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>

      <div class="business-table-grid">
        <article class="business-table-card">
          <div class="business-table-head">
            <h4>同類產業中分類結構</h4>
          </div>

          <div class="business-list">
            <div v-if="!sameIndustryGroups.length" class="business-empty">目前沒有同類產業中分類資料。</div>
            <div v-for="group in sameIndustryGroups" :key="group.industryCode || group.industryName" class="business-list-row">
              <div>
                <strong>{{ group.industryName || '-' }}</strong>
                <span>{{ group.industryCode || '-' }}</span>
              </div>
              <div class="business-row-metrics">
                <span>{{ formatInteger(group.storeCount) }}</span>
                <small>{{ formatShare(group.share) }}</small>
              </div>
            </div>
          </div>
        </article>

        <article class="business-table-card">
          <div class="business-table-head">
            <h4>同類產業細項結構</h4>
          </div>

          <div class="business-list">
            <div v-if="!sameIndustryDetails.length" class="business-empty">目前沒有同類產業細項資料。</div>
            <div v-for="detail in sameIndustryDetails" :key="detail.industryCode || detail.industryName" class="business-list-row">
              <div>
                <strong>{{ detail.industryName || '-' }}</strong>
                <span>{{ detail.industryCode || '-' }}</span>
              </div>
              <div class="business-row-metrics">
                <span>{{ formatInteger(detail.storeCount) }}</span>
                <small>{{ formatShare(detail.share) }}</small>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="business-section">
      <div class="business-section-head">
        <h3>
          同業競品
          <span class="business-section-kicker">TargetIndustryCompetitionVo</span>
        </h3>
      </div>

      <div class="business-stat-grid compact">
        <article v-for="stat in targetIndustrySummary" :key="stat.key" class="business-stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>

      <div class="business-competitor-list">
        <div v-if="!competitors.length" class="business-empty">目前沒有鄰近同業資料。</div>
        <div v-for="competitor in competitors" :key="competitor.id || competitor.name" class="business-competitor-row">
          <div>
            <strong>{{ competitor.name || '-' }}</strong>
            <span>{{ competitor.address || '-' }}</span>
          </div>
          <small>{{ formatDistance(competitor.distanceMeters) }}</small>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.business-panel {
  display: grid;
  gap: 18px;
}

.business-section {
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.business-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.business-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  color: #111318;
  font-size: 16px;
  font-weight: var(--title-weight);
}

.business-section-kicker {
  display: inline-flex;
  align-items: center;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.business-rank-grid,
.business-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.business-rank-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.business-stat-grid.compact {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.business-rank-card,
.business-stat-card {
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.business-rank-card {
  background: #ffffff;
}

.business-rank-card span,
.business-stat-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: var(--emphasis-weight);
  line-height: 1.45;
}

.business-rank-card strong,
.business-stat-card strong {
  color: var(--text);
  font-size: 22px;
  font-weight: var(--emphasis-weight);
  line-height: 1.1;
}

.business-rank-card strong {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--primary-dark);
  font-size: 28px;
  line-height: 1;
}

.business-rank-card strong small {
  color: var(--muted);
  font-size: 14px;
  font-weight: var(--emphasis-weight);
}

.business-table-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.business-table-card {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.business-table-head {
  margin-bottom: 12px;
}

.business-table-head h4 {
  margin: 0;
  color: #111318;
  font-size: 14px;
  font-weight: var(--title-weight);
}

.business-list,
.business-competitor-list {
  display: grid;
  gap: 8px;
}

.business-competitor-list {
  margin-top: 12px;
}

.business-list-row,
.business-competitor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  min-height: 56px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.business-list-row > div:first-child,
.business-competitor-row > div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.business-list-row strong,
.business-competitor-row strong {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: var(--emphasis-weight);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-list-row span,
.business-competitor-row span {
  overflow: hidden;
  color: var(--muted);
  font-size: 12px;
  font-weight: var(--emphasis-weight);
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-row-metrics {
  flex: 0 0 auto;
  display: grid;
  justify-items: end;
  gap: 4px;
}

.business-row-metrics span,
.business-competitor-row small {
  color: var(--text);
  font-size: 13px;
  font-weight: var(--emphasis-weight);
  white-space: nowrap;
}

.business-row-metrics small {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  color: var(--primary-dark);
  background: rgba(47, 125, 240, 0.08);
  font-size: 12px;
  font-weight: var(--emphasis-weight);
  line-height: 1.35;
}

.business-empty {
  padding: 18px;
  border: 1px dashed var(--line);
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 13px;
  font-weight: var(--emphasis-weight);
  text-align: center;
}

@media (max-width: 1100px) {
  .business-rank-grid,
  .business-stat-grid,
  .business-stat-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .business-table-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .business-rank-grid,
  .business-stat-grid,
  .business-stat-grid.compact {
    grid-template-columns: 1fr;
  }

  .business-list-row,
  .business-competitor-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .business-row-metrics {
    justify-items: start;
  }
}
</style>
