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

const formatWalkTime = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  const minutes = Math.max(1, Math.round(number / 80))
  return `步行約 ${minutes} 分鐘`
}

const scoreWidth = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(number, 100)) : 0
}

const metrics = computed(() => [
  { key: 'transitScore', label: '交通分數', value: formatRank(transitScoreVo.value.transitScore), width: scoreWidth(transitScoreVo.value.transitScore) },
  { key: 'metroImpactRank', label: '捷運影響力', value: formatRank(transitScoreVo.value.metroImpactRank), width: scoreWidth(transitScoreVo.value.metroImpactRank) },
  { key: 'busImpactRank', label: '公車影響力', value: formatRank(transitScoreVo.value.busImpactRank), width: scoreWidth(transitScoreVo.value.busImpactRank) },
])

const overviewStats = computed(() => [
  { key: 'metroStationCount', label: '生活圈內捷運站數', value: formatInteger(transitOverviewVo.value.metroStationCount) },
  { key: 'busStopCount', label: '生活圈內公車站牌數', value: formatInteger(transitOverviewVo.value.busStopCount) },
  { key: 'busRouteCount', label: '生活圈內公車路線數', value: formatInteger(transitOverviewVo.value.busRouteCount) },
  { key: 'metroStationDensityPerSquareKm', label: '捷運站密度 / km²', value: formatDecimal(transitOverviewVo.value.metroStationDensityPerSquareKm) },
  { key: 'busStopDensityPerSquareKm', label: '公車站牌密度 / km²', value: formatDecimal(transitOverviewVo.value.busStopDensityPerSquareKm) },
])

const nearestStops = computed(() => [
  {
    key: 'nearestMetroStation',
    label: '最近捷運站',
    code: 'METRO',
    name: transitOverviewVo.value.nearestMetroStationName || '-',
    distance: formatDistance(transitOverviewVo.value.nearestMetroDistanceMeters),
    walk: formatWalkTime(transitOverviewVo.value.nearestMetroDistanceMeters),
  },
  {
    key: 'nearestBusStop',
    label: '最近公車站牌',
    code: 'BUS',
    name: transitOverviewVo.value.nearestBusStopName || '-',
    distance: formatDistance(transitOverviewVo.value.nearestBusStopDistanceMeters),
    walk: formatWalkTime(transitOverviewVo.value.nearestBusStopDistanceMeters),
  },
])
</script>

<template>
  <div class="transit-panel">
    <section class="panel-card">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">TRANSIT / 交通</p>
          <h2>人怎麼被帶到這裡</h2>
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
          <h2>交通基底</h2>
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
          <p class="panel-kicker">NEAREST / 最近</p>
          <h2>最後一哩路</h2>
        </div>
      </div>

      <div class="nearest-grid">
        <article v-for="stop in nearestStops" :key="stop.key" class="nearest-card">
          <span>{{ stop.code }} · {{ stop.label }}</span>
          <strong>{{ stop.name }}</strong>
          <small>{{ stop.distance }} · {{ stop.walk }}</small>
        </article>
      </div>
    </section>
  </div>
</template>
