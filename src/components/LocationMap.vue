<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import { TAIWAN_CENTER } from '@/maps/constants'
import { useMapLibreMap } from '@/maps/composables/useMapLibreMap'
import { createSubmitPreviewStyle } from '@/maps/styles'

const props = defineProps({
  longitude: {
    type: [Number, String],
    default: '',
  },
  latitude: {
    type: [Number, String],
    default: '',
  },
  radius: {
    type: [Number, String],
    default: 500,
  },
})

const mapEl = ref(null)
const { map, initializeMap: initializeMapLibre } = useMapLibreMap()
let marker = null

const selectedLocation = computed(() => {
  const longitude = Number(props.longitude)
  const latitude = Number(props.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null

  return [longitude, latitude]
})

const scopeTitle = computed(() => '座標半徑分析')
const scopeSubtitle = computed(() => {
  return selectedLocation.value ? `${props.radius}m 半徑` : '輸入座標後預覽範圍'
})

const createCircleFeature = (center, radiusMeters) => {
  const points = 72
  const coordinates = []
  const earthRadius = 6378137
  const latitudeRad = center[1] * Math.PI / 180

  for (let index = 0; index <= points; index += 1) {
    const angle = 2 * Math.PI * index / points
    const dx = radiusMeters * Math.cos(angle)
    const dy = radiusMeters * Math.sin(angle)
    const lng = center[0] + (dx / (earthRadius * Math.cos(latitudeRad))) * 180 / Math.PI
    const lat = center[1] + (dy / earthRadius) * 180 / Math.PI
    coordinates.push([lng, lat])
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      },
    ],
  }
}

const clearPointPreview = () => {
  marker?.remove()
  marker = null

  if (map.value?.getLayer('analysis-radius-outline')) {
    map.value.removeLayer('analysis-radius-outline')
  }
  if (map.value?.getLayer('analysis-radius-fill')) {
    map.value.removeLayer('analysis-radius-fill')
  }
  if (map.value?.getSource('analysis-radius')) {
    map.value.removeSource('analysis-radius')
  }
}

const renderPointPreview = () => {
  if (!map.value?.isStyleLoaded?.()) return

  clearPointPreview()

  if (!selectedLocation.value) {
    return
  }

  const center = selectedLocation.value
  const radiusMeters = Math.max(Number(props.radius) || 500, 100)

  map.value.addSource('analysis-radius', {
    type: 'geojson',
    data: createCircleFeature(center, radiusMeters),
  })
  map.value.addLayer({
    id: 'analysis-radius-fill',
    type: 'fill',
    source: 'analysis-radius',
    paint: {
      'fill-color': '#2f7df0',
      'fill-opacity': 0.16,
    },
  })
  map.value.addLayer({
    id: 'analysis-radius-outline',
    type: 'line',
    source: 'analysis-radius',
    paint: {
      'line-color': '#1f67d8',
      'line-width': 2,
    },
  })

  marker = new maplibregl.Marker({ color: '#1f67d8' })
    .setLngLat(center)
    .addTo(map.value)
  map.value.easeTo({ center, zoom: 15, duration: 320 })
}

const syncMapViewport = () => {
  if (!map.value) return

  renderPointPreview()
}

const initializeMap = async () => {
  const mapInstance = await initializeMapLibre({
    container: mapEl,
    style: await createSubmitPreviewStyle(),
    center: TAIWAN_CENTER,
    zoom: 8,
  })
  if (!mapInstance) return

  mapInstance.on('load', syncMapViewport)
}

watch(
  () => [props.longitude, props.latitude, props.radius],
  syncMapViewport,
)

onMounted(initializeMap)

onBeforeUnmount(clearPointPreview)
</script>

<template>
  <div class="submit-map-panel">
    <div ref="mapEl" class="submit-map-canvas maplibre-stage" aria-label="分析範圍預覽地圖"></div>
    <div class="submit-map-summary">
      <div>
        <h3>分析範圍預覽</h3>
        <p>{{ scopeTitle }} · {{ scopeSubtitle }}</p>
      </div>
    </div>
  </div>
</template>
