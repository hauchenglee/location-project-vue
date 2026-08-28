import { getActiveBasemap, getBasemapStyleUrl } from '@/maps/basemaps/basemapRegistry'
import { backgroundLayer } from '@/maps/layers/baseMapLayers'

const styleCache = new Map()

const cloneStyle = (style) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(style)
  }

  return JSON.parse(JSON.stringify(style))
}

const createFallbackStyle = () => ({
  version: 8,
  sources: {},
  layers: [
    backgroundLayer(),
  ],
})

const warnBasemapFallback = (message, detail) => {
  if (!import.meta.env.DEV) return

  console.warn(`[map] ${message}`, detail || '')
}

export const loadBasemapStyle = async (basemap = getActiveBasemap()) => {
  const styleUrl = getBasemapStyleUrl(basemap)
  if (!styleUrl) {
    warnBasemapFallback('MapTiler API key is missing. Using local fallback basemap.', {
      basemap: basemap.id,
      env: 'VITE_MAPTILER_API_KEY',
    })
    return createFallbackStyle()
  }

  if (!styleCache.has(styleUrl)) {
    styleCache.set(styleUrl, fetch(styleUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load basemap style: ${response.status}`)
        }
        return response.json()
      })
      .catch((error) => {
        warnBasemapFallback('Failed to load remote basemap style. Using local fallback basemap.', {
          basemap: basemap.id,
          error,
        })
        return createFallbackStyle()
      }))
  }

  return cloneStyle(await styleCache.get(styleUrl))
}
