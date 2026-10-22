<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { TAIWAN_BOUNDS } from '@/maps/constants'
import { useMapLibreMap } from '@/maps/composables/useMapLibreMap'
import { compositeRankLegendGradient } from '@/maps/scales/compositeRankScale'
import { createClusterHeatmapStyle } from '@/maps/styles'
import { getClusterBounds } from '@/maps/utils/bounds'
import MapFallback from '@/components/MapFallback.vue'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
  clusterId: {
    type: [Number, String],
    default: null,
  },
  metricCluster: {
    type: Object,
    default: null,
  },
})

const mapEl = ref(null)
const mapUnavailable = ref(false)
const { map, initializeMap: initializeMapLibre, setStyle } = useMapLibreMap()
const legendGradient = computed(() => compositeRankLegendGradient())

const createMapStyle = () => createClusterHeatmapStyle({
  analysisId: props.analysisId,
  metricClusterId: props.clusterId,
})

const focusCluster = (options = {}) => {
  if (!map.value) return

  const bounds = getClusterBounds(props.metricCluster)
  const duration = options.animate === false ? 0 : 420

  if (bounds) {
    map.value.fitBounds(bounds, {
      padding: 58,
      maxZoom: 15,
      duration,
    })
    return
  }

  map.value.fitBounds(TAIWAN_BOUNDS, {
    padding: 34,
    animate: false,
  })
}

const refreshMap = async () => {
  if (!map.value) return

  setStyle(await createMapStyle(), () => focusCluster())
}

const initializeMap = async () => {
  const mapInstance = await initializeMapLibre({
    container: mapEl,
    style: await createMapStyle(),
  })
  if (!mapInstance) {
    mapUnavailable.value = true
    return
  }

  mapInstance.on('load', () => {
    mapInstance.resize()
    focusCluster({ animate: false })
  })
}

watch(() => [props.analysisId, props.clusterId], refreshMap)
watch(() => props.metricCluster, () => focusCluster(), { deep: true })

onMounted(initializeMap)
</script>

<template>
  <section class="panel-card">
    <div class="spatial-toolbar">
      <div>
        <p class="panel-kicker">HEAT / 空間</p>
        <h2 class="spatial-title">綜合評分熱區</h2>
        <p class="spatial-subtitle">每個格網依綜合評分著色，每 5 分一階。顏色越深，越值得停下來看。</p>
      </div>
      <div class="heat-legend" aria-label="綜合評分熱區圖例">
        <span>低</span>
        <i :style="{ background: legendGradient }"></i>
        <span>高</span>
      </div>
    </div>

    <div class="spatial-map-shell">
      <div ref="mapEl" class="spatial-map maplibre-stage" aria-label="生活圈空間熱區地圖"></div>
      <MapFallback
        v-if="mapUnavailable"
        title="熱區暫時無法描繪"
        description="此環境未啟用 WebGL2，無法顯示格網熱區。其他分頁的商業、人口、人潮與交通資料仍可正常閱讀。"
      />
    </div>

    <div class="spatial-foot">
      <span>GRID · 100m</span>
      <span>COMPOSITE SCORE · 0–100</span>
      <span>每 5 分一階</span>
    </div>
  </section>
</template>

<style scoped>
.spatial-title {
  margin-top: 3px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.spatial-subtitle {
  max-width: 460px;
  margin-top: 5px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.7;
}

.spatial-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.spatial-toolbar {
  align-items: flex-start;
}
</style>
