<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
  lat: {
    type: [String, Number],
    default: '25.0330',
  },
  lng: {
    type: [String, Number],
    default: '121.5654',
  },
  radius: {
    type: [String, Number],
    default: 500,
  },
})

const mapEl = ref(null)
let map
let marker
let circle

const defaultCenter = [25.033, 121.5654]
const districtCenter = [25.0262, 121.5435]

const currentCenter = computed(() => {
  const lat = Number.parseFloat(props.lat)
  const lng = Number.parseFloat(props.lng)

  if (props.mode === 'pin' && Number.isFinite(lat) && Number.isFinite(lng)) {
    return [lat, lng]
  }

  return props.mode === 'district' ? districtCenter : defaultCenter
})

const normalizedRadius = computed(() => {
  const radius = Number.parseInt(props.radius, 10)
  return Number.isFinite(radius) && radius > 0 ? radius : 500
})

const updateLayers = () => {
  if (!map) return

  const center = currentCenter.value
  map.setView(center, props.mode === 'pin' ? 15 : 14)

  if (circle) {
    circle.setLatLng(center)
    circle.setRadius(normalizedRadius.value)
  }

  if (marker) {
    marker.setLatLng(center)
    if (props.mode === 'pin') {
      marker.addTo(map)
    } else {
      marker.remove()
    }
  }
}

onMounted(async () => {
  await nextTick()

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView(currentCenter.value, 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  circle = L.circle(currentCenter.value, {
    radius: normalizedRadius.value,
    color: '#2563eb',
    weight: 2,
    dashArray: '8 8',
    fillColor: '#2563eb',
    fillOpacity: 0.08,
  }).addTo(map)

  marker = L.marker(currentCenter.value)
  updateLayers()

  window.setTimeout(() => {
    map?.invalidateSize()
  }, 80)
})

watch(() => [props.mode, props.lat, props.lng, props.radius], updateLayers)

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="map-card">
    <div class="map-top">
      <div class="map-top-left">
        <h3>地圖定位區</h3>
      </div>
    </div>

    <div ref="mapEl" class="map-stage leaflet-stage" aria-label="OpenStreetMap 地圖定位區"></div>
  </div>
</template>
