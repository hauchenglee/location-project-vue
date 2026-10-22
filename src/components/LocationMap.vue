<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import { TAIWAN_CENTER } from '@/maps/constants'
import { useMapLibreMap } from '@/maps/composables/useMapLibreMap'
import { createSubmitPreviewStyle } from '@/maps/styles'
import MapFallback from '@/components/MapFallback.vue'

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

const emit = defineEmits(['pick-location', 'update:radius'])

const radiusOptions = [
  { value: 250, label: '250m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
]

const mapEl = ref(null)
const mapUnavailable = ref(false)
const { map, initializeMap: initializeMapLibre } = useMapLibreMap()
let marker = null

const selectedLocation = computed(() => {
  const longitude = Number(props.longitude)
  const latitude = Number(props.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null
  return [longitude, latitude]
})

const activeRadius = computed(() => Number(props.radius) || 500)

const coordinateLabel = computed(() => {
  if (!selectedLocation.value) return '尚未選定'
  const [longitude, latitude] = selectedLocation.value
  return `${latitude.toFixed(4)}°N / ${longitude.toFixed(4)}°E`
})

const createCircleCoordinates = (center, radiusMeters) => {
  const points = 96
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

  return coordinates
}

const createRadiusFeatures = (center) => {
  const radii = [...new Set([...radiusOptions.map((option) => option.value), activeRadius.value])]
  return {
    type: 'FeatureCollection',
    features: radii.map((radiusMeters) => ({
      type: 'Feature',
      properties: { radius: radiusMeters },
      geometry: {
        type: 'Polygon',
        coordinates: [createCircleCoordinates(center, radiusMeters)],
      },
    })),
  }
}

const createPinElement = () => {
  const element = document.createElement('div')
  element.className = 'luozi-pin'
  element.setAttribute('aria-label', '目前分析地點')
  return element
}

const removeRadiusLayers = () => {
  if (!map.value) return

  ;['analysis-radius-selected-outline', 'analysis-radius-selected-fill', 'analysis-radius-outline'].forEach((layerId) => {
    if (map.value.getLayer(layerId)) {
      map.value.removeLayer(layerId)
    }
  })

  if (map.value.getSource('analysis-radius')) {
    map.value.removeSource('analysis-radius')
  }
}

const clearPointPreview = () => {
  marker?.remove()
  marker = null
  removeRadiusLayers()
}

const renderPointPreview = () => {
  if (!map.value?.isStyleLoaded?.()) return

  clearPointPreview()

  if (!selectedLocation.value) return

  const center = selectedLocation.value
  const selectedRadius = activeRadius.value

  map.value.addSource('analysis-radius', {
    type: 'geojson',
    data: createRadiusFeatures(center),
  })

  map.value.addLayer({
    id: 'analysis-radius-selected-fill',
    type: 'fill',
    source: 'analysis-radius',
    filter: ['==', ['get', 'radius'], selectedRadius],
    paint: {
      'fill-color': '#c3472c',
      'fill-opacity': 0.09,
    },
  })

  map.value.addLayer({
    id: 'analysis-radius-outline',
    type: 'line',
    source: 'analysis-radius',
    paint: {
      'line-color': '#3a3c30',
      'line-width': ['case', ['==', ['get', 'radius'], selectedRadius], 1.4, 0.8],
      'line-opacity': ['case', ['==', ['get', 'radius'], selectedRadius], 0.72, 0.34],
      'line-dasharray': [3, 3],
    },
  })

  map.value.addLayer({
    id: 'analysis-radius-selected-outline',
    type: 'line',
    source: 'analysis-radius',
    filter: ['==', ['get', 'radius'], selectedRadius],
    paint: {
      'line-color': '#a7381f',
      'line-width': 1.7,
      'line-opacity': 0.9,
    },
  })

  marker = new maplibregl.Marker({ element: createPinElement(), anchor: 'center' })
    .setLngLat(center)
    .addTo(map.value)
}

const syncMapViewport = ({ focus = false } = {}) => {
  if (!map.value) return

  renderPointPreview()

  if (focus && selectedLocation.value) {
    map.value.easeTo({
      center: selectedLocation.value,
      zoom: Math.max(map.value.getZoom(), 14.2),
      duration: 480,
    })
  }
}

const initializeMap = async () => {
  const initialCenter = selectedLocation.value || TAIWAN_CENTER
  const mapInstance = await initializeMapLibre({
    container: mapEl,
    style: await createSubmitPreviewStyle(),
    center: initialCenter,
    zoom: selectedLocation.value ? 13.2 : 8.2,
    navigationPosition: 'bottom-right',
  })
  if (!mapInstance) {
    mapUnavailable.value = true
    return
  }

  mapInstance.on('load', () => {
    renderPointPreview()
  })

  mapInstance.on('click', (event) => {
    const { lng, lat } = event.lngLat
    emit('pick-location', {
      longitude: Number(lng.toFixed(6)),
      latitude: Number(lat.toFixed(6)),
    })
  })
}

watch(
  () => [props.longitude, props.latitude],
  () => syncMapViewport({ focus: true }),
)

watch(activeRadius, () => renderPointPreview())

onMounted(initializeMap)

onBeforeUnmount(clearPointPreview)
</script>

<template>
  <div class="submit-map-panel">
    <div ref="mapEl" class="map-canvas maplibre-stage" aria-label="分析地點預覽地圖"></div>

    <MapFallback
      v-if="mapUnavailable"
      title="座標已就位，地圖待命"
      description="此環境未啟用 WebGL2，無法繪製互動地圖。你仍可直接輸入經緯度，或用右側的快速地點完成分析。"
    />

    <div v-if="!mapUnavailable" class="map-overlay-top">
      <div class="map-caption">
        <p class="eyebrow eyebrow--plain">LOCATION PREVIEW</p>
        <h2>地點預覽</h2>
        <p v-if="selectedLocation">已選定地點。點擊地圖其他位置，可以重新設定。</p>
        <p v-else>點擊地圖任意位置，選定分析地點。</p>
      </div>

      <div class="map-radius-control" aria-label="分析範圍">
        <button
          v-for="option in radiusOptions"
          :key="option.value"
          class="map-radius-btn"
          :class="{ active: activeRadius === option.value }"
          type="button"
          @click="emit('update:radius', option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div v-if="!mapUnavailable" class="map-overlay-bottom">
      <div class="map-coordinate">
        <span>LNG / LAT</span>
        <strong>{{ coordinateLabel }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submit-map-panel {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--paper-2);
}

.submit-map-panel :deep(.maplibregl-canvas) {
  cursor: crosshair;
}
</style>
