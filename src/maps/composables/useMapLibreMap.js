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

  const supportsWebGL2 = () => {
    try {
      const canvas = document.createElement('canvas')
      return Boolean(canvas.getContext('webgl2'))
    } catch (error) {
      return false
    }
  }

  const initializeMap = async ({ container, style, center = TAIWAN_CENTER, zoom = 8, navigationPosition = 'top-right' }) => {
    await nextTick()
    if (map.value || !container.value || !supportsWebGL2()) return null

    try {
      map.value = new maplibregl.Map({
        container: container.value,
        style,
        center,
        zoom,
        minZoom: 6,
        maxZoom: 22,
        attributionControl: false,
      })

      map.value.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), navigationPosition)
      map.value.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

      resizeObserver = new ResizeObserver(() => {
        try {
          map.value?.resize()
        } catch (error) {
          // The map may be between style swaps; a later resize will settle it.
        }
      })
      resizeObserver.observe(container.value)

      return map.value
    } catch (error) {
      console.warn('[map] MapLibre could not initialize.', error)
      map.value = null
      return null
    }
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
    try {
      map.value?.remove()
    } catch (error) {
      // A failed map can throw while tearing down; nothing else to release.
    }
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
