<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as maplibregl from 'maplibre-gl'
import { MVT_LAYERS, MVT_SOURCE_ID, TAIWAN_CENTER } from '@/maps/constants'
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
  districtCode: {
    type: [Number, String],
    default: '',
  },
  districtName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['pick-location', 'update:radius', 'map-unavailable'])

const radiusOptions = [
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
]

const mapEl = ref(null)
const mapUnavailable = ref(false)
const mapReady = ref(false)
const { map, initializeMap: initializeMapLibre } = useMapLibreMap()
let marker = null
let pendingFocus = null

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
    const longitude = center[0] + (dx / (earthRadius * Math.cos(latitudeRad))) * 180 / Math.PI
    const latitude = center[1] + (dy / earthRadius) * 180 / Math.PI
    coordinates.push([longitude, latitude])
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
  element.setAttribute('aria-label', '分析中心點，可拖拽微調')
  element.title = '拖拽可微調分析中心點'
  return element
}

const RADIUS_LAYER_IDS = [
  'analysis-radius-selected-outline',
  'analysis-radius-selected-fill',
  'analysis-radius-outline',
]

const removeRadiusLayers = () => {
  const mapInstance = map.value
  if (!mapInstance) return

  RADIUS_LAYER_IDS.forEach((layerId) => {
    try {
      if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId)
    } catch (error) {
      // The style may be mid-swap; there is nothing to release yet.
    }
  })

  try {
    if (mapInstance.getSource('analysis-radius')) mapInstance.removeSource('analysis-radius')
  } catch (error) {
    // Same as above: the upcoming style load will render a fresh preview.
  }
}

const createMarker = (center) => {
  if (!map.value) return
  if (marker) {
    marker.setLngLat(center)
    return
  }

  marker = new maplibregl.Marker({
    element: createPinElement(),
    anchor: 'center',
    draggable: true,
  })
    .setLngLat(center)
    .addTo(map.value)

  marker.on('drag', () => {
    const { lng, lat } = marker.getLngLat()
    const source = map.value?.getSource('analysis-radius')
    if (source) source.setData(createRadiusFeatures([lng, lat]))
  })

  marker.on('dragend', () => {
    const { lng, lat } = marker.getLngLat()
    emit('pick-location', {
      longitude: Number(lng.toFixed(6)),
      latitude: Number(lat.toFixed(6)),
    })
  })
}

const renderPointPreview = () => {
  if (!map.value || !mapReady.value) return

  removeRadiusLayers()
  if (!selectedLocation.value) {
    marker?.remove()
    marker = null
    return
  }

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

  createMarker(center)
}

const updateDistrictHighlight = () => {
  const mapInstance = map.value
  if (!mapInstance || !mapInstance.getLayer('analysis-district-fill')) return

  const code = props.districtCode
  const filter = code
    ? ['==', ['to-string', ['get', 'town_code']], String(code)]
    : ['==', ['get', 'town_code'], '__none__']

  try {
    mapInstance.setFilter('analysis-district-fill', filter)
    mapInstance.setFilter('analysis-district-outline', filter)
  } catch (error) {
    console.warn('[map] Could not update district highlight.', error)
  }
}

const addDistrictLayers = () => {
  const mapInstance = map.value
  if (!mapInstance || mapInstance.getLayer('analysis-district-fill')) return

  const noMatch = ['==', ['get', 'town_code'], '__none__']
  const beforeId = mapInstance.getLayer('admin-county-outline') ? 'admin-county-outline' : undefined

  mapInstance.addLayer({
    id: 'analysis-district-fill',
    type: 'fill',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.adminTown.sourceLayer,
    filter: noMatch,
    paint: {
      'fill-color': '#8a6a3a',
      'fill-opacity': 0.075,
    },
  }, beforeId)

  mapInstance.addLayer({
    id: 'analysis-district-outline',
    type: 'line',
    source: MVT_SOURCE_ID,
    'source-layer': MVT_LAYERS.adminTown.sourceLayer,
    filter: noMatch,
    paint: {
      'line-color': '#8a6a3a',
      'line-width': 1.6,
      'line-dasharray': [2, 1.6],
      'line-opacity': 0.78,
    },
  })

  updateDistrictHighlight()
}

const focusOn = (longitude, latitude, zoom) => {
  const center = [Number(longitude), Number(latitude)]
  if (!Number.isFinite(center[0]) || !Number.isFinite(center[1])) return

  if (!map.value || !mapReady.value) {
    pendingFocus = { center, zoom }
    return
  }

  const options = {
    center,
    duration: 520,
  }
  const nextZoom = Number(zoom)
  if (Number.isFinite(nextZoom) && nextZoom > 0) {
    options.zoom = nextZoom
  }

  map.value.easeTo(options)
}

defineExpose({ focusOn })

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
    emit('map-unavailable')
    return
  }

  mapInstance.on('load', () => {
    mapReady.value = true
    addDistrictLayers()
    renderPointPreview()

    if (pendingFocus) {
      const next = pendingFocus
      pendingFocus = null
      const options = {
        center: next.center,
        duration: 520,
      }
      const nextZoom = Number(next.zoom)
      if (Number.isFinite(nextZoom) && nextZoom > 0) {
        options.zoom = nextZoom
      }
      mapInstance.easeTo(options)
    }
  })

  mapInstance.on('click', (event) => {
    emit('pick-location', {
      longitude: Number(event.lngLat.lng.toFixed(6)),
      latitude: Number(event.lngLat.lat.toFixed(6)),
    })
  })
}

watch(() => [props.longitude, props.latitude], renderPointPreview)
watch(activeRadius, renderPointPreview)
watch(() => props.districtCode, updateDistrictHighlight)

onMounted(initializeMap)

onBeforeUnmount(() => {
  removeRadiusLayers()
  marker?.remove()
  marker = null
})
</script>

<template>
  <div class="submit-map-panel">
    <div ref="mapEl" class="map-canvas maplibre-stage" aria-label="分析地點預覽地圖"></div>

    <MapFallback
      v-if="mapUnavailable"
      title="地點已就位，地圖待命"
      description="此環境未啟用 WebGL2，無法繪製互動地圖。你仍可用行政區選擇代表點，或展開手動輸入座標。"
    />

    <template v-else>
      <div class="map-overlay-top">
        <div class="map-caption">
          <p class="eyebrow eyebrow--plain">LOCATION PREVIEW</p>
          <h2>地點預覽</h2>
          <p v-if="districtName" class="map-caption-place">
            <i aria-hidden="true"></i>
            {{ districtName }}
          </p>
          <p v-if="districtName">行政區名稱會跟著標記更新；拖拽標記可微調中心點。</p>
          <p v-else>點擊地圖或拖拽標記，選定分析中心點。目前資料範圍為台北市、新北市。</p>
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

      <div class="map-overlay-bottom">
        <div class="map-foot">
          <div v-if="districtName" class="map-context-legend">
            <span><i class="legend-swatch legend-swatch--district"></i>行政區（位置名稱）</span>
            <span><i class="legend-swatch legend-swatch--radius"></i>分析範圍</span>
          </div>
          <div class="map-coordinate">
            <span>LNG / LAT</span>
            <strong>{{ coordinateLabel }}</strong>
          </div>
        </div>
      </div>
    </template>
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

.submit-map-panel :deep(.luozi-pin) {
  cursor: grab;
}

.submit-map-panel :deep(.luozi-pin:active) {
  cursor: grabbing;
}

.map-caption-place {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px !important;
  color: var(--ink) !important;
  font-size: 11px !important;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.map-caption-place i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 3px rgba(138, 106, 58, 0.12);
}

.map-foot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
}

.map-foot > * {
  pointer-events: auto;
}

.map-context-legend {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(246, 241, 230, 0.94);
  box-shadow: var(--shadow-card);
  color: var(--muted);
  font-size: 9px;
  backdrop-filter: blur(10px);
}

.map-context-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.legend-swatch {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
}

.legend-swatch--district {
  border: 1px dashed var(--gold);
  background: rgba(138, 106, 58, 0.13);
}

.legend-swatch--radius {
  border: 1px solid var(--vermilion);
  border-radius: 50%;
  background: rgba(195, 71, 44, 0.12);
}
</style>
