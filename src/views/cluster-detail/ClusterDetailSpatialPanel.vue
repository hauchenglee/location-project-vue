<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { TAIWAN_BOUNDS } from '@/maps/constants'
import { useMapLibreMap } from '@/maps/composables/useMapLibreMap'
import { compositeRankLegendGradient } from '@/maps/scales/compositeRankScale'
import { createClusterHeatmapStyle } from '@/maps/styles'
import { getClusterBounds } from '@/maps/utils/bounds'

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
  if (!mapInstance) return

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
  <section class="cluster-spatial-panel">
    <div class="cluster-spatial-toolbar">
      <div>
        <h3>空間熱點</h3>
        <p>Composite rank / 每 5 分一階</p>
      </div>
      <div class="cluster-heatmap-legend" aria-label="Composite rank heatmap legend">
        <span>低</span>
        <i :style="{ background: legendGradient }"></i>
        <span>高</span>
      </div>
    </div>

    <div class="cluster-spatial-map-shell">
      <div ref="mapEl" class="cluster-spatial-map maplibre-stage" aria-label="生活圈空間熱點地圖"></div>
    </div>
  </section>
</template>
