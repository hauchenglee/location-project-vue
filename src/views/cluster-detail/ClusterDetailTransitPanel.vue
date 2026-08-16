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
  { key: 'metroImpactRank', label: '捷運影響力', value: formatRank(props.vo?.metroImpactRank) },
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
  </div>
</template>
