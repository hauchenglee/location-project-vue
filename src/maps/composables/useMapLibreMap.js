import { nextTick, onBeforeUnmount, shallowRef } from 'vue'
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { TAIWAN_CENTER } from '@/maps/constants'

let workerConfigured = false

const configureWorker = () => {
  if (workerConfigured) return

  maplibregl.setWorkerUrl(maplibreWorkerUrl)
  workerConfigured = true
}

export const useMapLibreMap = () => {
  configureWorker()

  const map = shallowRef(null)
  let resizeObserver = null

  const initializeMap = async ({ container, style, center = TAIWAN_CENTER, zoom = 8 }) => {
    await nextTick()
    if (map.value || !container.value) return null

    map.value = new maplibregl.Map({
      container: container.value,
      style,
      center,
      zoom,
      minZoom: 6,
      maxZoom: 22,
      attributionControl: false,
    })

    map.value.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.value.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    resizeObserver = new ResizeObserver(() => {
      map.value?.resize()
    })
    resizeObserver.observe(container.value)

    return map.value
  }

  const resizeAfterLayout = async () => {
    await nextTick()
    map.value?.resize()
    requestAnimationFrame(() => {
      map.value?.resize()
      requestAnimationFrame(() => map.value?.resize())
    })
  }

  const setStyle = (style, onIdle) => {
    if (!map.value) return

    map.value.setStyle(style)
    if (onIdle) {
      map.value.once('idle', onIdle)
    }
  }

  const destroyMap = () => {
    resizeObserver?.disconnect()
    resizeObserver = null
    map.value?.remove()
    map.value = null
  }

  onBeforeUnmount(destroyMap)

  return {
    map,
    initializeMap,
    resizeAfterLayout,
    setStyle,
    destroyMap,
  }
}
