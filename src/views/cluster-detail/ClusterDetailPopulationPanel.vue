<script setup>
import { computed } from 'vue'

const props = defineProps({
  vo: {
    type: Object,
    default: null,
  },
  selectedAgeGroup: {
    type: String,
    default: 'ALL',
  },
})

const ageGroups = [
  { key: '0-4', label: '0-4', male: 'age0To4Male', female: 'age0To4Female' },
  { key: '5-9', label: '5-9', male: 'age5To9Male', female: 'age5To9Female' },
  { key: '10-14', label: '10-14', male: 'age10To14Male', female: 'age10To14Female' },
  { key: '15-19', label: '15-19', male: 'age15To19Male', female: 'age15To19Female' },
  { key: '20-24', label: '20-24', male: 'age20To24Male', female: 'age20To24Female' },
  { key: '25-29', label: '25-29', male: 'age25To29Male', female: 'age25To29Female' },
  { key: '30-34', label: '30-34', male: 'age30To34Male', female: 'age30To34Female' },
  { key: '35-39', label: '35-39', male: 'age35To39Male', female: 'age35To39Female' },
  { key: '40-44', label: '40-44', male: 'age40To44Male', female: 'age40To44Female' },
  { key: '45-49', label: '45-49', male: 'age45To49Male', female: 'age45To49Female' },
  { key: '50-54', label: '50-54', male: 'age50To54Male', female: 'age50To54Female' },
  { key: '55-59', label: '55-59', male: 'age55To59Male', female: 'age55To59Female' },
  { key: '60-64', label: '60-64', male: 'age60To64Male', female: 'age60To64Female' },
  { key: '65+', label: '65+', male: 'age65PlusMale', female: 'age65PlusFemale' },
]

const selectedAgeGroupMap = {
  ALL: { label: '全部年齡', keys: ageGroups.map((group) => group.key) },
  '0-14': { label: '0-14 歲', keys: ['0-4', '5-9', '10-14'] },
  '15-24': { label: '15-24 歲', keys: ['15-19', '20-24'] },
  '25-34': { label: '25-34 歲', keys: ['25-29', '30-34'] },
  '35-44': { label: '35-44 歲', keys: ['35-39', '40-44'] },
  '45-54': { label: '45-54 歲', keys: ['45-49', '50-54'] },
  '55-64': { label: '55-64 歲', keys: ['55-59', '60-64'] },
  '65+': { label: '65 歲以上', keys: ['65+'] },
}

const populationScoreVo = computed(() => props.vo?.populationScoreVo || {})
const populationOverviewVo = computed(() => props.vo?.populationOverviewVo || {})
const populationAgeVo = computed(() => props.vo?.populationAgeVo || {})

const toNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const formatInteger = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW').format(Math.round(number))
}

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

const formatPercent = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${new Intl.NumberFormat('zh-TW', {
    maximumFractionDigits: 1,
  }).format(number)}%`
}

const scoreWidth = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(number, 100)) : 0
}

const ageDistribution = computed(() => {
  const rows = ageGroups.map((group) => {
    const male = toNumber(populationAgeVo.value[group.male])
    const female = toNumber(populationAgeVo.value[group.female])

    return { ...group, male, female, total: male + female }
  })

  const maxSide = Math.max(...rows.flatMap((row) => [row.male, row.female]), 1)

  return rows.map((row) => ({
    ...row,
    maleWidth: row.male ? Math.max((row.male / maxSide) * 100, 2) : 0,
    femaleWidth: row.female ? Math.max((row.female / maxSide) * 100, 2) : 0,
  }))
})

const totalPopulation = computed(() => {
  const total = toNumber(populationOverviewVo.value.populationTotal)
  return total || ageDistribution.value.reduce((sum, row) => sum + row.total, 0)
})

const selectedAgeGroupDetail = computed(() => {
  const group = selectedAgeGroupMap[props.selectedAgeGroup] || {
    label: props.selectedAgeGroup || '未指定',
    keys: [],
  }
  const total = totalPopulation.value

  if (props.selectedAgeGroup === 'ALL') {
    return { label: group.label, total, ratio: total ? 100 : 0 }
  }

  const selectedRows = ageDistribution.value.filter((row) => group.keys.includes(row.key))
  const selectedTotal = selectedRows.reduce((sum, row) => sum + row.total, 0)

  return {
    label: group.label,
    total: selectedTotal,
    ratio: total ? (selectedTotal / total) * 100 : 0,
  }
})

const rankMetrics = computed(() => [
  {
    key: 'populationCountRank',
    label: '人口分數',
    value: formatRank(populationScoreVo.value.populationCountRank),
    width: scoreWidth(populationScoreVo.value.populationCountRank),
  },
  {
    key: 'populationTargetAgeRank',
    label: '目標年齡層分數',
    note: `選定：${selectedAgeGroupDetail.value.label}`,
    value: formatRank(populationScoreVo.value.populationTargetAgeRank),
    width: scoreWidth(populationScoreVo.value.populationTargetAgeRank),
  },
])

const structureStats = computed(() => {
  const male = toNumber(populationOverviewVo.value.populationMale)
  const female = toNumber(populationOverviewVo.value.populationFemale)
  const total = totalPopulation.value

  return [
    { key: 'householdCount', label: '戶數', value: formatInteger(populationOverviewVo.value.householdCount) },
    { key: 'populationTotal', label: '總人口', value: formatInteger(total) },
    { key: 'populationMale', label: '男性', value: formatInteger(male), percent: total ? formatPercent((male / total) * 100) : '-' },
    { key: 'populationFemale', label: '女性', value: formatInteger(female), percent: total ? formatPercent((female / total) * 100) : '-' },
  ]
})
</script>

<template>
  <div class="population-panel">
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">POPULATION / 人口</p>
          <h2>誰住在這個生活圈</h2>
        </div>
        <span class="panel-kicker">INDEX / 100</span>
      </div>

      <div class="metric-grid metric-grid--two">
        <article v-for="metric in rankMetrics" :key="metric.key" class="metric-tile">
          <span class="metric-tile__label">
            {{ metric.label }}
            <small v-if="metric.note">{{ metric.note }}</small>
          </span>
          <strong class="metric-tile__value">{{ metric.value }}<small>/ 100</small></strong>
          <span class="metric-tile__bar"><i :style="{ width: `${metric.width}%` }"></i></span>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">OVERVIEW / 結構</p>
          <h2>人口基底</h2>
        </div>
      </div>

      <div class="stat-grid">
        <article v-for="stat in structureStats" :key="stat.key" class="stat-card">
          <span>{{ stat.label }}</span>
          <b>
            {{ stat.value }}
            <small v-if="stat.percent">{{ stat.percent }}</small>
          </b>
        </article>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">AGE / 年齡</p>
          <h2>年齡分佈</h2>
        </div>
        <div class="age-legend">
          <span><i class="male"></i>男性</span>
          <span><i class="female"></i>女性</span>
        </div>
      </div>

      <div class="age-axis" aria-hidden="true">
        <span>男</span>
        <span>AGE</span>
        <span>女</span>
      </div>

      <div class="age-chart" aria-label="年齡與性別分佈圖">
        <div v-for="row in ageDistribution" :key="row.key" class="age-row">
          <div class="age-side age-side--male">
            <span class="age-bar age-bar--male" :style="{ width: `${row.maleWidth}%` }" :title="`男性 ${formatInteger(row.male)} 人`"></span>
          </div>
          <span class="age-label">{{ row.label }}</span>
          <div class="age-side">
            <span class="age-bar age-bar--female" :style="{ width: `${row.femaleWidth}%` }" :title="`女性 ${formatInteger(row.female)} 人`"></span>
          </div>
        </div>
      </div>

      <div class="age-summary">
        <div>
          <span>選定年齡層</span>
          <b>{{ selectedAgeGroupDetail.label }}</b>
        </div>
        <div>
          <span>人口數</span>
          <b>{{ formatInteger(selectedAgeGroupDetail.total) }}</b>
        </div>
        <div>
          <span>佔全體</span>
          <b>{{ formatPercent(selectedAgeGroupDetail.ratio) }}</b>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.age-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 18px;
  border-top: 1px solid var(--line);
}

.age-summary > div {
  padding: 12px 14px 0 0;
}

.age-summary span {
  display: block;
  color: var(--muted);
  font-size: 9.5px;
}

.age-summary b {
  display: block;
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 560px) {
  .age-summary {
    grid-template-columns: 1fr;
  }
}
</style>
