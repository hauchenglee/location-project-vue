<script setup>
import { computed } from 'vue'

const props = defineProps({
  vo: {
    type: Object,
    default: null,
  },
})

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

const metrics = computed(() => [
  { key: 'peopleCountRank', label: '人潮數量', value: formatRank(props.vo?.peopleCountRank) },
  { key: 'peoplePeakRank', label: '人潮高峰', value: formatRank(props.vo?.peoplePeakRank) },
  { key: 'peopleAverageRank', label: '平均人潮', value: formatRank(props.vo?.peopleAverageRank) },
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
  </div>
</template>
