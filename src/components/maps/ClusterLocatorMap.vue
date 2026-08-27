<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TAIWAN_BOUNDS, TAIWAN_CENTER } from '@/maps/constants'
import { useClusterMarkers } from '@/maps/composables/useClusterMarkers'
import { useMapLibreMap } from '@/maps/composables/useMapLibreMap'
import { clusterFootprintLayers } from '@/maps/layers/clusterFootprintLayers'
import { createClusterLocatorStyle } from '@/maps/styles'
import { getClusterBounds, getClustersBounds, getGeometryBounds } from '@/maps/utils/bounds'

const props = defineProps({
  analysisId: {
    type: [Number, String],
    default: null,
  },
  metricClusters: {
    type: Array,
    default: () => [],
  },
  selectedMetricClusterId: {
    type: [Number, String],
    default: null,
  },
  analysisGeometry: {
    type: [Object, String],
    default: null,
  },
})

const emit = defineEmits(['select-cluster'])

const mapEl = ref(null)
const hoveredMetricClusterId = ref(null)
const CLUSTER_SEARCH_ZOOM = 11
const { map, initializeMap: initializeMapLibre, resizeAfterLayout, setStyle } = useMapLibreMap()
const { renderMarkers, clearMarkers } = useClusterMarkers({
  map,
  onSelect: (metricCluster) => {
    focusCluster(metricCluster)
    emit('select-cluster', metricCluster)
  },
})

const createLocatorStyle = () => createClusterLocatorStyle({
  analysisId: props.analysisId,
  metricClusters: props.metricClusters,
  selectedMetricClusterId: props.selectedMetricClusterId,
  hoveredMetricClusterId: hoveredMetricClusterId.value,
})

const renderLocatorMarkers = () => {
  renderMarkers({
    metricClusters: props.metricClusters,
    selectedMetricClusterId: props.selectedMetricClusterId,
  })
}

const updateLocatorPaint = () => {
  if (!map.value?.isStyleLoaded?.()) return
  if (!map.value.getLayer('cluster-footprint-fill') || !map.value.getLayer('cluster-footprint-outline')) return

  const [fillLayer, outlineLayer] = clusterFootprintLayers({
    metricClusters: props.metricClusters,
    selectedMetricClusterId: props.selectedMetricClusterId,
    hoveredMetricClusterId: hoveredMetricClusterId.value,
  })

  Object.entries(fillLayer.paint).forEach(([property, value]) => {
    map.value.setPaintProperty(fillLayer.id, property, value)
  })
  Object.entries(outlineLayer.paint).forEach(([property, value]) => {
    map.value.setPaintProperty(outlineLayer.id, property, value)
  })
}

const fitAllClusters = () => {
  if (!map.value) return

  const clusterBounds = getClustersBounds(props.metricClusters)
  if (clusterBounds) {
    map.value.fitBounds(clusterBounds, {
      padding: 72,
      maxZoom: 13,
      duration: 420,
    })
    return
  }

  map.value.fitBounds(TAIWAN_BOUNDS, {
    padding: 34,
    animate: false,
  })
}

const fitAnalysisArea = (options = {}) => {
  if (!map.value) return

  const analysisBounds = getGeometryBounds(props.analysisGeometry)
  const duration = options.animate === false ? 0 : 360

  if (analysisBounds) {
    map.value.fitBounds(analysisBounds, {
      padding: 72,
      maxZoom: 14,
      duration,
    })
    return
  }

  map.value.easeTo({
    center: TAIWAN_CENTER,
    zoom: CLUSTER_SEARCH_ZOOM,
    duration,
  })
}

const focusCluster = (metricClusterOrKey, options = {}) => {
  if (!map.value || !metricClusterOrKey) return

  const metricCluster = typeof metricClusterOrKey === 'object'
    ? metricClusterOrKey
    : props.metricClusters.find((cluster) => Number(cluster.id) === Number(metricClusterOrKey))
  const bounds = getClusterBounds(metricCluster)
  const duration = options.animate === false ? 0 : 520

  if (bounds) {
    map.value.fitBounds(bounds, {
      padding: 54,
      maxZoom: 15,
      duration,
    })
    return
  }

  fitAnalysisArea(options)
}

const findClusterByFeature = (feature) => {
  const metricClusterId = Number(feature?.properties?.id)
  return props.metricClusters.find((cluster) => Number(cluster.id) === metricClusterId)
}

const refreshMap = (options = {}) => {
  if (!map.value) return

  setStyle(createLocatorStyle(), () => {
    renderLocatorMarkers()
    if (props.selectedMetricClusterId) {
      focusCluster(props.selectedMetricClusterId)
    } else if (options.fitAll !== false) {
      fitAllClusters()
    }
  })
}

const initializeMap = async () => {
  const mapInstance = await initializeMapLibre({
    container: mapEl,
    style: createLocatorStyle(),
  })
  if (!mapInstance) return

  mapInstance.on('load', async () => {
    await resizeAfterLayout()
    if (props.selectedMetricClusterId) {
      focusCluster(props.selectedMetricClusterId, { animate: false })
    } else {
      fitAllClusters()
    }
    renderLocatorMarkers()
  })

  mapInstance.on('click', 'cluster-footprint-fill', (event) => {
    const metricCluster = findClusterByFeature(event.features?.[0])
    if (!metricCluster) return

    focusCluster(metricCluster)
    emit('select-cluster', metricCluster)
  })

  mapInstance.on('mousemove', 'cluster-footprint-fill', (event) => {
    mapInstance.getCanvas().style.cursor = 'pointer'
    hoveredMetricClusterId.value = event.features?.[0]?.properties?.id ?? null
  })

  mapInstance.on('mouseleave', 'cluster-footprint-fill', () => {
    mapInstance.getCanvas().style.cursor = ''
    hoveredMetricClusterId.value = null
  })
}

watch(() => props.analysisId, () => refreshMap())

watch(() => props.metricClusters, async (metricClusters) => {
  if (!metricClusters.length) {
    clearMarkers()
    return
  }

  await nextTick()
  updateLocatorPaint()
  renderLocatorMarkers()
  if (!props.selectedMetricClusterId) {
    fitAllClusters()
  }
}, { deep: true })

watch(() => props.selectedMetricClusterId, () => {
  updateLocatorPaint()
  renderLocatorMarkers()
})

watch(hoveredMetricClusterId, updateLocatorPaint)

onMounted(initializeMap)

onBeforeUnmount(clearMarkers)

defineExpose({
  fitAllClusters,
  focusCluster,
})
</script>

<template>
  <div ref="mapEl" class="analysis-cluster-map maplibre-stage" aria-label="生活圈位置地圖"></div>
</template>
