<script setup>
import { computed } from 'vue'

const props = defineProps({
  vo: {
    type: Object,
    default: null,
  },
})

const peopleScoreVo = computed(() => props.vo?.peopleScoreVo || {})
const peopleOverviewVo = computed(() => props.vo?.peopleOverviewVo || {})
const peopleTimePeriodVo = computed(() => props.vo?.peopleTimePeriodVo || {})

const formatRank = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number)
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

const formatPercentFromRatio = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 1,
  }).format(number * 100)}%`
}

const dayTypeLabels = {
  weekday: '平日',
  weekend: '假日',
}

const timeSlotLabels = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
}

const formatPeakPeriod = (dayType, timeSlot) => {
  const dayTypeLabel = dayTypeLabels[dayType]
  const timeSlotLabel = timeSlotLabels[timeSlot]

  if (!dayTypeLabel && !timeSlotLabel) {
    return '-'
  }

  return [dayTypeLabel, timeSlotLabel].filter(Boolean).join(' ')
}

const metrics = computed(() => [
  { key: 'peopleCountRank', label: '人潮數量', value: formatRank(peopleScoreVo.value.peopleCountRank) },
  { key: 'peoplePeakRank', label: '人潮高峰', value: formatRank(peopleScoreVo.value.peoplePeakRank) },
  { key: 'peopleAverageRank', label: '平均人潮', value: formatRank(peopleScoreVo.value.peopleAverageRank) },
])

const overviewStats = computed(() => [
  { key: 'selectedPeople', label: '使用者選定時間區段的人潮', value: formatDecimal(peopleOverviewVo.value.selectedPeople) },
  { key: 'peakPeople', label: '最高人潮', value: formatDecimal(peopleOverviewVo.value.peakPeople) },
  {
    key: 'peakPeriod',
    label: '最高人潮時段',
    value: formatPeakPeriod(peopleOverviewVo.value.peakDayType, peopleOverviewVo.value.peakTimeSlot),
  },
  { key: 'averagePeople', label: '六個時間區段平均人潮', value: formatDecimal(peopleOverviewVo.value.averagePeople) },
  { key: 'stabilityRatio', label: '人潮穩定度', value: formatPercentFromRatio(peopleOverviewVo.value.stabilityRatio) },
])

const timePeriodRows = computed(() => [
  { key: 'weekdayMorningPeople', dayType: '平日', timeSlot: '上午', value: formatDecimal(peopleTimePeriodVo.value.weekdayMorningPeople) },
  { key: 'weekdayAfternoonPeople', dayType: '平日', timeSlot: '下午', value: formatDecimal(peopleTimePeriodVo.value.weekdayAfternoonPeople) },
  { key: 'weekdayEveningPeople', dayType: '平日', timeSlot: '晚上', value: formatDecimal(peopleTimePeriodVo.value.weekdayEveningPeople) },
  { key: 'weekendMorningPeople', dayType: '假日', timeSlot: '上午', value: formatDecimal(peopleTimePeriodVo.value.weekendMorningPeople) },
  { key: 'weekendAfternoonPeople', dayType: '假日', timeSlot: '下午', value: formatDecimal(peopleTimePeriodVo.value.weekendAfternoonPeople) },
  { key: 'weekendEveningPeople', dayType: '假日', timeSlot: '晚上', value: formatDecimal(peopleTimePeriodVo.value.weekendEveningPeople) },
])
</script>

<template>
  <div class="cluster-data-panel">
    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          人潮指標
          <span class="cluster-data-kicker">Indicator</span>
        </h3>
      </div>

      <div class="cluster-rank-grid three">
        <article v-for="metric in metrics" :key="metric.key" class="cluster-rank-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }} <small>/ 100</small></strong>
        </article>
      </div>
    </section>

    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          人潮總覽
          <span class="cluster-data-kicker">Overview</span>
        </h3>
      </div>

      <div class="people-overview-grid">
        <article v-for="stat in overviewStats" :key="stat.key" class="people-stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>
    </section>

    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          人潮時段分布
          <span class="cluster-data-kicker">Time Period</span>
        </h3>
      </div>

      <div class="people-time-period-grid">
        <article v-for="row in timePeriodRows" :key="row.key" class="people-time-period-card">
          <span>{{ row.dayType }}</span>
          <strong>{{ row.timeSlot }}</strong>
          <small>{{ row.value }}</small>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.people-overview-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.people-stat-card,
.people-time-period-card {
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.people-stat-card span,
.people-time-period-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: var(--emphasis-weight);
  line-height: 1.45;
}

.people-stat-card strong {
  color: var(--text);
  font-size: 22px;
  font-weight: var(--emphasis-weight);
  line-height: 1.15;
}

.people-time-period-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.people-time-period-card strong {
  color: var(--text);
  font-size: 18px;
  font-weight: var(--emphasis-weight);
  line-height: 1.2;
}

.people-time-period-card small {
  color: var(--primary-dark);
  font-size: 20px;
  font-weight: var(--emphasis-weight);
  line-height: 1.1;
}

@media (max-width: 1100px) {
  .people-overview-grid,
  .people-time-period-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .people-overview-grid,
  .people-time-period-grid {
    grid-template-columns: 1fr;
  }
}
</style>
