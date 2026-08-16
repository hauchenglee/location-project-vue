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

const population = computed(() => props.vo || null)

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

const rankMetrics = computed(() => [
  {
    key: 'populationCountRank',
    label: '人口數量',
    value: formatRank(population.value?.populationCountRank),
  },
  {
    key: 'populationTargetAgeRank',
    label: '目標年齡層人口',
    note: `選擇：${selectedAgeGroupDetail.value.label}`,
    value: formatRank(population.value?.populationTargetAgeRank),
  },
])

const structureStats = computed(() => {
  const male = toNumber(population.value?.populationMale)
  const female = toNumber(population.value?.populationFemale)
  const total = toNumber(population.value?.populationTotal) || male + female

  return [
    { key: 'householdCount', label: '戶數', value: formatInteger(population.value?.householdCount), note: 'Households' },
    { key: 'populationTotal', label: '總人口', value: formatInteger(total), note: 'Population' },
    { key: 'populationMale', label: '男性', value: formatInteger(male), note: total ? formatPercent((male / total) * 100) : '-' },
    { key: 'populationFemale', label: '女性', value: formatInteger(female), note: total ? formatPercent((female / total) * 100) : '-' },
  ]
})

const ageDistribution = computed(() => {
  const rows = ageGroups.map((group) => {
    const male = toNumber(population.value?.[group.male])
    const female = toNumber(population.value?.[group.female])

    return {
      ...group,
      male,
      female,
      total: male + female,
    }
  })

  const max = Math.max(...rows.map((row) => row.total), 1)

  return rows.map((row) => ({
    ...row,
    malePercent: row.total ? (row.male / max) * 100 : 0,
    femalePercent: row.total ? (row.female / max) * 100 : 0,
  }))
})

const selectedAgeGroupDetail = computed(() => {
  const group = selectedAgeGroupMap[props.selectedAgeGroup] || {
    label: props.selectedAgeGroup || '未指定',
    keys: [],
  }
  const total = toNumber(population.value?.populationTotal) || ageDistribution.value.reduce((sum, row) => sum + row.total, 0)

  if (props.selectedAgeGroup === 'ALL') {
    return {
      label: group.label,
      total,
      ratio: total ? 100 : 0,
    }
  }

  const selectedRows = ageDistribution.value.filter((row) => group.keys.includes(row.key))
  const selectedTotal = selectedRows.reduce((sum, row) => sum + row.total, 0)
  const ratio = total ? (selectedTotal / total) * 100 : 0

  return {
    label: group.label,
    total: selectedTotal,
    ratio,
  }
})

</script>

<template>
  <div class="population-panel">
    <section class="population-section">
      <div class="population-section-head">
        <h3>
          人口指標
          <span class="population-section-kicker">Indicator</span>
        </h3>
      </div>

      <div class="population-rank-grid">
        <article v-for="metric in rankMetrics" :key="metric.key" class="population-rank-card">
          <span class="population-rank-card-head">
            <span>{{ metric.label }}</span>
            <small v-if="metric.note">{{ metric.note }}</small>
          </span>
          <strong>{{ metric.value }} <small>/ 100</small></strong>
        </article>
      </div>
    </section>

    <section class="population-section population-data-section">
      <div class="population-section-head">
        <h3>
          人口數據
          <span class="population-section-kicker raw">Data</span>
        </h3>
      </div>

      <div class="population-data-grid">
        <article class="population-data-card">
          <div class="population-card-head">
            <h4>人口結構</h4>
          </div>

          <div class="population-structure-grid">
            <div v-for="stat in structureStats" :key="stat.key" class="population-structure-item">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
              <small>{{ stat.note }}</small>
            </div>
          </div>
        </article>

        <article class="population-data-card age-card">
          <div class="population-card-head">
            <h4>年齡分佈</h4>
            <div class="population-legend">
              <span class="male">男性</span>
              <span class="female">女性</span>
            </div>
          </div>

          <div class="age-bars">
            <div v-for="row in ageDistribution" :key="row.key" class="age-bar-row">
              <span class="age-label">{{ row.label }}</span>
              <div class="age-bar-track">
                <div class="age-bar male" :style="{ width: `${row.malePercent}%` }"></div>
                <div class="age-bar female" :style="{ width: `${row.femalePercent}%` }"></div>
              </div>
              <strong>{{ formatInteger(row.total) }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.population-panel {
  display: grid;
  gap: 16px;
}

.population-section,
.population-data-card {
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.population-section {
  padding: 18px;
}

.population-section-head,
.population-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.population-section-kicker {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.population-section-kicker.raw {
  color: #0f766e;
}

.population-section h3,
.population-card-head h4 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}

.population-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
}

.population-card-head h4 {
  font-size: 14px;
}

.population-card-head span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.population-rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.population-rank-card {
  min-height: 112px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(255, 255, 255, 0.62));
}

.population-rank-card span,
.population-structure-item span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.population-rank-card-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.population-rank-card-head small {
  display: inline-flex;
  align-items: center;
  color: #1e40af;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.4;
}

.population-rank-card strong {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #1e3a8a;
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.population-rank-card strong small {
  color: #64748b;
  font-size: 14px;
  font-weight: 900;
}

.population-data-grid {
  display: grid;
  gap: 14px;
}

.population-data-card {
  padding: 16px;
}

.population-structure-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.population-structure-item {
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.56);
}

.population-structure-item strong {
  color: #0f172a;
  font-size: 24px;
  font-weight: 900;
  line-height: 1.1;
}

.population-structure-item small {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
}

.age-card {
  min-height: 320px;
}

.population-legend {
  display: flex;
  gap: 12px;
}

.population-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.population-legend span::before {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.population-legend .male::before {
  background: #2563eb;
}

.population-legend .female::before {
  background: #db2777;
}

.age-bars {
  display: grid;
  gap: 9px;
}

.age-bar-row {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) 82px;
  align-items: center;
  gap: 12px;
  min-height: 28px;
}

.age-label {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}

.age-bar-track {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.age-bar {
  height: 9px;
  min-width: 2px;
  border-radius: 0;
}

.age-bar.male {
  background: #2563eb;
}

.age-bar.female {
  background: #db2777;
}

.age-bar-row strong {
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  text-align: right;
}

@media (max-width: 1100px) {
  .population-structure-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .population-rank-grid,
  .population-structure-grid {
    grid-template-columns: 1fr;
  }

  .age-bar-row {
    grid-template-columns: 48px minmax(0, 1fr) 66px;
    gap: 8px;
  }
}
</style>
