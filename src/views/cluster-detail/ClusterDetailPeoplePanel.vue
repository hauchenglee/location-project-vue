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
  const dayTypeLabel = dayTypeLabels[String(dayType || '').toLowerCase()]
  const timeSlotLabel = timeSlotLabels[String(timeSlot || '').toLowerCase()]

  if (!dayTypeLabel && !timeSlotLabel) {
    return '-'
  }

  return [dayTypeLabel, timeSlotLabel].filter(Boolean).join(' ')
}

const scoreWidth = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(number, 100)) : 0
}

const metrics = computed(() => [
  { key: 'peopleCountRank', label: '人潮數量', value: formatRank(peopleScoreVo.value.peopleCountRank), width: scoreWidth(peopleScoreVo.value.peopleCountRank) },
  { key: 'peoplePeakRank', label: '人潮高峰', value: formatRank(peopleScoreVo.value.peoplePeakRank), width: scoreWidth(peopleScoreVo.value.peoplePeakRank) },
  { key: 'peopleAverageRank', label: '平均人潮', value: formatRank(peopleScoreVo.value.peopleAverageRank), width: scoreWidth(peopleScoreVo.value.peopleAverageRank) },
])

const overviewStats = computed(() => [
  { key: 'selectedPeople', label: '選定時段人潮', value: formatDecimal(peopleOverviewVo.value.selectedPeople) },
  { key: 'peakPeople', label: '最高人潮', value: formatDecimal(peopleOverviewVo.value.peakPeople) },
  {
    key: 'peakPeriod',
    label: '最高人潮時段',
    value: formatPeakPeriod(peopleOverviewVo.value.peakDayType, peopleOverviewVo.value.peakTimeSlot),
  },
  { key: 'averagePeople', label: '六時段平均', value: formatDecimal(peopleOverviewVo.value.averagePeople) },
  { key: 'stabilityRatio', label: '人潮穩定度', value: formatPercentFromRatio(peopleOverviewVo.value.stabilityRatio) },
])

const timePeriodRows = computed(() => {
  const rows = [
    { key: 'weekdayMorningPeople', dayType: '平日', timeSlot: '上午', value: Number(peopleTimePeriodVo.value.weekdayMorningPeople) },
    { key: 'weekdayAfternoonPeople', dayType: '平日', timeSlot: '下午', value: Number(peopleTimePeriodVo.value.weekdayAfternoonPeople) },
    { key: 'weekdayEveningPeople', dayType: '平日', timeSlot: '晚上', value: Number(peopleTimePeriodVo.value.weekdayEveningPeople) },
    { key: 'weekendMorningPeople', dayType: '假日', timeSlot: '上午', value: Number(peopleTimePeriodVo.value.weekendMorningPeople) },
    { key: 'weekendAfternoonPeople', dayType: '假日', timeSlot: '下午', value: Number(peopleTimePeriodVo.value.weekendAfternoonPeople) },
    { key: 'weekendEveningPeople', dayType: '假日', timeSlot: '晚上', value: Number(peopleTimePeriodVo.value.weekendEveningPeople) },
  ].map((row) => ({
    ...row,
    value: Number.isFinite(row.value) ? row.value : null,
  }))

  const max = Math.max(...rows.map((row) => row.value || 0), 1)

  return rows.map((row) => {
    const ratio = row.value !== null ? row.value / max : 0
    return {
      ...row,
      displayValue: row.value === null ? '-' : formatDecimal(row.value),
      ratio,
      intensity: Math.round(ratio * 100),
    }
  })
})

const peakRowKey = computed(() => (
  timePeriodRows.value.reduce((peak, row) => (
    (row.value || 0) > (peak.value || 0) ? row : peak
  ), timePeriodRows.value[0] || {}).key
))
</script>

<template>
  <div class="people-panel">
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">PEOPLE / 人潮</p>
          <h2>什麼時候，人會聚集</h2>
        </div>
        <span class="panel-kicker">INDEX / 100</span>
      </div>

      <div class="metric-grid metric-grid--three">
        <article v-for="metric in metrics" :key="metric.key" class="metric-tile">
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
          <h2>人潮基底</h2>
        </div>
      </div>

      <div class="stat-grid stat-grid--five">
        <article v-for="stat in overviewStats" :key="stat.key" class="stat-card">
          <span>{{ stat.label }}</span>
          <b>{{ stat.value }}</b>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">TIME / 時段</p>
          <h2>六個時段的人潮</h2>
        </div>
        <span class="panel-kicker">HEAT</span>
      </div>

      <div class="time-grid">
        <article
          v-for="row in timePeriodRows"
          :key="row.key"
          class="time-card"
          :class="{ 'time-card--peak': row.key === peakRowKey }"
          :style="{ background: `rgba(195, 71, 44, ${0.035 + row.ratio * 0.13})` }"
        >
          <span>{{ row.dayType }} · {{ row.timeSlot }}</span>
          <strong>{{ row.displayValue }}</strong>
          <div class="time-card-foot">
            <small :style="{ width: `${Math.max(row.intensity, 2)}%` }"></small>
            <em>{{ row.intensity }}%</em>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.time-card {
  position: relative;
  overflow: hidden;
}

.time-card strong {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
}

.time-card--peak {
  border-color: rgba(195, 71, 44, 0.55);
}

.time-card--peak::after {
  content: "PEAK";
  position: absolute;
  top: 10px;
  right: 10px;
  color: var(--vermilion);
  font-family: var(--font-mono);
  font-size: 7px;
  letter-spacing: 0.12em;
}

.time-card-foot {
  display: flex;
  align-items: center;
  gap: 7px;
}

.time-card-foot small {
  display: block;
  height: 2px;
  background: var(--vermilion);
  opacity: 0.72;
}

.time-card-foot em {
  margin-left: auto;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 7.5px;
  font-style: normal;
}
</style>
