<script setup>
import { computed } from 'vue'

const props = defineProps({
  vo: {
    type: Object,
    default: null,
  },
})

const transitScoreVo = computed(() => props.vo?.transitScoreVo || {})
const transitOverviewVo = computed(() => props.vo?.transitOverviewVo || {})

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

const formatDistance = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${formatInteger(number)} m`
}

const metrics = computed(() => [
  { key: 'transitScore', label: '交通分數', value: formatRank(transitScoreVo.value.transitScore) },
  { key: 'metroImpactRank', label: '捷運影響力', value: formatRank(transitScoreVo.value.metroImpactRank) },
  { key: 'busImpactRank', label: '公車影響力', value: formatRank(transitScoreVo.value.busImpactRank) },
])

const overviewStats = computed(() => [
  { key: 'metroStationCount', label: '分群內捷運站數', value: formatInteger(transitOverviewVo.value.metroStationCount) },
  { key: 'busStopCount', label: '分群內公車站牌數', value: formatInteger(transitOverviewVo.value.busStopCount) },
  { key: 'busRouteCount', label: '分群內公車路線數', value: formatInteger(transitOverviewVo.value.busRouteCount) },
  { key: 'metroStationDensityPerSquareKm', label: '每平方公里捷運站密度', value: formatDecimal(transitOverviewVo.value.metroStationDensityPerSquareKm) },
  { key: 'busStopDensityPerSquareKm', label: '每平方公里公車站牌密度', value: formatDecimal(transitOverviewVo.value.busStopDensityPerSquareKm) },
])

const nearestStops = computed(() => [
  {
    key: 'nearestMetroStation',
    label: '最近捷運站',
    name: transitOverviewVo.value.nearestMetroStationName || '-',
    distance: formatDistance(transitOverviewVo.value.nearestMetroDistanceMeters),
  },
  {
    key: 'nearestBusStop',
    label: '最近公車站牌',
    name: transitOverviewVo.value.nearestBusStopName || '-',
    distance: formatDistance(transitOverviewVo.value.nearestBusStopDistanceMeters),
  },
])
</script>

<template>
  <div class="cluster-data-panel">
    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          交通指標
          <span class="cluster-data-kicker">Indicator</span>
        </h3>
      </div>

      <div class="cluster-rank-grid single">
        <article v-for="metric in metrics" :key="metric.key" class="cluster-rank-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }} <small>/ 100</small></strong>
        </article>
      </div>
    </section>

    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          交通總覽
          <span class="cluster-data-kicker">Overview</span>
        </h3>
      </div>

      <div class="transit-overview-grid">
        <article v-for="stat in overviewStats" :key="stat.key" class="transit-stat-card">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </article>
      </div>
    </section>

    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          最近場站
          <span class="cluster-data-kicker">Nearest</span>
        </h3>
      </div>

      <div class="transit-nearest-grid">
        <article v-for="stop in nearestStops" :key="stop.key" class="transit-nearest-card">
          <span>{{ stop.label }}</span>
          <strong>{{ stop.name }}</strong>
          <small>{{ stop.distance }}</small>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cluster-rank-grid.single {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.transit-overview-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.transit-nearest-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.transit-stat-card,
.transit-nearest-card {
  min-height: 104px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-soft);
}

.transit-stat-card span,
.transit-nearest-card span {
  color: var(--muted);
  font-size: 12px;
  font-weight: var(--emphasis-weight);
  line-height: 1.45;
}

.transit-stat-card strong,
.transit-nearest-card strong {
  color: var(--text);
  font-size: 22px;
  font-weight: var(--emphasis-weight);
  line-height: 1.15;
}

.transit-nearest-card small {
  color: var(--primary-dark);
  font-size: 13px;
  font-weight: var(--emphasis-weight);
  line-height: 1.4;
}

@media (max-width: 1100px) {
  .cluster-rank-grid.single,
  .transit-overview-grid,
  .transit-nearest-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .cluster-rank-grid.single,
  .transit-overview-grid,
  .transit-nearest-grid {
    grid-template-columns: 1fr;
  }
}
</style>
