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

const formatInteger = (value) => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '-'
  }

  return new Intl.NumberFormat('zh-TW').format(Math.round(number))
}

const rankMetrics = computed(() => [
  { key: 'businessCountRank', label: '店家總數', value: formatRank(props.vo?.businessCountRank) },
  { key: 'industryCountRank', label: '產業類別數', value: formatRank(props.vo?.industryCountRank) },
  { key: 'hhiRank', label: 'HHI 集中度', value: formatRank(props.vo?.hhiRank) },
  { key: 'entropyRank', label: 'Shannon Entropy 多樣性', value: formatRank(props.vo?.entropyRank) },
  { key: 'competitionImpactRank', label: '競品壓力', value: formatRank(props.vo?.competitionImpactRank) },
])

const industries = computed(() => (Array.isArray(props.vo?.industries) ? props.vo.industries : []))
</script>

<template>
  <div class="cluster-data-panel">
    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          商業指標
          <span class="cluster-data-kicker">Indicator</span>
        </h3>
      </div>

      <div class="cluster-rank-grid">
        <article v-for="metric in rankMetrics" :key="metric.key" class="cluster-rank-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }} <small>/ 100</small></strong>
        </article>
      </div>
    </section>

    <section class="cluster-data-section">
      <div class="cluster-data-section-head">
        <h3>
          產業組成
          <span class="cluster-data-kicker raw">Data</span>
        </h3>
      </div>

      <div class="table-wrap cluster-business-table">
        <table>
          <thead>
            <tr>
              <th>產業</th>
              <th>代碼</th>
              <th>店家數</th>
              <th>層級</th>
              <th>版本</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!industries.length">
              <td colspan="5" class="empty-cell">目前沒有商業產業資料。</td>
            </tr>
            <tr v-for="industry in industries" :key="industry.industryId || industry.industryCode">
              <td>
                <span class="case-id">{{ industry.name || '-' }}</span>
                <span class="sub">{{ industry.definition || '-' }}</span>
              </td>
              <td>{{ industry.industryCode || '-' }}</td>
              <td>{{ formatInteger(industry.businessCount) }}</td>
              <td>{{ industry.levelNo ?? '-' }}</td>
              <td>{{ industry.revision || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
